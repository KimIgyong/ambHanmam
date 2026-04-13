# 작업 계획서: 통합 검색 · 공개 설정 · 번역 에이전트 확대

| 항목 | 내용 |
|------|------|
| **문서번호** | PLAN-Search-Visibility-Translation-작업계획-20260223 |
| **요구사항 분석서** | REQ-Search-Visibility-Enhancement-20260223 (v2) |
| **작성일** | 2026-02-23 |
| **대상 브랜치** | `main` |
| **최종 커밋** | `072817a` (법인별 그룹/부서 관리 UI + 그룹별 메뉴 권한 체크박스 UI) |

---

## 1. 시스템 개발 현황 분석 요약

### 1.1 검색 시스템

| 구성요소 | 파일 | 상태 |
|---------|------|------|
| 검색 서비스 | `domain/search/service/search.service.ts` (200줄) | `amb_work_items` 대상 ILIKE 검색 |
| 검색 컨트롤러 | `domain/search/controller/search.controller.ts` | GET `/api/v1/search` |
| WorkItem 엔티티 | `domain/acl/entity/work-item.entity.ts` (60줄) | witVisibility는 문자열, **wit_group_id 없음** |
| WorkItem 동기화 리스너 | `domain/kms/listener/work-item-sync.listener.ts` (120줄) | `module.data.created/updated` 이벤트 핸들링 |
| 이벤트 인터페이스 | `domain/kms/event/module-data.event.ts` | **visibility·groupId 필드 없음** |
| 프론트 검색바 | `domain/search/components/GlobalSearchBar.tsx` (237줄) | 5개 모듈만 등록 |

**현재 검색 접근 제어 쿼리:**
```sql
(wit_owner_id = :userId OR wit_visibility IN ('SHARED','DEPARTMENT','ENTITY','PUBLIC'))
```
→ DEPARTMENT 항목은 **부서 무관하게** 모든 사용자에게 노출됨 (부서 필터 없음)

### 1.2 모듈별 work_items 동기화 현황

| 모듈 | 이벤트 발행 | WorkItem 직접생성 | 동기화됨 | visibility |
|------|:-----------:|:-----------------:|:--------:|:----------:|
| **Todo** | ✅ (L90,L154) | - | ✅ | PRIVATE 고정 |
| **Issue** | ✅ (L124,L167) | - | ✅ | PRIVATE 고정 |
| **Contract** | ✅ (L135,L208) | - | ✅ | PRIVATE 고정 |
| **Project** | - | ✅ | ✅ | ENTITY 고정 |
| **Meeting Notes** | ❌ | ❌ | ❌ | - |
| **Notice** | ❌ | ❌ | ❌ | - |
| **Partner** | ❌ | ❌ | ❌ | - |
| **Service Catalog** | ❌ | ❌ | ❌ | - |
| **Client** | ❌ | ❌ | ❌ | - |
| **Webmail** | ❌ | ❌ | ❌ | - |

### 1.3 모듈별 엔티티 Visibility 현황

| 모듈 | visibility 컬럼 | dept/group 컬럼 | original_lang 컬럼 |
|------|:---------------:|:--------------:|:------------------:|
| Todo | ❌ | ❌ | ✅ `tdo_original_lang` |
| Issue | ❌ | ❌ | ❌ |
| Meeting Notes | ✅ `mtn_visibility` (PRIVATE/DEPARTMENT/PUBLIC) | ✅ `mtn_department` (varchar30) | ✅ `mtn_original_lang` |
| Notice | ✅ `ntc_visibility` (PUBLIC/DEPARTMENT) | ✅ `ntc_department` (varchar) | ✅ `ntc_original_lang` |
| Project | ❌ (work_item에서 ENTITY) | ✅ `pjt_dept_id` (UUID) | ❌ |
| Contract | ❌ | ❌ | ❌ |
| Partner | ❌ | ❌ | ❌ |
| Service Catalog | ❌ | ❌ | ❌ (다국어 컬럼 별도) |
| Client | ❌ | ❌ | ❌ |
| Webmail | ❌ | ❌ | ❌ |

### 1.4 그룹 시스템

| 테이블 | 현재 상태 |
|--------|-----------|
| `amb_groups` | grpId, grpName, grpDescription, entId — **순수 조직 관리용** |
| `amb_user_groups` | ugrId, usrId, grpId — **관계 정의 없음 (bare join table)** |
| `GroupService` | CRUD + 멤버 관리 (227줄) — **접근 제어 사용 안함** |

현재 그룹은 **멤버 관리(Member Management)** 용도로만 사용. 콘텐츠 접근 제어(visibility)에는 전혀 활용되지 않음.

### 1.5 번역 시스템

| 구성요소 | 파일 | 상태 |
|---------|------|------|
| TranslationService | `domain/translation/service/translation.service.ts` (615줄) | TODO, MEETING_NOTE, NOTICE 3개 타입만 지원 |
| TranslationModule | `domain/translation/translation.module.ts` | TodoEntity, MeetingNoteEntity, NoticeEntity 3개 주입 |
| TranslationController | `domain/translation/controller/translation.controller.ts` (159줄) | 9개 엔드포인트 |
| ContentTranslationEntity | `domain/translation/entity/content-translation.entity.ts` | sourceType별 저장 |
| TranslationPanel (FE) | `domain/translations/components/TranslationPanel.tsx` (329줄) | 3개 모듈 상세페이지에 적용 |
| SaveTranslationDialog (FE) | `domain/translations/components/SaveTranslationDialog.tsx` (254줄) | 2개 모듈 폼에 적용 |

**getSourceContent() 지원 타입:** `TODO`, `MEETING_NOTE`, `NOTICE` → 나머지 7개 타입 추가 필요

### 1.6 프론트엔드 검색 모듈 맵

| 키 | MODULE_ICONS | MODULE_LABELS | MODULE_ROUTES | 상태 |
|----|:-----------:|:------------:|:-------------:|:----:|
| `todo` | ✅ CheckSquare | ✅ | ✅ /todos | 등록됨 |
| `billing` | ✅ FileText | ✅ | ✅ /billing/contracts | 등록됨 |
| `webmail` | ✅ Mail | ✅ | ✅ /webmail | 등록됨 |
| `drive` | ✅ Folder | ✅ | ✅ /drive | 등록됨 |
| `meeting-notes` | ❌ | ✅ | ✅ /meeting-notes | 아이콘 누락 |
| `issue` | ❌ | ❌ | ❌ | 미등록 |
| `project` | ❌ | ❌ | ❌ | 미등록 |
| `partner` | ❌ | ❌ | ❌ | 미등록 |
| `notice` | ❌ | ❌ | ❌ | 미등록 |
| `service` | ❌ | ❌ | ❌ | 미등록 |
| `client` | ❌ | ❌ | ❌ | 미등록 |

### 1.7 부서(Department) 기반 접근 제어

현재 Meeting Notes 접근 제어 방식:
- `getUserDepartment(userId)` → `user.usrDepartment` 문자열 읽기
- 목록 쿼리: `(owner = userId) OR (visibility = 'PUBLIC') OR (visibility = 'DEPARTMENT' AND department = userDept)`
- `DEPARTMENTS` 상수: 12개 부서 (LEGAL, ACCOUNTING, ... PLANNING)

