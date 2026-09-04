import { describe, expect, it } from "vitest";
import { buildImprovedPrompt } from "../src/promptBuilder/index.js";
import type { AnalysisResult, ContextBundle } from "../src/types.js";

const emptyContext: ContextBundle = { recent_conversation: [], document_context: null };

describe("promptBuilder", () => {
  it("planning: 확정된 정보가 명시화된 요청 문장에 반영된다", () => {
    const analysis: AnalysisResult = {
      task: "planning",
      original_request: "이거 보고 계획 짜줘.",
      ambiguities: [
        {
          type: "reference",
          expression: "이거",
          candidates: ["AI 공모전 안내문"],
          context_support: "strong",
          impact: "high",
          top_candidate: "AI 공모전 안내문",
          decision: "RESOLVED",
          resolved_value: "AI 공모전 안내문",
        },
      ],
      questions: [],
    };
    const prompt = buildImprovedPrompt(analysis, {
      recent_conversation: [],
      document_context: "AI 공모전 안내문 원문...",
    });
    expect(prompt).toContain("AI 공모전 안내문 보고 계획 짜줘.");
    expect(prompt).not.toMatch(/명시화된 요청\]\n이거/);
    expect(prompt).toContain("첨부된 문서에 명시된 마감일");
  });

  it("writing: task별 출력 형식 지침이 다르게 적용된다", () => {
    const analysis: AnalysisResult = {
      task: "writing",
      original_request: "그 기능 빼줘.",
      ambiguities: [
        {
          type: "reference",
          expression: "그 기능",
          candidates: ["알림 기능"],
          context_support: "strong",
          impact: "high",
          top_candidate: "알림 기능",
          decision: "RESOLVED",
          resolved_value: "알림 기능",
        },
      ],
      questions: [],
    };
    const prompt = buildImprovedPrompt(analysis, emptyContext);
    expect(prompt).toContain("알림 기능 빼줘.");
    expect(prompt).toContain("문서를 작성/수정한다");
  });
});
