import type { AmbiguityFinding, Decision, RawAmbiguityFinding } from "./types.js";

// v0 DecisionEngine
// AmbiguityAnalyzer(LLM)가 산출한 원시 후보/영향도를 받아
// RESOLVED / SAFE_INFERENCE / CLARIFICATION_REQUIRED를 "결정론적으로" 판단한다.
// LLM을 다시 호출하지 않는 순수 함수이므로 테스트에서 stub 없이도 검증 가능하다.
//
// 핵심 규칙 (요구사항 3):
//   질문이 필요한 조건 = 유력 후보가 2개 이상 남음 AND 후보 선택에 따라 결과가 크게 달라짐(impact=high)
//
// 예외: candidates가 0개인데 impact가 high인 경우(예: degree 유형에서 "글자 수를 꼭 지켜야
// 한다"면서 실제 기준값이 전혀 없는 경우)도 AI가 안전하게 추론할 근거 자체가 없으므로
// CLARIFICATION_REQUIRED로 처리한다.

function dedupe(candidates: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const c of candidates) {
    const trimmed = c.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }
  return result;
}

export function decide(raw: RawAmbiguityFinding): AmbiguityFinding {
  const unique = dedupe(raw.candidates);
  const { impact, context_support } = raw;

  let decision: Decision;
  let resolved_value: string | null;

  if (impact === "high" && unique.length !== 1) {
    // 후보가 없거나(0개) 유력 후보가 2개 이상인데 결과 영향이 큼 -> 질문 필요
    decision = "CLARIFICATION_REQUIRED";
    resolved_value = null;
  } else if (unique.length === 1 && context_support !== "weak") {
    // 후보가 사실상 하나이고 문맥 근거가 약하지 않음 -> 문맥으로 해결됨
    decision = "RESOLVED";
    resolved_value = unique[0];
  } else {
    // 완전히 확실하진 않지만 영향이 낮거나(=안전) 후보가 하나뿐인데 근거가 약한 경우
    // -> 질문하지 않고 AI가 합리적으로 추론
    decision = "SAFE_INFERENCE";
    resolved_value = raw.top_candidate?.trim() || unique[0] || null;
  }

  return { ...raw, decision, resolved_value };
}

export function decideAll(raws: RawAmbiguityFinding[]): AmbiguityFinding[] {
  return raws.map(decide);
}