**핵심 문제:** `usrDepartment`는 문자열 필드이고, `amb_groups` 기반 그룹 시스템과 별개로 동작.

---

## 2. 구현 단계 계획

### Phase 개요

| Phase | 제목 | 주요 변경 | 예상 공수 |
|-------|------|-----------|----------|
| **Phase 1** | 스키마 변경 + 이벤트 인프라 | DB 마이그레이션, ModuleDataEvent 확장, WorkItemSyncListener 수정 | 1일 |
| **Phase 2** | 기존 모듈 Visibility 체계 적용 | Todo/Issue visibility 추가, Meeting Notes/Notice DEPT→GROUP 전환 | 1.5일 |
| **Phase 3** | 신규 모듈 검색 동기화 | Partner/Notice/Service/Client/Webmail → work_items 연동 | 1일 |
| **Phase 4** | 검색 접근 제어 개선 + 프론트 검색바 확장 | SearchService 쿼리 개선, GlobalSearchBar 모듈 맵 확장 | 0.5일 |
| **Phase 5** | 번역 에이전트 확대 (백엔드) | getSourceContent 확장, Module DI, original_lang 추가 | 1일 |
| **Phase 6** | 번역 에이전트 확대 (프론트엔드) | TranslationPanel/SaveTranslationDialog 7개 모듈 추가 | 1일 |
| **Phase 7** | 기존 데이터 마이그레이션 + 테스트 | work_items 일괄 등록, DEPARTMENT→GROUP 데이터 전환, E2E 검증 | 0.5일 |

---

## Phase 1: 스키마 변경 + 이벤트 인프라

### 1-1. DB 스키마 변경 (SQL 마이그레이션)

#### `amb_work_items` — 그룹 참조 추가

```sql
-- 1-1-1: work_items에 group_id 추가
ALTER TABLE amb_work_items 
  ADD COLUMN wit_group_id UUID NULL;

CREATE INDEX idx_work_items_group ON amb_work_items(wit_group_id);
CREATE INDEX idx_work_items_visibility ON amb_work_items(wit_visibility);
```

**변경 파일:** `domain/acl/entity/work-item.entity.ts`

```typescript
// 추가할 컬럼
@Column({ name: 'wit_group_id', type: 'uuid', nullable: true })
witGroupId: string;

@ManyToOne(() => GroupEntity)
@JoinColumn({ name: 'wit_group_id' })
group: GroupEntity;
```

**사이드 임팩트:** 없음 (nullable 컬럼 추가, 기존 쿼리 영향 없음)

#### `amb_todos` — visibility 추가

```sql
-- 1-1-2: Todo에 visibility + group_id 추가
ALTER TABLE amb_todos
  ADD COLUMN tdo_visibility VARCHAR(20) DEFAULT 'PRIVATE',
  ADD COLUMN tdo_group_id UUID NULL;
```

**변경 파일:** `domain/todo/entity/todo.entity.ts`

```typescript
@Column({ name: 'tdo_visibility', length: 20, default: 'PRIVATE' })
tdoVisibility: string; // 'PRIVATE' | 'GROUP' | 'ENTITY'

@Column({ name: 'tdo_group_id', type: 'uuid', nullable: true })
tdoGroupId: string;
```

#### `amb_issues` — visibility + original_lang 추가

```sql
-- 1-1-3: Issue에 visibility + group_id + original_lang 추가
ALTER TABLE amb_issues
  ADD COLUMN iss_visibility VARCHAR(20) DEFAULT 'ENTITY',
  ADD COLUMN iss_group_id UUID NULL,
  ADD COLUMN iss_original_lang VARCHAR(5) DEFAULT 'ko';
```

**변경 파일:** `domain/issues/entity/issue.entity.ts`

```typescript
@Column({ name: 'iss_visibility', length: 20, default: 'ENTITY' })
issVisibility: string;

@Column({ name: 'iss_group_id', type: 'uuid', nullable: true })
issGroupId: string;

@Column({ name: 'iss_original_lang', length: 5, default: 'ko' })
issOriginalLang: string;
```

#### `amb_meeting_notes` — DEPARTMENT → GROUP 전환

```sql
-- 1-1-4: Meeting Notes department→group 전환 + ENTITY 허용
-- 기존 mtn_department는 유지하되 deprecated
ALTER TABLE amb_meeting_notes
  ADD COLUMN mtn_group_id UUID NULL;

-- visibility 값에 GROUP, ENTITY 허용 (체크 제약 조건이 있다면 변경)
-- 기존 mtn_department의 마그레이션은 Phase 7에서 처리
```

**변경 파일:** `domain/meeting-notes/entity/meeting-note.entity.ts`

```typescript
// 추가
@Column({ name: 'mtn_group_id', type: 'uuid', nullable: true })
mtnGroupId: string;

// 기존 mtn_department는 유지 (Phase 7에서 데이터 마이그레이션 후 drop)
```

#### `amb_notices` — DEPARTMENT → GROUP 전환

```sql
-- 1-1-5: Notice department→group 전환
ALTER TABLE amb_notices
  ADD COLUMN ntc_group_id UUID NULL;
```

**변경 파일:** `domain/notices/entity/notice.entity.ts`

```typescript
@Column({ name: 'ntc_group_id', type: 'uuid', nullable: true })
ntcGroupId: string;
```

#### 번역 대상 모듈 original_lang 추가

```sql
-- 1-1-6: original_lang이 없는 엔티티에 추가
ALTER TABLE kms_projects
  ADD COLUMN pjt_original_lang VARCHAR(5) DEFAULT 'ko';
  
ALTER TABLE amb_bil_partners
  ADD COLUMN ptn_original_lang VARCHAR(5) DEFAULT 'ko';

ALTER TABLE amb_bil_contracts
  ADD COLUMN ctr_original_lang VARCHAR(5) DEFAULT 'ko';

ALTER TABLE amb_svc_clients
  ADD COLUMN cli_original_lang VARCHAR(5) DEFAULT 'ko';
```

**변경 파일:** 각 엔티티에 `xxxOriginalLang` 컬럼 추가
- `domain/project/entity/project.entity.ts`
- `domain/billing/entity/partner.entity.ts`
- `domain/billing/entity/contract.entity.ts`
- `domain/service-management/entity/client.entity.ts`

### 1-2. ModuleDataEvent 인터페이스 확장

**파일:** `domain/kms/event/module-data.event.ts`

```typescript
// AS-IS
export interface ModuleDataEvent {
  module: string;
  type: string;
  refId: string;
  title: string;
  content: string;
  ownerId: string;
  entityId?: string;
}

// TO-BE
export interface ModuleDataEvent {
  module: string;
  type: string;
  refId: string;
  title: string;
  content: string;
  ownerId: string;
  entityId?: string;
  visibility?: string;   // ★ 추가
  groupId?: string;      // ★ 추가
}
```

**사이드 임팩트:** 기존 이벤트 발행 코드에 영향 없음 (optional 필드). 리스너만 수정 필요.

### 1-3. WorkItemSyncListener 수정

**파일:** `domain/kms/listener/work-item-sync.listener.ts`

