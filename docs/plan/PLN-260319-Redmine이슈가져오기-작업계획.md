# 작업 계획서: Redmine 이슈 → AMA 가져오기

> **문서 ID**: PLAN-Redmine이슈가져오기-작업계획-20260319  
> **분석서**: [REQ-Redmine이슈가져오기-20260319](../analysis/REQ-Redmine이슈가져오기-20260319.md)  
> **작성일**: 2026-03-19  
> **상태**: 작성 완료

---

## 1. 시스템 개발 현황 분석

### 1.1 기존 마이그레이션 모듈 (재활용 가능)

| 파일 | 역할 | 재활용 |
|------|------|--------|
| `migration.module.ts` | 모듈 등록 (TypeORM 7개 엔티티 주입) | ✅ 확장 |
| `migration.controller.ts` | API 컨트롤러 (SUPER_ADMIN) | ✅ 엔드포인트 추가 |
| `redmine-migration.service.ts` | 변환+저장 로직 (~600줄) | ✅ 핵심 재활용 |
| `migration-user-map.entity.ts` | 사용자 매핑 테이블 | ✅ 그대로 사용 |
| `migration-log.entity.ts` | 배치 로그 테이블 | ✅ 그대로 사용 |

### 1.2 기존 데이터 인프라 (변경 불필요)

| 항목 | 상태 |
|------|------|
| `amb_issues.iss_redmine_id` (INT, nullable) | ✅ 존재 |
| `kms_projects.pjt_redmine_id` (INT, nullable) | ✅ 존재 |
| `amb_migration_user_map` 테이블 | ✅ 존재 |
| `amb_migration_logs` 테이블 | ✅ 존재 |
| Tracker/Status/Priority 매핑 상수 | ✅ 구현됨 |
| 이메일 기반 사용자 매칭 로직 | ✅ 구현됨 |

### 1.3 프론트엔드 현황

| 항목 | 상태 |
|------|------|
| 관리자 라우팅 (`/admin/*`) | ✅ AdminGuard + MenuGuard 패턴 |
| 관리자 사이드바 메뉴 | ✅ `ADMIN_SETTINGS_ITEMS` 배열 |
| Redmine 커스텀앱 (`/apps/app-redmine`) | ✅ iframe 임베드 |
| 마이그레이션 관리 UI | ❌ 없음 (신규 개발) |

### 1.4 핵심 갭 (구현 필요 항목)

| # | 갭 | 설명 |
|---|-----|------|
| G1 | Redmine API 호출 서비스 없음 | 현재 JSON body 수동 전달 방식, REST API 자동 호출 미구현 |
| G2 | 선택적 이슈 가져오기 불가 | 전체 일괄 임포트만 가능, 개별 이슈 선택 불가 |
| G3 | 관리자 UI 없음 | API만 존재, 프론트엔드 화면 전무 |
| G4 | Redmine 연결 설정 없음 | `REDMINE_URL`, `REDMINE_API_KEY` 환경변수 미등록 |
| G5 | Textile → HTML 미변환 | Redmine의 description 마크업 미처리 |

---

## 2. 구현 계획

### 2.1 단계 구성

| 단계 | 이름 | 범위 | 우선순위 |
|------|------|------|----------|
| **Step 1** | 환경변수 + 설정 | Redmine 연결 정보 설정 | 필수 |
| **Step 2** | Redmine API 서비스 | REST API 통신 레이어 | 필수 |
| **Step 3** | Controller 확장 | 프로젝트/이슈 조회 + 선택적 가져오기 엔드포인트 | 필수 |
| **Step 4** | 선택적 가져오기 서비스 | API 데이터 → 기존 매핑 → DB 저장 | 필수 |
| **Step 5** | 프론트엔드 UI | 관리자 화면 (이슈 목록 + 선택 + 가져오기) | 필수 |
| **Step 6** | i18n + 메뉴 등록 | 번역 키 + 관리자 메뉴 항목 추가 | 필수 |
| **Step 7** | 테스트 + 검증 | 스테이징 배포 + 실제 Redmine 연동 테스트 | 필수 |

---

### Step 1: 환경변수 + 설정

**변경 파일:**
| 파일 | 변경 내용 |
|------|-----------|
| `env/backend/.env.development` | `REDMINE_URL`, `REDMINE_API_KEY` 추가 |
| `docker/staging/.env.staging` | 동일 (스테이징 서버에서 직접) |

**환경변수:**
```env
# Redmine Integration
REDMINE_URL=https://redmine.amoeba.site
REDMINE_API_KEY=<redmine-admin-api-key>
```

**Redmine 설정 확인 필요:**
- Redmine 관리자 → 설정 → API → "Enable REST web service" 활성화
- 관리자 계정 → My Account → API access key 발급

---

### Step 2: Redmine API 서비스

