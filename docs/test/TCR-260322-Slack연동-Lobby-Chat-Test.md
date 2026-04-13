# 테스트 케이스: Slack ↔ Lobby Chat 양방향 연동

**작성일**: 2026-03-22  
**관련 문서**: PLAN-Slack연동-Lobby-Chat-작업계획-20260322.md

---

## A. 단위 테스트 케이스

### A1. 백엔드 빌드 검증

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-A1-01 | 백엔드 TypeScript 컴파일 (Slack 모듈) | Slack 관련 TS 에러 0건 | |
| TC-A1-02 | 프론트엔드 Vite 빌드 | 빌드 성공, 에러 없음 | |
| TC-A1-03 | `@slack/web-api` 패키지 설치 확인 | package.json에 의존성 존재 | |

### A2. 서버 기동 & 모듈 로딩

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-A2-01 | 스테이징 API 서버 시작 | `Nest application successfully started` | |
| TC-A2-02 | SlackIntegrationModule 로드 | 에러 없이 모듈 초기화 | |
| TC-A2-03 | DB 테이블 자동 생성 (synchronize) | amb_slack_workspace_configs, amb_slack_channel_mappings, amb_slack_message_mappings 3개 테이블 존재 | |

### A3. 메뉴 권한

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-A3-01 | 메뉴 설정 확인 | amb_menu_config에 ENTITY_SLACK_INTEGRATION 존재 | |
| TC-A3-02 | MASTER/SUPER_ADMIN/ADMIN 접근 | accessible = true | |
| TC-A3-03 | MANAGER/USER 접근 차단 | accessible = false | |

---

## B. API 엔드포인트 테스트

### B1. Webhook 엔드포인트

| TC# | 테스트 | 방법 | 기대결과 | 결과 |
|-----|--------|------|---------|------|
| TC-B1-01 | URL Verification | POST `/api/v1/webhooks/slack/events` body: `{ "type": "url_verification", "challenge": "test123" }` | 200 + `{ "challenge": "test123" }` | |
| TC-B1-02 | 서명 없이 이벤트 전송 | POST 헤더 없이 event_callback 전송 | 401 Unauthorized | |
| TC-B1-03 | 잘못된 서명으로 이벤트 전송 | 헤더에 잘못된 x-slack-signature | 401 Unauthorized | |
| TC-B1-04 | 만료된 타임스탬프 (5분 초과) | x-slack-request-timestamp: 10분 전 | 401 Unauthorized | |

### B2. 워크스페이스 관리 API

| TC# | 테스트 | 방법 | 기대결과 | 결과 |
|-----|--------|------|---------|------|
| TC-B2-01 | 워크스페이스 목록 (비연결 상태) | GET `/entity-settings/slack/workspaces` | 200 + 빈 배열 | |
| TC-B2-02 | 미인증 접근 | 토큰 없이 GET 요청 | 401 Unauthorized | |

### B3. 채널 매핑 API

| TC# | 테스트 | 방법 | 기대결과 | 결과 |
|-----|--------|------|---------|------|
| TC-B3-01 | 매핑 목록 (빈 상태) | GET `/entity-settings/slack/mappings` | 200 + 빈 배열 | |
| TC-B3-02 | 미인증 접근 | 토큰 없이 GET 요청 | 401 Unauthorized | |

---

## C. 프론트엔드 UI 테스트

### C1. Entity Settings 메뉴

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-C1-01 | Entity Settings 페이지에 Slack 연동 메뉴 표시 | MessageSquare 아이콘 + "Slack 연동" 라벨 | |
| TC-C1-02 | ADMIN 이상 역할로 메뉴 접근 | 메뉴 클릭 시 Slack 설정 페이지 이동 | |
| TC-C1-03 | MANAGER/USER 역할로 접근 | 메뉴가 표시되지 않음 | |

### C2. Slack 연동 설정 페이지

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-C2-01 | 미연결 상태 UI | "연결된 Slack 워크스페이스가 없습니다" + "연결" 버튼 | |
| TC-C2-02 | 뒤로가기 버튼 | Entity Settings 메인으로 이동 | |
| TC-C2-03 | 페이지 타이틀 | "Slack 연동" + 설명 텍스트 표시 | |

### C3. 다국어 (i18n)

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-C3-01 | 한국어 표시 | 모든 라벨이 한국어 | |
| TC-C3-02 | 영어 표시 | 모든 라벨이 영어 | |
| TC-C3-03 | 베트남어 표시 | 모든 라벨이 베트남어 | |

### C4. Lobby Chat 스타일링

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-C4-01 | [Slack] prefix 메시지 표시 | Slack 아이콘(보라색) + prefix 제거된 사용자명 | |
| TC-C4-02 | 일반 메시지 표시 (기존) | 기존 스타일 유지, Slack 아이콘 없음 | |

---

## D. 회귀 테스트

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-D-01 | Lobby Chat 일반 메시지 송수신 | 기존과 동일하게 동작 | |
| TC-D-02 | 메시지 번역 기능 | 번역 버튼 + 결과 정상 표시 | |
| TC-D-03 | 파일 첨부 | 이미지/파일 첨부 및 다운로드 정상 | |
| TC-D-04 | 멘션 (@) 기능 | 멘션 알림 + 하이라이트 정상 | |
| TC-D-05 | Entity Settings 기존 메뉴 | 조직관리, 멤버관리, API키 등 기존 탭 정상 접근 | |
| TC-D-06 | Pin/Reply/Reaction | 기존 기능 정상 동작 | |

