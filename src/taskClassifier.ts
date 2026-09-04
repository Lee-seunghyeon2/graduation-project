import type { LLMClient } from "./llm/client.js";
import { parseJsonResponse } from "./llm/client.js";
import type { Task } from "./types.js";

const SYSTEM_PROMPT = `너는 한국어 사용자의 작업 요청을 아래 두 Task 중 하나로 분류하는 분류기다.

1. planning: 프로젝트/학업/업무 계획 수립, 첨부 문서를 기반으로 한 실행 계획 작성
2. writing: 보고서, 자기소개서, 기획서 등 자료 기반 문서의 작성/수정

반드시 아래 JSON 형식으로만 답하라. 다른 설명은 절대 추가하지 마라.
{"task": "planning" | "writing"}`;

export async function classifyTask(
  llm: LLMClient,
  request: string,
  contextText: string
): Promise<Task> {
  const userPrompt = `[사용자 요청]\n${request}\n\n[문맥]\n${contextText}`;
  const raw = await llm.complete(SYSTEM_PROMPT, userPrompt);
  const parsed = parseJsonResponse<{ task: string }>(raw);
  if (parsed.task !== "planning" && parsed.task !== "writing") {
    throw new Error(`TaskClassifier가 알 수 없는 task를 반환했습니다: ${parsed.task}`);
  }
  return parsed.task;
}