**신규 파일:**
```
apps/api/src/domain/migration/service/redmine-api.service.ts
```

**서비스 설계:**
```typescript
@Injectable()
export class RedmineApiService {
  private readonly baseUrl: string;   // ConfigService에서 REDMINE_URL
  private readonly apiKey: string;    // ConfigService에서 REDMINE_API_KEY

  // 연결 상태 확인
  checkConnection(): Promise<{ connected: boolean; version?: string }>

  // 프로젝트 목록 조회 (페이징)
  fetchProjects(offset?: number, limit?: number): Promise<{
    projects: RedmineApiProject[];
    totalCount: number;
  }>

  // 이슈 목록 조회 (필터 + 페이징)
  fetchIssues(params: {
    projectId?: number;
    statusId?: string;    // 'open' | 'closed' | '*'
    trackerId?: number;
    assignedToId?: number;
    offset?: number;
    limit?: number;
    sort?: string;
  }): Promise<{
    issues: RedmineApiIssue[];
    totalCount: number;
  }>

  // 이슈 상세 (journals 포함)
  fetchIssueDetail(issueId: number): Promise<RedmineApiIssueDetail>

  // 사용자 목록 (매칭용)
  fetchUsers(offset?: number, limit?: number): Promise<{
    users: RedmineApiUser[];
    totalCount: number;
  }>
}
```

**Redmine API 응답 인터페이스:**
```typescript
interface RedmineApiProject {
  id: number;
  name: string;
  identifier: string;
  description: string;
  status: number;
  parent?: { id: number; name: string };
  created_on: string;
  updated_on: string;
}

interface RedmineApiIssue {
  id: number;
  project: { id: number; name: string };
  tracker: { id: number; name: string };
  status: { id: number; name: string };
  priority: { id: number; name: string };
  author: { id: number; name: string };
  assigned_to?: { id: number; name: string };
  subject: string;
  description: string;
  start_date: string | null;
  due_date: string | null;
  done_ratio: number;
  estimated_hours: number | null;
  created_on: string;
  updated_on: string;
}

interface RedmineApiIssueDetail extends RedmineApiIssue {
  journals: RedmineApiJournal[];
}

interface RedmineApiJournal {
  id: number;
  user: { id: number; name: string };
  notes: string;
  created_on: string;
  details: Array<{
    property: string;
    name: string;
    old_value: string | null;
    new_value: string | null;
  }>;
}

interface RedmineApiUser {
  id: number;
  login: string;
  firstname: string;
  lastname: string;
  mail: string;
  created_on: string;
}
```

**구현 핵심:**
- `fetch` (Node.js 18+ 내장) 또는 `axios`로 HTTP 호출
- Header: `X-Redmine-API-Key: <api-key>`
- 페이징 처리: `offset`, `limit` (최대 100)
- 에러 처리: 네트워크 타임아웃, 인증 실패, 404 등
- SSRF 방지: `REDMINE_URL` 환경변수 고정값만 허용 (사용자 입력 URL 금지)

---

### Step 3: Controller 확장

**변경 파일:**
```
apps/api/src/domain/migration/controller/migration.controller.ts
```

**신규 엔드포인트:**

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| `GET` | `/migration/redmine/connection` | Redmine 연결 상태 확인 | SUPER_ADMIN |
| `GET` | `/migration/redmine/projects` | Redmine 프로젝트 목록 | SUPER_ADMIN |
| `GET` | `/migration/redmine/issues` | Redmine 이슈 목록 (query: project_id, status_id, offset, limit) | SUPER_ADMIN |
| `GET` | `/migration/redmine/issues/:id` | Redmine 이슈 상세 (journals 포함) | SUPER_ADMIN |
| `POST` | `/migration/redmine/import-selected` | 선택 이슈 가져오기 (body: issue_ids[], entity_id) | SUPER_ADMIN |

**기존 엔드포인트 (변경 없음):**
- `POST /migration/redmine/preview` — 유지
- `POST /migration/redmine/import` — 유지
- `GET /migration/logs` — 유지
- `POST /migration/redmine/rollback` — 유지

---

### Step 4: 선택적 가져오기 서비스

**변경 파일:**
```
apps/api/src/domain/migration/service/redmine-migration.service.ts
```

**신규 메서드:**
```typescript
/**
 * 선택된 Redmine 이슈를 AMA로 가져오기
 * - RedmineApiService로 이슈 상세 + journals 조회
 * - 기존 매핑 로직(TRACKER_MAP, STATUS_MAP 등) 재활용
 * - 중복 방지: iss_redmine_id 확인
 */
async importSelectedIssues(
  issueIds: number[],
  entityId: string
): Promise<MigrationResult>
```

