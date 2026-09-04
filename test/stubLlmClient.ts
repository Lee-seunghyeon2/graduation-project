import type { LLMClient } from "../src/llm/client.js";

/** 테스트 전용 LLMClient. 호출 순서대로 미리 준비한 JSON 문자열을 반환한다.
 *  실제 네트워크 호출 없이 AmbiguityAnalyzer/TaskClassifier/workflow를 검증하기 위함. */
export class StubLLMClient implements LLMClient {
  private calls = 0;

  constructor(private readonly responses: string[]) {}

  async complete(_systemPrompt: string, _userPrompt: string): Promise<string> {
    const response = this.responses[this.calls];
    this.calls++;
    if (response === undefined) {
      throw new Error(
        `StubLLMClient: ${this.calls}번째 호출에 대해 준비된 응답이 없습니다.`
      );
    }
    return response;
  }

  get callCount(): number {
    return this.calls;
  }
}

/** AmbiguityAnalyzer가 기대하는 형태의 JSON 응답을 손쉽게 만들기 위한 헬퍼 */
export function analyzerResponse(
  ambiguities: Array<{
    type: string;
    expression: string;
    candidates: string[];
    context_support: "strong" | "medium" | "weak";
    impact: "high" | "low";
    top_candidate?: string | null;
  }>
): string {
  return JSON.stringify({ ambiguities });
}