변경 내용:
1. `handleModuleDataCreated`에서 `event.visibility` → `witVisibility`로 전달 (없으면 'PRIVATE' fallback)
2. `event.groupId` → `witGroupId`로 전달
3. `handleModuleDataUpdated`에서도 visibility/groupId 갱신

```typescript
// handleModuleDataCreated 내부 — 변경 전
const newItem = this.workItemRepo.create({
  // ...
  witVisibility: 'PRIVATE',   // 하드코딩
  // ...
});

// 변경 후
const newItem = this.workItemRepo.create({
  // ...
  witVisibility: event.visibility || 'PRIVATE',
  witGroupId: event.groupId || null,
  // ...
});
```

```typescript
// handleModuleDataUpdated 내부 — 추가
if (event.visibility) {
  workItem.witVisibility = event.visibility;
}
if (event.groupId !== undefined) {
  workItem.witGroupId = event.groupId || null;
}
```

**사이드 임팩트:** 
- 기존 Todo/Issue 이벤트는 visibility 미전달 → 기존처럼 PRIVATE (안전)
- Contract 이벤트도 미전달 → PRIVATE 유지 (Phase 3에서 필요 시 수정)

---

## Phase 2: 기존 모듈 Visibility 체계 적용

### 2-1. Todo Visibility

#### 2-1-1. 백엔드 — todo.service.ts

**`create()` (L90)** — 이벤트 발행 시 visibility 전달:
```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'todo',
  type: 'TODO',
  refId: todo.tdoId,
  title: todo.tdoTitle,
  content: [todo.tdoTitle, todo.tdoDescription, ...].filter(Boolean).join(' '),
  ownerId: userId,
  entityId: entityId,
  visibility: todo.tdoVisibility || 'PRIVATE',  // ★ 추가
  groupId: todo.tdoGroupId || undefined,          // ★ 추가
});
```

**`update()` (L154)** — 동일하게 visibility 전달

**변경 파일:**
- `domain/todo/service/todo.service.ts`
- `domain/todo/dto/request/create-todo.request.ts` — `visibility`, `group_id` 필드 추가
- `domain/todo/dto/request/update-todo.request.ts` — 동일

#### 2-1-2. 프론트엔드 — Todo 폼에 visibility 드롭다운 추가

**변경 파일:**
- Todo 생성/수정 폼 컴포넌트 — visibility 선택 UI
- 그룹 선택 드롭다운 (visibility === 'GROUP' 시에만 표시)
- `useTodoForm` 또는 관련 훅 — API 호출 시 visibility/group_id 전달
- Todo 목록에서 group/company 탭과 연동

**상세:**
```tsx
// [Visibility Select]
<select value={visibility} onChange={e => setVisibility(e.target.value)}>
  <option value="PRIVATE">{t('visibility.PRIVATE')}</option>
  <option value="GROUP">{t('visibility.GROUP')}</option>
  <option value="ENTITY">{t('visibility.ENTITY')}</option>
</select>

// [Group Select - visibility === 'GROUP' 일 때만]
{visibility === 'GROUP' && (
  <select value={groupId} onChange={e => setGroupId(e.target.value)}>
    {groups.map(g => <option key={g.grpId} value={g.grpId}>{g.grpName}</option>)}
  </select>
)}
```

**사이드 임팩트:**
- TodoPage의 `mine` / `group` / `company` 탭이 이미 존재하므로, 각 탭의 데이터 소스가 visibility와 일치하게 조정 필요
- Todo API의 그룹/회사 탭 조회 로직(`ScopedTodoList`)에서 work_items visibility 기반 필터링 검토

### 2-2. Issue Visibility

#### 2-2-1. 백엔드 — issue.service.ts

**`create()` (L124)** — 이벤트 발행 시 visibility 전달:
```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  // ... 기존 필드
  visibility: issue.issVisibility || 'ENTITY', // ★ 기본 ENTITY
  groupId: issue.issGroupId || undefined,
});
```

**`update()` (L167)** — 동일

**변경 파일:**
- `domain/issues/service/issue.service.ts`
- `domain/issues/dto/request/create-issue.request.ts` — `visibility`, `group_id` 추가
- `domain/issues/dto/request/update-issue.request.ts` — 동일

#### 2-2-2. 프론트엔드 — Issue 폼에 visibility 드롭다운 추가

**변경 파일:**
- `domain/issues/components/IssueFormModal.tsx` — visibility 선택 UI (기본 ENTITY)
- Issue 목록 페이지 — visibility에 따른 필터 고려

### 2-3. Meeting Notes — DEPARTMENT → GROUP 전환

#### 2-3-1. 백엔드 — meeting-note.service.ts

**현재 접근 제어 (L43-56):**
```typescript
// AS-IS: getUserDepartment로 user.usrDepartment 문자열 비교
.andWhere(
  '(note.usrId = :userId OR note.mtnVisibility = :public OR ' +
  '(note.mtnVisibility = :dept AND note.mtnDepartment = :userDept))',
  { userId, public: 'PUBLIC', dept: 'DEPARTMENT', userDept },
)
```

**TO-BE: 그룹 기반 접근 제어:**
```typescript
// 사용자가 속한 그룹 ID 목록 조회 (UserGroupEntity)
const userGroupIds = await this.getUserGroupIds(userId);

qb.andWhere(
  '(note.usrId = :userId' +
  ' OR note.mtnVisibility = :public' +
  ' OR note.mtnVisibility = :entity' +
  ' OR (note.mtnVisibility = :group AND note.mtnGroupId IN (:...userGroupIds)))',
  { userId, public: 'PUBLIC', entity: 'ENTITY', group: 'GROUP', userGroupIds },
);
```

**추가 필요:**
- `UserGroupEntity`를 meeting-note.service.ts에 DI 주입
- `getUserGroupIds(userId)` 헬퍼 메서드 구현
- 또는 공통 서비스(`GroupAccessService`)로 추출하여 재사용

**변경 파일:**
- `domain/meeting-notes/service/meeting-note.service.ts`
- `domain/meeting-notes/meeting-notes.module.ts` — UserGroupEntity import
- `domain/meeting-notes/dto/request/create-meeting-note.request.ts` — `group_id` 추가, visibility enum 변경
- `domain/meeting-notes/dto/request/update-meeting-note.request.ts` — 동일

#### 2-3-2. 프론트엔드 — MeetingNoteFormModal

**현재 (L24-25):**
```tsx
const [visibility, setVisibility] = useState('PRIVATE');
const [department, setDepartment] = useState('');
```

**변경 후:**
```tsx
const [visibility, setVisibility] = useState('PRIVATE');
const [groupId, setGroupId] = useState('');  // department → groupId

// Select 옵션: PRIVATE | GROUP | ENTITY | PUBLIC
// GROUP 선택 시 그룹 드롭다운 (API에서 그룹 목록 조회)
```

**변경 파일:**
- `domain/meeting-notes/components/MeetingNoteFormModal.tsx`
- `domain/meeting-notes/pages/MeetingNotesPage.tsx` — visibility 필터 버튼 변경 (DEPARTMENT → GROUP, ENTITY 추가)
- `domain/meeting-notes/pages/MeetingNoteDetailPage.tsx` — visibility 배지 변경

### 2-4. Notice — DEPARTMENT → GROUP 전환

