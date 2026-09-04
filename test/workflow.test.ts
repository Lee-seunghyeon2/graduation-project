import { describe, expect, it } from "vitest";
import { runWorkflow } from "../src/workflow.js";
import { analyzerResponse, StubLLMClient } from "./stubLlmClient.js";
import type { WorkflowOutput } from "../src/types.js";

/** improved_prompt에서 "[명시화된 요청]" 섹션만 뽑아낸다.
 *  모호 표현이 실제로 치환되었는지는 이 섹션 기준으로 검증한다
 *  ([확정된 정보] 목록에는 투명성을 위해 원본 표현이 "->" 좌변으로 의도적으로 남아있다). */
function extractExplicitRequest(prompt: string): string {
  const match = prompt.match(/\[명시화된 요청\]\n([\s\S]*?)\n\n\[확정된 정보\]/);
  return match ? match[1] : "";
}

function expectReady(result: WorkflowOutput): asserts result is Extract<
  WorkflowOutput,
  { status: "ready" }
> {
  expect(result.status).toBe("ready");
}

function expectClarification(
  result: WorkflowOutput
): asserts result is Extract<WorkflowOutput, { status: "clarification_required" }> {
  expect(result.status).toBe("clarification_required");
}

describe("워크플로우 - reference (지시 대상 모호성)", () => {
  it("A. 문맥으로 해결 가능 -> 질문 없이 RESOLVED, 최종 프롬프트에 명시화", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "reference",
          expression: "그 기능",
          candidates: ["자동 저장 기능"],
          context_support: "strong",
          impact: "high",
          top_candidate: "자동 저장 기능",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "그 기능 빼줘.",
        recent_conversation: ["방금 자동 저장 기능을 새로 추가했어."],
        task_hint: "writing",
      },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.ambiguities[0].decision).toBe("RESOLVED");
    const explicit = extractExplicitRequest(result.improved_prompt);
    expect(explicit).toContain("자동 저장 기능");
    expect(explicit).not.toContain("그 기능");
  });

  it("B. 다소 모호하지만 영향 낮음 -> 질문 없이 SAFE_INFERENCE", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "reference",
          expression: "이거",
          candidates: ["보고서 초안 문장 표현"],
          context_support: "weak",
          impact: "low",
          top_candidate: "보고서 초안 문장 표현",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "이거 조금만 다듬어줘.", task_hint: "writing" },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.ambiguities[0].decision).toBe("SAFE_INFERENCE");
    expect(result.analysis.questions).toHaveLength(0);
  });

  it("C. 후보 2개 이상 + 영향 큼 -> CLARIFICATION_REQUIRED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "reference",
          expression: "그 기능",
          candidates: ["자동 저장 기능", "알림 기능"],
          context_support: "weak",
          impact: "high",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "그 기능 빼줘.",
        recent_conversation: ["자동 저장 기능을 추가했어.", "알림 기능도 넣었어."],
        task_hint: "writing",
      },
      { llm }
    );
    expectClarification(result);
    expect(result.questions).toHaveLength(1);
    expect(result.questions[0].options).toEqual(["자동 저장 기능", "알림 기능"]);
  });
});

describe("워크플로우 - omission (성분 생략)", () => {
  it("A. 직전 대화로 복원 가능 -> RESOLVED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "omission",
          expression: "정리해줘",
          candidates: ["보고서 문단 순서를 논리적으로 재정렬"],
          context_support: "strong",
          impact: "high",
          top_candidate: "보고서 문단 순서를 논리적으로 재정렬",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "정리해줘.",
        recent_conversation: ["보고서 초안을 검토했는데 문단이 뒤죽박죽이야."],
        task_hint: "writing",
      },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.ambiguities[0].decision).toBe("RESOLVED");
    const explicit = extractExplicitRequest(result.improved_prompt);
    expect(explicit).toContain("보고서 문단 순서를 논리적으로 재정렬");
  });

  it("B. 세부 목적은 없지만 일반적 기본값으로 수행 가능 -> SAFE_INFERENCE", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "omission",
          expression: "다듬어줘",
          candidates: ["전반적인 문장 표현 다듬기"],
          context_support: "weak",
          impact: "low",
          top_candidate: "전반적인 문장 표현 다듬기",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "다듬어줘.", task_hint: "writing" },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.questions).toHaveLength(0);
  });

  it("C. 무엇을 수정해야 하는지 자체가 불명확 -> CLARIFICATION_REQUIRED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "omission",
          expression: "바꿔줘",
          candidates: ["보고서 제목 변경", "보고서 본문 구성 변경"],
          context_support: "weak",
          impact: "high",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "바꿔줘.", task_hint: "writing" },
      { llm }
    );
    expectClarification(result);
    expect(result.questions.length).toBeGreaterThan(0);
    expect(result.questions.length).toBeLessThanOrEqual(3);
  });
});

describe("워크플로우 - degree (정도 모호성)", () => {
  it("A. 문서에 명시적 기준 존재 -> 해당 기준으로 RESOLVED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "degree",
          expression: "조금 더 길게",
          candidates: ["800자 내외로 분량 확대"],
          context_support: "strong",
          impact: "high",
          top_candidate: "800자 내외로 분량 확대",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "조금 더 길게 써줘.",
        document_context: "자기소개서는 800자 이내로 작성해야 함.",
        task_hint: "writing",
      },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.ambiguities[0].decision).toBe("RESOLVED");
    const explicit = extractExplicitRequest(result.improved_prompt);
    expect(explicit).toContain("800자 내외로 분량 확대");
  });

  it("B. 작은 스타일 조정, 영향 낮음 -> SAFE_INFERENCE (매번 질문하지 않음)", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "degree",
          expression: "조금 더 자세히",
          candidates: ["현재보다 조금 더 상세하게 설명 추가"],
          context_support: "weak",
          impact: "low",
          top_candidate: "현재보다 조금 더 상세하게 설명 추가",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "조금 더 자세히 써줘.", task_hint: "writing" },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.questions).toHaveLength(0);
  });

  it("C. 제한 준수를 강조하지만 실제 기준값 없음 -> CLARIFICATION_REQUIRED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "degree",
          expression: "짧게",
          candidates: [],
          context_support: "weak",
          impact: "high",
          top_candidate: null,
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "짧게 써줘. 분량 꼭 지켜줘.",
        task_hint: "writing",
      },
      { llm }
    );
    expectClarification(result);
    expect(result.questions).toHaveLength(1);
  });
});

