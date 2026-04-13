# 구현 체크리스트: 통합 검색 · 공개 설정 · 번역 에이전트 확대

**작업계획서:** PLAN-Search-Visibility-Translation-작업계획-20260223  
**작성일:** 2026-02-23

---

## Phase 1: 스키마 변경 + 이벤트 인프라 (예상 1일)

### 1-1. SQL 마이그레이션 작성 및 실행

- [ ] `sql/migration_search_visibility_translation.sql` 파일 생성
- [ ] `amb_work_items` — `wit_group_id` UUID NULL 컬럼 추가
- [ ] `amb_work_items` — `idx_work_items_group`, `idx_work_items_visibility` 인덱스 생성
- [ ] `amb_todos` — `tdo_visibility` VARCHAR(20) DEFAULT 'PRIVATE' 추가
- [ ] `amb_todos` — `tdo_group_id` UUID NULL 추가
- [ ] `amb_issues` — `iss_visibility` VARCHAR(20) DEFAULT 'ENTITY' 추가
- [ ] `amb_issues` — `iss_group_id` UUID NULL 추가
- [ ] `amb_issues` — `iss_original_lang` VARCHAR(5) DEFAULT 'ko' 추가
- [ ] `amb_meeting_notes` — `mtn_group_id` UUID NULL 추가
- [ ] `amb_notices` — `ntc_group_id` UUID NULL 추가
- [ ] `kms_projects` — `pjt_original_lang` VARCHAR(5) DEFAULT 'ko' 추가
- [ ] `amb_bil_partners` — `ptn_original_lang` VARCHAR(5) DEFAULT 'ko' 추가
- [ ] `amb_bil_contracts` — `ctr_original_lang` VARCHAR(5) DEFAULT 'ko' 추가
- [ ] `amb_svc_clients` — `cli_original_lang` VARCHAR(5) DEFAULT 'ko' 추가
- [ ] 스테이징 DB에서 마이그레이션 SQL 실행 및 검증

### 1-2. 엔티티 파일 수정

- [ ] `work-item.entity.ts` — `witGroupId` 컬럼 + `GroupEntity` 관계 추가
- [ ] `todo.entity.ts` — `tdoVisibility`, `tdoGroupId` 컬럼 추가
- [ ] `issue.entity.ts` — `issVisibility`, `issGroupId`, `issOriginalLang` 컬럼 추가
- [ ] `meeting-note.entity.ts` — `mtnGroupId` 컬럼 추가
- [ ] `notice.entity.ts` — `ntcGroupId` 컬럼 추가
- [ ] `project.entity.ts` — `pjtOriginalLang` 컬럼 추가
- [ ] `partner.entity.ts` — `ptnOriginalLang` 컬럼 추가
- [ ] `contract.entity.ts` — `ctrOriginalLang` 컬럼 추가
- [ ] `client.entity.ts` — `cliOriginalLang` 컬럼 추가

### 1-3. 이벤트/리스너 인프라

- [ ] `module-data.event.ts` — `visibility?`, `groupId?` optional 필드 추가
- [ ] `work-item-sync.listener.ts` — `handleModuleDataCreated()`: `event.visibility || 'PRIVATE'` 반영
- [ ] `work-item-sync.listener.ts` — `handleModuleDataCreated()`: `event.groupId || null` 반영
- [ ] `work-item-sync.listener.ts` — `handleModuleDataUpdated()`: visibility/groupId 갱신 로직 반영
- [ ] API 재시작 후 기존 Todo/Issue/Contract 이벤트 정상 동작 확인 (하위호환)

---

## Phase 2: 기존 모듈 Visibility 체계 적용 (예상 1.5일)

### 2-1. 공통 그룹 접근 제어 서비스 (신규)

- [ ] `domain/members/service/group-access.service.ts` 신규 생성
  - [ ] `getUserGroupIds(userId): Promise<string[]>` 구현
  - [ ] `isUserInGroup(userId, groupId): Promise<boolean>` 구현