Meeting Notes와 동일한 패턴.

**변경 파일:**
- `domain/notices/service/notice.service.ts` — 접근 제어 로직 변경
- `domain/notices/notices.module.ts` — UserGroupEntity import
- Notice 프론트 컴포넌트들 — department → group 드롭다운

### 2-5. 공통 그룹 접근 제어 서비스 (권장)

Meeting Notes, Notice, 향후 다른 모듈에서 동일한 그룹 기반 접근 제어가 필요하므로, **공통 서비스**를 만드는 것을 권장.

**신규 파일:** `domain/members/service/group-access.service.ts`

```typescript
@Injectable()
export class GroupAccessService {
  constructor(
    @InjectRepository(UserGroupEntity)
    private readonly userGroupRepo: Repository<UserGroupEntity>,
  ) {}

  /** 사용자가 속한 그룹 ID 목록 반환 */
  async getUserGroupIds(userId: string): Promise<string[]> {
    const memberships = await this.userGroupRepo.find({ where: { usrId: userId } });
    return memberships.map(m => m.grpId);
  }

  /** 사용자가 특정 그룹에 속해 있는지 확인 */
  async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    const count = await this.userGroupRepo.count({ where: { usrId: userId, grpId: groupId } });
    return count > 0;
  }
}
```

**exports:** `MembersModule`에서 export → 필요한 모듈에서 import

### 2-6. i18n — Visibility 관련 번역 키 추가

**변경 파일:** `locales/ko/common.json`, `locales/en/common.json`, `locales/vi/common.json`

```json
{
  "visibility": {
    "PRIVATE": "비공개 / Private / Riêng tư",
    "GROUP": "그룹공개 / Group / Nhóm",
    "ENTITY": "법인공개 / Company / Công ty",
    "PUBLIC": "전체공개 / Public / Công khai"
  }
}
```

---

## Phase 3: 신규 모듈 검색 동기화

### 3-1. Meeting Notes → work_items 이벤트 발행

**파일:** `domain/meeting-notes/service/meeting-note.service.ts`

**`create()` 내부 추가:**
```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'meeting-notes',
  type: 'NOTE',
  refId: note.mtnId,
  title: note.mtnTitle,
  content: [note.mtnTitle, note.mtnContent].filter(Boolean).join(' '),
  ownerId: userId,
  entityId: entityId,
  visibility: note.mtnVisibility || 'PRIVATE',
  groupId: note.mtnGroupId || undefined,
} as ModuleDataEvent);
```

**`update()` 내부 추가:** 동일 패턴 (`MODULE_DATA_EVENTS.UPDATED`)

**필요 DI:** `EventEmitter2` 주입 (현재 MeetingNoteService에 없을 수 있음)

### 3-2. Partner → work_items 이벤트 발행

**파일:** `domain/billing/service/partner.service.ts`

```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'partner',
  type: 'DOC',
  refId: partner.ptnId,
  title: partner.ptnCompanyName,
  content: [
    partner.ptnCompanyName,
    partner.ptnCompanyNameLocal,
    partner.ptnBizType,
    partner.ptnBizCategory,
    partner.ptnNote,
  ].filter(Boolean).join(' '),
  ownerId: userId,
  entityId: partner.entId,
  visibility: 'ENTITY',
});
```

**사이드 임팩트:** 거래처는 법인(Entity) 레벨 데이터이므로 항상 ENTITY 고정

### 3-3. Notice → work_items 이벤트 발행

**파일:** `domain/notices/service/notice.service.ts`

```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'notice',
  type: 'DOC',
  refId: notice.ntcId,
  title: notice.ntcTitle,
  content: [notice.ntcTitle, notice.ntcContent].filter(Boolean).join(' '),
  ownerId: userId,
  entityId: entityId,
  visibility: notice.ntcVisibility || 'PUBLIC',
  groupId: notice.ntcGroupId || undefined,
});
```

### 3-4. Service Catalog → work_items 이벤트 발행

**파일:** `domain/service-management/service/service-catalog.service.ts`

```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'service',
  type: 'DOC',
  refId: service.svcId,
  title: service.svcName,
  content: [
    service.svcName,
    service.svcNameKo,
    service.svcNameVi,
    service.svcDescription,
    service.svcCategory,
  ].filter(Boolean).join(' '),
  ownerId: userId,
  entityId: entityId,
  visibility: 'ENTITY',
});
```

### 3-5. Client → work_items 이벤트 발행

**파일:** `domain/service-management/service/client.service.ts`

```typescript
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'client',
  type: 'DOC',
  refId: client.cliId,
  title: client.cliCompanyName,
  content: [
    client.cliCompanyName,
    client.cliCompanyNameLocal,
    client.cliIndustry,
    client.cliNote,
  ].filter(Boolean).join(' '),
  ownerId: userId,
  entityId: entityId,
  visibility: 'ENTITY',
});
```

### 3-6. Webmail → work_items 동기화

**특이사항:** 웹메일은 IMAP 동기화 또는 Postal webhook으로 메일이 들어오므로, 일반적인 사용자 생성 이벤트와 다름.

**방안 A (권장):** `imap-sync.service.ts` 또는 `postal-webhook.service.ts`에서 메일 저장 후 이벤트 발행
**방안 B:** 별도 배치로 `amb_mail_messages` → `amb_work_items` 동기화

```typescript
// 메일 저장 후
this.eventEmitter.emit(MODULE_DATA_EVENTS.CREATED, {
  module: 'webmail',
  type: 'EMAIL',
  refId: message.msgId,
  title: message.msgSubject,
  content: [message.msgSubject, message.msgBodyText?.substring(0, 2000)].filter(Boolean).join(' '),
  ownerId: accountOwnerId, // 메일 계정 소유자
  entityId: entityId,
  visibility: 'PRIVATE', // 메일은 항상 비공개
});
```

**주의사항:**
- 메일 본문이 매우 길 수 있으므로 `wit_content`에는 앞 2000자만 저장
- IMAP 대량 동기화 시 성능 고려 → 배치 처리 또는 큐 사용

### 3-7. 필요한 Module Import 변경

각 서비스 모듈에 `EventEmitter2` 사용을 위한 import 변경:
- `meeting-notes.module.ts` — 이미 EventEmitterModule이 글로벌이면 변경 불필요
- `billing.module.ts` (partner) — 위와 동일
- 기타 — EventEmitter2 주입 확인

---

## Phase 4: 검색 접근 제어 개선 + 프론트 검색바 확장

### 4-1. SearchService 쿼리 개선

**파일:** `domain/search/service/search.service.ts`

**AS-IS (L61-64):**
```typescript
qb.andWhere(
  '(wi.witOwnerId = :userId OR wi.witVisibility IN (:...visibilities))',
  { userId: params.userId, visibilities: ['SHARED', 'DEPARTMENT', 'ENTITY', 'PUBLIC'] },
);
```

