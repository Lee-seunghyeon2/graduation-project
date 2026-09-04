import type { ContextBundle } from "./types.js";

// v0 ContextResolver
// 복잡한 retrieval/scoring 없이 recent_conversation과 document_context를
// LLM 프롬프트에 넣을 수 있는 하나의 텍스트로 정리하는 역할만 한다.
// "현재 Task와 의미적으로 연결되는지"에 대한 판단은 여기서 점수화하지 않고,
// 정리된 컨텍스트를 AmbiguityAnalyzer(LLM)에게 그대로 넘겨 LLM이 직접 판단하게 한다.

const MAX_DOCUMENT_CHARS = 4000;
const MAX_CONVERSATION_TURNS = 10;

export function buildContextBundle(
  recentConversation: string[] | undefined,
  documentContext: string | undefined
): ContextBundle {
  const trimmedConversation = (recentConversation ?? [])
    .filter((turn) => turn.trim().length > 0)
    .slice(-MAX_CONVERSATION_TURNS);

  const trimmedDocument = documentContext?.trim()
    ? documentContext.trim().slice(0, MAX_DOCUMENT_CHARS)
    : null;

  return {
    recent_conversation: trimmedConversation,
    document_context: trimmedDocument,
  };
}

export function formatContextForPrompt(bundle: ContextBundle): string {
  const parts: string[] = [];

  if (bundle.recent_conversation.length > 0) {
    const numbered = bundle.recent_conversation
      .map((turn, i) => `  ${i + 1}. ${turn}`)
      .join("\n");
    parts.push(`[최근 대화 (오래된 순)]\n${numbered}`);
  } else {
    parts.push("[최근 대화]\n(없음)");
  }

  if (bundle.document_context) {
    parts.push(`[첨부 문서 내용]\n${bundle.document_context}`);
  } else {
    parts.push("[첨부 문서 내용]\n(없음)");
  }

  return parts.join("\n\n");
}
