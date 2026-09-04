#!/usr/bin/env node
try {
  // 로컬 개발/수동 테스트 편의를 위해 .env가 있으면 불러온다 (없으면 무시).
  process.loadEnvFile();
} catch {
  // .env 파일이 없는 경우 (예: 배포 환경에서 환경변수를 직접 주입) - 무시
}

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AnthropicLLMClient, type LLMClient } from "./llm/client.js";
import { GeminiLLMClient } from "./llm/geminiClient.js";
import { GroqLLMClient } from "./llm/groqClient.js";
import type { AnalysisResult } from "./types.js";
import { runWorkflow } from "./workflow.js";

function createLLMClient(): LLMClient {
  const provider = process.env.LLM_PROVIDER ?? "anthropic";
  switch (provider) {
    case "gemini":
      return new GeminiLLMClient();
    case "groq":
      return new GroqLLMClient();
    case "anthropic":
      return new AnthropicLLMClient();
    default:
      throw new Error(`알 수 없는 LLM_PROVIDER: ${provider}`);
  }
}

// 한국어 프롬프트 개선 MCP v0
// 메인 워크플로우(analyze_prompt) 하나만 노출한다.
// - 질문이 필요하면 clarification_required 상태와 questions를 반환한다.
// - 필요 없으면 improved_prompt를 생성해 ready 상태로 반환한다.
// - 이전 analysis(JSON)와 answers를 함께 넘기면 답변을 반영해 이어서 처리한다.

const server = new McpServer({
  name: "korean-prompt-improver",
  version: "0.1.0",
});

const llm = createLLMClient();

server.registerTool(
  "analyze_prompt",
  {
    title: "한국어 프롬프트 모호성 분석 및 개선",
    description:
      "사용자의 짧고 모호한 한국어 요청을 이전 대화와 첨부 문서 문맥으로 분석해 " +
      "모호성을 해결하고, 필요한 경우에만 명확화 질문을 반환하며, " +
      "그렇지 않으면 실제 작업에 사용할 수 있는 개선된 Prompt를 생성한다.",
    inputSchema: {
      current_user_request: z.string().describe("사용자의 현재 요청 원문"),
      recent_conversation: z
        .array(z.string())
        .optional()
        .describe("최근 대화 내역 (오래된 순서)"),
      document_context: z.string().optional().describe("첨부 문서 내용 또는 요약"),
      task_hint: z
        .enum(["planning", "writing"])
        .optional()
        .describe("Task를 이미 알고 있다면 명시적으로 지정 (생략 시 자동 판별)"),
      previous_analysis: z
        .string()
        .optional()
        .describe(
          "이전 analyze_prompt 호출이 반환한 analysis 객체의 JSON 문자열. " +
            "answers와 함께 넘기면 명확화 질문에 대한 답변을 반영해 이어서 처리한다."
        ),
      answers: z
        .record(z.string())
        .optional()
        .describe("이전에 반환된 질문 id(q1, q2, ...) -> 사용자 답변 텍스트"),
    },
  },
  async (args) => {
    const previous_analysis: AnalysisResult | undefined = args.previous_analysis
      ? (JSON.parse(args.previous_analysis) as AnalysisResult)
      : undefined;

    const result = await runWorkflow(
      {
        current_user_request: args.current_user_request,
        recent_conversation: args.recent_conversation,
        document_context: args.document_context,
        task_hint: args.task_hint,
        previous_analysis,
        answers: args.answers,
      },
      { llm }
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("korean-prompt-improver MCP server (v0) running on stdio");
}

main().catch((err) => {
  console.error("MCP 서버 시작 실패:", err);
  process.exit(1);
});