**TO-BE:**
```typescript
// 사용자 그룹 ID 조회
const userGroupIds = await this.groupAccessService.getUserGroupIds(params.userId);

if (userGroupIds.length > 0) {
  qb.andWhere(
    '(wi.witOwnerId = :userId' +
    ' OR wi.witVisibility = :entity' +
    ' OR wi.witVisibility = :public' +
    ' OR wi.witVisibility = :shared' +
    ' OR (wi.witVisibility = :group AND wi.witGroupId IN (:...userGroupIds)))',
    {
      userId: params.userId,
      entity: 'ENTITY',
      public: 'PUBLIC',
      shared: 'SHARED',
      group: 'GROUP',
      userGroupIds,
    },
  );
} else {
  qb.andWhere(
    '(wi.witOwnerId = :userId' +
    ' OR wi.witVisibility IN (:...visibilities))',
    {
      userId: params.userId,
      visibilities: ['SHARED', 'ENTITY', 'PUBLIC'],
    },
  );
}
```

**추가 변경:**
- SearchService에 `GroupAccessService` DI 주입
- `search.module.ts`에 `MembersModule` import 추가

### 4-2. GlobalSearchBar 모듈 맵 확장

**파일:** `apps/web/src/domain/search/components/GlobalSearchBar.tsx`

```typescript
const MODULE_ICONS: Record<string, LucideIcon> = {
  todo: CheckSquare,
  billing: FileText,
  webmail: Mail,
  drive: Folder,
  'meeting-notes': BookOpen,  // ★ 추가/수정
  issue: AlertCircle,          // ★ 추가
  project: Kanban,             // ★ 추가
  partner: Building2,          // ★ 추가
  notice: Bell,                // ★ 추가
  service: Settings,           // ★ 추가
  client: Users,               // ★ 추가
};

const MODULE_LABELS: Record<string, string> = {
  // 기존 유지 + 신규 추가
  issue: t('search:module.issue'),
  project: t('search:module.project'),
  partner: t('search:module.partner'),
  notice: t('search:module.notice'),
  service: t('search:module.service'),
  client: t('search:module.client'),
};

const MODULE_ROUTES: Record<string, string> = {
  // 기존 유지 + 신규 추가
  issue: '/issues',
  project: '/projects',
  partner: '/billing/partners',
  notice: '/notices',
  service: '/services',
  client: '/services/clients',
};
```

### 4-3. 검색 i18n 키 추가

**변경 파일:** `locales/{ko,en,vi}/search.json` (없으면 common.json)

```json
{
  "module": {
    "issue": "이슈 / Issues / Vấn đề",
    "project": "프로젝트 / Projects / Dự án",
    "partner": "거래처 / Partners / Đối tác",
    "notice": "공지사항 / Notices / Thông báo",
    "service": "서비스 / Services / Dịch vụ",
    "client": "고객 / Clients / Khách hàng"
  }
}
```

---

## Phase 5: 번역 에이전트 확대 (백엔드)

### 5-1. TranslationService.getSourceContent() 확대

**파일:** `domain/translation/service/translation.service.ts`

**현재 (L~430):**
```typescript
switch (sourceType) {
  case 'TODO':         → todoRepo
  case 'MEETING_NOTE': → meetingNoteRepo
  case 'NOTICE':       → noticeRepo
  default: return null;
}
```

**추가 case:**

```typescript
case 'ISSUE': {
  const issue = await this.issueRepo.findOne({ where: { issId: sourceId } });
  if (!issue) return null;
  return {
    fields: {
      title: issue.issTitle,
      description: issue.issDescription || '',
      resolution: issue.issResolution || '',
    },
    originalLang: issue.issOriginalLang || 'ko',
    entityId: issue.entId || null,
  };
}

case 'PROJECT': {
  const project = await this.projectRepo.findOne({ where: { pjtId: sourceId } });
  if (!project) return null;
  return {
    fields: {
      title: project.pjtTitle || project.pjtName,
      purpose: project.pjtPurpose || '',
      goal: project.pjtGoal || '',
      summary: project.pjtSummary || '',
    },
    originalLang: project.pjtOriginalLang || 'ko',
    entityId: project.entId || null,
  };
}

case 'PARTNER': {
  const partner = await this.partnerRepo.findOne({ where: { ptnId: sourceId } });
  if (!partner) return null;
  return {
    fields: {
      company_name: partner.ptnCompanyName,
      company_name_local: partner.ptnCompanyNameLocal || '',
      note: partner.ptnNote || '',
    },
    originalLang: partner.ptnOriginalLang || 'ko',
    entityId: partner.entId || null,
  };
}

case 'CONTRACT': {
  const contract = await this.contractRepo.findOne({ where: { ctrId: sourceId } });
  if (!contract) return null;
  return {
    fields: {
      title: contract.ctrTitle,
      description: contract.ctrDescription || '',
      scope_of_work: contract.ctrScopeOfWork || '',
    },
    originalLang: contract.ctrOriginalLang || 'ko',
    entityId: contract.entId || null,
  };
}

case 'SERVICE': {
  const svc = await this.serviceRepo.findOne({ where: { svcId: sourceId } });
  if (!svc) return null;
  return {
    fields: {
      name: svc.svcName,
      description: svc.svcDescription || '',
    },
    originalLang: 'en', // 서비스는 다국어 컬럼이 별도 → 기본 EN
    entityId: svc.entId || null,
  };
}

case 'CLIENT': {
  const client = await this.clientRepo.findOne({ where: { cliId: sourceId } });
  if (!client) return null;
  return {
    fields: {
      company_name: client.cliCompanyName,
      company_name_local: client.cliCompanyNameLocal || '',
      note: client.cliNote || '',
    },
    originalLang: client.cliOriginalLang || 'ko',
    entityId: client.entId || null,
  };
}

case 'WEBMAIL': {
  // 웹메일 번역은 메일 본문 자체를 번역 — 구현 시점에 MailMessage 엔티티 참조
  const mail = await this.mailMessageRepo.findOne({ where: { msgId: sourceId } });
  if (!mail) return null;
  return {
    fields: {
      subject: mail.msgSubject || '',
      body: mail.msgBodyText?.substring(0, 5000) || '',
    },
    originalLang: 'auto', // 메일은 원본 언어 자동 감지
    entityId: null,
  };
}
```

### 5-2. TranslationService DI 추가

**Constructor에 추가할 Repository:**

```typescript
@InjectRepository(IssueEntity)     private readonly issueRepo: Repository<IssueEntity>,
@InjectRepository(ProjectEntity)   private readonly projectRepo: Repository<ProjectEntity>,
@InjectRepository(PartnerEntity)   private readonly partnerRepo: Repository<PartnerEntity>,
@InjectRepository(ContractEntity)  private readonly contractRepo: Repository<ContractEntity>,
@InjectRepository(SvcServiceEntity) private readonly serviceRepo: Repository<SvcServiceEntity>,
@InjectRepository(SvcClientEntity)  private readonly clientRepo: Repository<SvcClientEntity>,
@InjectRepository(MailMessageEntity) private readonly mailMessageRepo: Repository<MailMessageEntity>,
```

**주의: 순환 의존성**
- TranslationModule이 IssueEntity, ProjectEntity 등을 직접 import하면 모듈 간 순환 의존 가능성
- **대응:** `TypeOrmModule.forFeature([...entities])`로 엔티티만 import (서비스×모듈 간 순환 없음)

### 5-3. TranslationModule 엔티티 등록

**파일:** `domain/translation/translation.module.ts`

