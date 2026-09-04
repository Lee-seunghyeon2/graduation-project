import type { LLMClient } from "./client.js";

// Gemini(Google AI Studio) REST API를 사용하는 LLMClient 구현체.
// 무료 티어 테스트용 - 별도 SDK 의존성 없이 Node 내장 fetch로 호출한다.

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: { code: number; message: string; status: string };
}

export class GeminiLLMClient implements LLMClient {
  private apiKey: string;
  private model: string;

  constructor(model = "gemini-2.0-flash") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY 환경변수가 설정되어 있지 않습니다.");
    }
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_MODEL || model;
  }

  async complete(systemPrompt: string, userPrompt: string): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });

    const data = (await res.json()) as GeminiGenerateContentResponse;

    if (!res.ok || data.error) {
      const message = data.error?.message ?? `HTTP ${res.status}`;
      throw new Error(`Gemini API 호출 실패: ${message}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("");
    if (!text) {
      throw new Error(`Gemini 응답에서 텍스트를 찾을 수 없습니다: ${JSON.stringify(data)}`);
    }
    return text;
  }
}