**처리 흐름:**
```
1. 중복 확인 → iss_redmine_id로 이미 가져온 이슈 스킵
2. Redmine API 호출 → 이슈 상세 + journals 일괄 조회
3. 사용자 매칭 → 이메일 기반 (기존 mapUsers 로직 재활용)
4. 프로젝트 확인 → pjt_redmine_id로 매칭, 없으면 자동 생성
5. 이슈 변환 → TRACKER_MAP, STATUS_MAP, PRIORITY_MAP 적용
6. DB 저장 → IssueEntity INSERT + MigrationLogEntity 기록
7. 코멘트/상태로그 → journals 변환 + 저장
8. 결과 반환 → 성공/실패/스킵 건수
```

---

### Step 5: 프론트엔드 UI

**신규 파일:**
```
apps/web/src/domain/admin/pages/RedmineMigrationPage.tsx
```

**변경 파일:**
| 파일 | 변경 |
|------|------|
| `apps/web/src/router/index.tsx` | `/admin/redmine-migration` 라우트 추가 |
| `apps/web/src/layouts/AdminLayout.tsx` | `ADMIN_SETTINGS_ITEMS`에 메뉴 항목 추가 |

**UI 구성:**

```
┌─────────────────────────────────────────────────────────────┐
│ 🔄 Redmine 이슈 가져오기                      [연결 상태: 🟢] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  프로젝트: [전체 프로젝트 ▼]   상태: [전체 ▼]   [조회]       │
│                                                             │
│ ┌───┬──────┬──────────┬─────────────────────┬──────────────┐│
│ │ ☐ │ #ID  │ Type     │ Subject             │ Status       ││
│ ├───┼──────┼──────────┼─────────────────────┼──────────────┤│
│ │ ☐ │ #123 │ 🐛 Bug   │ Login 오류           │ In Progress  ││
│ │ ☑ │ #456 │ ✨ Feature│ 대시보드 추가         │ New          ││
│ │ 🟢│ #789 │ 📋 Task  │ DB 스크립트          │ Closed       ││
│ │   │      │          │ (이미 가져옴)         │              ││
│ └───┴──────┴──────────┴─────────────────────┴──────────────┘│
│                                                             │
│  Redmine 전체: 150건 │ 선택: 1건 │ 이미 가져옴: 1건          │
│                                                             │
│  [선택 이슈 가져오기]                    [< 1 2 3 ... 6 >]   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ 📋 가져오기 결과                                             │
│  • 성공: 1건 (#456 → ISS-xxx)                               │
│  • 스킵: 0건                                                │
│  • 실패: 0건                                                │
│  배치 ID: xxxxxxxx-xxxx                                     │
└─────────────────────────────────────────────────────────────┘
```

**화면 기능 상세:**

| 기능 | 설명 |
|------|------|
| **연결 상태 확인** | 페이지 진입 시 `GET /migration/redmine/connection` 호출, 🟢/🔴 표시 |
| **프로젝트 필터** | Redmine 프로젝트 목록 드롭다운 |
| **상태 필터** | 전체/Open/Closed 선택 |
| **이슈 테이블** | 체크박스 + ID + Type + Subject + Assignee + Status + Updated |
| **이미 가져옴 표시** | `iss_redmine_id` 존재하는 이슈는 🟢 배지 + 체크박스 비활성화 |
| **페이징** | offset/limit 기반, 25건씩 |
| **선택 가져오기** | 체크한 이슈 IDs → `POST /migration/redmine/import-selected` |
| **결과 표시** | 성공/스킵/실패 건수 + 배치 ID |

---

### Step 6: i18n + 메뉴 등록

**변경 파일:**
| 파일 | 변경 |
|------|------|
| `apps/web/public/locales/ko/admin.json` | Redmine 마이그레이션 번역 키 추가 |
| `apps/web/public/locales/en/admin.json` | 영문 번역 추가 |
| `apps/web/public/locales/vi/admin.json` | 베트남어 번역 추가 |

**번역 키 구조:**
```json
{
  "redmineMigration": {
    "title": "Redmine 이슈 가져오기",
    "connectionStatus": "연결 상태",
    "connected": "연결됨",
    "disconnected": "연결 안됨",
    "project": "프로젝트",
    "allProjects": "전체 프로젝트",
    "status": "상태",
    "allStatuses": "전체",
    "query": "조회",
    "issueId": "#ID",
    "type": "유형",
    "subject": "제목",
    "assignee": "담당자",
    "updated": "수정일",
    "alreadyImported": "이미 가져옴",
    "selected": "선택",
    "total": "전체",
    "importSelected": "선택 이슈 가져오기",
    "importResult": "가져오기 결과",
    "success": "성공",
    "skipped": "스킵",
    "failed": "실패",
    "batchId": "배치 ID",
    "confirmImport": "선택한 {{count}}건의 이슈를 가져오시겠습니까?",
    "noApiKey": "Redmine API 키가 설정되지 않았습니다"
  }
}
```

