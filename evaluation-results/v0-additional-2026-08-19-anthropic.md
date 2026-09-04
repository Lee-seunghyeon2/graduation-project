# v0 Additional Evaluation Report

## Environment
- model: (anthropic default)
- provider: anthropic
- date: 2026-08-19-anthropic
- number of cases: 30 / fixture 전체 30
- 성공한 API 호출 수 (케이스 기준, 정상 완료): 30
- quota/rate-limit 실패 수: 0 (전체 ERROR 0건 중)
- JSON 파싱 실패 수: 0 (모델이 코드펜스 없이 reasoning/<think> 텍스트를 응답에 섞어 보내 parseJsonResponse가 JSON을 추출하지 못한 경우 — quota와 무관한 별도 실패 모드)

## Summary

전체 PASS: 8
전체 FAIL: 19
전체 REVIEW: 3
전체 ERROR: 0

유형별:
- reference: PASS 0 / FAIL 2 / REVIEW 1 / ERROR 0 (총 3)
- omission: PASS 2 / FAIL 2 / REVIEW 0 / ERROR 0 (총 4)
- degree: PASS 0 / FAIL 4 / REVIEW 0 / ERROR 0 (총 4)
- comparison: PASS 3 / FAIL 1 / REVIEW 0 / ERROR 0 (총 4)
- scope: PASS 0 / FAIL 3 / REVIEW 1 / ERROR 0 (총 4)
- compound: PASS 0 / FAIL 3 / REVIEW 1 / ERROR 0 (총 4)
- false_positive: PASS 0 / FAIL 2 / REVIEW 0 / ERROR 0 (총 2)
- false_negative: PASS 1 / FAIL 1 / REVIEW 0 / ERROR 0 (총 2)
- context_conflict: PASS 1 / FAIL 1 / REVIEW 0 / ERROR 0 (총 2)
- question_limit: PASS 1 / FAIL 0 / REVIEW 0 / ERROR 0 (총 1)

## Failure Classification

### 1. Ambiguity Detection Failure
- **D3**: 탐지 누락: [degree] 타입이 탐지되지 않음; 질문 개수 범위 초과: expected=1-1, actual=2
- **FN2**: 탐지 누락: [omission] 타입이 탐지되지 않음

### 2. Context Resolution Failure
- 해당 없음

### 3. Impact Judgment Failure
- 해당 없음

### 4. Decision Failure
- 해당 없음

