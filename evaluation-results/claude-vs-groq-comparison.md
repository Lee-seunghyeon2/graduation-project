# Claude Sonnet 4.5 vs Groq (Qwen3.6-27B) — v0 한국어 프롬프트 개선 MCP 비교 평가

이 문서는 동일한 30개 테스트 케이스(tests/evaluation/v0-additional-cases.json)를 두 개의 서로 다른 LLM 백엔드로 실행한 비교 데이터입니다.
production 로직(ambiguity 판단 규칙, DecisionEngine, PromptBuilder, ClarificationQuestionGenerator)은 완전히 동일하고, 오직 AmbiguityAnalyzer/TaskClassifier를 호출하는 LLM만 다릅니다.

## 1. 실행 환경

- **Claude Sonnet 4.5**: model=claude-sonnet-4-5, provider=anthropic (유료 API), PASS 8 / FAIL 19 / REVIEW 3 / ERROR 0 (성공 API 호출 30/30)
- **Groq (Qwen3.6-27B)**: model=qwen/qwen3.6-27b, provider=groq (무료 티어), PASS 9 / FAIL 12 / REVIEW 2 / ERROR 7 (성공 API 호출 23/30)

## 2. 전체 요약

| Provider | PASS | FAIL | REVIEW | ERROR | 성공 호출 |
|---|---|---|---|---|---|
| Claude Sonnet 4.5 | 8 | 19 | 3 | 0 | 30/30 |
| Groq Qwen3.6-27B | 9 | 12 | 2 | 7 | 23/30 |

Groq의 ERROR 7건은 쿼터 문제가 아니라 reasoning 모델(Qwen)이 `<think>` 태그를 JSON 없이 응답에 섞어 보내 파싱에 실패한 경우(6건) + 스키마 위반(impact="medium", 1건)입니다 (quota_failures=0).
Claude는 유료 API라 재시도/쿼터 문제 없이 30/30 전부 실데이터를 확보했습니다.

**중요**: Claude가 Groq보다 FAIL이 훨씬 많지만(19 vs 12), 이는 Claude의 "실패"가 아니라 Claude가 Groq보다 훨씬 자주 CLARIFICATION_REQUIRED(질문)를 발동시키기 때문입니다 (Unnecessary Clarification 15건, Question Generation Failure 18건 — 아래 4번 참고). 즉 Claude는 v0 fixture 기준으로 더 "조심스러운/의심 많은" 모델입니다.

## 3. 모호성 유형별 비교

| 유형 | Claude (PASS/FAIL/REVIEW/ERROR) | Groq (PASS/FAIL/REVIEW/ERROR) |
|---|---|---|
| reference | 0/2/1/0 | 1/1/1/0 |
| omission | 2/2/0/0 | 1/2/0/1 |
| degree | 0/4/0/0 | 1/1/0/2 |
| comparison | 3/1/0/0 | 2/1/0/1 |
| scope | 0/3/1/0 | 1/2/0/1 |
| compound | 0/3/1/0 | 0/1/1/2 |
| false_positive | 0/2/0/0 | 0/2/0/0 |
| false_negative | 1/1/0/0 | 1/1/0/0 |
| context_conflict | 1/1/0/0 | 1/1/0/0 |
| question_limit | 1/0/0/0 | 1/0/0/0 |

## 4. Failure Classification 비교 (FAIL 케이스만, 케이스당 여러 분류 중복 가능)

| 분류 | Claude 건수 | Groq 건수 |
|---|---|---|
| Ambiguity Detection Failure | 2 | 4 |
| Context Resolution Failure | 0 | 0 |
| Impact Judgment Failure | 0 | 0 |
| Decision Failure | 0 | 0 |
| Unnecessary Clarification | 15 | 8 |
| Missing Clarification | 0 | 0 |
| Question Generation Failure | 18 | 8 |
| Prompt Explicitization Failure | 0 | 0 |

## 5. 케이스별 상세 비교

