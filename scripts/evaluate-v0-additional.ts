// v0 추가 실사용 검증 평가 러너 (실제 LLM 호출).
// 기존 vitest(stub LLM)와 분리된 "evaluation runner"로,
// tests/evaluation/v0-additional-cases.json의 fixture를 실제 Gemini API로 실행하고
// 결과를 evaluation-results/에 즉시(케이스마다) 저장한다.
//
// 실행: node --import tsx scripts/evaluate-v0-additional.ts
//       node --import tsx scripts/evaluate-v0-additional.ts --report-only   (재호출 없이 기존 jsonl로 리포트만 재생성)
//
// production 로직(src/*)은 일절 수정하지 않고 그대로 호출만 한다.

import { readFileSync, existsSync, appendFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

try {
  process.loadEnvFile();
} catch {
  // .env 없으면 무시 (환경변수 직접 주입 가정)
}

import { AnthropicLLMClient, type LLMClient } from "../src/llm/client.js";
import { GeminiLLMClient } from "../src/llm/geminiClient.js";
import { GroqLLMClient } from "../src/llm/groqClient.js";
import { runWorkflow } from "../src/workflow.js";
import type {
  AmbiguityFinding,
  AmbiguityType,
  AnalysisResult,
  ClarificationQuestion,
  Decision,
  WorkflowInput,
  WorkflowOutput,
} from "../src/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIXTURE_PATH = path.join(ROOT, "tests/evaluation/v0-additional-cases.json");
const RESULTS_DIR = path.join(ROOT, "evaluation-results");

// 실행 시점의 UTC 날짜가 자정을 넘어가면 새 run이 별도 파일로 튀어 이전 진행분을 이어받지 못하는
// 문제를 막기 위해, 기본값은 "가장 최근에 존재하는 v0-additional-*.jsonl의 날짜"를 그대로 재사용한다.
// EVAL_FRESH=1이면 강제로 오늘 날짜의 새 파일로 시작하고, EVAL_RESULTS_DATE로 명시 지정도 가능하다.
function resolveRunDate(): string {
  if (process.env.EVAL_RESULTS_DATE) return process.env.EVAL_RESULTS_DATE;
  const todayUTC = new Date().toISOString().slice(0, 10);
  if (process.env.EVAL_FRESH === "1") return todayUTC;
  if (!existsSync(RESULTS_DIR)) return todayUTC;
  const dates = readdirSync(RESULTS_DIR)
    .map((f) => f.match(/^v0-additional-(\d{4}-\d{2}-\d{2})\.jsonl$/)?.[1])
    .filter((d): d is string => !!d)
    .sort();
  return dates.length > 0 ? dates[dates.length - 1] : todayUTC;
}

const today = resolveRunDate();
const JSONL_PATH = path.join(RESULTS_DIR, `v0-additional-${today}.jsonl`);
const JSON_PATH = path.join(RESULTS_DIR, `v0-additional-${today}.json`);
const MD_PATH = path.join(RESULTS_DIR, `v0-additional-${today}.md`);

const DELAY_MS = Number(process.env.EVAL_DELAY_MS ?? 12000);
const RETRY_DELAYS_MS = (process.env.EVAL_RETRY_DELAYS_MS ?? "20000,40000,70000")
  .split(",")
  .map((s) => Number(s.trim()));

// ----------------------------------------------------------------------------
// Fixture / Expected types
// ----------------------------------------------------------------------------

interface ExpectedSpec {
  ambiguity_types: string[];
  allow_not_detected?: string[];
  status: "ready" | "clarification_required";
  status_alternatives?: string[];
  decisions?: Record<string, Decision[]>;
  decision_match_mode?: "any";
  question_count_min?: number;
  question_count_max?: number;
  resolved_keywords?: Record<string, string[]>;
  improved_prompt_must_contain?: string[];
  improved_prompt_must_not_contain?: string[];
  improved_prompt_must_not_contain_if_ready?: string[];
  question_options_hint?: string[];
  question_text_hint?: string;
  unnecessary_question_risk?: boolean;
  false_positive_check?: boolean;
  false_negative_check?: boolean;
  priority_check?: boolean;
  notes: string;
}

interface FixtureCase {
  case_id: string;
  category: string;
  review_candidate: boolean;
  description: string;
  input: WorkflowInput;
  expected: ExpectedSpec;
}

interface FixtureFile {
  cases: FixtureCase[];
}

// ----------------------------------------------------------------------------
// Result record (persisted, one line per case)
// ----------------------------------------------------------------------------

interface CaseResultRecord {
  case_id: string;
  ambiguity_category: string;
  review_candidate: boolean;
  timestamp: string;
  verdict: "PASS" | "FAIL" | "REVIEW" | "ERROR";
  failure_reasons: string[];
  failure_classification: string[];
  expected_ambiguity_types: string[];
  actual_ambiguity_types: string[];
  expected_status: string;
  actual_status: string | null;
  expected_decision: Record<string, Decision[]> | undefined;
  actual_decision: Record<string, Decision[]>;
  expected_question_count: string;
  actual_question_count: number | null;
  actual_questions: ClarificationQuestion[];
  expected_resolved_value: Record<string, string[]> | undefined;
  actual_resolved_value: Record<string, (string | null)[]>;
  expected_behavior: string;
  improved_prompt: string | null;
  raw_analysis: AnalysisResult | null;
  error_message: string | null;
}

// ----------------------------------------------------------------------------
// LLM client
// ----------------------------------------------------------------------------

function createLLMClient(): LLMClient {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  if (provider === "gemini") return new GeminiLLMClient();
  if (provider === "groq") return new GroqLLMClient();
  return new AnthropicLLMClient();
}

function resolveModelName(): string {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  if (provider === "gemini") return process.env.GEMINI_MODEL ?? "(unset)";
  if (provider === "groq") return process.env.GROQ_MODEL ?? "(unset)";
  return "(anthropic default)";
}

// ----------------------------------------------------------------------------
// Grading
// ----------------------------------------------------------------------------

function normalizeStatus(s: WorkflowOutput["status"]): "ready" | "clarification_required" {
  return s === "ready" ? "ready" : "clarification_required";
}

function findingsByType(analysis: AnalysisResult, type: string): AmbiguityFinding[] {
  return analysis.ambiguities.filter((f) => f.type === type);
}

function extractExplicitRequest(prompt: string): string {
  const match = prompt.match(/\[명시화된 요청\]\n([\s\S]*?)\n\n\[확정된 정보\]/);
  return match ? match[1] : prompt;
}

function containsCI(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function grade(
  fixture: FixtureCase,
  output: WorkflowOutput | null,
  error: unknown
): CaseResultRecord {
  const expected = fixture.expected;
  const base: CaseResultRecord = {
    case_id: fixture.case_id,
    ambiguity_category: fixture.category,
    review_candidate: fixture.review_candidate,
    timestamp: new Date().toISOString(),
    verdict: "ERROR",
    failure_reasons: [],
    failure_classification: [],
    expected_ambiguity_types: expected.ambiguity_types,
    actual_ambiguity_types: [],
    expected_status: [expected.status, ...(expected.status_alternatives ?? [])].join(" | "),
    actual_status: null,
    expected_decision: expected.decisions,
    actual_decision: {},
    expected_question_count: `${expected.question_count_min ?? 0}-${expected.question_count_max ?? 0}`,
    actual_question_count: null,
    actual_questions: [],
    expected_resolved_value: expected.resolved_keywords,
    actual_resolved_value: {},
    expected_behavior: expected.notes,
    improved_prompt: null,
    raw_analysis: null,
    error_message: null,
  };

  if (error) {
    base.error_message = error instanceof Error ? error.message : String(error);
    base.verdict = "ERROR";
    base.failure_reasons = [`LLM 호출/파싱 실패: ${base.error_message}`];
    return base;
  }
  if (!output) {
    base.error_message = "output이 없음 (알 수 없는 오류)";
    return base;
  }

  const analysis = output.analysis;
  base.raw_analysis = analysis;
  base.actual_status = normalizeStatus(output.status);
  base.actual_ambiguity_types = Array.from(new Set(analysis.ambiguities.map((f) => f.type)));
  base.actual_question_count = analysis.questions.length;
  base.actual_questions = output.status === "clarification_required" ? output.questions : [];
  base.improved_prompt = output.status === "ready" ? output.improved_prompt : null;

  for (const f of analysis.ambiguities) {
    if (!base.actual_decision[f.type]) base.actual_decision[f.type] = [];
    base.actual_decision[f.type].push(f.decision);
    if (!base.actual_resolved_value[f.type]) base.actual_resolved_value[f.type] = [];
    base.actual_resolved_value[f.type].push(f.resolved_value);
  }

  const failureReasons: string[] = [];
  const classifications = new Set<string>();

  // Check A: status
  const acceptedStatuses = [expected.status, ...(expected.status_alternatives ?? [])];
  const statusOk = acceptedStatuses.includes(base.actual_status);
  if (!statusOk) {
    failureReasons.push(
      `status 불일치: expected=[${acceptedStatuses.join(",")}], actual=${base.actual_status}`
    );
    if (expected.status === "ready" && base.actual_status === "clarification_required") {
      classifications.add("Unnecessary Clarification");
    } else if (
      expected.status === "clarification_required" &&
      base.actual_status === "ready"
    ) {
      classifications.add("Missing Clarification");
    } else {
      classifications.add("Decision Failure");
    }
  }

  // Check B: detection
  const allowNotDetected = new Set(expected.allow_not_detected ?? []);
  const detectionMissing = expected.ambiguity_types.filter(
    (t) => !base.actual_ambiguity_types.includes(t) && !allowNotDetected.has(t)
  );
  if (detectionMissing.length > 0) {
    failureReasons.push(`탐지 누락: [${detectionMissing.join(", ")}] 타입이 탐지되지 않음`);
    classifications.add("Ambiguity Detection Failure");
  }

  // Check C: per-type decision
  if (expected.decisions) {
    if (expected.decision_match_mode === "any") {
      const anyOk = Object.entries(expected.decisions).some(([type, accepted]) => {
        const actualDecisions = base.actual_decision[type] ?? [];
        return actualDecisions.some((d) => accepted.includes(d));
      });
      if (!anyOk) {
        failureReasons.push(
          `decision(any) 불일치: 다음 중 하나도 만족하지 못함: ${JSON.stringify(expected.decisions)} / actual=${JSON.stringify(base.actual_decision)}`
        );
        classifications.add("Decision Failure");
      }
    } else {
      for (const [type, accepted] of Object.entries(expected.decisions)) {
        const actualDecisions = base.actual_decision[type];
        if (!actualDecisions || actualDecisions.length === 0) {
          continue; // 이미 detection 체크에서 잡힘
        }
        const ok = actualDecisions.some((d) => accepted.includes(d));
        if (!ok) {
          failureReasons.push(
            `[${type}] decision 불일치: expected=[${accepted.join(",")}], actual=[${actualDecisions.join(",")}]`
          );
          const hasClarReq = actualDecisions.includes("CLARIFICATION_REQUIRED");
          if (hasClarReq && !accepted.includes("CLARIFICATION_REQUIRED")) {
            classifications.add("Unnecessary Clarification");
          } else if (!hasClarReq && accepted.length === 1 && accepted[0] === "CLARIFICATION_REQUIRED") {
            classifications.add("Missing Clarification");
          } else {
            classifications.add("Impact Judgment Failure");
          }
        }
      }
    }
  }

  // Check D: question count
  const qMin = expected.question_count_min ?? 0;
  const qMax = expected.question_count_max ?? 0;
  const qCount = base.actual_question_count ?? 0;
  if (qCount < qMin || qCount > qMax) {
    failureReasons.push(`질문 개수 범위 초과: expected=${qMin}-${qMax}, actual=${qCount}`);
    classifications.add("Question Generation Failure");
  }

  // Check E: resolved keywords (context resolution quality)
  if (expected.resolved_keywords) {
    for (const [type, keywords] of Object.entries(expected.resolved_keywords)) {
      const values = (base.actual_resolved_value[type] ?? []).filter(
        (v): v is string => typeof v === "string" && v.length > 0
      );
      if (values.length === 0) {
        // decision 체크에서 이미 잡히는 경우가 대부분 (CLARIFICATION_REQUIRED -> resolved_value null)
        continue;
      }
      const anyMatch = values.some((v) => keywords.some((k) => containsCI(v, k)));
      if (!anyMatch) {
        failureReasons.push(
          `[${type}] resolved_value에 기대 키워드 없음: expected keywords=[${keywords.join(",")}], actual=[${values.join(" / ")}]`
        );
        classifications.add("Context Resolution Failure");
      }
    }
  }

  // Check F: improved_prompt content (ready 상태에서만)
  if (base.actual_status === "ready" && base.improved_prompt) {
    const explicit = extractExplicitRequest(base.improved_prompt);
    const mustContain = [
      ...(expected.improved_prompt_must_contain ?? []),
    ];
    for (const kw of mustContain) {
      if (!containsCI(base.improved_prompt, kw)) {
        failureReasons.push(`improved_prompt에 기대 문구 없음: "${kw}"`);
        classifications.add("Prompt Explicitization Failure");
      }
    }
    const mustNotContain = [
      ...(expected.improved_prompt_must_not_contain ?? []),
      ...(expected.improved_prompt_must_not_contain_if_ready ?? []),
    ];
    for (const kw of mustNotContain) {
      if (containsCI(explicit, kw)) {
        failureReasons.push(`improved_prompt([명시화된 요청])에 해결됐어야 할 모호 표현이 남아있음: "${kw}"`);
        classifications.add("Prompt Explicitization Failure");
      }
    }
  }

  // Check G: 명시적 불필요/누락 질문 플래그 (진단 보강용, 이미 A/C에서 대부분 잡힘)
  if (expected.unnecessary_question_risk && qCount > 0) {
    failureReasons.push("unnecessary_question_risk: 질문이 필요 없다고 예상된 케이스에서 질문이 생성됨");
    classifications.add("Unnecessary Clarification");
  }
  if (expected.false_positive_check && base.actual_status === "clarification_required") {
    failureReasons.push("false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨");
    classifications.add("Unnecessary Clarification");
  }
  if (expected.false_negative_check && base.actual_status === "ready") {
    failureReasons.push("false_negative_check: 사전 단어에 의존하지 않고 탐지했어야 하는데 질문 없이 넘어감");
    classifications.add("Missing Clarification");
  }

  // Priority diagnostic (QLIMIT1 등) - FAIL로 세지 않고 note만 남김
  if (expected.priority_check) {
    const degreeOnlyQuestion = base.actual_questions.find((q) => q.type === "degree");
    if (degreeOnlyQuestion && base.actual_questions.length === (expected.question_count_max ?? 3)) {
      failureReasons.push(
        `priority_check(진단): degree 유형 질문이 포함된 채 질문 수가 상한(${expected.question_count_max})에 도달함 - 핵심 질문 우선순위 재검토 필요`
      );
    }
  }

  base.failure_reasons = failureReasons;
  base.failure_classification = Array.from(classifications);

  if (fixture.review_candidate) {
    base.verdict = "REVIEW";
  } else {
    base.verdict = failureReasons.length === 0 ? "PASS" : "FAIL";
  }

  return base;
}

// ----------------------------------------------------------------------------
// Persistence (crash-safe incremental JSONL)
// ----------------------------------------------------------------------------

function ensureResultsDir() {
  if (!existsSync(RESULTS_DIR)) mkdirSync(RESULTS_DIR, { recursive: true });
}

function loadExistingResults(): Map<string, CaseResultRecord> {
  const map = new Map<string, CaseResultRecord>();
  if (!existsSync(JSONL_PATH)) return map;
  const lines = readFileSync(JSONL_PATH, "utf-8").split("\n").filter((l) => l.trim());
  for (const line of lines) {
    try {
      const rec = JSON.parse(line) as CaseResultRecord;
      map.set(rec.case_id, rec); // 마지막 기록이 이김 (재시도 결과로 덮어쓰기)
    } catch {
      // 손상된 라인 무시
    }
  }
  return map;
}

function appendResult(rec: CaseResultRecord) {
  appendFileSync(JSONL_PATH, JSON.stringify(rec) + "\n", "utf-8");
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ----------------------------------------------------------------------------
// Report generation
// ----------------------------------------------------------------------------

const FAILURE_CATEGORY_ORDER = [
  "Ambiguity Detection Failure",
  "Context Resolution Failure",
  "Impact Judgment Failure",
  "Decision Failure",
  "Unnecessary Clarification",
  "Missing Clarification",
  "Question Generation Failure",
  "Prompt Explicitization Failure",
];

function generateReport(records: CaseResultRecord[], fixtures: FixtureCase[]) {
  ensureResultsDir();

  const byId = new Map(fixtures.map((f) => [f.case_id, f]));
  const ordered = fixtures
    .map((f) => records.find((r) => r.case_id === f.case_id))
    .filter((r): r is CaseResultRecord => !!r);

  const pass = ordered.filter((r) => r.verdict === "PASS").length;
  const fail = ordered.filter((r) => r.verdict === "FAIL").length;
  const review = ordered.filter((r) => r.verdict === "REVIEW").length;
  const errorCount = ordered.filter((r) => r.verdict === "ERROR").length;
  const quotaFailures = ordered.filter(
    (r) =>
      r.verdict === "ERROR" &&
      r.error_message &&
      /429|quota|rate.?limit|RESOURCE_EXHAUSTED/i.test(r.error_message)
  ).length;
  const successfulCalls = ordered.filter((r) => r.verdict !== "ERROR").length;
  const parseFailures = ordered.filter(
    (r) =>
      r.verdict === "ERROR" &&
      r.error_message &&
      /JSON으로 파싱하지 못했습니다/i.test(r.error_message)
  ).length;
  const otherErrors = errorCount - quotaFailures - parseFailures;

  const byCategory = new Map<string, CaseResultRecord[]>();
  for (const r of ordered) {
    const cat = r.ambiguity_category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(r);
  }

  function categorySummaryLine(cat: string): string {
    const recs = byCategory.get(cat) ?? [];
    if (recs.length === 0) return `- ${cat}: (케이스 없음)`;
    const p = recs.filter((r) => r.verdict === "PASS").length;
    const f = recs.filter((r) => r.verdict === "FAIL").length;
    const rv = recs.filter((r) => r.verdict === "REVIEW").length;
    const e = recs.filter((r) => r.verdict === "ERROR").length;
    return `- ${cat}: PASS ${p} / FAIL ${f} / REVIEW ${rv} / ERROR ${e} (총 ${recs.length})`;
  }

  const failureBuckets = new Map<string, CaseResultRecord[]>();
  for (const cat of FAILURE_CATEGORY_ORDER) failureBuckets.set(cat, []);
  for (const r of ordered) {
    if (r.verdict !== "FAIL") continue;
    for (const cls of r.failure_classification) {
      if (!failureBuckets.has(cls)) failureBuckets.set(cls, []);
      failureBuckets.get(cls)!.push(r);
    }
  }

  const lines: string[] = [];
  lines.push("# v0 Additional Evaluation Report");
  lines.push("");
  lines.push("## Environment");
  lines.push(`- model: ${resolveModelName()}`);
  lines.push(`- provider: ${process.env.LLM_PROVIDER ?? "(unset)"}`);
  lines.push(`- date: ${today}`);
  lines.push(`- number of cases: ${ordered.length} / fixture 전체 ${fixtures.length}`);
  lines.push(`- 성공한 API 호출 수 (케이스 기준, 정상 완료): ${successfulCalls}`);
  lines.push(`- quota/rate-limit 실패 수: ${quotaFailures} (전체 ERROR ${errorCount}건 중)`);
  lines.push(
    `- JSON 파싱 실패 수: ${parseFailures} (모델이 코드펜스 없이 reasoning/<think> 텍스트를 응답에 섞어 보내 parseJsonResponse가 JSON을 추출하지 못한 경우 — quota와 무관한 별도 실패 모드)`
  );
  if (otherErrors > 0) {
    lines.push(`- 기타 오류 수: ${otherErrors}`);
  }
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`전체 PASS: ${pass}`);
  lines.push(`전체 FAIL: ${fail}`);
  lines.push(`전체 REVIEW: ${review}`);
  lines.push(`전체 ERROR: ${errorCount}`);
  lines.push("");
  lines.push("유형별:");
  for (const cat of [
    "reference",
    "omission",
    "degree",
    "comparison",
    "scope",
    "compound",
    "false_positive",
    "false_negative",
    "context_conflict",
    "question_limit",
  ]) {
    lines.push(categorySummaryLine(cat));
  }
  lines.push("");
  lines.push("## Failure Classification");
  lines.push("");
  let n = 1;
  for (const cat of FAILURE_CATEGORY_ORDER) {
    const recs = failureBuckets.get(cat) ?? [];
    lines.push(`### ${n}. ${cat}`);
    n++;
    if (recs.length === 0) {
      lines.push("- 해당 없음");
    } else {
      for (const r of recs) {
        lines.push(`- **${r.case_id}**: ${r.failure_reasons.join("; ")}`);
      }
    }
    lines.push("");
  }

  lines.push("## Detailed Results");
  lines.push("");
  for (const r of ordered) {
    const fixture = byId.get(r.case_id)!;
    lines.push(`### ${r.case_id} — ${fixture.description}`);
    lines.push("");
    lines.push(`- **Category**: ${r.ambiguity_category}${r.review_candidate ? " (review candidate)" : ""}`);
    lines.push(`- **Verdict**: ${r.verdict}`);
    lines.push("");
    lines.push("**Input**");
    lines.push("```json");
    lines.push(JSON.stringify(fixture.input, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("**Expected**");
    lines.push(`- status: ${r.expected_status}`);
    lines.push(`- ambiguity_types: ${r.expected_ambiguity_types.join(", ")}`);
    if (r.expected_decision) {
      lines.push(`- decisions: ${JSON.stringify(r.expected_decision)}`);
    }
    lines.push(`- question_count: ${r.expected_question_count}`);
    if (r.expected_resolved_value) {
      lines.push(`- resolved_value keywords: ${JSON.stringify(r.expected_resolved_value)}`);
    }
    lines.push(`- behavior: ${r.expected_behavior}`);
    lines.push("");
    lines.push("**Actual analysis**");
    if (r.verdict === "ERROR") {
      lines.push(`- ERROR: ${r.error_message}`);
    } else {
      lines.push(`- status: ${r.actual_status}`);
      lines.push(`- ambiguity_types: ${r.actual_ambiguity_types.join(", ") || "(none)"}`);
      lines.push(`- decision: ${JSON.stringify(r.actual_decision)}`);
      lines.push(`- resolved_value: ${JSON.stringify(r.actual_resolved_value)}`);
      lines.push(`- question_count: ${r.actual_question_count}`);
    }
    lines.push("");
    lines.push("**Actual questions**");
    if (r.actual_questions.length === 0) {
      lines.push("- (없음)");
    } else {
      for (const q of r.actual_questions) {
        lines.push(`- [${q.id}/${q.type}] ${q.question}${q.options ? ` (options: ${q.options.join(" / ")})` : ""}`);
      }
    }
    lines.push("");
    lines.push("**Improved prompt**");
    lines.push(r.improved_prompt ? "```\n" + r.improved_prompt + "\n```" : "- (없음, status != ready)");
    lines.push("");
    lines.push(`**PASS/FAIL**: ${r.verdict}`);
    lines.push(
      `**실패 이유**: ${r.failure_reasons.length > 0 ? r.failure_reasons.join(" / ") : "(없음)"}`
    );
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push("## v1 Candidates");
  lines.push("");
  lines.push(
    "아래는 실제 FAIL 패턴에서만 추출한 후보다 (사전에 가정한 개선안이 아니라 이번 실행 결과 기준):"
  );
  lines.push("");
  const hasAnyFail = fail > 0;
  if (!hasAnyFail) {
    lines.push("- 이번 실행에서는 REVIEW 대상을 제외하고 FAIL로 분류된 케이스가 없었다.");
  } else {
    for (const cat of FAILURE_CATEGORY_ORDER) {
      const recs = failureBuckets.get(cat) ?? [];
      if (recs.length === 0) continue;
      lines.push(`- **${cat}** (${recs.length}건: ${recs.map((r) => r.case_id).join(", ")})`);
    }
  }
  lines.push("");
  if (review > 0) {
    lines.push(
      `REVIEW로 남긴 ${review}건(${ordered.filter((r) => r.verdict === "REVIEW").map((r) => r.case_id).join(", ")})은 정답이 하나로 정해지지 않은 경계 사례이므로, v1 설계 시 "충분한 근거"의 기준을 사람이 먼저 정의한 뒤 판단 규칙을 다듬는 것이 우선되어야 한다.`
    );
  }
  lines.push("");

  writeFileSync(MD_PATH, lines.join("\n"), "utf-8");
  writeFileSync(
    JSON_PATH,
    JSON.stringify(
      {
        environment: {
          model: resolveModelName(),
          provider: process.env.LLM_PROVIDER ?? null,
          date: today,
          number_of_cases: ordered.length,
          fixture_total: fixtures.length,
          successful_calls: successfulCalls,
          quota_failures: quotaFailures,
          parse_failures: parseFailures,
          other_errors: otherErrors,
          error_count: errorCount,
        },
        summary: { pass, fail, review, error: errorCount },
        results: ordered,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\n리포트 생성 완료:\n- ${MD_PATH}\n- ${JSON_PATH}`);
  console.log(`PASS ${pass} / FAIL ${fail} / REVIEW ${review} / ERROR ${errorCount}`);
}

// ----------------------------------------------------------------------------
// Main
// ----------------------------------------------------------------------------

async function main() {
  ensureResultsDir();

  const fixture: FixtureFile = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8"));
  const reportOnly = process.argv.includes("--report-only");

  const existing = loadExistingResults();

  if (!reportOnly) {
    const llm = createLLMClient();

    for (const c of fixture.cases) {
      const prev = existing.get(c.case_id);
      if (prev && prev.verdict !== "ERROR") {
        console.log(`[skip] ${c.case_id} 이미 완료됨 (verdict=${prev.verdict})`);
        continue;
      }

      console.log(`\n[run] ${c.case_id} - ${c.description}`);
      let output: WorkflowOutput | null = null;
      let error: unknown = null;

      try {
        output = await runWorkflow(c.input, { llm });
        error = null;
      } catch (err) {
        error = err;
      }

      for (const delay of RETRY_DELAYS_MS) {
        if (!error) break;
        const msg = error instanceof Error ? error.message : String(error);
        if (!/429|quota|rate.?limit|RESOURCE_EXHAUSTED|high demand/i.test(msg)) break;
        console.warn(`  quota/rate-limit/과부하 감지, ${delay}ms 대기 후 재시도`);
        await sleep(delay);
        try {
          output = await runWorkflow(c.input, { llm });
          error = null;
        } catch (err2) {
          error = err2;
        }
      }

      const rec = grade(c, output, error);
      appendResult(rec);
      existing.set(c.case_id, rec);
      console.log(`  -> verdict=${rec.verdict}${rec.error_message ? ` (${rec.error_message})` : ""}`);

      await sleep(DELAY_MS);
    }
  }

  const finalRecords = fixture.cases
    .map((c) => existing.get(c.case_id))
    .filter((r): r is CaseResultRecord => !!r);

  generateReport(finalRecords, fixture.cases);
}

main().catch((err) => {
  console.error("평가 러너 실행 중 치명적 오류:", err);
  process.exit(1);
});
