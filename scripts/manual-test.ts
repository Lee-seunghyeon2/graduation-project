// 실제 LLM(Gemini)로 워크플로우를 한 번 실행해보는 수동 테스트 스크립트.
// 실행: node --env-file=.env --import tsx scripts/manual-test.ts
import { AnthropicLLMClient, type LLMClient } from "../src/llm/client.js";
import { GeminiLLMClient } from "../src/llm/geminiClient.js";
import { GroqLLMClient } from "../src/llm/groqClient.js";
import { runWorkflow } from "../src/workflow.js";

function createLLMClient(): LLMClient {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  if (provider === "gemini") return new GeminiLLMClient();
  if (provider === "groq") return new GroqLLMClient();
  return new AnthropicLLMClient();
}

async function main() {
  const llm = createLLMClient();

  const cases = [
    {
      label: "reference - 문맥상 후보가 여러 개 (질문이 나와야 함)",
      input: {
        current_user_request: "그 기능 빼줘.",
        recent_conversation: ["자동 저장 기능을 추가했어.", "알림 기능도 넣었어."],
      },
    },
    {
      label: "omission - 직전 대화로 복원 가능 (질문 없이 바로 결과)",
      input: {
        current_user_request: "정리해줘.",
        recent_conversation: ["보고서 초안을 검토했는데 문단이 뒤죽박죽이야."],
      },
    },
    {
      label: "degree - 가벼운 스타일 조정, 영향 낮음 (질문 없이 바로 결과 기대)",
      input: {
        current_user_request: "이 문장 조금만 더 자연스럽게 다듬어줘.",
        recent_conversation: ["자기소개서 첫 문단 초안: 저는 어릴 때부터 컴퓨터에 관심이 많았습니다."],
      },
    },
  ];

  for (const c of cases) {
    console.log("\n=================================");
    console.log("CASE:", c.label);
    console.log("INPUT:", JSON.stringify(c.input, null, 2));
    try {
      const result = await runWorkflow(c.input, { llm });
      console.log("RESULT:\n", JSON.stringify(result, null, 2));
    } catch (err) {
      console.error("ERROR:", err);
    }
  }
}

main();