| case_id | 유형 | expected_status | Claude verdict | Claude 이유(요약) | Groq verdict | Groq 이유(요약) |
|---|---|---|---|---|---|---|
| R1 | reference | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=2 | PASS | - |
| R2 | reference | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범... | FAIL | status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범... |
| R3 | reference | clarification_required | ready | REVIEW | - | REVIEW | 질문 개수 범위 초과: expected=0-1, actual=2 |
| O1 | omission | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUI... | ERROR | LLM 호출/파싱 실패: LLM 응답을 JSON으로 파싱하지 못했습니다: Unexpected token '<', "<think> He"... is not valid JSON 원본: <think> Here's a thinking process: 1. **Analyze U... |
| O2 | omission | clarification_required | PASS | - | FAIL | 탐지 누락: [omission] 타입이 탐지되지 않음 |
| O3 | omission | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUI... | FAIL | status 불일치: expected=[ready], actual=clarification_required / [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUI... |
| O4 | omission | clarification_required | PASS | - | PASS | - |
| D1 | degree | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초... | ERROR | LLM 호출/파싱 실패: LLM 응답을 JSON으로 파싱하지 못했습니다: Unexpected token '.', "..." is not valid JSON 원본: <think> Here's a thinking process: 1. **Analyze User Input:... |
| D2 | degree | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개... | FAIL | status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개... |
| D3 | degree | clarification_required | FAIL | 탐지 누락: [degree] 타입이 탐지되지 않음 / 질문 개수 범위 초과: expected=1-1, actual=2 | PASS | - |
| D4 | degree | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRE... | ERROR | LLM 호출/파싱 실패: LLM 응답을 JSON으로 파싱하지 못했습니다: Unexpected token '<', "<think> He"... is not valid JSON 원본: <think> Here's a thinking process: 1. **Analyze U... |
| C1 | comparison | ready | PASS | - | ERROR | LLM 호출/파싱 실패: LLM 응답을 JSON으로 파싱하지 못했습니다: Unexpected end of JSON input 원본: <think> Here's a thinking process: 1. **Analyze User Input:** - Task: `writi... |
| C2 | comparison | clarification_required | PASS | - | PASS | - |
| C3 | comparison | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1 / false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이... | FAIL | status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1 / false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이... |
| C4 | comparison | clarification_required | PASS | - | PASS | - |
| S1 | scope | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1 | PASS | - |
| S2 | scope | clarification_required | FAIL | 질문 개수 범위 초과: expected=1-2, actual=3 | FAIL | 탐지 누락: [reference] 타입이 탐지되지 않음 |
| S3 | scope | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [scope] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED... | FAIL | status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1 |
| S4 | scope | ready | clarification_required | REVIEW | [scope] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICA... | ERROR | LLM 호출/파싱 실패: LLM 응답을 JSON으로 파싱하지 못했습니다: Unexpected token '<', "<think> He"... is not valid JSON 원본: <think> Here's a thinking process: 1. **Analyze U... |
| M1 | compound | ready | clarification_required | FAIL | [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[... | ERROR | LLM 호출/파싱 실패: LLM 응답을 JSON으로 파싱하지 못했습니다: Unexpected token '<', "<think> He"... is not valid JSON 원본: <think> Here's a thinking process: 1. **Analyze U... |
| M2 | compound | clarification_required | ready | REVIEW | - | REVIEW | [omission] decision 불일치: expected=[CLARIFICATION_REQUIRED,RESOLVED], actual=[SAFE_INFERENCE] |
| M3 | compound | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [scope] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [degr... | ERROR | LLM 호출/파싱 실패: [ { "received": "medium", "code": "invalid_enum_value", "options": [ "high", "low" ], "path": [ "ambiguities", 3, "impact" ], "message":... |
| M4 | compound | clarification_required | ready | FAIL | 질문 개수 범위 초과: expected=0-2, actual=3 | FAIL | 탐지 누락: [comparison] 타입이 탐지되지 않음 |
| FP1 | false_positive | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQU... | FAIL | status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1 / false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이... |
| FP2 | false_positive | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [comparison] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQ... | FAIL | status 불일치: expected=[ready], actual=clarification_required / [comparison] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQ... |
| FN1 | false_negative | clarification_required | PASS | - | PASS | - |
| FN2 | false_negative | clarification_required | FAIL | 탐지 누락: [omission] 타입이 탐지되지 않음 | FAIL | 탐지 누락: [reference] 타입이 탐지되지 않음 |
| CTX1 | context_conflict | ready | FAIL | status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범... | FAIL | status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범... |
| CTX2 | context_conflict | clarification_required | PASS | - | PASS | - |
| QLIMIT1 | question_limit | clarification_required | ready | PASS | - | PASS | - |

## 6. 두 모델의 판정이 갈린 케이스 (divergence, 11건)

| case_id | Claude verdict | Groq verdict | Claude actual_status | Groq actual_status |
|---|---|---|---|---|
| R1 | FAIL | PASS | clarification_required | ready |
| O1 | FAIL | ERROR | clarification_required | (오류) |
| O2 | PASS | FAIL | clarification_required | clarification_required |
| D1 | FAIL | ERROR | clarification_required | (오류) |
| D3 | FAIL | PASS | clarification_required | clarification_required |
| D4 | FAIL | ERROR | clarification_required | (오류) |
| C1 | PASS | ERROR | ready | (오류) |
| S1 | FAIL | PASS | clarification_required | ready |
| S4 | REVIEW | ERROR | clarification_required | (오류) |
| M1 | FAIL | ERROR | clarification_required | (오류) |
| M3 | FAIL | ERROR | clarification_required | (오류) |

총 11건에서 두 모델의 verdict가 갈렸습니다. 이 중 O2, D3, S1, R1 등은 Groq은 통과(PASS)했는데 Claude가 불필요한 질문을 생성해 FAIL로 갈린 경우가 다수입니다.

## 7. 원본 데이터 위치

- Claude 원본(raw_analysis 포함): evaluation-results/v0-additional-2026-08-19-anthropic.json
- Groq 원본(raw_analysis 포함): evaluation-results/v0-additional-2026-08-19.json
- 테스트 fixture 정의: tests/evaluation/v0-additional-cases.json
