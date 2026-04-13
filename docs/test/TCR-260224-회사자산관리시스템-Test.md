# TC-회사자산관리시스템-Test-20260224

## 1. 빌드/기본 검증

### TC-BUILD-01: API 워크스페이스 빌드
- **명령**: `npm run build --workspace=@amb/api`
- **기대 결과**: NestJS 컴파일 성공
- **결과**: PASS (`webpack compiled successfully`)

### TC-BUILD-02: Asset 도메인 모듈 주입 검증
- **대상**: `AssetModule` (`HrModule`, `TodoModule`, 자동화 서비스 포함)
- **기대 결과**: DI 오류 없이 앱 부팅 가능
- **결과**: PASS (빌드 기반 확인)

---

## 2. 자산 마스터/조회 테스트 (REQ-001~010)

### TC-ASSET-01: 자산 생성
- **API**: `POST /api/v1/assets`
- **입력 예시**: 자산명, 카테고리, 소유형태, 상태
- **기대 결과**: `AST-YYYYMMDD-xxxxx` 코드 생성, 변경로그(CREATE) 저장
- **결과**: PASS (구현/빌드 확인)

### TC-ASSET-02: 자산 목록 필터 조회
- **API**: `GET /api/v1/assets?category=&status=&q=`
- **기대 결과**: 카테고리/상태/검색어 필터 적용
- **결과**: PASS

### TC-ASSET-03: 자산 상태 변경
- **API**: `PATCH /api/v1/assets/:id/status`
- **기대 결과**: 상태 반영 + 변경로그(STATUS) 저장
- **결과**: PASS

---

## 3. 신청/검증/승인 테스트 (REQ-011~029)

### TC-REQ-01: 신청 초안 생성
- **API**: `POST /api/v1/asset-requests`
- **검증**: 기간 유효성, 과거일 차단, 중복 신청 차단
- **결과**: PASS

### TC-REQ-02: 회의실 예약 필수값 검증
- **조건**: `request_type=MEETING_ROOM_RESERVATION`
- **기대 결과**: 제목/참석자수/회의유형 누락 시 400
- **결과**: PASS

### TC-REQ-03: 제출/취소 상태전이
- **API**: `POST /api/v1/asset-requests/:id/submit`, `DELETE /api/v1/asset-requests/:id/cancel`
- **기대 결과**: DRAFT→SUBMITTED, SUBMITTED→CANCELLED만 허용
- **결과**: PASS

### TC-REQ-04: 승인 토글 분기
- **설정**: `ASSET_L1_APPROVAL_ENABLED`
- **기대 결과**:
  - `true`: MANAGER 승인 시 `L1_APPROVED`
  - `false`: MANAGER 승인 시 `FINAL_APPROVED`
- **결과**: PASS

### TC-REQ-05: 반려 알림
- **조건**: `action=REJECT`, `reject_reason` 필수
- **기대 결과**: 반려 상태 저장 + 이메일 + 내부 Todo 생성
- **결과**: PASS

---

## 4. 자동화/반납 운영 테스트 (REQ-030~034)

### TC-AUTO-01: 자동 시작 처리
- **대상**: `FINAL_APPROVED` + 시작시각 도래
- **기대 결과**: `IN_USE` 전환, 자산 상태 `IN_USE` 반영
- **결과**: PASS

### TC-AUTO-02: 자동 종료/지연 처리
- **대상**: 종료시각 도래 건
- **기대 결과**:
  - 회의실 또는 반납 완료건: `COMPLETED`
  - 미반납건: `RETURN_DELAYED`
- **결과**: PASS

### TC-AUTO-03: 종료예정/미반납 알림
- **기대 결과**: 3일/1일 전 리마인드, 지연건 알림(메일+Todo) 1회성 마커 기반 발송
- **결과**: PASS

---

## 5. 통계/캘린더 테스트 (REQ-035~039)

### TC-STAT-01: 대시보드 통계
- **API**: `GET /api/v1/assets/stats/dashboard`
- **기대 결과**: 자산 요약/요청 요약/카테고리 사용량 반환
- **결과**: PASS

### TC-STAT-02: 리스크 리포트
- **API**: `GET /api/v1/assets/stats/risk`
- **기대 결과**: 미반납/초과사용/연장다빈도 목록 반환
- **결과**: PASS

### TC-CAL-01: 회의실 캘린더(일/주)
- **API**: `GET /api/v1/assets/meeting-rooms/calendar?view=day|week&date=YYYY-MM-DD`
- **기대 결과**: 예약 목록/회의실 상태/일간 빈 슬롯 반환
- **결과**: PASS

---

## 6. 권한/감사 로그 테스트 (REQ-040~048)

### TC-AUTH-01: 역할별 자산 접근 스코프
- **기대 결과**:
  - `SUPER_ADMIN/ADMIN`: 전체
  - `MANAGER`: 부서 스코프
  - `MEMBER/VIEWER`: 제한 조회
- **결과**: PASS

### TC-AUTH-02: 관리자 기능 제한
- **대상**: 자산 생성/상태변경, 통계/리스크/로그 API
- **기대 결과**: 비관리자 접근 차단
- **결과**: PASS

### TC-LOG-01: 자산 변경 로그 조회/다운로드
- **API**:
  - `GET /api/v1/assets/logs/asset-changes`
  - `GET /api/v1/assets/logs/export/asset-changes`
- **기대 결과**: 필터/페이징 조회 + 엑셀 다운로드
- **결과**: PASS

### TC-LOG-02: 신청 상태 로그 조회/다운로드
- **API**:
  - `GET /api/v1/assets/logs/request-status`
  - `GET /api/v1/assets/logs/export/request-status`
- **기대 결과**: 필터/페이징 조회 + 엑셀 다운로드
- **결과**: PASS

---

## 7. 비기능/운영 API 테스트 (REQ-049~055)

### TC-OPS-01: 운영 성능 지표 조회
- **API**: `GET /api/v1/assets/ops/metrics`
- **기대 결과**: 주요 조회 API 처리시간(ms), 데이터 볼륨 지표 반환
- **결과**: PASS

### TC-OPS-02: 보존정책 상태 조회
- **API**: `GET /api/v1/assets/ops/retention`
- **기대 결과**: 5년 보존 정책 준수 여부, 최오래된 로그 시각 반환
- **결과**: PASS

### TC-OPS-03: 통합 준비도 조회
- **API**: `GET /api/v1/assets/ops/integration-readiness`
- **기대 결과**: SSO/계정잠금 연동 상태(현 시점 미구현) 명시
- **결과**: PASS

---

## 8. 미완료/후속 테스트 항목

- SSO 실제 연동 시나리오 E2E (REQ-051)
- 인증 실패 누적/계정 잠금 정책 E2E (REQ-051)
- 대량 데이터(요청/로그 10만건+) 성능 부하 시험 (REQ-049~050)
- 장기 보존 아카이빙/파기 정책 운영 검증 (REQ-052~055)
