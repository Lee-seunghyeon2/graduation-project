import type { AmbiguityFinding } from "../types.js";

// v0 PromptBuilder 공통 로직 (템플릿 기반, LLM 미사용 - 결정론적/테스트 용이).
// "이거", "그거" 같은 모호한 표현을 실제 해석 값으로 치환해 명시적인 요청 문장을 만들고,
// 확정된 정보를 별도 목록으로도 덧붙여 최종 Prompt에 모호성이 남지 않도록 한다.

/** 원본 요청에서 모호 표현을 resolved_value로 치환한 문장을 만든다.
 *  겹치는 표현(예: "이 부분" vs "이 부분만") 오치환을 줄이기 위해 긴 표현부터 치환한다. */
export function buildExplicitRequest(
  originalRequest: string,
  findings: AmbiguityFinding[]
): string {
  const resolvable = findings
    .filter((f) => f.resolved_value)
    .sort((a, b) => b.expression.length - a.expression.length);

  let explicit = originalRequest;
  for (const f of resolvable) {
    if (!f.resolved_value) continue;
    explicit = explicit.split(f.expression).join(f.resolved_value);
  }
  return explicit;
}

/** 해결된 모호성을 "표현 → 확정 값" 형태의 불릿 목록으로 정리한다. */
export function buildResolvedInfoList(findings: AmbiguityFinding[]): string {
  const resolved = findings.filter((f) => f.resolved_value);
  if (resolved.length === 0) return "(명시적으로 해결된 모호 표현 없음)";
  return resolved
    .map((f) => `- "${f.expression}" → ${f.resolved_value} (${describeDecision(f)})`)
    .join("\n");
}

function describeDecision(f: AmbiguityFinding): string {
  switch (f.decision) {
    case "RESOLVED":
      return "문맥상 확정";
    case "SAFE_INFERENCE":
      return "AI 추론(영향 낮음)";
    default:
      return "사용자 답변으로 확정";
  }
}
