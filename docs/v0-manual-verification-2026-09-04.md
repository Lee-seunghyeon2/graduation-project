# v0 실사용 검증 기록 (2026-09-04) — Claude Sonnet 4.5 + Claude Desktop

2026-08-13 검증([v0-manual-verification.md](./v0-manual-verification.md))은 실제 LLM로 Gemini(무료 티어)를 사용했다.
본 기록은 동일한 세 경로(RESOLVED/SAFE_INFERENCE 자동 처리, CLARIFICATION_REQUIRED 질문,
답변 이어받기)를 **Claude Sonnet 4.5(Anthropic API)**를 붙인 상태에서, **실제 MCP 클라이언트(Claude Desktop)**로
`analyze_prompt` 전체 파이프라인이 정상 동작하는지 재검증한 것이다.

## 검증 환경

- MCP 클라이언트: Claude Desktop (`claude_desktop_config.json`의 `mcpServers.korean-prompt-improver`로 stdio 등록)
- MCP 서버: 로컬 빌드 `dist/index.js`
- LLM: Anthropic API, `LLM_PROVIDER=anthropic`, 모델 `claude-sonnet-4-5` (`AnthropicLLMClient` 기본값), `ANTHROPIC_WORKSPACE_ID` 헤더 사용
- 변경 사항: `src/llm/client.ts`의 `AnthropicLLMClient` `max_tokens` 1500 → **2000** (분석 응답이 후보를 많이 생성할 때 잘리는 것을 방지). 재빌드 후 Claude Desktop 재시작.
- 호출: Claude Desktop에서 `mcp__korean-prompt-improver__analyze_prompt` 툴을 직접 호출, 반환 JSON 원문 그대로 기록
- 프로덕션 로직(`src/*`)은 위 `max_tokens` 한 줄 외에 수정 없음

## Case A — reference + degree, 질문 없이 자동 처리 (RESOLVED / SAFE_INFERENCE)

**입력**
```json
{
  "current_user_request": "이 문장 조금만 더 자연스럽게 다듬어줘.",
  "recent_conversation": [
    "자기소개서 첫 문단 초안 한 문장: 저는 어릴 때부터 컴퓨터에 관심이 많았습니다."
  ]
}
```

**결과**
- `status: ready`
- `reference` "이 문장" → candidates 1개("저는 어릴 때부터 컴퓨터에 관심이 많았습니다"), `context_support: strong`, `impact: high` → **RESOLVED**
- `degree` "조금만 더" → candidates `["약간의 표현 수정","어순 조정","어휘 교체"]`, `context_support: weak`, `impact: low` → **SAFE_INFERENCE** (`resolved_value: "약간의 표현 수정"`)
- `questions: []`
- `improved_prompt` [확정된 정보]:
  - `"이 문장" → 저는 어릴 때부터 컴퓨터에 관심이 많았습니다 (문맥상 확정)`
  - `"조금만 더" → 약간의 표현 수정 (AI 추론(영향 낮음))`

→ 대명사가 이전 대화의 실제 문장으로 치환되고, 위험이 낮은 정도 표현(`impact: low`)은 질문 없이 넘어가는
공통 Decision 규칙이 Claude Sonnet 4.5 출력 위에서도 동작함을 확인.

## Case B — reference, 후보 2개 + impact 높음 → 질문 (CLARIFICATION_REQUIRED)

**입력**
```json
{
  "current_user_request": "그 기능 빼줘.",
  "recent_conversation": ["자동 저장 기능을 추가했어.", "알림 기능도 넣었어."]
}
```