---

## E. Slack App 연결 후 테스트 (Slack App 설정 필요)

### E1. OAuth 연결 플로우

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-E1-01 | "Slack 워크스페이스 연결" 버튼 클릭 | Slack OAuth 동의 페이지로 리다이렉트 | - |
| TC-E1-02 | Slack에서 권한 허용 | 콜백 처리 후 설정 페이지로 리다이렉트 + 성공 표시 | - |
| TC-E1-03 | 연결 후 워크스페이스 정보 표시 | 워크스페이스명 + 연결일시 + "연결됨" 뱃지 | - |
| TC-E1-04 | 중복 연결 시도 | 기존 연결 업데이트 (토큰 갱신) | - |
| TC-E1-05 | 연결 해제 | 확인 팝업 → 소프트 삭제 → 미연결 상태 UI | - |

### E2. 채널 매핑

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-E2-01 | Slack 채널 목록 로드 | 워크스페이스의 public/private 채널 드롭다운 표시 | - |
| TC-E2-02 | 매핑 생성 (양방향) | Slack 채널 + AMA 채널 선택 → 매핑 생성 성공 | - |
| TC-E2-03 | 매핑 생성 (수신 전용) | direction: INBOUND_ONLY로 매핑 생성 | - |
| TC-E2-04 | 매핑 생성 (발신 전용) | direction: OUTBOUND_ONLY로 매핑 생성 | - |
| TC-E2-05 | 중복 매핑 방지 | 같은 Slack 채널 재매핑 시도 → 에러 메시지 | - |
| TC-E2-06 | 매핑 일시정지/재개 | Pause → PAUSED 상태, Play → ACTIVE 상태 | - |
| TC-E2-07 | 매핑 삭제 | 확인 팝업 → 삭제 성공 → 목록에서 제거 | - |

### E3. Inbound 메시지 (Slack → AMA)

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-E3-01 | Slack에서 일반 메시지 전송 | AMA Lobby Chat에 실시간 표시 (Slack 아이콘 + 사용자명) | - |
| TC-E3-02 | Slack에서 스레드 메시지 | AMA에서 Reply 형태로 표시 | - |
| TC-E3-03 | Bot 자신의 메시지 무시 | AMA에 표시되지 않음 (루프 방지 #1) | - |
| TC-E3-04 | PAUSED 상태 채널 | Slack 메시지가 AMA에 전달되지 않음 | - |
| TC-E3-05 | INBOUND_ONLY 매핑 | Slack → AMA만 동작, 역방향 차단 | - |

### E4. Outbound 메시지 (AMA → Slack)

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-E4-01 | AMA에서 메시지 전송 | Slack 채널에 Bot으로 메시지 게시 | - |
| TC-E4-02 | AMA Reply → Slack Thread | Slack에서 thread_ts 매핑된 스레드로 게시 | - |
| TC-E4-03 | OUTBOUND_ONLY 매핑 | AMA → Slack만 동작, 역방향 차단 | - |
| TC-E4-04 | Slack 발 메시지 재전송 방지 | Slack에서 온 메시지는 다시 Slack으로 안 감 (루프 방지 #3) | - |

### E5. 무한 루프 방지 (핵심)

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-E5-01 | Slack → AMA → Slack 루프 | 메시지가 1번만 전달되고 루프 발생 안 함 | - |
| TC-E5-02 | AMA → Slack → AMA 루프 | 메시지가 1번만 전달되고 루프 발생 안 함 | - |
| TC-E5-03 | 동일 Slack ts 중복 수신 | 첫 번째만 처리, 이후 무시 | - |

---

## F. 엣지 케이스

| TC# | 테스트 | 기대결과 | 결과 |
|-----|--------|---------|------|
| TC-F-01 | Slack 워크스페이스 연결 해제 후 메시지 | 메시지 무시 (워크스페이스 비활성) | - |
| TC-F-02 | Bot이 Slack 채널에서 제거됨 | Outbound 전송 실패 → 에러 로그만 (장애 아님) | - |
| TC-F-03 | 네트워크 오류 (Slack API 다운) | Outbound 전송 실패 → 에러 로그만 (기존 AMA 메시지 정상) | - |
| TC-F-04 | 빈 메시지 텍스트 | event.text 빈 문자열일 때 정상 처리 | - |
| TC-F-05 | 매우 긴 메시지 (4000자+) | Slack/AMA 양쪽 정상 처리 | - |

---

## 테스트 결과 요약

| 구분 | 전체 | Pass | Fail | Skip |
|------|------|------|------|------|
| A. 단위 테스트 | 9 | | | |
| B. API 엔드포인트 | 8 | | | |
| C. 프론트엔드 UI | 10 | | | |
| D. 회귀 테스트 | 6 | | | |
| E. Slack App 연결 후 | 19 | | | |
| F. 엣지 케이스 | 5 | | | |
| **합계** | **57** | | | |
