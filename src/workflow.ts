import { analyzeAmbiguities } from "./ambiguityAnalyzer.js";
import { generateClarificationQuestions } from "./clarificationQuestionGenerator.js";
import { buildContextBundle, formatContextForPrompt } from "./contextResolver.js";
import { decideAll } from "./decisionEngine.js";
import type { LLMClient } from "./llm/client.js";
import { buildImprovedPrompt } from "./promptBuilder/index.js";
import { classifyTask } from "./taskClassifier.js";
import type { AmbiguityFinding, AnalysisResult, WorkflowInput, WorkflowOutput } from "./types.js";

// 메인 워크플로우:
//   request + recent_conversation + document_context
//   -> Task 판별 -> 모호성 탐지(LLM) -> Decision -> (질문 또는 improved_prompt)
//
// previous_analysis + answers가 함께 들어오면 새로 분석하지 않고
// 이전에 CLARIFICATION_REQUIRED였던 항목을 답변으로 확정한 뒤 이어서 처리한다.
// (v0에서는 세션 DB 없이, 호출자가 이전 AnalysisResult를 그대로 다시 넘겨주는 방식으로 확장성을 확보)

export interface WorkflowDeps {
  llm: LLMClient;
}

export async function runWorkflow(
  input: WorkflowInput,
  deps: WorkflowDeps
): Promise<WorkflowOutput> {
  const contextBundle = buildContextBundle(input.recent_conversation, input.document_context);

  if (input.previous_analysis && input.answers) {
    return continueFromAnswers(input.previous_analysis, input.answers, contextBundle);
  }

  return runFreshAnalysis(input, deps, contextBundle);
}

async function runFreshAnalysis(
  input: WorkflowInput,
  deps: WorkflowDeps,
  contextBundle: ReturnType<typeof buildContextBundle>
): Promise<WorkflowOutput> {
  const contextText = formatContextForPrompt(contextBundle);
  const request = input.current_user_request;

  const task = input.task_hint ?? (await classifyTask(deps.llm, request, contextText));
  const rawFindings = await analyzeAmbiguities(deps.llm, task, request, contextText);
  const decided = decideAll(rawFindings);
  const { questions, findings } = generateClarificationQuestions(decided);

  const analysis: AnalysisResult = {
    task,
    original_request: request,
    ambiguities: findings,
    questions: questions.map((q) => q.question),
  };

  if (questions.length > 0) {
    return { status: "clarification_required", questions, analysis };
  }

  const improved_prompt = buildImprovedPrompt(analysis, contextBundle);
  return { status: "ready", improved_prompt, analysis };
}

function continueFromAnswers(
  previousAnalysis: AnalysisResult,
  answers: Record<string, string>,
  contextBundle: ReturnType<typeof buildContextBundle>
): WorkflowOutput {
  const updated: AmbiguityFinding[] = previousAnalysis.ambiguities.map((f) => {
    if (f.decision === "CLARIFICATION_REQUIRED" && f.question_id && answers[f.question_id]) {
      return {
        ...f,
        decision: "RESOLVED",
        resolved_value: answers[f.question_id],
      };
    }
    return f;
  });

  const { questions, findings } = generateClarificationQuestions(updated);

  const analysis: AnalysisResult = {
    ...previousAnalysis,
    ambiguities: findings,
    questions: questions.map((q) => q.question),
  };

  if (questions.length > 0) {
    return { status: "clarification_required", questions, analysis };
  }

  const improved_prompt = buildImprovedPrompt(analysis, contextBundle);
  return { status: "ready", improved_prompt, analysis };
}
