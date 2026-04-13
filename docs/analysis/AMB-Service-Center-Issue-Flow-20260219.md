# 서비스센터 Issue->Task->AI->지식 업데이트 E2E 플로우 제안서

> 작성일: 2026-02-19
> 대상: AMB Management (React18/Vite + NestJS/TypeORM + SSE + Claude)
> 목적: 서비스센터/고객센터 문의가 접수될 때, Issue 생성->Task 실행->AI 요청/지식 업데이트까지 닫히는 일관된 운영 플로우 정의

## 1. 배경 및 목표
- 서비스관리/계약/HR/프로젝트 등 도메인이 이미 존재하지만, 고객 문의를 일관되게 Issue->Task->해결/AI 업데이트로 연결하는 전용 플로우가 없음
- 목표: (1) 단일 접수 채널 표준화, (2) SLA 기반 라우팅/작업 배정, (3) AI 헬퍼를 통한 요약·초안·KMS 업데이트 자동화, (4) 작업/지식이 분리되지 않도록 링크 일원화

## 2. AS-IS 자산 인벤토리 (재활용 포인트)
- 서비스관리: amb_svc_services, amb_svc_clients, amb_svc_subscriptions 등 고객·서비스 컨텍스트 보유
- 작업/프로젝트: Work Items(ACL), TODO, Project 모듈 존재 — Task 컨테이너로 활용 가능
- 커뮤니케이션: Chat(부서별 AI), Meeting Notes, Webmail(IMAP/SMTP), Notices — 알림/대화/요약 활용
- 지식: KMS(태그/그래프), Documents(Drive), AI 에이전트 지식베이스
- 권한: MenuGuard + UserMenuPermission + MenuConfig — 메뉴 접근/노출 관리 가능

## 3. TO-BE 상위 플로우 (요약)
1) 접수: 고객/내부가 웹폼·메일·챗으로 문의 -> Case 생성 (서비스/고객/구독 컨텍스트 포함)
2) 트리아지: 우선순위·SLA·담당 그룹 자동 지정, 라우팅 실패 시 큐 적재
3) 태스킹: Case <-> Task(Work Item/Project/TODO) 링크, 선행/후행 관계 관리
4) AI Assist: 요약, 라벨링, 원인 추정, 응답 초안, KMS 업데이트 초안, 로그 추출 자동화
5) 해결/배포: Task 완료 -> Case 해결 -> 고객 통지(메일/SSE/챗) -> KMS/FAQ 업데이트 -> 회고

## 4. 제안 데이터 모델 (신규 최소 세트)
| 테이블 | prefix | 핵심 컬럼 | 설명 |
|--------|--------|-----------|------|
| amb_cse_cases | cse_ | cse_id(UUID), cse_title, cse_desc, cse_status(NEW/INTAKE/IN_PROGRESS/WAITING/RESOLVED/CLOSED), cse_priority(P1-P4), cse_channel(WEB/MAIL/CHAT/API), svc_id, cli_id, sub_id, cse_sla_at, cse_assignee_usr_id, cse_group, cse_created_by | 문의/이슈 헤더 |
| amb_cse_timelines | ctl_ | ctl_id, cse_id, ctl_type(COMMENT/STATUS/ASSIGN/AI_SUMMARY/AI_PLAN/KMS_UPDATE), ctl_payload(JSON), ctl_usr_id | 상태/메모/AI 로그 타임라인 |
| amb_cse_tasks | cst_ | cst_id, cse_id, wi_id(NULLable), prj_task_id(NULLable), todo_id(NULLable), cst_status | Case<->Task 링크 |
| amb_cse_attachments | cat_ | cat_id, cse_id, file_id, cat_kind(MAIL/UPLOAD/LOG) | 첨부/메일 원문 |
| amb_cse_labels | csl_ | csl_id, cse_id, csl_key, csl_value | 태깅/라벨 |

### 설계 원칙
- 네이밍: amb_ prefix + snake_case, 3자 prefix, soft delete 컬럼 포함
- Work Item 등 외부 키는 FK 없이 ID 저장 후 서비스 레벨 검증 (모듈 결합도 최소화)
- 타임라인은 모든 활동·AI 액션을 JSON으로 남겨 감사/학습 가능

## 5. API & 서비스 역할 (초안)
- IntakeController (신규): POST /api/v1/cases (웹폼/챗/메일 인입), GET /cases, GET /cases/:id, POST /cases/:id/timeline, POST /cases/:id/resolve
- CaseService: 생성/조회/라벨/상태 전이, SLA 계산, 트리아지 룰 실행
- CaseTaskService: Task 생성/링크, 상태 동기화(Hook)
- CaseAiService: 요약, 라벨링, 분류, 답변 초안, KMS 업데이트 초안 생성 (Claude SDK)
- Webhook/Mail Intake: IMAP/SMTP 파서 -> IntakeController 호출 (메일 스레드-ID <-> Case 매핑)
- Permissions: MenuCode SERVICE_CENTER 추가, 역할·개별 권한 + MenuGuard 적용