---

### Step 7: 테스트 + 검증

| # | 테스트 항목 | 방법 |
|---|------------|------|
| T1 | Redmine 연결 확인 | `GET /migration/redmine/connection` → 200 |
| T2 | 프로젝트 목록 조회 | `GET /migration/redmine/projects` → 프로젝트 목록 반환 |
| T3 | 이슈 목록 조회 | `GET /migration/redmine/issues?project_id=1&limit=25` |
| T4 | 이슈 1건 가져오기 | `POST /import-selected` body: `{issue_ids: [1], entity_id: "..."}` |
| T5 | 중복 가져오기 방지 | 같은 이슈 재가져오기 → 스킵 처리 |
| T6 | 프론트 UI 흐름 | 프로젝트 선택 → 이슈 체크 → 가져오기 → 결과 확인 |
| T7 | 권한 검증 | 일반 사용자 접근 → 403 |

---

## 3. 파일 변경 목록

### 신규 파일 (2개)

| 파일 | 내용 |
|------|------|
| `apps/api/src/domain/migration/service/redmine-api.service.ts` | Redmine REST API 통신 서비스 |
| `apps/web/src/domain/admin/pages/RedmineMigrationPage.tsx` | 관리자 UI 페이지 |

### 변경 파일 (8개)

| 파일 | 변경 내용 |
|------|-----------|
| `apps/api/src/domain/migration/migration.module.ts` | `RedmineApiService` 프로바이더 추가 |
| `apps/api/src/domain/migration/controller/migration.controller.ts` | 5개 엔드포인트 추가 |
| `apps/api/src/domain/migration/service/redmine-migration.service.ts` | `importSelectedIssues()` 메서드 추가 |
| `apps/web/src/router/index.tsx` | `/admin/redmine-migration` 라우트 추가 |
| `apps/web/src/layouts/AdminLayout.tsx` | 사이드바 메뉴 항목 추가 |
| `apps/web/public/locales/ko/admin.json` | 한국어 번역 |
| `apps/web/public/locales/en/admin.json` | 영문 번역 |
| `apps/web/public/locales/vi/admin.json` | 베트남어 번역 |

### 환경변수 파일 (서버에서 직접 수정)

| 파일 | 변경 |
|------|------|
| `env/backend/.env.development` | `REDMINE_URL`, `REDMINE_API_KEY` 추가 |
| 스테이징 `.env.staging` | 동일 (서버에서 직접) |

---

## 4. 사이드 임팩트 분석

| 영역 | 영향도 | 설명 |
|------|--------|------|
| **기존 마이그레이션 API** | ⚪ 없음 | 기존 4개 엔드포인트 변경 없음, 신규 5개 추가만 |
| **이슈 시스템** | ⚪ 없음 | 기존 이슈 테이블에 INSERT만, 스키마 변경 없음 |
| **프로젝트 시스템** | ⚪ 없음 | 기존 프로젝트 테이블 활용, 스키마 변경 없음 |
| **사용자 시스템** | ⚪ 없음 | 이메일 기반 조회만, 수정 없음 |
| **프론트엔드 빌드** | 🟡 경미 | 신규 페이지 + 라우트 추가 (번들 크기 미미한 증가) |
| **관리자 메뉴** | 🟡 경미 | 메뉴 1개 추가 (SUPER_ADMIN만 노출) |
| **환경변수** | 🟡 경미 | 2개 추가 (미설정 시 Redmine 기능만 비활성) |
| **기존 DB 데이터** | ⚪ 없음 | DDL 변경 없음, 기존 데이터 영향 없음 |

---

## 5. 사전 확인 사항

구현 착수 전 확인이 필요한 항목:

| # | 확인 사항 | 담당 |
|---|----------|------|
| 1 | **Redmine REST API 활성화 여부** — 관리자 → 설정 → API에서 "Enable REST web service" 체크 필요 | Redmine 관리자 |
| 2 | **Redmine 관리자 API Key 발급** — My Account → API access key | Redmine 관리자 |
| 3 | **AMA 서버 → Redmine 서버 네트워크 접근** — `https://redmine.amoeba.site`에 서버에서 curl 가능한지 확인 | 인프라 |

---

## 6. 작업 순서 요약

```
[1] 환경변수 설정 (REDMINE_URL, REDMINE_API_KEY)
 ↓
[2] RedmineApiService 생성 (API 통신 래퍼)
 ↓
[3] Controller 엔드포인트 5개 추가
 ↓
[4] importSelectedIssues() 서비스 메서드 추가
 ↓
[5] RedmineMigrationPage.tsx UI 페이지 생성
 ↓
[6] 라우터 + 메뉴 + i18n 등록
 ↓
[7] 스테이징 배포 + Redmine 실제 연동 테스트
```