describe("워크플로우 - comparison (비교 기준 모호성)", () => {
  it("A. 비교 가능한 이전 결과가 하나 -> RESOLVED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "comparison",
          expression: "전처럼",
          candidates: ["지난번 자기소개서 초안과 동일한 문체와 구조"],
          context_support: "strong",
          impact: "high",
          top_candidate: "지난번 자기소개서 초안과 동일한 문체와 구조",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "전처럼 써줘.",
        recent_conversation: ["지난번에 작성한 자기소개서 초안이 있어."],
        task_hint: "writing",
      },
      { llm }
    );
    expectReady(result);
    const explicit = extractExplicitRequest(result.improved_prompt);
    expect(explicit).toContain("지난번 자기소개서 초안과 동일한 문체와 구조");
    expect(explicit).not.toContain("전처럼");
  });

  it("B. 비교 대상은 명확하나 속성이 약간 불명확 + 위험 낮음 -> SAFE_INFERENCE", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "comparison",
          expression: "비슷하게",
          candidates: ["기존 문서와 비슷한 톤앤매너"],
          context_support: "weak",
          impact: "low",
          top_candidate: "기존 문서와 비슷한 톤앤매너",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "비슷하게 정리해줘.", task_hint: "writing" },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.questions).toHaveLength(0);
  });

  it("C. 비교 대상 후보가 여러 개 + 결과 크게 달라짐 -> CLARIFICATION_REQUIRED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "comparison",
          expression: "아까처럼",
          candidates: ["기획서 초안 A의 격식체 스타일", "기획서 초안 B의 구어체 스타일"],
          context_support: "weak",
          impact: "high",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "아까처럼 해줘.",
        recent_conversation: ["기획서 초안 A(격식체)를 만들었어.", "기획서 초안 B(구어체)도 만들었어."],
        task_hint: "writing",
      },
      { llm }
    );
    expectClarification(result);
    expect(result.questions[0].options).toHaveLength(2);
  });
});

describe("워크플로우 - scope (범위 모호성)", () => {
  it("A. 작업 중인 범위가 하나로 특정됨 -> RESOLVED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "scope",
          expression: "여기만",
          candidates: ["3번째 문단"],
          context_support: "strong",
          impact: "high",
          top_candidate: "3번째 문단",
        },
      ]),
    ]);
    const result = await runWorkflow(
      {
        current_user_request: "여기만 고쳐줘.",
        recent_conversation: ["3번째 문단에 오타가 있어."],
        task_hint: "writing",
      },
      { llm }
    );
    expectReady(result);
    const explicit = extractExplicitRequest(result.improved_prompt);
    expect(explicit).toContain("3번째 문단");
    expect(explicit).not.toContain("여기만");
  });

  it("B. 전체 스타일 조정 등 자율 적용해도 영향 낮음 -> SAFE_INFERENCE", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "scope",
          expression: "필요한 부분만",
          candidates: ["전반적으로 어색한 부분들"],
          context_support: "weak",
          impact: "low",
          top_candidate: "전반적으로 어색한 부분들",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "필요한 부분만 정리해줘.", task_hint: "writing" },
      { llm }
    );
    expectReady(result);
    expect(result.analysis.questions).toHaveLength(0);
  });

  it("C. 여러 영역 중 어디인지 불명확 + 훼손 위험 큼 -> CLARIFICATION_REQUIRED", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "scope",
          expression: "일부만",
          candidates: ["결론 부분", "서론 부분"],
          context_support: "weak",
          impact: "high",
        },
      ]),
    ]);
    const result = await runWorkflow(
      { current_user_request: "일부만 수정해줘.", task_hint: "writing" },
      { llm }
    );
    expectClarification(result);
    expect(result.questions[0].options).toEqual(["결론 부분", "서론 부분"]);
  });
});

describe("워크플로우 - 답변 이어받기 (clarification 이후 재입력)", () => {
  it("clarification_required 이후 answers를 반영하면 ready 상태로 개선된 prompt를 생성한다", async () => {
    const llm = new StubLLMClient([
      analyzerResponse([
        {
          type: "reference",
          expression: "그 기능",
          candidates: ["자동 저장 기능", "알림 기능"],
          context_support: "weak",
          impact: "high",
        },
      ]),
    ]);
    const first = await runWorkflow(
      { current_user_request: "그 기능 빼줘.", task_hint: "writing" },
      { llm }
    );
    expectClarification(first);
    const questionId = first.questions[0].id;

    const second = await runWorkflow(
      {
        current_user_request: "그 기능 빼줘.",
        previous_analysis: first.analysis,
        answers: { [questionId]: "알림 기능" },
      },
      { llm }
    );
    expectReady(second);
    const explicit = extractExplicitRequest(second.improved_prompt);
    expect(explicit).toContain("알림 기능");
    expect(explicit).not.toContain("그 기능");
  });
});
