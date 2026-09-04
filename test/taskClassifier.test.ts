import { describe, expect, it } from "vitest";
import { classifyTask } from "../src/taskClassifier.js";
import { StubLLMClient } from "./stubLlmClient.js";

describe("taskClassifier", () => {
  it("계획 관련 요청은 planning으로 분류한다", async () => {
    const llm = new StubLLMClient([JSON.stringify({ task: "planning" })]);
    const task = await classifyTask(llm, "이 공모전 준비 계획 짜줘.", "(문맥 없음)");
    expect(task).toBe("planning");
  });

  it("문서 작성 관련 요청은 writing으로 분류한다", async () => {
    const llm = new StubLLMClient([JSON.stringify({ task: "writing" })]);
    const task = await classifyTask(llm, "자기소개서 다듬어줘.", "(문맥 없음)");
    expect(task).toBe("writing");
  });
});