```typescript
TypeOrmModule.forFeature([
  ContentTranslationEntity,
  TranslationHistoryEntity,
  TranslationGlossaryEntity,
  TranslationUsageEntity,
  // 기존
  TodoEntity,
  MeetingNoteEntity,
  NoticeEntity,
  // ★ 추가
  IssueEntity,
  ProjectEntity,
  PartnerEntity,
  ContractEntity,
  SvcServiceEntity,
  SvcClientEntity,
  MailMessageEntity,
]),
```

### 5-4. TranslationPanel Props 타입 확장

**파일:** `apps/web/src/domain/translations/components/TranslationPanel.tsx`

```typescript
// AS-IS
interface TranslationPanelProps {
  sourceType: 'TODO' | 'MEETING_NOTE' | 'NOTICE';
  // ...
}

// TO-BE
interface TranslationPanelProps {
  sourceType: 'TODO' | 'MEETING_NOTE' | 'NOTICE' | 'ISSUE' | 'PROJECT' | 'PARTNER' | 'CONTRACT' | 'SERVICE' | 'CLIENT' | 'WEBMAIL';
  // ...
}
```

**SaveTranslationDialog도 동일하게 확장.**

---

## Phase 6: 번역 에이전트 확대 (프론트엔드)

### 6-1. Issue 상세에 TranslationPanel 추가

**파일:** `domain/issues/components/IssueDetailModal.tsx`

```tsx
<TranslationPanel
  sourceType="ISSUE"
  sourceId={issue.issId}
  sourceFields={['title', 'description', 'resolution']}
  originalLang={issue.issOriginalLang || 'ko'}
  originalContent={{
    title: issue.issTitle,
    description: issue.issDescription || '',
    resolution: issue.issResolution || '',
  }}
/>
```

### 6-2. Project 상세에 TranslationPanel 추가

**파일:** 프로젝트 상세 페이지 (Project detail page/modal)

```tsx
<TranslationPanel
  sourceType="PROJECT"
  sourceId={project.pjtId}
  sourceFields={['title', 'purpose', 'goal', 'summary']}
  originalLang={project.pjtOriginalLang || 'ko'}
  originalContent={{
    title: project.pjtTitle || project.pjtName,
    purpose: project.pjtPurpose || '',
    goal: project.pjtGoal || '',
    summary: project.pjtSummary || '',
  }}
/>
```

### 6-3. Partner 상세에 TranslationPanel 추가

거래처 상세 페이지/모달에 추가.

### 6-4. Contract 상세에 TranslationPanel 추가

계약 상세 페이지에 추가.

### 6-5. Service Catalog 상세에 TranslationPanel 추가

서비스 상세 페이지에 추가. (다만 이미 다국어 컬럼 svc_name_ko, svc_name_vi가 별도로 있으므로, AI 번역과의 병행 방법 결정 필요)

### 6-6. Client 상세에 TranslationPanel 추가

고객 상세 페이지에 추가.

### 6-7. Webmail 상세에 TranslationPanel 추가

메일 상세(본문 확인) UI에 추가. 메일은 본문이 길 수 있으므로, 번역 버튼을 별도로 제공하는 것이 UX상 적절.

### 6-8. SaveTranslationDialog 추가 (각 생성/수정 폼)

현재 Todo(CreateForm), MeetingNote(FormModal)에만 있음. 추가 대상:

| 모듈 | 폼 컴포넌트 | 추가 위치 |
|------|-----------|-----------|
| Issue | IssueFormModal | 저장 후 다이얼로그 |
| Notice | (공지 작성 폼) | 기존에 자동번역 로직이 있으므로 통합 검토 |
| Project | (프로젝트 생성/수정 폼) | 저장 후 다이얼로그 |
| Partner | (거래처 생성/수정 폼) | 저장 후 다이얼로그 |
| Service | (서비스 생성/수정 폼) | 다국어 컬럼 방식과 병행 검토 |
| Client | (고객 생성/수정 폼) | 저장 후 다이얼로그 |

---

## Phase 7: 기존 데이터 마이그레이션 + 테스트

### 7-1. work_items 일괄 등록 SQL

```sql
-- Meeting Notes → work_items
INSERT INTO amb_work_items (wit_id, ent_id, wit_type, wit_title, wit_owner_id, wit_visibility, wit_module, wit_ref_id, wit_content, wit_group_id, wit_created_at, wit_updated_at)
SELECT 
  gen_random_uuid(),
  (SELECT eur.ent_id FROM amb_entity_user_roles eur WHERE eur.usr_id = mn.usr_id LIMIT 1),
  'NOTE',
  mn.mtn_title,
  mn.usr_id,
  CASE 
    WHEN mn.mtn_visibility = 'DEPARTMENT' THEN 'GROUP'
    ELSE COALESCE(mn.mtn_visibility, 'PRIVATE')
  END,
  'meeting-notes',
  mn.mtn_id,
  COALESCE(mn.mtn_title, '') || ' ' || COALESCE(mn.mtn_content, ''),
  mn.mtn_group_id,
  mn.mtn_created_at,
  mn.mtn_updated_at
FROM amb_meeting_notes mn
WHERE mn.mtn_deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM amb_work_items wi WHERE wi.wit_module = 'meeting-notes' AND wi.wit_ref_id = mn.mtn_id);

-- Partners → work_items
INSERT INTO amb_work_items (wit_id, ent_id, wit_type, wit_title, wit_owner_id, wit_visibility, wit_module, wit_ref_id, wit_content, wit_created_at, wit_updated_at)
SELECT
  gen_random_uuid(),
  p.ent_id,
  'DOC',
  p.ptn_company_name,
  p.ptn_created_by,
  'ENTITY',
  'partner',
  p.ptn_id,
  COALESCE(p.ptn_company_name, '') || ' ' || COALESCE(p.ptn_company_name_local, '') || ' ' || COALESCE(p.ptn_biz_type, '') || ' ' || COALESCE(p.ptn_note, ''),
  p.ptn_created_at,
  p.ptn_updated_at
FROM amb_bil_partners p
WHERE p.ptn_deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM amb_work_items wi WHERE wi.wit_module = 'partner' AND wi.wit_ref_id = p.ptn_id);

-- Notices → work_items
INSERT INTO amb_work_items (wit_id, ent_id, wit_type, wit_title, wit_owner_id, wit_visibility, wit_module, wit_ref_id, wit_content, wit_group_id, wit_created_at, wit_updated_at)
SELECT
  gen_random_uuid(),
  n.ent_id,
  'DOC',
  n.ntc_title,
  n.ntc_author_id,
  CASE 
    WHEN n.ntc_visibility = 'DEPARTMENT' THEN 'GROUP'
    ELSE COALESCE(n.ntc_visibility, 'PUBLIC')
  END,
  'notice',
  n.ntc_id,
  COALESCE(n.ntc_title, '') || ' ' || COALESCE(n.ntc_content, ''),
  n.ntc_group_id,
  n.ntc_created_at,
  n.ntc_updated_at
FROM amb_notices n
WHERE n.ntc_deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM amb_work_items wi WHERE wi.wit_module = 'notice' AND wi.wit_ref_id = n.ntc_id);

-- Services → work_items
INSERT INTO amb_work_items (wit_id, ent_id, wit_type, wit_title, wit_owner_id, wit_visibility, wit_module, wit_ref_id, wit_content, wit_created_at, wit_updated_at)
SELECT
  gen_random_uuid(),
  s.ent_id,
  'DOC',
  s.svc_name,
  s.svc_created_by,
  'ENTITY',
  'service',
  s.svc_id,
  COALESCE(s.svc_name, '') || ' ' || COALESCE(s.svc_name_ko, '') || ' ' || COALESCE(s.svc_name_vi, '') || ' ' || COALESCE(s.svc_description, ''),
  s.svc_created_at,
  s.svc_updated_at
FROM amb_svc_services s
WHERE s.svc_deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM amb_work_items wi WHERE wi.wit_module = 'service' AND wi.wit_ref_id = s.svc_id);
```