- [ ] `members.module.ts` — `GroupAccessService` providers + exports 등록
- [ ] 단위 테스트: 사용자 그룹 ID 조회 정상 동작 확인

### 2-2. Todo — Visibility 추가

**백엔드:**
- [ ] `create-todo.request.ts` — `visibility`, `group_id` 필드 추가
- [ ] `update-todo.request.ts` — `visibility`, `group_id` 필드 추가
- [ ] `todo.service.ts` — `create()`: DTO에서 visibility/groupId 저장
- [ ] `todo.service.ts` — `create()`: 이벤트 발행에 `visibility`, `groupId` 전달
- [ ] `todo.service.ts` — `update()`: 이벤트 발행에 `visibility`, `groupId` 전달
- [ ] Todo 목록 API — group/company 탭 조회 시 visibility 기반 필터 동작 확인

**프론트엔드:**
- [ ] Todo 생성/수정 폼 — visibility 드롭다운 (PRIVATE/GROUP/ENTITY) 추가
- [ ] Todo 생성/수정 폼 — visibility=GROUP 시 그룹 선택 드롭다운 표시
- [ ] 그룹 목록 API 호출 훅 연동
- [ ] Todo mine/group/company 탭과 visibility 연동 확인

### 2-3. Issue — Visibility 추가

**백엔드:**
- [ ] `create-issue.request.ts` — `visibility`, `group_id` 필드 추가
- [ ] `update-issue.request.ts` — `visibility`, `group_id` 필드 추가
- [ ] `issue.service.ts` — `create()`: visibility/groupId 저장 + 이벤트 전달
- [ ] `issue.service.ts` — `update()`: visibility/groupId 이벤트 전달

**프론트엔드:**
- [ ] `IssueFormModal.tsx` — visibility 드롭다운 (PRIVATE/GROUP/ENTITY) 추가 (기본 ENTITY)
- [ ] visibility=GROUP 시 그룹 선택 드롭다운

### 2-4. Meeting Notes — DEPARTMENT → GROUP 전환

**백엔드:**
- [ ] `meeting-notes.module.ts` — `MembersModule` import 추가
- [ ] `meeting-note.service.ts` — `GroupAccessService` DI 주입
- [ ] `meeting-note.service.ts` — `getUserDepartment()` → `getUserGroupIds()` 로 변경
- [ ] `meeting-note.service.ts` — 목록 쿼리: DEPARTMENT 조건 → GROUP 조건으로 변경
- [ ] `meeting-note.service.ts` — 상세 접근 권한: DEPARTMENT → GROUP 기반으로 변경
- [ ] `meeting-note.service.ts` — visibility에 ENTITY 허용 추가
- [ ] `create-meeting-note.request.ts` — `department` → `group_id`, visibility enum 변경
- [ ] `update-meeting-note.request.ts` — 동일 변경

**프론트엔드:**
- [ ] `MeetingNoteFormModal.tsx` — visibility 옵션: PRIVATE/GROUP/ENTITY/PUBLIC
- [ ] `MeetingNoteFormModal.tsx` — 부서 드롭다운 → 그룹 드롭다운 (그룹 API 연동)
- [ ] `MeetingNotesPage.tsx` — 필터 버튼: DEPARTMENT → GROUP 변경, ENTITY 추가
- [ ] `MeetingNoteDetailPage.tsx` — visibility 배지 표시 변경

### 2-5. Notice — DEPARTMENT → GROUP 전환

**백엔드:**
- [ ] `notices.module.ts` — `MembersModule` import 추가
- [ ] `notice.service.ts` — GroupAccessService DI + 접근 제어 변경 (Meeting Notes와 동일 패턴)
- [ ] `create-notice.request.ts` — `department` → `group_id`, visibility 변경

**프론트엔드:**
- [ ] Notice 폼 — 부서 드롭다운 → 그룹 드롭다운 교체
- [ ] Notice 목록/상세 — visibility 배지 변경

### 2-6. i18n — Visibility 키