## 6. 프런트엔드 UX (apps/web)
- 라우트: /service-center/cases, /service-center/cases/:id
- 목록: 필터(상태, 우선순위, SLA, 서비스, 고객), 배정/라벨 일괄 처리
- 상세: 헤더(상태/우선순위/SLA/담당자), 타임라인(사람/AI 활동), Task 링크, 첨부, AI 패널
- AI 패널: 1) 요약 새로고침, 2) 응답 초안 생성, 3) 라벨/원인 제안, 4) KMS 업데이트 초안 -> KMS PR 만들기
- 알림: SSE로 상태/타임라인 업데이트, 이메일/챗 답변 전송 지원

## 7. 권한/노출 정책
- 메뉴 코드: SERVICE_CENTER (ADMIN/MANAGER 기본 허용, USER는 개별 권한으로 허용)
- Case 단위 접근: 담당자/소속 그룹 매칭 + 엔터티 격리(EntityGuard) + 구독 고객 매칭(있을 때)
- 상태 전이 권한: CLOSE/RESOLVE는 MANAGER 이상, 코멘트/파일 업로드는 권한 보유자

## 8. AI 활용 시나리오 (Claude)
- 인입 즉시: 요약+우선순위/서비스 후보 태깅 -> triage 추천
- 작업 중: 로그/증적 요청 시 분석 요약, 해결 가설 제안, 고객 응답 초안 생성
- 해결 후: 회고/블램리스 리포트 초안, KMS/FAQ 초안 생성 -> 담당자 검수 후 반영
- 프롬프트 스키마: context{case, service, client, subscription, tasks, timeline}, instruction, output_format (JSON for 라벨/계획, Markdown for 응답)

## 9. TO-BE 워크플로우 (상세 단계)
1) Intake: 채널 식별->중복 검사(제목+송신자+시간)->Case 생성->AI 요약/라벨 초안 저장
2) Triage: 라우팅 규칙(서비스/고객/우선순위/SLA) -> 담당자/그룹 할당 -> SLA 타이머 세팅
3) Tasking: Work Item/Project/TODO 중 선택 생성, Case<->Task 링크. 기존 Task 연결도 허용
4) Execution: Task 진행상태를 Hook로 Case에 동기화(IN_PROGRESS/WAITING/RESOLVED)
5) Resolution: 결과 요약+고객 응답 초안 생성 -> 검수/발송 -> Case 상태 RESOLVED/CLOSED
6) Knowledge: 재발 방지/FAQ/KMS 업데이트 초안 작성 -> 승인 후 게시 -> Case 타임라인 기록
7) Metrics: SLA 준수 여부, FRT/MTTR, 재오픈율, AI 초안 채택률 집계

## 10. 단계별 구현 로드맵 (우선순위)
- Phase 0 (1~2d): 메뉴 코드/권한, 라우트/페이지 스켈레톤, DB 마이그레이션(Case/Timeline/Tasks/Labels)
- Phase 1 (3~5d): Intake API+UI, 리스트/상세, 타임라인, 기본 triage, Task 링크, SSE 알림
- Phase 2 (3~5d): AI 요약/라벨/응답 초안, SLA 타이머, 이메일/챗 발송, Webmail/챗 인입 파서
- Phase 3 (3~5d): KMS/FAQ 자동 초안, 회고 리포트, 대시보드(FRT/MTTR/재오픈율/AI 채택률)

## 11. 영향/리스크 및 완화
- 결합도: Work Item/Project/TODO 3계통 연결 시 API 계약 명확화 필요 -> 인터페이스/어댑터 계층 분리
- 권한: MenuGuard 전환 시 SETTINGS_* 선행 추가 필요 없음(신규 메뉴)이나 EntityGuard/Group 매핑 누락 주의
- 채널 파싱: 메일 스레드 매핑 실패 가능 -> 메타데이터 저장(Message-ID, In-Reply-To)
- AI: 잘못된 라벨/가설 제안 리스크 -> 사람 검수 필수, 타임라인에 AI 책임 표기

## 12. 산출물/파일 제안
- 분석/플로우 문서(본 문서): docs/analysis/AMB-Service-Center-Issue-Flow-20260219.md
- BE 설계 세부: docs/design/api-service-center-v1.md (엔드포인트, DTO, 상태머신)
- FE 설계 세부: docs/design/ui-service-center-v1.md (와이어프레임, 상태 전이, SSE 이벤트)
- AI 프롬프트 가이드: docs/design/ai-service-center-prompts.md (입출력 스키마, 가드레일)

## 13. 다음 액션(즉시 실행 가능한 TODO)
- 마이그레이션 스크립트: Case/Timeline/Task/Attachment/Label 테이블 추가
- MenuCode 상수 + i18n 추가, router/MenuGuard 등록(/service-center/*)
- Intake API + 리스트/상세 스켈레톤 생성, SSE 채널 이름 정의(case-updates)
- AI 요약/라벨 초안 생성기(Claude) 서비스 추가, 타임라인 기록
- Task 링크 어댑터: Work Item / Project / TODO ID를 수용하는 서비스 계층 작성
