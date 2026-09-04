import type { LLMClient } from "./client.js";

// Groq(OpenAI 호환 chat completions) API를 사용하는 LLMClient 구현체.
// 무료/고속 티어 테스트용 - 별도 SDK 의존성 없이 Node 내장 fetch로 호출한다.

interface GroqChatCompletionResponse {
  choices?: Array<{
    message?: { content?: string };
  }>;
  error?: { message: string; type?: string; code?: string };
}

export class GroqLLMClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(model = "llama-3.1-8b-instant") {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY 환경변수가 설정되어 있지 않습니다.");
    }
    this.apiKey = apiKey;
    this.model = process.env.GROQ_MODEL || model;
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
      }),
    });

    const data = (await res.json()) as GroqChatCompletionResponse;

    if (!res.ok || data.error) {
      const message = data.error?.message ?? `HTTP ${res.status}`;
      throw new Error(`Groq API 호출 실패: ${message}`);
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(`Groq 응답에서 텍스트를 찾을 수 없습니다: ${JSON.stringify(data)}`);
    }
    return text;
  }
}