- [ ] `locales/ko/common.json` — visibility.PRIVATE/GROUP/ENTITY/PUBLIC 키 추가
- [ ] `locales/en/common.json` — 동일
- [ ] `locales/vi/common.json` — 동일
- [ ] Todo 네임스페이스 — `form.visibility`, `form.groupId` 키 추가
- [ ] Issue 네임스페이스 — `form.visibility`, `form.groupId` 키 추가

---

## Phase 3: 신규 모듈 검색 동기화 (예상 1일)

### 3-1. Meeting Notes → work_items

- [ ] `meeting-note.service.ts` — `EventEmitter2` DI 주입 (없을 경우)
- [ ] `meeting-note.service.ts` — `create()`: `module.data.created` 이벤트 발행
- [ ] `meeting-note.service.ts` — `update()`: `module.data.updated` 이벤트 발행
- [ ] 회의록 작성 후 `amb_work_items`에 레코드 생성 확인

### 3-2. Partner (거래처) → work_items

- [ ] `partner.service.ts` — `EventEmitter2` DI 주입
- [ ] `partner.service.ts` — `create()`: 이벤트 발행 (module='partner', visibility='ENTITY')
- [ ] `partner.service.ts` — `update()`: 이벤트 발행
- [ ] content: company_name + company_name_local + biz_type + note 결합
- [ ] 거래처 등록 후 work_items 생성 확인

### 3-3. Notice (공지사항) → work_items

- [ ] `notice.service.ts` — `EventEmitter2` DI 주입 (없을 경우)
- [ ] `notice.service.ts` — `create()`: 이벤트 발행 (visibility=ntcVisibility)
- [ ] `notice.service.ts` — `update()`: 이벤트 발행
- [ ] 공지사항 작성 후 work_items 생성 확인

### 3-4. Service Catalog → work_items

- [ ] `service-catalog.service.ts` — `EventEmitter2` DI 주입
- [ ] `create()` / `update()` 이벤트 발행 (visibility='ENTITY')
- [ ] content: svc_name + svc_name_ko + svc_name_vi + description + category 결합

### 3-5. Client → work_items

- [ ] `client.service.ts` — `EventEmitter2` DI 주입
- [ ] `create()` / `update()` 이벤트 발행 (visibility='ENTITY')
- [ ] content: company_name + company_name_local + industry + note 결합

### 3-6. Webmail → work_items

- [ ] 동기화 진입점 결정 (imap-sync / postal-webhook / 둘 다)
- [ ] 메일 저장 후 이벤트 발행 (visibility='PRIVATE')
- [ ] content: subject + body_text (앞 2000자) — 대용량 주의
- [ ] IMAP 대량 동기화 시 배치 처리 또는 debounce 적용

### 3-7. Module Import 확인

- [ ] 각 서비스 모듈에서 `EventEmitter2` 사용 가능 확인 (글로벌 모듈 여부)
- [ ] 필요 시 모듈별 `EventEmitterModule` import 추가

---

## Phase 4: 검색 접근 제어 + 프론트 검색바 (예상 0.5일)

### 4-1. SearchService 쿼리 개선

- [ ] `search.module.ts` — `MembersModule` import 추가
- [ ] `search.service.ts` — `GroupAccessService` DI 주입
- [ ] `search.service.ts` — 검색 시 `getUserGroupIds(userId)` 호출
- [ ] `search.service.ts` — AS-IS 쿼리 교체:
  - PRIVATE → 본인만
  - GROUP → 같은 그룹 멤버
  - ENTITY → 같은 법인
  - PUBLIC → 모든 사용자
- [ ] 그룹 미가입 사용자(userGroupIds=[]) 시 GROUP 항목 제외 처리
- [ ] 검색 권한 테스트: 각 visibility별 다른 사용자 검색 결과 확인

### 4-2. GlobalSearchBar 모듈 맵 확장