### 5. Unnecessary Clarification
- **R1**: status 불일치: expected=[ready], actual=clarification_required; 질문 개수 범위 초과: expected=0-0, actual=2
- **R2**: status 불일치: expected=[ready], actual=clarification_required; [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **O1**: status 불일치: expected=[ready], actual=clarification_required; [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **O3**: status 불일치: expected=[ready], actual=clarification_required; [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2; unnecessary_question_risk: 질문이 필요 없다고 예상된 케이스에서 질문이 생성됨
- **D1**: status 불일치: expected=[ready], actual=clarification_required; [degree] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **D2**: status 불일치: expected=[ready], actual=clarification_required; [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=1
- **D4**: status 불일치: expected=[ready], actual=clarification_required; [degree] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=1
- **C3**: status 불일치: expected=[ready], actual=clarification_required; 질문 개수 범위 초과: expected=0-0, actual=1; false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨
- **S1**: status 불일치: expected=[ready], actual=clarification_required; 질문 개수 범위 초과: expected=0-0, actual=1
- **S3**: status 불일치: expected=[ready], actual=clarification_required; [scope] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=3
- **M1**: [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-1, actual=3
- **M3**: status 불일치: expected=[ready], actual=clarification_required; [scope] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **FP1**: status 불일치: expected=[ready], actual=clarification_required; [reference] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=3; false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨
- **FP2**: status 불일치: expected=[ready], actual=clarification_required; [comparison] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2; false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨
- **CTX1**: status 불일치: expected=[ready], actual=clarification_required; [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2

### 6. Missing Clarification
- 해당 없음

### 7. Question Generation Failure
- **R1**: status 불일치: expected=[ready], actual=clarification_required; 질문 개수 범위 초과: expected=0-0, actual=2
- **R2**: status 불일치: expected=[ready], actual=clarification_required; [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **O1**: status 불일치: expected=[ready], actual=clarification_required; [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **O3**: status 불일치: expected=[ready], actual=clarification_required; [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2; unnecessary_question_risk: 질문이 필요 없다고 예상된 케이스에서 질문이 생성됨
- **D1**: status 불일치: expected=[ready], actual=clarification_required; [degree] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **D2**: status 불일치: expected=[ready], actual=clarification_required; [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=1
- **D3**: 탐지 누락: [degree] 타입이 탐지되지 않음; 질문 개수 범위 초과: expected=1-1, actual=2
- **D4**: status 불일치: expected=[ready], actual=clarification_required; [degree] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=1
- **C3**: status 불일치: expected=[ready], actual=clarification_required; 질문 개수 범위 초과: expected=0-0, actual=1; false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨
- **S1**: status 불일치: expected=[ready], actual=clarification_required; 질문 개수 범위 초과: expected=0-0, actual=1
- **S2**: 질문 개수 범위 초과: expected=1-2, actual=3
- **S3**: status 불일치: expected=[ready], actual=clarification_required; [scope] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=3
- **M1**: [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-1, actual=3
- **M3**: status 불일치: expected=[ready], actual=clarification_required; [scope] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2
- **M4**: 질문 개수 범위 초과: expected=0-2, actual=3
- **FP1**: status 불일치: expected=[ready], actual=clarification_required; [reference] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=3; false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨
- **FP2**: status 불일치: expected=[ready], actual=clarification_required; [comparison] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2; false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨
- **CTX1**: status 불일치: expected=[ready], actual=clarification_required; [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED]; 질문 개수 범위 초과: expected=0-0, actual=2

### 8. Prompt Explicitization Failure
- 해당 없음

## Detailed Results

### R1 — 첨부 문서 단일 후보 - '이거'가 첨부 문서를 가리킴

- **Category**: reference
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "이거 보고 준비 계획 짜줘.",
  "document_context": "파일명: AI 아이디어 공모전 안내문\n공모전 접수 기간, 제출 서류, 평가 기준이 포함되어 있다."
}
```

**Expected**
- status: ready
- ambiguity_types: reference
- decisions: {"reference":["RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"reference":["AI 아이디어 공모전 안내문","공모전"]}
- behavior: improved_prompt에는 '이거'가 아니라 AI 아이디어 공모전 안내문이라는 명시적 대상이 나타나야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, omission, scope
- decision: {"reference":["RESOLVED"],"omission":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":["AI 아이디어 공모전"],"omission":[null],"scope":[null]}
- question_count: 2

**Actual questions**
- [q1/omission] "준비 계획 짜줘"은(는) 다음 중 무엇을 의미하나요?
1. 공모전 접수까지의 준비 일정
2. 아이디어 구체화 단계
3. 제출 서류 작성 계획
4. 전체 준비 프로세스 (options: 공모전 접수까지의 준비 일정 / 아이디어 구체화 단계 / 제출 서류 작성 계획 / 전체 준비 프로세스)
- [q2/scope] "준비 계획"은(는) 다음 중 무엇을 의미하나요?
1. 접수 전까지만
2. 공모전 제출까지
3. 발표 준비까지 포함 (options: 접수 전까지만 / 공모전 제출까지 / 발표 준비까지 포함)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=2

---

### R2 — 최근 대상과 과거 대상이 다른 경우 - 대화 전체의 첫 대상이 아니라 가장 최근 대상을 선택해야 함

- **Category**: reference
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "이 부분 조금 줄여줘.",
  "recent_conversation": [
    "User: 자기소개서 지원동기를 수정해줘.",
    "Assistant: 지원동기 수정본을 작성함.",
    "User: 이제 성장과정 문단을 수정해보자.",
    "Assistant: 성장과정 초안을 작성함."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: reference
- decisions: {"reference":["RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"reference":["성장과정"]}
- behavior: 단순히 대화 전체의 첫 번째 대상(지원동기)을 선택하면 실패. 가장 최근 대상(성장과정)이어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, degree, omission
- decision: {"reference":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"],"omission":["SAFE_INFERENCE"]}
- resolved_value: {"reference":[null],"degree":[null],"omission":["글자 수 줄이기"]}
- question_count: 2

**Actual questions**
- [q1/reference] "이 부분"은(는) 다음 중 무엇을 의미하나요?
1. 성장과정 문단 전체
2. 성장과정 문단의 특정 문장
3. 지원동기 수정본 (options: 성장과정 문단 전체 / 성장과정 문단의 특정 문장 / 지원동기 수정본)
- [q2/degree] "조금"은(는) 다음 중 무엇을 의미하나요?
1. 10~20% 정도 분량 축소
2. 한두 문장 정도 삭제
3. 불필요한 표현만 간결화 (options: 10~20% 정도 분량 축소 / 한두 문장 정도 삭제 / 불필요한 표현만 간결화)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2

---

### R3 — 첨부 문서와 이전 출력이 동시에 존재하는 경계 사례

- **Category**: reference (review candidate)
- **Verdict**: REVIEW

**Input**
```json
{
  "current_user_request": "이거 기준으로 다시 작성해줘.",
  "document_context": "공모전 모집요강",
  "recent_conversation": [
    "Assistant: 모집요강을 바탕으로 실행 계획 초안을 작성함."
  ]
}
```

**Expected**
- status: clarification_required | ready
- ambiguity_types: reference
- decisions: {"reference":["RESOLVED","SAFE_INFERENCE","CLARIFICATION_REQUIRED"]}
- question_count: 0-1
- behavior: 경계 사례: 첨부 문서와 직전 생성 결과 모두 '이거'의 후보가 될 수 있음. 두 후보를 선택했을 때 결과가 의미 있게 달라진다고 판단하면 CLARIFICATION_REQUIRED가 합리적이나, 강제로 PASS/FAIL 처리하지 않고 모델의 근거(candidates, context_support, impact)를 기록한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, omission
- decision: {"reference":["CLARIFICATION_REQUIRED"],"omission":["RESOLVED"]}
- resolved_value: {"reference":[null],"omission":["실행 계획 초안"]}
- question_count: 1

**Actual questions**
- [q1/reference] "이거"은(는) 다음 중 무엇을 의미하나요?
1. 공모전 모집요강
2. 이전에 작성한 실행 계획 초안 (options: 공모전 모집요강 / 이전에 작성한 실행 계획 초안)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: REVIEW
**실패 이유**: (없음)

---

### O1 — 현재 Task에서 수정 대상 복원 가능

- **Category**: omission
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "좀 더 구체적으로 바꿔줘.",
  "recent_conversation": [
    "User: 자기소개서 지원동기 문단을 수정하고 있어.",
    "Assistant: 지원동기 초안을 작성함."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: omission
- decisions: {"omission":["RESOLVED","SAFE_INFERENCE"]}
- question_count: 0-0
- resolved_value keywords: {"omission":["지원동기"]}
- behavior: 수정 대상 = 지원동기. 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission, degree
- decision: {"omission":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":[null],"degree":[null]}
- question_count: 2

**Actual questions**
- [q1/omission] "바꿔줘"은(는) 다음 중 무엇을 의미하나요?
1. 지원동기 문단
2. 지원동기 초안 (options: 지원동기 문단 / 지원동기 초안)
- [q2/degree] "좀 더 구체적으로"은(는) 다음 중 무엇을 의미하나요?
1. 구체적인 경험이나 사례 추가
2. 수치나 데이터 포함
3. 세부 내용 확장 (options: 구체적인 경험이나 사례 추가 / 수치나 데이터 포함 / 세부 내용 확장)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2

---

### O2 — 삭제 대상이 생략됨 - impact high

- **Category**: omission
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "하나는 빼줘.",
  "recent_conversation": [
    "보고서 구성:\n1. 기술 설명\n2. 시장 분석\n3. 기대 효과"
  ]
}
```

**Expected**
- status: clarification_required
- ambiguity_types: omission
- decisions: {"omission":["CLARIFICATION_REQUIRED"]}
- question_count: 1-3
- behavior: 삭제 대상이 불명확하고 되돌리기 어려운 작업(impact high) -> CLARIFICATION_REQUIRED. 가능하면 세 항목을 후보로 제공하는 선택형 질문.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, omission
- decision: {"reference":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"omission":[null]}
- question_count: 2

**Actual questions**
- [q1/reference] "하나"은(는) 다음 중 무엇을 의미하나요?
1. 기술 설명
2. 시장 분석
3. 기대 효과 (options: 기술 설명 / 시장 분석 / 기대 효과)
- [q2/omission] "빼줘"은(는) 다음 중 무엇을 의미하나요?
1. 보고서 구성에서 제거
2. 목차에서 삭제 (options: 보고서 구성에서 제거 / 목차에서 삭제)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### O3 — 문서 하나 + 일반적인 정리 작업 - 불필요한 질문 방지 테스트

- **Category**: omission
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "정리해줘.",
  "document_context": "프로젝트 결과보고서 초안 전체 내용"
}
```

**Expected**
- status: ready
- ambiguity_types: omission
- decisions: {"omission":["RESOLVED","SAFE_INFERENCE"]}
- question_count: 0-0
- behavior: 대상은 첨부 문서, 일반적인 정리/요약 작업으로 수행 가능. '어떻게 정리할까요?'라고 불필요하게 질문하면 실패 후보로 기록.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission, scope
- decision: {"omission":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":[null],"scope":[null]}
- question_count: 2

**Actual questions**
- [q1/omission] "정리해줘"은(는) 다음 중 무엇을 의미하나요?
1. 프로젝트 결과보고서 초안 전체
2. 보고서의 특정 섹션
3. 보고서의 문장 구조
4. 보고서의 논리 흐름
5. 보고서의 분량 (options: 프로젝트 결과보고서 초안 전체 / 보고서의 특정 섹션 / 보고서의 문장 구조 / 보고서의 논리 흐름 / 보고서의 분량)
- [q2/scope] "정리해줘"은(는) 다음 중 무엇을 의미하나요?
1. 전체 보고서를 재구성
2. 일부 섹션만 수정
3. 문장만 다듬기
4. 내용 요약 (options: 전체 보고서를 재구성 / 일부 섹션만 수정 / 문장만 다듬기 / 내용 요약)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [omission] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2 / unnecessary_question_risk: 질문이 필요 없다고 예상된 케이스에서 질문이 생성됨

---

### O4 — Context 자체가 없음

- **Category**: omission
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "바꿔줘."
}
```

**Expected**
- status: clarification_required
- ambiguity_types: omission
- decisions: {"omission":["CLARIFICATION_REQUIRED"]}
- question_count: 1-3
- behavior: 작업 대상 자체를 확인할 수 없음 -> CLARIFICATION_REQUIRED.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission
- decision: {"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":[null]}
- question_count: 1

**Actual questions**
- [q1/omission] "바꿔줘"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### D1 — 문서에 수치 기준(700자) 존재

- **Category**: degree
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "좀 줄여줘.",
  "document_context": "자기소개서는 700자 이내로 작성해야 한다.\n현재 초안은 약 950자이다."
}
```

**Expected**
- status: ready
- ambiguity_types: degree
- decisions: {"degree":["RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"degree":["700자"]}
- behavior: degree 표현은 존재하지만 700자 기준을 문서에서 찾을 수 있음 -> RESOLVED, improved_prompt에 700자 이내 조건 반영.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission, degree
- decision: {"omission":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":[null],"degree":[null]}
- question_count: 2

**Actual questions**
- [q1/omission] "줄여줘"은(는) 다음 중 무엇을 의미하나요?
1. 자기소개서 전체 내용
2. 자기소개서의 특정 단락
3. 자기소개서의 특정 문장 (options: 자기소개서 전체 내용 / 자기소개서의 특정 단락 / 자기소개서의 특정 문장)
- [q2/degree] "좀"은(는) 다음 중 무엇을 의미하나요?
1. 700자 이내로 줄이기
2. 약간만 줄이기
3. 적당히 줄이기 (options: 700자 이내로 줄이기 / 약간만 줄이기 / 적당히 줄이기)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2

---

### D2 — 저위험 정도 표현 (수정 대상은 명확하다고 가정)

- **Category**: degree
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "설명을 조금만 더 자세하게 써줘.",
  "recent_conversation": [
    "자기소개서 지원동기 초안을 작성했어."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: degree
- decisions: {"degree":["SAFE_INFERENCE"]}
- question_count: 0-0
- behavior: impact low -> SAFE_INFERENCE, 질문 없음.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, degree
- decision: {"reference":["RESOLVED"],"degree":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":["자기소개서 지원동기"],"degree":[null]}
- question_count: 1

**Actual questions**
- [q1/degree] "조금만 더 자세하게"에 대해 지켜야 할 구체적인 기준이 있다면 알려주세요. (예: 글자 수, 분량, 페이지 수 등)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=1

---

### D3 — 기준 준수를 강조하지만 기준값이 문맥 어디에도 없음

- **Category**: degree
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "분량에 맞게 줄여줘.",
  "recent_conversation": [
    "User: 이번 문서는 분량 제한을 반드시 맞춰야 해."
  ]
}
```

**Expected**
- status: clarification_required
- ambiguity_types: degree
- decisions: {"degree":["CLARIFICATION_REQUIRED"]}
- question_count: 1-1
- behavior: 결과에 중요한 수치 기준이 존재해야 하지만 실제 값이 없음 -> CLARIFICATION_REQUIRED.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission, reference
- decision: {"omission":["CLARIFICATION_REQUIRED"],"reference":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":[null],"reference":[null]}
- question_count: 2

**Actual questions**
- [q1/omission] "줄여줘"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/reference] "분량"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: 탐지 누락: [degree] 타입이 탐지되지 않음 / 질문 개수 범위 초과: expected=1-1, actual=2

---

### D4 — 이전 대화에 수치 기준(500자) 존재

- **Category**: degree
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "조금 더 짧게 해줘.",
  "recent_conversation": [
    "User: 지원동기는 500자 정도로 작성해야 해.",
    "Assistant: 확인함."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: degree
- decisions: {"degree":["SAFE_INFERENCE","RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"degree":["500자"]}
- behavior: 이전 대화의 500자 기준을 활용해 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission, degree
- decision: {"omission":["RESOLVED"],"degree":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":["지원동기"],"degree":[null]}
- question_count: 1

**Actual questions**
- [q1/degree] "조금 더 짧게"에 대해 지켜야 할 구체적인 기준이 있다면 알려주세요. (예: 글자 수, 분량, 페이지 수 등)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [degree] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=1

---

### C1 — 비교 대상 하나 - '전처럼'을 그대로 남기면 안 됨

- **Category**: comparison
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "성장과정도 전처럼 작성해줘.",
  "recent_conversation": [
    "Assistant: 지원동기 예시 A를 작성함."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: comparison
- decisions: {"comparison":["RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"comparison":["지원동기"]}
- behavior: comparison 대상 = 직전 지원동기 예시 A. 최종 prompt에서는 '전처럼'을 그대로 남기지 말고 비교 대상/기준을 명시해야 한다.

**Actual analysis**
- status: ready
- ambiguity_types: comparison
- decision: {"comparison":["RESOLVED"]}
- resolved_value: {"comparison":["지원동기 예시 A와 같은 스타일/구조/어조로"]}
- question_count: 0

**Actual questions**
- (없음)

**Improved prompt**
```
다음 요청에 따라 문서를 작성/수정한다.

[명시화된 요청]
성장과정도 지원동기 예시 A와 같은 스타일/구조/어조로 작성해줘.

[확정된 정보]
- "전처럼" → 지원동기 예시 A와 같은 스타일/구조/어조로 (문맥상 확정)

[출력 형식 지침]
위에서 확정된 대상/범위/기준/스타일을 그대로 반영하여 완성도 있는 문서를 작성한다.
```

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### C2 — 이전 버전이 여러 개 (v1/v2/v3)

- **Category**: comparison
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "전처럼 다시 만들어줘.",
  "recent_conversation": [
    "Assistant: 보고서 v1을 작성함.",
    "User: 수정 요청.",
    "Assistant: 보고서 v2를 작성함.",
    "User: 다른 방향 요청.",
    "Assistant: 보고서 v3를 작성함."
  ]
}
```

**Expected**
- status: clarification_required
- ambiguity_types: comparison
- decisions: {"comparison":["CLARIFICATION_REQUIRED"]}
- question_count: 1-1
- behavior: 비교 후보가 여러 개이고 결과 차이가 큼 -> CLARIFICATION_REQUIRED. 가능하면 v1/v2/v3를 후보로 제시.

**Actual analysis**
- status: clarification_required
- ambiguity_types: comparison, omission
- decision: {"comparison":["CLARIFICATION_REQUIRED"],"omission":["SAFE_INFERENCE"]}
- resolved_value: {"comparison":[null],"omission":["보고서를 만들어줘"]}
- question_count: 1

**Actual questions**
- [q1/comparison] "전처럼"은(는) 다음 중 무엇을 의미하나요?
1. 보고서 v1처럼
2. 보고서 v2처럼 (options: 보고서 v1처럼 / 보고서 v2처럼)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### C3 — False Positive 방지 - 비교 대상이 문장에 명시되어 있음

- **Category**: comparison
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "앞에서 작성한 지원동기와 비슷한 문체로 성장과정을 작성해줘.",
  "recent_conversation": [
    "Assistant: 지원동기 문단을 작성함."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: comparison
- decisions: {"comparison":["RESOLVED","SAFE_INFERENCE"]}
- question_count: 0-0
- behavior: '비슷한'이라는 표현만 보고 모호하다고 판단하면 안 됨. 비교 대상 = 지원동기, 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, comparison, omission
- decision: {"reference":["RESOLVED"],"comparison":["RESOLVED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":["Assistant가 작성한 지원동기 문단"],"comparison":["지원동기 문단의 문체적 특징"],"omission":[null]}
- question_count: 1

**Actual questions**
- [q1/omission] "성장과정을 작성해줘"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1 / false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨

---

### C4 — 비교 대상 자체가 존재하지 않음

- **Category**: comparison
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "저번처럼 만들어줘."
}
```

**Expected**
- status: clarification_required
- ambiguity_types: comparison
- decisions: {"comparison":["CLARIFICATION_REQUIRED"]}
- question_count: 1-3
- behavior: 비교 대상 없음 -> CLARIFICATION_REQUIRED.

**Actual analysis**
- status: clarification_required
- ambiguity_types: comparison, omission
- decision: {"comparison":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"comparison":[null],"omission":[null]}
- question_count: 2

**Actual questions**
- [q1/comparison] "저번처럼"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/omission] "만들어줘"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### S1 — 현재 작업 범위가 하나로 특정됨

- **Category**: scope
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "여기만 고쳐줘.",
  "recent_conversation": [
    "현재 자기소개서 지원동기 문단만 수정 중."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: scope
- decisions: {"scope":["RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"scope":["지원동기"]}
- behavior: scope = 지원동기 문단, 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, omission, scope
- decision: {"reference":["RESOLVED"],"omission":["CLARIFICATION_REQUIRED"],"scope":["RESOLVED"]}
- resolved_value: {"reference":["자기소개서 지원동기 문단"],"omission":[null],"scope":["자기소개서 지원동기 문단만"]}
- question_count: 1

**Actual questions**
- [q1/omission] "고쳐줘"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / 질문 개수 범위 초과: expected=0-0, actual=1

---

### S2 — 여러 섹션 중 어느 부분인지 불명확 - reference+scope 통합 질문 기대

- **Category**: scope
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "이 부분만 수정해줘.",
  "recent_conversation": [
    "보고서의 기술 설명, 시장 분석, 기대 효과를 모두 검토 중."
  ]
}
```

**Expected**
- status: clarification_required
- ambiguity_types: reference, scope
- decisions: {"reference":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- question_count: 1-2
- behavior: reference와 scope 후보가 여러 개, impact high -> CLARIFICATION_REQUIRED. 질문은 reference/scope를 따로 2개 생성하지 말고 가능하면 하나로 통합하는 것이 이상적 (question_count=1이 최선, 2까지는 허용).

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, omission, scope
- decision: {"reference":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"omission":[null],"scope":[null]}
- question_count: 3

**Actual questions**
- [q1/reference] "이 부분"은(는) 다음 중 무엇을 의미하나요?
1. 기술 설명
2. 시장 분석
3. 기대 효과 (options: 기술 설명 / 시장 분석 / 기대 효과)
- [q2/omission] "수정해줘"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q3/scope] "이 부분만"은(는) 다음 중 무엇을 의미하나요?
1. 기술 설명만
2. 시장 분석만
3. 기대 효과만 (options: 기술 설명만 / 시장 분석만 / 기대 효과만)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: 질문 개수 범위 초과: expected=1-2, actual=3

---

### S3 — 전체 범위가 직접 표현됨

- **Category**: scope
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "전체적으로 조금 더 자연스럽게 바꿔줘.",
  "recent_conversation": [
    "자기소개서 초안을 작성함."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: scope
- decisions: {"scope":["SAFE_INFERENCE","RESOLVED"]}
- question_count: 0-0
- behavior: scope = 전체 문서 (대상 문서는 하나), degree는 SAFE_INFERENCE 수준. 질문 없음.

**Actual analysis**
- status: clarification_required
- ambiguity_types: scope, degree
- decision: {"scope":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED","CLARIFICATION_REQUIRED"]}
- resolved_value: {"scope":[null],"degree":[null,null]}
- question_count: 3

**Actual questions**
- [q1/scope] "전체적으로"은(는) 다음 중 무엇을 의미하나요?
1. 자기소개서 초안 전체
2. 특정 문단들
3. 문장 구조
4. 어투 (options: 자기소개서 초안 전체 / 특정 문단들 / 문장 구조 / 어투)
- [q2/degree] "조금 더"에 대해 지켜야 할 구체적인 기준이 있다면 알려주세요. (예: 글자 수, 분량, 페이지 수 등)
- [q3/degree] "자연스럽게"은(는) 다음 중 무엇을 의미하나요?
1. 구어체로 변경
2. 문장 길이 조정
3. 접속어 개선
4. 단어 선택 개선 (options: 구어체로 변경 / 문장 길이 조정 / 접속어 개선 / 단어 선택 개선)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [scope] decision 불일치: expected=[SAFE_INFERENCE,RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=3

---

### S4 — '필요한 부분만' 경계 사례 - 과도한 질문 여부 확인

- **Category**: scope (review candidate)
- **Verdict**: REVIEW

**Input**
```json
{
  "current_user_request": "어색한 부분만 필요한 만큼 수정해줘.",
  "document_context": "보고서 초안 하나"
}
```

**Expected**
- status: ready | clarification_required
- ambiguity_types: scope, degree
- decisions: {"scope":["SAFE_INFERENCE"],"degree":["SAFE_INFERENCE"]}
- question_count: 0-1
- behavior: scope+degree가 존재하지만 일반적인 문장 개선 수준이라 결과 위험이 낮음 -> SAFE_INFERENCE 기대. 경계 사례이므로 과도하게 질문하는지 기록 위주로 확인한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, degree, scope
- decision: {"reference":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"degree":[null],"scope":[null]}
- question_count: 3

**Actual questions**
- [q1/reference] "어색한 부분"은(는) 다음 중 무엇을 의미하나요?
1. 보고서 초안의 문법적으로 어색한 표현
2. 보고서 초안의 논리 전개가 어색한 부분
3. 보고서 초안의 어색한 문장 구조 (options: 보고서 초안의 문법적으로 어색한 표현 / 보고서 초안의 논리 전개가 어색한 부분 / 보고서 초안의 어색한 문장 구조)
- [q2/degree] "필요한 만큼"에 대해 지켜야 할 구체적인 기준이 있다면 알려주세요. (예: 글자 수, 분량, 페이지 수 등)
- [q3/scope] "부분만"은(는) 다음 중 무엇을 의미하나요?
1. 보고서 초안 전체 중 어색한 부분만
2. 보고서 초안의 특정 섹션만 (options: 보고서 초안 전체 중 어색한 부분만 / 보고서 초안의 특정 섹션만)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: REVIEW
**실패 이유**: [scope] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-1, actual=3

---

### M1 — reference + scope + degree 복합

- **Category**: compound
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "그 부분만 좀 더 길게 해줘.",
  "recent_conversation": [
    "지원동기와 성장과정 두 문단을 작성함.",
    "직전에는 성장과정에 대해 이야기함."
  ]
}
```

**Expected**
- status: ready | clarification_required
- ambiguity_types: reference, scope, degree
- decisions: {"reference":["RESOLVED","CLARIFICATION_REQUIRED"],"scope":["RESOLVED","SAFE_INFERENCE"],"degree":["SAFE_INFERENCE"]}
- question_count: 0-1
- behavior: reference가 문맥상 성장과정으로 해결되면 RESOLVED+questions=0이 이상적. 하나로 좁힐 수 없다면 대상 확인 질문 1개만 허용되고, '얼마나 길게 할까요?'(degree) 질문은 생성되면 안 된다(unnecessary).

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, scope, degree
- decision: {"reference":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"scope":[null],"degree":[null]}
- question_count: 3

**Actual questions**
- [q1/reference] "그 부분"은(는) 다음 중 무엇을 의미하나요?
1. 지원동기 문단
2. 성장과정 문단 (options: 지원동기 문단 / 성장과정 문단)
- [q2/scope] "그 부분만"은(는) 다음 중 무엇을 의미하나요?
1. 성장과정 문단 전체
2. 성장과정 문단의 특정 문장
3. 성장과정 문단의 일부 내용 (options: 성장과정 문단 전체 / 성장과정 문단의 특정 문장 / 성장과정 문단의 일부 내용)
- [q3/degree] "좀 더 길게"에 대해 지켜야 할 구체적인 기준이 있다면 알려주세요. (예: 글자 수, 분량, 페이지 수 등)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-1, actual=3

---

### M2 — reference + omission + comparison 복합, 핵심 질문 선별 여부

- **Category**: compound (review candidate)
- **Verdict**: REVIEW

**Input**
```json
{
  "current_user_request": "그거 빼고 전처럼 해줘.",
  "recent_conversation": [
    "기능:\n- 자동 저장\n- 알림",
    "이전에 기능 구성을 수정한 버전 A도 존재함."
  ]
}
```

**Expected**
- status: clarification_required | ready
- ambiguity_types: reference, omission, comparison
- decisions: {"reference":["CLARIFICATION_REQUIRED","RESOLVED"],"omission":["CLARIFICATION_REQUIRED","RESOLVED"],"comparison":["CLARIFICATION_REQUIRED","RESOLVED"]}
- question_count: 0-3
- behavior: 여러 종류의 모호성이 동시에 탐지될 수 있음. 작업 결과를 결정하는 핵심 reference/omission이 불명확하면 우선 그 대상에 대해 질문해야 하고, 질문 수가 불필요하게 3개까지 증가하면 과함으로 기록한다. 경계 사례라 REVIEW로 기록.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, comparison, omission
- decision: {"reference":["CLARIFICATION_REQUIRED"],"comparison":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"comparison":[null],"omission":[null]}
- question_count: 3

**Actual questions**
- [q1/reference] "그거"은(는) 다음 중 무엇을 의미하나요?
1. 자동 저장
2. 알림 (options: 자동 저장 / 알림)
- [q2/comparison] "전처럼"은(는) 다음 중 무엇을 의미하나요?
1. 버전 A의 기능 구성
2. 최초 상태 (options: 버전 A의 기능 구성 / 최초 상태)
- [q3/omission] "해줘"은(는) 다음 중 무엇을 의미하나요?
1. 작성
2. 수정
3. 복원 (options: 작성 / 수정 / 복원)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: REVIEW
**실패 이유**: (없음)

---

### M3 — 모호 표현 3개지만 질문이 필요 없는 핵심 사례

- **Category**: compound
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "이거 보고 필요한 부분만 적당히 정리해줘.",
  "document_context": "공모전 안내문 1개"
}
```

**Expected**
- status: ready
- ambiguity_types: reference, scope, degree
- decisions: {"reference":["RESOLVED"],"scope":["SAFE_INFERENCE"],"degree":["SAFE_INFERENCE"]}
- question_count: 0-0
- behavior: 매우 중요한 케이스: 모호 표현의 개수(3개)가 질문 개수를 결정해서는 안 된다. reference만 RESOLVED로 확정되고 나머지는 SAFE_INFERENCE로 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, scope, degree
- decision: {"reference":["RESOLVED"],"scope":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":["공모전 안내문"],"scope":[null],"degree":[null]}
- question_count: 2

**Actual questions**
- [q1/scope] "필요한 부분만"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/degree] "적당히"에 대해 지켜야 할 구체적인 기준이 있다면 알려주세요. (예: 글자 수, 분량, 페이지 수 등)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [scope] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [degree] decision 불일치: expected=[SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2

---

### M4 — comparison + scope 두 핵심 모호성이 실제로 중요한 경우

- **Category**: compound
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "전에 거 기준으로 이 부분만 수정해줘.",
  "recent_conversation": [
    "보고서 v1과 v2가 있음.",
    "보고서는 서론, 기술 설명, 기대 효과로 구성됨."
  ]
}
```

**Expected**
- status: clarification_required | ready
- ambiguity_types: comparison, scope
- decisions: {"comparison":["CLARIFICATION_REQUIRED","RESOLVED"],"scope":["CLARIFICATION_REQUIRED","RESOLVED"]}
- question_count: 0-2
- behavior: comparison(v1/v2)과 scope(서론/기술 설명/기대 효과) 후보 모두 결과에 큰 영향을 줄 수 있음. 질문 개수는 반드시 2개 이하여야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: comparison, scope, omission
- decision: {"comparison":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"comparison":[null],"scope":[null],"omission":[null]}
- question_count: 3

**Actual questions**
- [q1/comparison] "전에 거"은(는) 다음 중 무엇을 의미하나요?
1. 보고서 v1
2. 보고서 v2 (options: 보고서 v1 / 보고서 v2)
- [q2/scope] "이 부분만"은(는) 다음 중 무엇을 의미하나요?
1. 서론
2. 기술 설명
3. 기대 효과 (options: 서론 / 기술 설명 / 기대 효과)
- [q3/omission] "수정해줘"은(는) 다음 중 무엇을 의미하나요?
1. 내용 추가
2. 문장 다듬기
3. 구조 변경
4. 삭제 (options: 내용 추가 / 문장 다듬기 / 구조 변경 / 삭제)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: 질문 개수 범위 초과: expected=0-2, actual=3

---

### FP1 — 모호 표현 뒤에 실제 대상이 즉시 명시됨 - 질문하면 안 됨

- **Category**: false_positive
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "이 부분, 즉 결론 문단만 수정해줘."
}
```

**Expected**
- status: ready
- ambiguity_types: reference, scope
- decisions: {"reference":["RESOLVED","SAFE_INFERENCE"],"scope":["RESOLVED","SAFE_INFERENCE"]}
- question_count: 0-0
- resolved_value keywords: {"reference":["결론"],"scope":["결론"]}
- behavior: '이 부분' 뒤에 실제 대상(결론 문단)이 명시됨. 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, scope, omission
- decision: {"reference":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"scope":[null],"omission":[null]}
- question_count: 3

**Actual questions**
- [q1/reference] "이 부분"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/scope] "결론 문단만"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q3/omission] "수정해줘"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / [scope] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=3 / false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨

---

### FP2 — 비교 대상이 문장 내에 명확히 명시됨 - 질문하면 안 됨

- **Category**: false_positive
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "앞에서 작성한 지원동기와 같은 구조로 성장과정을 작성해줘."
}
```

**Expected**
- status: ready
- ambiguity_types: comparison
- decisions: {"comparison":["RESOLVED","SAFE_INFERENCE"]}
- question_count: 0-0
- behavior: 비교 대상(지원동기)이 문장 자체에 명확히 존재. 질문 없이 처리되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, comparison
- decision: {"reference":["CLARIFICATION_REQUIRED"],"comparison":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"comparison":[null]}
- question_count: 2

**Actual questions**
- [q1/reference] "앞에서 작성한 지원동기"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/comparison] "같은 구조로"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [comparison] decision 불일치: expected=[RESOLVED,SAFE_INFERENCE], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2 / false_positive_check: 모호성이 문맥/문장 내에서 이미 해소되었는데 질문이 생성됨

---

### FN1 — '이거/그거' 같은 사전 단어가 없어도 omission을 탐지해야 함

- **Category**: false_negative
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "제출용으로 작성해줘."
}
```

**Expected**
- status: clarification_required
- ambiguity_types: omission
- decisions: {"omission":["CLARIFICATION_REQUIRED"]}
- question_count: 1-3
- behavior: 무엇을 작성해야 하는지 대상/내용이 전혀 없음. 특정 모호 단어 사전에 의존하지 않고 omission을 탐지해야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: omission, reference
- decision: {"omission":["CLARIFICATION_REQUIRED"],"reference":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"omission":[null],"reference":[null]}
- question_count: 2

**Actual questions**
- [q1/omission] "작성해줘"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/reference] "제출용으로"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### FN2 — degree는 명확하지만 수정 대상이 두 문서 중 어느 것인지 생략됨

- **Category**: false_negative
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "500자로 줄여줘.",
  "recent_conversation": [
    "보고서와 자기소개서 두 문서를 동시에 다룸."
  ]
}
```

**Expected**
- status: clarification_required
- ambiguity_types: omission, reference
- decisions: {"omission":["CLARIFICATION_REQUIRED"],"reference":["CLARIFICATION_REQUIRED"]}
- question_count: 1-3
- behavior: degree(500자) 자체는 명확하지만 수정 대상이 생략됨(보고서 vs 자기소개서). omission 또는 reference 유형 중 하나라도 CLARIFICATION_REQUIRED로 탐지되어야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, scope
- decision: {"reference":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"scope":[null]}
- question_count: 2

**Actual questions**
- [q1/reference] "줄여줘"은(는) 다음 중 무엇을 의미하나요?
1. 보고서
2. 자기소개서 (options: 보고서 / 자기소개서)
- [q2/scope] "500자로"은(는) 다음 중 무엇을 의미하나요?
1. 전체 문서를 500자로
2. 특정 섹션만 500자로
3. 각 문서를 각각 500자로 (options: 전체 문서를 500자로 / 특정 섹션만 500자로 / 각 문서를 각각 500자로)

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: 탐지 누락: [omission] 타입이 탐지되지 않음

---

### CTX1 — 최신 사용자 발화의 명시적 조건이 첨부 문서 조건보다 우선해야 함

- **Category**: context_conflict
- **Verdict**: FAIL

**Input**
```json
{
  "current_user_request": "그 기준으로 작성해줘.",
  "document_context": "제출 분량: 1,000자 이하",
  "recent_conversation": [
    "User: 교수님이 이번에는 700자로 작성하라고 했어."
  ]
}
```

**Expected**
- status: ready
- ambiguity_types: reference
- decisions: {"reference":["RESOLVED"]}
- question_count: 0-0
- resolved_value keywords: {"reference":["700자"]}
- behavior: 최신 사용자 명시 조건(700자)이 문서의 1,000자 조건보다 우선해야 한다.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, omission
- decision: {"reference":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"omission":[null]}
- question_count: 2

**Actual questions**
- [q1/reference] "그 기준"은(는) 다음 중 무엇을 의미하나요?
1. 700자
2. 1,000자 이하 (options: 700자 / 1,000자 이하)
- [q2/omission] "작성해줘"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: FAIL
**실패 이유**: status 불일치: expected=[ready], actual=clarification_required / [reference] decision 불일치: expected=[RESOLVED], actual=[CLARIFICATION_REQUIRED] / 질문 개수 범위 초과: expected=0-0, actual=2

---

### CTX2 — 두 문서의 조건이 충돌 - 마감일 차이가 결과에 큰 영향

- **Category**: context_conflict
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "이거 기준으로 준비 일정 짜줘.",
  "document_context": "문서 A: 제출 마감일 8월 30일\n문서 B: 제출 마감일 9월 5일"
}
```

**Expected**
- status: clarification_required
- ambiguity_types: reference
- decisions: {"reference":["CLARIFICATION_REQUIRED"]}
- question_count: 1-1
- behavior: reference 후보 2개(문서 A/B), 마감일 차이가 결과에 큰 영향 -> CLARIFICATION_REQUIRED.

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference
- decision: {"reference":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null]}
- question_count: 1

**Actual questions**
- [q1/reference] "이거"은(는) 다음 중 무엇을 의미하나요?
1. 문서 A (마감일 8월 30일)
2. 문서 B (마감일 9월 5일) (options: 문서 A (마감일 8월 30일) / 문서 B (마감일 9월 5일))

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

### QLIMIT1 — 질문 개수 제한 스트레스 테스트 - 여러 모호성이 동시에 탐지되어도 질문은 최대 3개, 핵심 위주로 압축되어야 함

- **Category**: question_limit
- **Verdict**: PASS

**Input**
```json
{
  "current_user_request": "그거 전처럼 적당히 바꿔서 필요한 부분만 정리해줘."
}
```

**Expected**
- status: clarification_required | ready
- ambiguity_types: reference, comparison, degree, scope
- decisions: {"reference":["CLARIFICATION_REQUIRED","RESOLVED","SAFE_INFERENCE"],"comparison":["CLARIFICATION_REQUIRED","RESOLVED","SAFE_INFERENCE"],"degree":["SAFE_INFERENCE","CLARIFICATION_REQUIRED"],"scope":["SAFE_INFERENCE","RESOLVED","CLARIFICATION_REQUIRED"]}
- question_count: 0-3
- behavior: context가 부족한 상태. 여러 ambiguity가 탐지될 수 있으나 질문은 최대 3개, 가능하면 1~2개로 압축되어야 한다. degree 때문에 별도 질문이 생성되지 않는 것이 바람직 (단순 <=3 확인이 아니라 핵심 ambiguity가 우선됐는지 기록).

**Actual analysis**
- status: clarification_required
- ambiguity_types: reference, comparison, degree, omission, scope
- decision: {"reference":["CLARIFICATION_REQUIRED"],"comparison":["CLARIFICATION_REQUIRED"],"degree":["CLARIFICATION_REQUIRED"],"omission":["CLARIFICATION_REQUIRED"],"scope":["CLARIFICATION_REQUIRED"]}
- resolved_value: {"reference":[null],"comparison":[null],"degree":[null],"omission":[null],"scope":[null]}
- question_count: 3

**Actual questions**
- [q1/reference] "그거"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q2/omission] "바꿔서"이(가) 정확히 무엇을 가리키는지 알려주세요.
- [q3/scope] "필요한 부분만"이(가) 정확히 무엇을 가리키는지 알려주세요.

**Improved prompt**
- (없음, status != ready)

**PASS/FAIL**: PASS
**실패 이유**: (없음)

---

## v1 Candidates

아래는 실제 FAIL 패턴에서만 추출한 후보다 (사전에 가정한 개선안이 아니라 이번 실행 결과 기준):

- **Ambiguity Detection Failure** (2건: D3, FN2)
- **Unnecessary Clarification** (15건: R1, R2, O1, O3, D1, D2, D4, C3, S1, S3, M1, M3, FP1, FP2, CTX1)
- **Question Generation Failure** (18건: R1, R2, O1, O3, D1, D2, D3, D4, C3, S1, S2, S3, M1, M3, M4, FP1, FP2, CTX1)

REVIEW로 남긴 3건(R3, S4, M2)은 정답이 하나로 정해지지 않은 경계 사례이므로, v1 설계 시 "충분한 근거"의 기준을 사람이 먼저 정의한 뒤 판단 규칙을 다듬는 것이 우선되어야 한다.