**결과**
- `status: clarification_required`
- `reference` "그 기능" → candidates `["자동 저장 기능","알림 기능"]`, `context_support: strong`, `impact: high` → **CLARIFICATION_REQUIRED** (`question_id: q1`)
- `omission` "빼줘" → candidates `["문서에서 해당 기능 설명 삭제","기능 코드 제거","기능 목록에서 제외"]`, `context_support: weak`, `impact: high` → **CLARIFICATION_REQUIRED** (`question_id: q2`)
- 생성 질문
  - q1(선택형): `"그 기능"은(는) 다음 중 무엇을 의미하나요? 1. 자동 저장 기능 2. 알림 기능`
  - q2(선택형): `"빼줘"은(는) 다음 중 무엇을 의미하나요? 1. 문서에서 해당 기능 설명 삭제 2. 기능 코드 제거 3. 기능 목록에서 제외`

→ 후보가 하나로 좁혀지지 않고(2개) 삭제라는 되돌리기 어려운 작업(`impact: high`)이라 질문으로 분기.
DecisionEngine 핵심 규칙("유력 후보 2개 이상 AND 결과 영향 큼 → 질문")이 실제 클라이언트 위에서 동작.

## Case C — Case B 이어받기: 답변 반영 (previous_analysis + answers)

**입력** (Case B가 반환한 `analysis`를 그대로 되돌려주고 답변 추가)
```json
{
  "current_user_request": "그 기능 빼줘.",
  "previous_analysis": "<Case B의 analysis JSON 문자열>",
  "answers": { "q1": "자동 저장 기능", "q2": "기능 목록에서 제외" }
}
```

**결과**
- `status: ready` (LLM 재호출 없음 — `continueFromAnswers` 경로)
- `reference` "그 기능": `decision` `CLARIFICATION_REQUIRED` → **RESOLVED**, `resolved_value: "자동 저장 기능"`, `question_id: q1` 유지
- `omission` "빼줘": `decision` `CLARIFICATION_REQUIRED` → **RESOLVED**, `resolved_value: "기능 목록에서 제외"`, `question_id: q2` 유지
- `questions: []`
- `improved_prompt`:
```
다음 요청에 따라 문서를 작성/수정한다.

[명시화된 요청]
자동 저장 기능 기능 목록에서 제외.

[확정된 정보]
- "그 기능" → 자동 저장 기능 (문맥상 확정)
- "빼줘" → 기능 목록에서 제외 (문맥상 확정)

[출력 형식 지침]
위에서 확정된 대상/범위/기준/스타일을 그대로 반영하여 완성도 있는 문서를 작성한다.
```

→ 세션 DB 없이 호출자가 이전 `analysis` JSON을 되돌려주는 것만으로 답변 이어받기가 동작하고
최종 `improved_prompt`까지 생성됨을 확인.

## 종합

- 세 경로(자동 처리 / 질문 / 답변 이어받기) 모두 **Claude Sonnet 4.5 + Claude Desktop**에서 요청 분석 → (질문) → 답변 반영 → 최종 프롬프트 생성까지 정상 동작.
- `max_tokens=1500`에서는 Case A 같은 다후보 분석 응답이 잘리는 경우가 있어 **2000으로 상향** 후 안정화. (Groq qwen에서 보이던 `<think>` 누출은 Claude에서는 없음.)

### 이번 검증에서 관찰된 v1 개선 후보 (기능 동작과 별개)

1. Case A·B에서 Claude가 stub 가정보다 보수적으로 판단해 질문을 더 자주 만든다. (2026-08-19 Anthropic 30케이스 평가의 Unnecessary Clarification 경향과 일치 — [claude-vs-groq-comparison.md](../evaluation-results/claude-vs-groq-comparison.md))
2. Case C `improved_prompt`의 [명시화된 요청]이 문자열 치환이라 "자동 저장 기능 기능 목록에서 제외."처럼 조사가 어색하게 남는다. (v1-backlog: improved_prompt 자연스러운 재작성)
3. Case C에서 답변으로 확정된 항목의 근거가 "(문맥상 확정)"으로 표시된다. "(사용자 답변으로 확정)"이 더 정확. (`src/promptBuilder/common.ts` 근거 라벨)