- [ ] `MODULE_ICONS` — meeting-notes(BookOpen), issue(AlertCircle), project(Kanban), partner(Building2), notice(Bell), service(Settings), client(Users) 추가
- [ ] `MODULE_LABELS` — 6개 신규 모듈 라벨 추가 (i18n 키 사용)
- [ ] `MODULE_ROUTES` — issue→/issues, project→/projects, partner→/billing/partners, notice→/notices, service→/services, client→/services/clients 추가
- [ ] 필요 아이콘 import 확인 (lucide-react)
- [ ] 검색 결과에서 각 신규 모듈 클릭 시 라우팅 정상 동작 확인

### 4-3. 검색 i18n

- [ ] `locales/ko/search.json` (또는 common) — module.issue/project/partner/notice/service/client 키
- [ ] `locales/en/search.json` — 동일
- [ ] `locales/vi/search.json` — 동일

---

## Phase 5: 번역 에이전트 확대 — 백엔드 (예상 1일)

### 5-1. TranslationModule 엔티티 등록

- [ ] `translation.module.ts` — `TypeOrmModule.forFeature()` 에 7개 엔티티 추가:
  - [ ] `IssueEntity`
  - [ ] `ProjectEntity`
  - [ ] `PartnerEntity`
  - [ ] `ContractEntity`
  - [ ] `SvcServiceEntity`
  - [ ] `SvcClientEntity`
  - [ ] `MailMessageEntity`
- [ ] 순환 의존성 체크 (API 시작 정상 확인)

### 5-2. TranslationService DI 추가

- [ ] constructor에 7개 Repository `@InjectRepository()` 추가
- [ ] import 문 추가 (각 엔티티 파일)

### 5-3. getSourceContent() 확장

- [ ] `case 'ISSUE'` 추가 — issTitle, issDescription, issResolution 반환
- [ ] `case 'PROJECT'` 추가 — pjtTitle/pjtName, pjtPurpose, pjtGoal, pjtSummary 반환
- [ ] `case 'PARTNER'` 추가 — ptnCompanyName, ptnCompanyNameLocal, ptnNote 반환
- [ ] `case 'CONTRACT'` 추가 — ctrTitle, ctrDescription, ctrScopeOfWork 반환
- [ ] `case 'SERVICE'` 추가 — svcName, svcDescription 반환
- [ ] `case 'CLIENT'` 추가 — cliCompanyName, cliCompanyNameLocal, cliNote 반환
- [ ] `case 'WEBMAIL'` 추가 — msgSubject, msgBodyText(앞 5000자) 반환
- [ ] 각 case에서 originalLang 올바르게 반환 확인
- [ ] 각 case에서 엔티티 not found 시 null 반환 확인

### 5-4. 번역 API 엔드포인트 테스트

- [ ] POST `/api/v1/translations/translate` — sourceType=ISSUE 테스트
- [ ] POST `/api/v1/translations/translate` — sourceType=PROJECT 테스트
- [ ] GET `/api/v1/translations/PARTNER/:id` — 번역 목록 조회 테스트
- [ ] 브릿지 번역 (ko→en→vi) 정상 동작 확인
- [ ] 번역 결과 `amb_content_translations` 저장 확인

---

## Phase 6: 번역 에이전트 확대 — 프론트엔드 (예상 1일)

### 6-1. TranslationPanel/SaveTranslationDialog 타입 확장

- [ ] `TranslationPanel.tsx` — sourceType union 타입에 7개 추가 (ISSUE|PROJECT|PARTNER|CONTRACT|SERVICE|CLIENT|WEBMAIL)
- [ ] `SaveTranslationDialog.tsx` — sourceType union 타입에 7개 추가

### 6-2. 각 모듈 상세 페이지에 TranslationPanel 추가

- [ ] `IssueDetailModal.tsx` — TranslationPanel (ISSUE, title/description/resolution)
- [ ] 프로젝트 상세 페이지 — TranslationPanel (PROJECT, title/purpose/goal/summary)
- [ ] 거래처 상세 페이지/모달 — TranslationPanel (PARTNER, company_name/company_name_local/note)
- [ ] 계약 상세 페이지 — TranslationPanel (CONTRACT, title/description/scope_of_work)
- [ ] 서비스 카탈로그 상세 — TranslationPanel (SERVICE, name/description)
- [ ] 고객 상세 — TranslationPanel (CLIENT, company_name/company_name_local/note)
- [ ] 웹메일 상세 — TranslationPanel (WEBMAIL, subject/body)

