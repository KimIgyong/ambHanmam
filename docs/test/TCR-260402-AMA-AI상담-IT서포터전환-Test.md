# Test Cases
## AMA AI 상담 및 관리자 대화 관제 기능 개선

- 문서 ID: TC-AMA-AI상담-IT서포터전환-Test-20260402
- 작성일: 2026-04-02

---

## 1. 단위 테스트 케이스

### TC-UNIT-01 Assistant Welcome 단순화
- 입력: 우측 상단 AMA AI 상담 버튼 클릭
- 기대결과: Welcome 화면에 Today's Tasks, My Issues 섹션이 노출되지 않는다.
- 검증항목: `WelcomeSection.tsx` 렌더 결과, locale 타이틀 반영

### TC-UNIT-02 관리자 대화 목록 Entity 메타데이터 포함
- 입력: `GET /api/v1/conversations/admin`
- 기대결과: 각 대화 항목에 `entityId`, `entityCode`, `entityName`이 포함된다.
- 검증항목: DTO/Mapper 응답 필드

### TC-UNIT-03 관리자 타임라인 조회
- 입력: `GET /api/v1/conversations/admin/timeline`
- 기대결과: 메시지 단위로 정렬된 목록이 반환되고 대화/사용자/Entity 메타데이터가 포함된다.
- 검증항목: 메시지 정렬, 검색/법인/부서 필터

### TC-UNIT-04 관리자 메시지 저장
- 입력: `POST /api/v1/conversations/admin/:id/messages`
- 기대결과: `msg_role=admin` 메시지가 저장되고 `cvs_message_count`가 증가한다.
- 검증항목: 메시지 순번, 대화 카운트 증가

### TC-UNIT-05 대화 이슈 전환
- 입력: `POST /api/v1/conversations/:id/convert-to-issue`
- 기대결과: 기존 IssueService를 사용해 이슈가 생성되고 conversation/source 메타데이터가 description에 포함된다.
- 검증항목: `issueId`, `issueRefNumber` 반환, Entity 컨텍스트 반영

### TC-UNIT-06 대화 노트 전환
- 입력: `POST /api/v1/conversations/:id/convert-to-note`
- 기대결과: MeetingNoteService를 사용해 MEMO가 생성되고 source 메타데이터가 HTML 본문에 포함된다.
- 검증항목: `meetingNoteId` 반환, project 연계 가능

### TC-UNIT-07 관리자 메시지 렌더링
- 입력: message.role=`admin` 데이터 포함
- 기대결과: 사용자/AI와 구분되는 색상, 라벨, 아이콘으로 렌더링된다.
- 검증항목: `MessageListView` 분기 처리

---

## 2. 통합 테스트 시나리오

### TC-INT-01 AMA AI 상담 진입
1. 메인 화면에서 AMA AI 상담 버튼 클릭
2. Welcome 화면 확인
3. IT 에이전트 선택
4. 채팅 시작

기대결과:
1. 타이틀이 AMA AI 상담으로 표시된다.
2. 할일/이슈 위젯이 보이지 않는다.
3. 채팅 진입이 정상 동작한다.

### TC-INT-02 관리자 통합 타임라인 관제
1. 관리자 계정으로 `/admin/conversations` 진입
2. 통합 타임라인 탭 확인
3. Entity/Unit/검색 필터 조합 적용
4. 메시지 클릭 후 상세 모달 오픈

기대결과:
1. 타임라인에 메시지 단위 항목이 표시된다.
2. Entity 코드/명, 사용자, 역할, 시간 정보가 보인다.
3. 클릭한 대화의 상세 모달이 열린다.

### TC-INT-03 관리자 참여 메시지
1. 상세 모달에서 관리자 답변 입력
2. 전송 버튼 클릭
3. 동일 대화 새로고침

기대결과:
1. 관리자 메시지가 저장된다.
2. 목록/타임라인 최신순 정렬에 반영된다.
3. 상세 모달에서 관리자 라벨로 표시된다.

### TC-INT-04 대화 이슈 전환 with Entity/Project 선택
1. 상세 모달에서 대상 Entity 선택
2. 해당 Entity의 프로젝트 선택
3. 이슈 제목/설명/유형/심각도 입력
4. 이슈 등록 버튼 클릭

기대결과:
1. 이슈가 생성된다.
2. 선택한 Entity 기준 ref 번호가 발급된다.
3. 생성 성공 메시지가 노출된다.

### TC-INT-05 VN01 대상 이슈 등록
1. `admin@amoeba.group` 계정으로 로그인
2. 관리자 대화 상세에서 대상 Entity를 VN01로 선택
3. 이슈 등록 실행

기대결과:
1. 요청이 `X-Entity-Id=VN01` 컨텍스트로 전송된다.
2. VN01 프로젝트 목록만 선택 가능하다.
3. 생성된 이슈가 VN01 Entity에 귀속된다.

### TC-INT-06 대화 노트 전환
1. 대화 상세에서 노트 제목/내용 입력
2. 필요 시 프로젝트 선택
3. 노트 등록 버튼 클릭

기대결과:
1. MEMO 타입 노트가 생성된다.
2. 소스 대화 메타데이터가 본문에 포함된다.

---

## 3. 엣지 케이스

### TC-EDGE-01 Entity 미선택 상태 전환 시도
- 입력: 대상 Entity 없이 이슈/노트 등록 시도
- 기대결과: 등록 버튼이 비활성화되어 잘못된 생성이 차단된다.

### TC-EDGE-02 선택 메시지 없는 상태 전환
- 입력: 메시지 선택 없이 이슈/노트 등록
- 기대결과: 대화 전체 QA 내용이 전환 소스로 사용된다.

### TC-EDGE-03 관리자 메시지 다중 등록
- 입력: 동일 대화에서 관리자 메시지 연속 전송
- 기대결과: `msg_order`가 충돌 없이 순차 증가한다.

### TC-EDGE-04 검색 결과 없음
- 입력: 존재하지 않는 키워드 검색
- 기대결과: 빈 상태 UI가 정상 표시된다.

### TC-EDGE-05 타 법인 프로젝트 혼입 방지
- 입력: A Entity 선택 후 B Entity 프로젝트를 수동 전달 시도
- 기대결과: 프론트 선택 목록이 해당 Entity 프로젝트로 제한되고, 백엔드 Entity 컨텍스트 기준으로 생성된다.

---

## 4. 데이터 격리 검증

### TC-SEC-01 USER_LEVEL 대화 상세 접근
- 시나리오: 일반 USER_LEVEL 사용자가 타인의 conversation ID로 접근 시도
- 기대결과: 기존 대화 상세 API에서 접근 거부가 유지된다.

### TC-SEC-02 ADMIN_LEVEL Entity 전환 등록
- 시나리오: ADMIN/SUPER_ADMIN이 특정 Entity를 지정해 이슈/노트 전환
- 기대결과: 선택한 Entity 컨텍스트로만 생성된다.

### TC-SEC-03 관리자 전용 API 보호
- 시나리오: 일반 사용자 계정이 `/conversations/admin*` API 호출
- 기대결과: 권한 오류가 발생한다.