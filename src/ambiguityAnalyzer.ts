import { z } from "zod";
import type { LLMClient } from "./llm/client.js";
import { parseJsonResponse } from "./llm/client.js";
import type { RawAmbiguityFinding, Task } from "./types.js";

// v0 AmbiguityAnalyzer
// 형태소 분석기/별도 NLP 모델 없이, LLM에게 5개 모호성 유형의 정의와 판단 기준을
// 그대로 프롬프트로 제공해 "LLM 기반 구조적 판단"으로 탐지한다.
// 여기서는 후보(candidates)/문맥근거(context_support)/영향도(impact)만 산출하고,
// 최종 RESOLVED/SAFE_INFERENCE/CLARIFICATION_REQUIRED 판정은 DecisionEngine이
// 결정론적으로 내린다 (LLM이 매번 다르게 판단해 테스트가 흔들리는 것을 방지).

const SYSTEM_PROMPT = `너는 한국어 사용자의 작업 요청에서 5가지 유형의 모호성을 탐지하는 분석기다.
아래 정의를 정확히 따르라.

[Task]
- planning: 프로젝트/학업/업무 계획, 첨부 문서 기반 실행 계획
- writing: 보고서/자기소개서/기획서 등 자료 기반 문서 작성/수정

[모호성 유형 5개]
1. reference (지시 대상 모호성): "이거", "그거", "이 부분", "그 기능", "위에 거" 등
2. omission (성분 생략): "해줘", "바꿔줘", "빼줘", "정리해줘" 등 대상/목적이 생략된 표현
3. degree (정도 모호성): "좀", "많이", "적당히", "조금 더", "길게", "짧게" 등
4. comparison (비교 기준 모호성): "전처럼", "비슷하게", "아까처럼", "이거랑 비슷하게" 등
5. scope (범위 모호성): "여기만", "이 부분만", "일부만", "전체적으로", "필요한 부분만" 등

[각 표현마다 판단할 것]
- expression: 모호한 표현 원문 그대로
- candidates: 현재 요청/최근 대화/첨부 문서에서 찾을 수 있는 "구체적인 해석 후보" 목록.
  - 문맥에서 후보를 전혀 찾을 수 없으면 빈 배열([])로 둔다.
  - 후보는 실제 지칭 대상/기준/범위를 설명하는 짧은 한국어 구절로 작성한다 (예: "자동 저장 기능").
- context_support: 후보를 뒷받침하는 문맥 근거의 강도. "strong" | "medium" | "weak" 중 하나.
- impact: 후보 중 어떤 것을 선택하느냐에 따라 작업 대상/내용/결과 구조가 실제로 크게
  달라지는지 여부. "high" | "low" 중 하나.
  - degree 유형에서 사용자가 글자수/분량 등 제한 준수를 강조했지만 실제 기준값이
    문맥 어디에도 없다면 candidates를 빈 배열로, impact는 "high"로 표시하라.
- top_candidate: candidates 중 가장 유력한 해석 (있다면). 없으면 null.

모호성이 전혀 없는 명확한 요청이면 빈 배열을 반환하라.
표현이 요청 안에 실제로 등장하지 않으면 만들어내지 마라.

반드시 아래 JSON 형식으로만 답하라. 다른 설명, 마크다운, 주석을 추가하지 마라.
{
  "ambiguities": [
    {
      "type": "reference" | "omission" | "degree" | "comparison" | "scope",
      "expression": "string",
      "candidates": ["string", ...],
      "context_support": "strong" | "medium" | "weak",
      "impact": "high" | "low",
      "top_candidate": "string" | null
    }
  ]
}`;

const RawFindingSchema = z.object({
  type: z.enum(["reference", "omission", "degree", "comparison", "scope"]),
  expression: z.string(),
  candidates: z.array(z.string()),
  context_support: z.enum(["strong", "medium", "weak"]),
  impact: z.enum(["high", "low"]),
  top_candidate: z.string().nullable().optional(),
});

const ResponseSchema = z.object({
  ambiguities: z.array(RawFindingSchema),
});

export async function analyzeAmbiguities(
  llm: LLMClient,
  task: Task,
  request: string,
  contextText: string
): Promise<RawAmbiguityFinding[]> {
  const userPrompt = `[Task]\n${task}\n\n[사용자 요청]\n${request}\n\n[문맥]\n${contextText}`;
  const raw = await llm.complete(SYSTEM_PROMPT, userPrompt);
  const parsed = parseJsonResponse<unknown>(raw);
  const validated = ResponseSchema.parse(parsed);
  return validated.ambiguities.map((f) => ({
    ...f,
    top_candidate: f.top_candidate ?? null,
  }));
}