### 6-3. 각 모듈 생성 폼에 SaveTranslationDialog 추가

- [ ] Issue 생성 폼 — 저장 후 SaveTranslationDialog 트리거
- [ ] 프로젝트 생성 폼 — 저장 후 SaveTranslationDialog 트리거
- [ ] 거래처 생성 폼 — 저장 후 SaveTranslationDialog 트리거
- [ ] 계약 생성 폼 — 저장 후 SaveTranslationDialog 트리거
- [ ] 고객 생성 폼 — 저장 후 SaveTranslationDialog 트리거
- [ ] Notice — 기존 자동번역(triggerAutoTranslation)과 SaveTranslationDialog 통합 검토

### 6-4. 서비스 카탈로그 번역 방식 결정

- [ ] 기존 다국어 컬럼(svc_name_ko, svc_name_vi) 유지 여부 확인
- [ ] AI 번역과 기존 다국어 컬럼 병행 방안 결정
- [ ] 결정에 따라 TranslationPanel 적용 또는 skip

---

## Phase 7: 데이터 마이그레이션 + 테스트 (예상 0.5일)

### 7-1. 기존 데이터 work_items 일괄 등록

- [ ] Meeting Notes(11건) → work_items INSERT SQL 작성 및 실행
- [ ] Partner(37건) → work_items INSERT SQL 작성 및 실행
- [ ] Notice(2건) → work_items INSERT SQL 작성 및 실행
- [ ] Service(3건) → work_items INSERT SQL 작성 및 실행
- [ ] 중복 등록 방지 (`NOT EXISTS` 조건) 확인
- [ ] 등록 후 work_items 건수 검증

### 7-2. DEPARTMENT → GROUP 데이터 전환

- [ ] `amb_groups` 테이블에서 기존 부서명과 매핑 가능한 그룹 확인
- [ ] 매핑 안 되는 부서명 수동 처리 방안 결정
- [ ] Meeting Notes: `mtn_department` → `mtn_group_id` + `mtn_visibility='GROUP'` UPDATE 실행
- [ ] Notice: `ntc_department` → `ntc_group_id` + `ntc_visibility='GROUP'` UPDATE 실행
- [ ] 전환 후 Meeting Notes/Notice 목록 접근 정상 확인

### 7-3. 기존 work_items visibility 갱신

- [ ] Issue work_items: PRIVATE → ENTITY 일괄 UPDATE
- [ ] Todo work_items: PRIVATE 유지 (변경 없음 확인)
- [ ] Contract work_items: 필요 시 visibility 갱신

### 7-4. 통합 테스트

**검색 동기화:**
- [ ] 회의록 작성 → 통합 검색에 노출 확인
- [ ] 거래처 등록 → 회사명 검색 가능 확인
- [ ] 공지사항 작성 → 검색 노출 확인
- [ ] 서비스 카탈로그 등록 → 검색 노출 확인
- [ ] 웹메일 수신 → 제목 검색 가능 확인
- [ ] 마이그레이션된 기존 데이터 검색 가능 확인

**Visibility 접근 제어:**
- [ ] Todo(비공개) — 타 사용자 검색 ❌
- [ ] Todo(그룹공개) — 같은 그룹 검색 ✅ / 다른 그룹 ❌
- [ ] Todo(법인공개) — 같은 법인 전체 ✅
- [ ] Issue(법인공개) — 같은 법인 전체 ✅
- [ ] Meeting Notes(그룹공개) — 같은 그룹 ✅ / 다른 그룹 ❌
- [ ] Meeting Notes(전체공개) — 모든 사용자 ✅
- [ ] Notice(그룹공개) — 그룹 멤버만 ✅
- [ ] Partner/Service(법인공개) — 같은 법인 ✅ / 타 법인 ❌
- [ ] Webmail(비공개) — 본인만 ✅

