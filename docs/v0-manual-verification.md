# v0 실사용 검증 기록 (2026-08-13)

자동 테스트(vitest, stub LLM)와 별개로, 실제 LLM(Gemini 2.5/3.x free tier)과 실제 MCP 클라이언트(Claude Desktop)로
`analyze_prompt` 전체 파이프라인을 검증한 기록. 세 경로(RESOLVED/SAFE_INFERENCE 자동 처리,
CLARIFICATION_REQUIRED 질문, 답변 이어받기)를 모두 실사용 환경에서 확인했다.

## 검증 환경
- LLM: Gemini API (`GEMINI_MODEL=gemini-flash-latest`, free tier, 결제 계정 없음 — 429 quota 에러로 무료 티어임을 실측 확인)
- MCP 클라이언트: Claude Desktop (`claude_desktop_config.json`에 `korean-prompt-improver` stdio 서버 등록)
- 서버: 로컬 빌드(`dist/index.js`), `.env`로 `LLM_PROVIDER=gemini` 주입

## Case A — reference + degree, 질문 없이 자동 처리 (SAFE_INFERENCE / RESOLVED)

**1턴 (문맥 제공)**
> 자기소개서 첫 문단 초안: "저는 어릴 때부터 컴퓨터에 관심이 많았습니다."

**2턴 (모호 요청)**
> analyze_prompt 툴로 분석해줘: "이 문장 조금만 더 자연스럽게 다듬어줘."

**결과**
- `status: ready`
- 모호성 2건
  1. `reference` "이 문장" → 1턴의 특정 문장으로 RESOLVED (`context_support: strong`)
  2. `degree` "조금만 더" → 구체적 기준 후보 없음, `impact: low` → SAFE_INFERENCE (질문 없음)
- `questions: []`
- `improved_prompt`의 [명시화된 요청]: "자기소개서 첫 문단의 '저는 어릴 때부터 컴퓨터에 관심이 많았습니다.' 문장 조금만 더 자연스럽게 다듬어줘."

→ 대명사가 이전 대화의 실제 문장으로 정확히 치환되고, 스타일 조정처럼 위험이 낮은 정도 표현은 질문 없이 넘어가는
스펙 3번(공통 Decision 규칙)의 의도대로 동작함을 확인.

## Case B — reference, 후보 2개 + impact 높음 → 질문 (CLARIFICATION_REQUIRED)

**1턴 (문맥 제공)**
> 자동 저장 기능을 추가했어. 알림 기능도 넣었어.

**2턴 (모호 요청)**
> analyze_prompt 툴 써서 분석해줘: "그 기능 빼줘."

**결과**
- `status: clarification_required`
- "그 기능" → 후보 2개("자동 저장 기능" / "알림 기능"), `context_support: medium`, `impact: high` → CLARIFICATION_REQUIRED
- 생성 질문(q1, 선택형): `"그 기능"은(는) 다음 중 무엇을 의미하나요? 1. 자동 저장 기능 2. 알림 기능`

→ 후보가 하나로 좁혀지지 않고(2개) 삭제라는 되돌리기 어려운 작업(impact: high)이라 질문으로 넘어감.
Case A(후보 1개 → 자동 해결)와 대조되는 사례로, DecisionEngine의 핵심 규칙
("유력 후보 2개 이상 AND 결과 영향 큼 → 질문")이 실제 모델 출력 위에서도 정확히 작동함을 확인.

## Case C — Case B 이어받기: 답변 반영 (previous_analysis + answers)

**3턴**
> 방금 q1에 "자동 저장 기능"으로 답할게. analyze_prompt에 이전 analysis와
> `answers: {"q1": "자동 저장 기능"}`을 같이 넣어서 이어서 분석해줘.

**결과**
- `status: ready`
- "그 기능" ambiguity: `decision`이 `CLARIFICATION_REQUIRED` → `RESOLVED`로 전환, `resolved_value: "자동 저장 기능"`
  (`question_id: q1`은 그대로 유지되어 어떤 질문에 대한 답인지 추적 가능)
- `questions: []`
- `improved_prompt`: "자동 저장 기능 빼줘." + [확정된 정보]에 `"그 기능" → 자동 저장 기능 (문맥상 확정)` 명시

→ 세션 DB 없이 호출자가 이전 `analysis` JSON을 그대로 되돌려주는 것만으로 이어받기가 정확히 동작함을 확인.
스펙 8번("확장 가능한 형태로 구현")이 실제 클라이언트 환경에서 실증됨.

## 종합
- 자동 테스트(15+1케이스, stub) → 실제 LLM(스크립트) → 실제 MCP 클라이언트(Claude Desktop) 3단계 모두에서
  RESOLVED / SAFE_INFERENCE / CLARIFICATION_REQUIRED 세 경로와 답변 이어받기 흐름이 일관되게 동작.
- 다만 실제 모델의 판단이 항상 손으로 짠 stub 테스트의 가정과 일치하지는 않음 (→ [v1-backlog.md](./v1-backlog.md) 참고).