### 7-2. DEPARTMENT → GROUP 데이터 마이그레이션

```sql
-- Meeting Notes: mtn_department 값을 amb_groups에서 매칭하여 mtn_group_id 설정
UPDATE amb_meeting_notes mn
SET mtn_group_id = g.grp_id,
    mtn_visibility = 'GROUP'
FROM amb_groups g
WHERE mn.mtn_visibility = 'DEPARTMENT'
  AND mn.mtn_department IS NOT NULL
  AND LOWER(g.grp_name) = LOWER(mn.mtn_department);

-- Notice: 동일 패턴
UPDATE amb_notices n
SET ntc_group_id = g.grp_id,
    ntc_visibility = 'GROUP'
FROM amb_groups g  
WHERE n.ntc_visibility = 'DEPARTMENT'
  AND n.ntc_department IS NOT NULL
  AND LOWER(g.grp_name) = LOWER(n.ntc_department);
```

**주의:** 부서명(mtn_department)과 그룹명(grp_name)이 일치하지 않는 경우 수동 매핑 필요.

### 7-3. 기존 work_items visibility 갱신

```sql
-- Issue: PRIVATE → ENTITY (기본값 변경)
UPDATE amb_work_items
SET wit_visibility = 'ENTITY'
WHERE wit_module = 'issue' AND wit_visibility = 'PRIVATE';

-- Contract (billing): 이미 ENTITY인 경우가 대부분이므로 확인만
-- Todo: PRIVATE 유지 (사용자가 변경하기 전까지)
```

### 7-4. 테스트 시나리오

| # | 카테고리 | 테스트 | 기대 결과 |
|---|---------|--------|-----------|
| 1 | 검색 동기화 | 회의록 작성 후 통합 검색 | work_items에 등록, 검색 결과 노출 |
| 2 | 검색 동기화 | 거래처 등록 후 회사명 검색 | 같은 법인 사용자 검색 가능 |
| 3 | 검색 동기화 | 공지사항 작성 후 검색 | visibility에 따른 노출 |
| 4 | 검색 동기화 | 서비스 카탈로그 등록 후 검색 | 같은 법인 사용자 검색 가능 |
| 5 | Visibility | Todo(비공개) → 타 사용자 검색 | ❌ 검색 불가 |
| 6 | Visibility | Todo(그룹공개) → 같은 그룹 검색 | ✅ 검색 가능 |
| 7 | Visibility | Todo(그룹공개) → 다른 그룹 검색 | ❌ 검색 불가 |
| 8 | Visibility | Issue(법인공개) → 같은 법인 검색 | ✅ 검색 가능 |
| 9 | Visibility | 회의록(전체공개) → 모든 사용자 | ✅ 검색 가능 |
| 10 | Visibility | 회의록 그룹 선택 → 저장 → 접근 | 선택한 그룹 멤버만 접근 가능 |
| 11 | 번역 | Issue 상세 → 번역 실행 | SSE 스트리밍 번역, 저장 |
| 12 | 번역 | Project 상세 → 번역 실행 | SSE 스트리밍 번역, 저장 |
| 13 | 번역 | 번역된 회의록 → 타 사용자 조회 | 번역 결과 표시 |
| 14 | 번역 | 원본 수정 후 번역 STALE 확인 | isStale = true 표시 |
| 15 | 검색 FE | 검색 결과에서 Issue 클릭 | /issues로 이동 |
| 16 | 검색 FE | 검색 결과에서 Partner 클릭 | /billing/partners로 이동 |
| 17 | 마이그레이션 | 기존 11건 회의록 work_items 확인 | work_items에 등록됨 |
| 18 | 마이그레이션 | 기존 37건 거래처 work_items 확인 | work_items에 등록됨 |

---

## 3. 변경 파일 목록 (전체)

### Phase 1: 스키마 + 인프라

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 1 | `sql/migration_search_visibility_translation.sql` | **신규** | 전체 DB 마이그레이션 SQL |
| 2 | `domain/acl/entity/work-item.entity.ts` | 수정 | witGroupId 추가 |
| 3 | `domain/kms/event/module-data.event.ts` | 수정 | visibility, groupId 추가 |
| 4 | `domain/kms/listener/work-item-sync.listener.ts` | 수정 | visibility/groupId 동기화 |
| 5 | `domain/todo/entity/todo.entity.ts` | 수정 | tdoVisibility, tdoGroupId 추가 |
| 6 | `domain/issues/entity/issue.entity.ts` | 수정 | issVisibility, issGroupId, issOriginalLang 추가 |
| 7 | `domain/meeting-notes/entity/meeting-note.entity.ts` | 수정 | mtnGroupId 추가 |
| 8 | `domain/notices/entity/notice.entity.ts` | 수정 | ntcGroupId 추가 |
| 9 | `domain/project/entity/project.entity.ts` | 수정 | pjtOriginalLang 추가 |
| 10 | `domain/billing/entity/partner.entity.ts` | 수정 | ptnOriginalLang 추가 |
| 11 | `domain/billing/entity/contract.entity.ts` | 수정 | ctrOriginalLang 추가 |
| 12 | `domain/service-management/entity/client.entity.ts` | 수정 | cliOriginalLang 추가 |

### Phase 2: Visibility 체계 적용

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 13 | `domain/members/service/group-access.service.ts` | **신규** | 그룹 접근 제어 공통 서비스 |
| 14 | `domain/members/members.module.ts` | 수정 | GroupAccessService export |
| 15 | `domain/todo/service/todo.service.ts` | 수정 | 이벤트에 visibility 전달 |
| 16 | `domain/todo/dto/request/create-todo.request.ts` | 수정 | visibility, group_id 추가 |
| 17 | `domain/todo/dto/request/update-todo.request.ts` | 수정 | visibility, group_id 추가 |
| 18 | `domain/issues/service/issue.service.ts` | 수정 | 이벤트에 visibility 전달 |
| 19 | `domain/issues/dto/request/create-issue.request.ts` | 수정 | visibility, group_id 추가 |
| 20 | `domain/issues/dto/request/update-issue.request.ts` | 수정 | visibility, group_id 추가 |
| 21 | `domain/meeting-notes/service/meeting-note.service.ts` | 수정 | GROUP 접근 제어, 이벤트 발행 (Phase 3 겸) |
| 22 | `domain/meeting-notes/meeting-notes.module.ts` | 수정 | UserGroupEntity, MembersModule import |
| 23 | `domain/meeting-notes/dto/request/create-meeting-note.request.ts` | 수정 | group_id 추가, visibility 변경 |
| 24 | `domain/meeting-notes/dto/request/update-meeting-note.request.ts` | 수정 | 동일 |
| 25 | `domain/notices/service/notice.service.ts` | 수정 | GROUP 접근 제어 (Phase 3 겸) |
| 26 | `domain/notices/notices.module.ts` | 수정 | MembersModule import |