**번역 에이전트:**
- [ ] Issue 상세 → 번역 실행 → SSE 스트리밍 정상 / 저장 확인
- [ ] Project 상세 → 번역 실행 → 저장 확인
- [ ] Partner 상세 → 번역 실행 → 저장 확인
- [ ] 번역된 콘텐츠 — 원본 접근 가능한 다른 사용자에게 표시 확인
- [ ] 원본 수정 → 번역 STALE 마킹 확인
- [ ] 재번역 실행 → 이력 저장 확인

**프론트엔드 UX:**
- [ ] 검색 결과에서 Issue 클릭 → /issues 이동
- [ ] 검색 결과에서 Project 클릭 → /projects 이동
- [ ] 검색 결과에서 Partner 클릭 → /billing/partners 이동
- [ ] 검색 결과에서 Notice 클릭 → /notices 이동
- [ ] 검색 결과에서 Service 클릭 → /services 이동
- [ ] Todo 생성 폼 — visibility 드롭다운 정상 표시
- [ ] Meeting Notes 폼 — 그룹 드롭다운 정상 표시 (부서 드롭다운 제거)
- [ ] 각 모듈 상세 — TranslationPanel 정상 렌더링
- [ ] i18n: ko/en/vi 모든 키 정상 표시

---

## 배포 체크리스트

### 스테이징 배포

- [ ] Phase 1 SQL 마이그레이션 스테이징 DB 실행
- [ ] Phase 1~4 코드 커밋 & 푸시
- [ ] 스테이징 서버 배포 (`deploy-staging.sh`)
- [ ] API 재시작 후 에러 로그 없음 확인
- [ ] Phase 7-1 work_items 마이그레이션 SQL 실행
- [ ] Phase 7-2 DEPARTMENT→GROUP 매핑 SQL 실행
- [ ] 기능 테스트 (검색 · visibility · 접근 제어)
- [ ] Phase 5~6 코드 커밋 & 푸시
- [ ] 스테이징 재배포
- [ ] 번역 에이전트 기능 테스트

### 프로덕션 배포

- [ ] 프로덕션 DB 마이그레이션 SQL 실행
- [ ] 코드 배포 (`deploy-production.sh`)
- [ ] work_items 마이그레이션 SQL 실행
- [ ] DEPARTMENT→GROUP 데이터 전환 SQL 실행
- [ ] 스모크 테스트: 검색 / 번역 / visibility 동작 확인

### 롤백 확인

- [ ] 모든 ALTER TABLE은 ADD COLUMN (nullable) — 기존 코드 영향 없음 확인
- [ ] `mtn_department` 원본 컬럼 보존 — 필요 시 원복 가능
- [ ] TypeORM synchronize: false 확인 (자동 스키마 변경 방지)

---

## 완료 기준

| 항목 | 기준 |
|------|------|
| 검색 범위 | 10개 모듈(Todo/Issue/MeetingNotes/Project/Contract/Partner/Notice/Service/Client/Webmail) work_items 동기화 |
| Visibility | PRIVATE/GROUP/ENTITY/PUBLIC 4단계 접근 제어 동작 |
| GROUP 기반 | `amb_user_groups` 기반 그룹 접근 제어 (usrDepartment 문자열 X) |
| 번역 지원 | 10개 sourceType 번역 가능 (기존 3 + 신규 7) |
| 번역 공개 | 번역 결과는 원본 접근 가능한 모든 사용자에게 표시 |
| 프론트 검색 | GlobalSearchBar에 11개 모듈 등록 (아이콘/라벨/라우트) |
| i18n | ko/en/vi 3개 언어 모든 신규 키 등록 |
| 기존 데이터 | Meeting Notes 11건, Partner 37건, Notice 2건, Service 3건 마이그레이션 |
| DEPT→GROUP | Meeting Notes/Notice의 DEPARTMENT 데이터가 GROUP으로 전환 |