### Phase 3: 신규 모듈 검색 동기화

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 27 | `domain/billing/service/partner.service.ts` | 수정 | 이벤트 발행 추가 |
| 28 | `domain/service-management/service/service-catalog.service.ts` | 수정 | 이벤트 발행 추가 |
| 29 | `domain/service-management/service/client.service.ts` | 수정 | 이벤트 발행 추가 |
| 30 | `domain/webmail/service/imap-sync.service.ts` 또는 `postal-webhook.service.ts` | 수정 | work_items 동기화 |

### Phase 4: 검색 접근 제어 + 프론트 검색바

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 31 | `domain/search/service/search.service.ts` | 수정 | GROUP 기반 접근 제어 쿼리 |
| 32 | `domain/search/search.module.ts` | 수정 | MembersModule import |
| 33 | `apps/web/src/domain/search/components/GlobalSearchBar.tsx` | 수정 | 모듈 맵 확장 (11개) |

### Phase 5: 번역 백엔드

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 34 | `domain/translation/service/translation.service.ts` | 수정 | getSourceContent 7타입 추가, DI 추가 |
| 35 | `domain/translation/translation.module.ts` | 수정 | 7개 엔티티 forFeature 추가 |

### Phase 6: 번역 프론트엔드

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 36 | `domain/translations/components/TranslationPanel.tsx` | 수정 | sourceType 타입 확장 |
| 37 | `domain/translations/components/SaveTranslationDialog.tsx` | 수정 | sourceType 타입 확장 |
| 38 | `domain/issues/components/IssueDetailModal.tsx` | 수정 | TranslationPanel 추가 |
| 39 | 프로젝트 상세 페이지 | 수정 | TranslationPanel 추가 |
| 40 | 거래처 상세 페이지/모달 | 수정 | TranslationPanel 추가 |
| 41 | 계약 상세 페이지 | 수정 | TranslationPanel 추가 |
| 42 | 서비스 카탈로그 상세 | 수정 | TranslationPanel 추가 |
| 43 | 고객 상세 | 수정 | TranslationPanel 추가 |
| 44 | 웹메일 상세 | 수정 | TranslationPanel 추가 |
| 45 | Issue 생성 폼 | 수정 | SaveTranslationDialog 추가 |
| 46 | Project 생성 폼 | 수정 | SaveTranslationDialog 추가 |
| 47 | Partner 생성 폼 | 수정 | SaveTranslationDialog 추가 |

### Phase 6 (계속): 프론트 UI

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 48 | Todo 생성/수정 폼 | 수정 | visibility 드롭다운 + 그룹 선택 |
| 49 | `domain/issues/components/IssueFormModal.tsx` | 수정 | visibility 드롭다운 추가 |
| 50 | `domain/meeting-notes/components/MeetingNoteFormModal.tsx` | 수정 | DEPT→GROUP, 그룹 드롭다운 |
| 51 | `domain/meeting-notes/pages/MeetingNotesPage.tsx` | 수정 | 필터 버튼 변경 |
| 52 | `domain/meeting-notes/pages/MeetingNoteDetailPage.tsx` | 수정 | visibility 배지 변경 |
| 53 | Notice 관련 컴포넌트 | 수정 | DEPT→GROUP 변경 |

### Phase 7: i18n + 마이그레이션

| # | 파일 | 변경 유형 | 설명 |
|---|------|---------|------|
| 54 | `locales/ko/common.json` | 수정 | visibility 키, 모듈명 |
| 55 | `locales/en/common.json` | 수정 | 동일 |
| 56 | `locales/vi/common.json` | 수정 | 동일 |
| 57 | `locales/ko/search.json` (또는 common) | 수정 | 검색 모듈명 |
| 58 | `locales/en/search.json` | 수정 | 동일 |
| 59 | `locales/vi/search.json` | 수정 | 동일 |

**총 변경 파일: 약 59개** (신규 2개 + 수정 57개)

---

## 4. 사이드 임팩트 분석

| 영향 영역 | 임팩트 | 위험도 | 대응 |
|-----------|--------|:------:|------|
| Meeting Notes 목록/접근 | DEPARTMENT→GROUP, 기존 DEPARTMENT 데이터 접근 불가 가능 | **높음** | Phase 7 데이터 마이그레이션을 반드시 선행 |
| Notice 목록/접근 | 동일 | **높음** | 동일 |
| Todo `group`/`company` 탭 | Visibility 기반으로 동작 방식 변경 가능 | 중간 | 기존 탭 로직과 visibility 연동 점검 |
| TranslationModule DI 크기 증가 | 15+ Repository 주입 → 모듈 초기화 시간 | 낮음 | 모듈 분리 고려 |
| WorkItem 수 급증 | 37(Partner) + 11(MN) + 2(Notice) + 3(Service) + 메일... | 중간 | work_items 인덱스 확인, 검색 성능 테스트 |
| KMS Auto-tagging 부하 | 신규 work_items 생성 시 AI 태깅 트리거 | 중간 | 마이그레이션 시 태깅은 별도 배치로 |
| GlobalSearchBar 모듈 수 | 5 → 11개 모듈 | 낮음 | 모듈 필터 드롭다운 UX 검토 |
| Service Catalog 다국어 컬럼 | 기존 svc_name_ko/vi 와 번역 에이전트 병행 | 낮음 | 기존 다국어 컬럼은 유지, 번역은 별도 |

---

## 5. 배포 전략

### 배포 순서

| 단계 | 내용 | 환경 |
|------|------|------|
| 1 | SQL 마이그레이션 실행 (Phase 1 스키마) | 스테이징 DB |
| 2 | Phase 1~4 코드 배포 → API 재시작 | 스테이징 |
| 3 | Phase 7-1 work_items 마이그레이션 SQL 실행 | 스테이징 DB |
| 4 | Phase 7-2 DEPARTMENT→GROUP 매핑 SQL 실행 | 스테이징 DB |
| 5 | 기능 테스트 (검색·visibility·번역) | 스테이징 |
| 6 | Phase 5~6 코드 배포 (번역 에이전트 확대) | 스테이징 |
| 7 | 프로덕션 DB 마이그레이션 | 프로덕션 DB |
| 8 | 프로덕션 전체 코드 배포 | 프로덕션 |

### 롤백 계획

1. SQL 마이그레이션은 모두 **ADD COLUMN** (nullable) → 기존 기능에 영향 없음
2. 코드 롤백 시 신규 컬럼은 무시됨 (TypeORM `synchronize: false`)
3. `DEPARTMENT` → `GROUP` 데이터 전환은 **원본 mtn_department 보존** → 롤백 가능

---

## 6. 참고 문서

- 요구사항 분석서: `docs/analysis/REQ-Search-Visibility-Enhancement-20260223.md`
- 현재 코드 기준: commit `072817a` (main)
