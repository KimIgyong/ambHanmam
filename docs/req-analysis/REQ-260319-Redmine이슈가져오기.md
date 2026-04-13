# 조사 분석서: Redmine 이슈 → AMA 가져오기 방안 연구

> **문서 ID**: REQ-Redmine이슈가져오기-20260319  
> **작성일**: 2026-03-19  
> **상태**: 분석 완료

---

## 1. 현황 분석

### 1.1 Redmine 연동 현황

| 항목 | 상태 | 상세 |
|------|------|------|
| **Redmine 인스턴스** | 운영 중 | `https://redmine.amoeba.site` |
| **AMA 연동** | iframe 임베드 | 커스텀앱 `app-redmine` (JWT 인증, iframe 렌더링) |
| **마이그레이션 시스템** | 구현 완료 | `POST /api/v1/migration/redmine/import` (SUPER_ADMIN 전용) |
| **기존 가져오기 실적** | 0건 | `iss_redmine_id`가 설정된 이슈 없음 (191건 모두 네이티브) |

### 1.2 기존 마이그레이션 시스템 구조

```
현재 방식 (수동 JSON 전달):
┌──────────┐    JSON Body    ┌──────────────────┐    DB Insert    ┌──────────┐
│  관리자   │ ──────────────→ │ Migration API    │ ──────────────→ │  AMA DB  │
│  (수동)   │  users,projects │ /redmine/import  │  사용자 매칭    │          │
│          │  issues,journals│ (SUPER_ADMIN)    │  타입/상태 변환  │          │
└──────────┘                 └──────────────────┘                 └──────────┘
```

**현재 방식의 문제점:**
1. **수동 JSON 추출 필요** — 관리자가 Redmine DB에서 직접 JSON을 만들어 Body로 전달해야 함
2. **Redmine API 미사용** — Redmine REST API를 호출하지 않음 (오프라인 마이그레이션)
3. **UI 없음** — API만 존재, 관리자 화면 없음
4. **일회성 전체 임포트** — 선택적 이슈 가져오기 불가

### 1.3 관련 코드 현황

| 파일 | 역할 | 비고 |
|------|------|------|
| `apps/api/src/domain/migration/service/redmine-migration.service.ts` | 마이그레이션 서비스 (~600줄) | preview, importAll, rollback |
| `apps/api/src/domain/migration/controller/migration.controller.ts` | API 컨트롤러 (~60줄) | SUPER_ADMIN 전용 |
| `apps/api/src/domain/migration/entity/migration-user-map.entity.ts` | 사용자 매핑 엔티티 | Redmine↔AMB 사용자 매핑 |
| `apps/api/src/domain/migration/entity/migration-log.entity.ts` | 마이그레이션 로그 | 배치별 추적/롤백 |
| `sql/migration_redmine_tables.sql` | DDL | migration 테이블 생성 |

### 1.4 데이터 매핑 (기존 구현)

| Redmine | AMB | 매핑 |
|---------|-----|------|
| **Tracker** (Bug/Feature/Support/Task) | `iss_type` | 1→BUG, 2→FEATURE_REQUEST, 3→OPINION, 4→TASK |
| **Status** (New/In Progress/...) | `iss_status` | 1→OPEN, 2→IN_PROGRESS, 3→RESOLVED, 5→CLOSED, 6→REJECTED |
| **Priority** (Low~Urgent) | `iss_priority` + `iss_severity` | 1→(5,MINOR), 3→(2,MAJOR), 5→(1,CRITICAL) |
| **Project** | `kms_projects` | 별도 테이블, redmine_id 추적 |
| **Author/Assignee** | `iss_reporter_id/iss_assignee_id` | 이메일 기반 자동 매칭 |
| **Journal** | Comment + StatusLog | notes→코멘트, status변경→상태로그 |

---

## 2. Redmine REST API 사양 분석

### 2.1 Redmine API 개요

Redmine은 REST API를 기본 제공합니다 (관리자 설정에서 활성화 필요).

**인증 방식:**
- API Key (Header `X-Redmine-API-Key` 또는 Query `?key=xxx`)
- HTTP Basic Auth (username/password)

**응답 형식:** JSON (`format=json`) 또는 XML

### 2.2 주요 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 페이징 |
|-----------|--------|------|--------|
| `GET /issues.json` | GET | 이슈 목록 조회 | `offset`, `limit` (max 100) |
| `GET /issues/{id}.json` | GET | 이슈 상세 (include: journals, attachments) | - |
| `GET /projects.json` | GET | 프로젝트 목록 | `offset`, `limit` |
| `GET /projects/{id}.json` | GET | 프로젝트 상세 | - |
| `GET /users.json` | GET | 사용자 목록 (admin만) | `offset`, `limit` |
| `GET /users/{id}.json` | GET | 사용자 상세 | - |
| `GET /issue_statuses.json` | GET | 이슈 상태 목록 | - |
| `GET /trackers.json` | GET | 트래커(타입) 목록 | - |
| `GET /issue_priorities.json` | GET | 우선순위 목록 | - |

### 2.3 이슈 목록 조회 파라미터

```
GET /issues.json?
  project_id=1              # 프로젝트별 필터
  &tracker_id=1             # 트래커별 필터
  &status_id=open|closed|*  # 상태 필터
  &assigned_to_id=5         # 담당자 필터
  &created_on=%3E%3D2026-01-01  # 생성일 필터
  &updated_on=%3E%3D2026-01-01  # 수정일 필터
  &offset=0&limit=100       # 페이징
  &sort=updated_on:desc     # 정렬
  &include=attachments,journals  # 관련 데이터 포함
```

### 2.4 이슈 응답 구조 예시

```json
{
  "issues": [
    {
      "id": 123,
      "project": { "id": 1, "name": "AMA" },
      "tracker": { "id": 1, "name": "Bug" },
      "status": { "id": 2, "name": "In Progress" },
      "priority": { "id": 3, "name": "Normal" },
      "author": { "id": 5, "name": "John Doe" },
      "assigned_to": { "id": 8, "name": "Jane Smith" },
      "subject": "Login 화면에서 비밀번호 리셋 안됨",
      "description": "상세 내용...",
      "start_date": "2026-03-01",
      "due_date": "2026-03-15",
      "done_ratio": 50,
      "estimated_hours": 8,
      "created_on": "2026-03-01T10:00:00Z",
      "updated_on": "2026-03-10T15:30:00Z",
      "journals": [
        {
          "id": 456,
          "user": { "id": 5, "name": "John Doe" },
          "notes": "첫 번째 코멘트",
          "created_on": "2026-03-05T09:00:00Z",
          "details": [
            { "property": "attr", "name": "status_id", "old_value": "1", "new_value": "2" }
          ]
        }
      ]
    }
  ],
  "total_count": 150,
  "offset": 0,
  "limit": 25
}
```

---

## 3. 가져오기 방안 비교

### 방안 A: Redmine API 직접 호출 (서버 → Redmine → AMA DB)

```
┌──────────┐    UI 요청      ┌──────────────────┐  REST API     ┌──────────┐
│ AMA 관리  │ ──────────────→ │ AMA Backend      │ ───────────→  │ Redmine  │
│ 화면(Web) │  프로젝트 선택  │ /migration/      │  GET /issues  │ Server   │
│          │  이슈 필터/선택  │ redmine/fetch    │  ?project_id= │          │
└──────────┘                 │                  │ ←───────────  └──────────┘
                             │                  │  JSON 응답
                             │   변환 + 저장     │
                             └──────────────────┘
                                    │
                                    ▼
                             ┌──────────┐
                             │  AMA DB  │
                             └──────────┘
```

**장점:**
- 사용자가 UI에서 직접 프로젝트/이슈를 보고 선택 가능
- 실시간 Redmine 데이터 반영
- 수동 JSON 추출 불필요
- 선택적 가져오기 가능 (개별 이슈, 프로젝트 단위)

**단점:**
- Redmine API Key 설정 필요
- Redmine 서버가 AMA 서버에서 접근 가능해야 함
- API Rate Limit 고려 필요

### 방안 B: JSON 파일 업로드 (현재 방식 개선)

**장점:** Redmine 서버 접근 불필요, 오프라인 처리 가능  
**단점:** 수동 작업, JSON 생성 도구 별도 필요, 비실시간

### 방안 C: DB 직접 연결 (Redmine PostgreSQL → AMA)

**장점:** 가장 빠른 대량 처리  
**단점:** 보안 위험, Redmine DB 스키마 의존, 인프라 복잡

### ✅ 권장: 방안 A (Redmine API 직접 호출)

Redmine이 이미 `https://redmine.amoeba.site`에서 운영 중이고, AMA에서 JWT로 연동하고 있으므로 API 호출이 가장 자연스럽고 실용적입니다.

---

## 4. 권장 방안 상세 설계

### 4.1 아키텍처

```
[Phase 1] Redmine 프로젝트/이슈 목록 조회 (미리보기)
  AMA UI → AMA API → Redmine API → 프로젝트 목록 반환
                                  → 이슈 목록 반환 (페이징)

[Phase 2] 선택 이슈 가져오기
  AMA UI (체크박스 선택) → AMA API → Redmine API (상세 + journals)
                                   → 변환 + AMA DB 저장
                                   → 결과 반환

[Phase 3] 동기화 (선택)
  이미 가져온 이슈의 Redmine 측 변경사항 감지 + 업데이트
```

### 4.2 필요 설정

| 설정 | 값 | 저장 위치 |
|------|-----|----------|
| `REDMINE_URL` | `https://redmine.amoeba.site` | 환경변수 또는 DB (커스텀앱 테이블에 이미 있음) |
| `REDMINE_API_KEY` | Redmine 관리자 API Key | 환경변수 (보안상 .env 권장) |

### 4.3 신규 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `GET /migration/redmine/projects` | GET | Redmine 프로젝트 목록 조회 |
| `GET /migration/redmine/issues` | GET | Redmine 이슈 목록 조회 (필터/페이징) |
| `GET /migration/redmine/issues/:id` | GET | Redmine 이슈 상세 (journals 포함) |
| `POST /migration/redmine/import-selected` | POST | 선택된 이슈 가져오기 |
| `GET /migration/redmine/status` | GET | 연결 상태 확인 |

### 4.4 백엔드 서비스 구조

```typescript
// 신규: RedmineApiService — Redmine REST API 통신 전담
class RedmineApiService {
  // Redmine API 호출 래퍼
  fetchProjects(offset, limit): Promise<RedmineProjectListResponse>
  fetchIssues(filters, offset, limit): Promise<RedmineIssueListResponse>  
  fetchIssueDetail(id, include): Promise<RedmineIssueDetailResponse>
  fetchUsers(offset, limit): Promise<RedmineUserListResponse>
  checkConnection(): Promise<boolean>
}

// 기존: RedmineMigrationService — 확장
class RedmineMigrationService {
  // 기존 메서드 유지
  preview(data): ...
  importAll(data, entityId): ...
  rollback(batchId): ...
  
  // 신규: API 기반 선택적 가져오기
  importSelectedIssues(issueIds: number[], entityId: string): Promise<MigrationResult>
}
```

### 4.5 프론트엔드 UI 설계

```
┌─────────────────────────────────────────────────────┐
│ Redmine 이슈 가져오기                                │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [프로젝트 선택 ▼]  [상태: 전체 ▼]  [검색...]       │
│                                                     │
│  ┌─────────────────────────────────────────────────┐│
│  │ ☐ │ #123 │ Bug    │ Login 비밀번호 리셋 안됨     ││
│  │   │      │ In Prg │ John Doe → Jane Smith       ││
│  │ ☑ │ #456 │ Feature│ 대시보드 차트 추가            ││
│  │   │      │ New    │ Park → Kim                   ││
│  │ ☑ │ #789 │ Task   │ DB 마이그레이션 스크립트       ││
│  │   │      │ Closed │ Lee → Lee                    ││
│  └─────────────────────────────────────────────────┘│
│                                                     │
│  선택: 2건  │  이미 가져온 이슈: 🟢 표시              │
│                                                     │
│  [미리보기]  [가져오기 실행]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.6 데이터 변환 규칙 (기존 매핑 재활용)

기존 `RedmineMigrationService`에 구현된 매핑 그대로 사용:

| Redmine 필드 | AMA 필드 | 변환 규칙 |
|-------------|----------|-----------|
| `tracker.id` | `iss_type` | TRACKER_MAP (1→BUG, 2→FEATURE_REQUEST, 3→OPINION, 4→TASK) |
| `status.id` | `iss_status` | STATUS_MAP (1→OPEN, 2→IN_PROGRESS, ...) |
| `priority.id` | `iss_priority` + `iss_severity` | PRIORITY_MAP |
| `author` | `iss_reporter_id` | 이메일 기반 사용자 매칭 (fallback: system user) |
| `assigned_to` | `iss_assignee_id` | 이메일 기반 사용자 매칭 |
| `subject` | `iss_title` | 그대로 (200자 제한) |
| `description` | `iss_description` | Textile → HTML 변환 필요 |
| `start_date` | `iss_start_date` | 그대로 |
| `due_date` | `iss_due_date` | 그대로 |
| `done_ratio` | `iss_done_ratio` | 그대로 (0-100) |
| `id` | `iss_redmine_id` | 중복 방지용 추적 |
| `journals` | Comment + StatusLog | notes→코멘트, details→상태변경 |

### 4.7 중복 방지

- `iss_redmine_id` 컬럼으로 이미 가져온 이슈 식별
- UI에서 이미 가져온 이슈는 🟢 또는 "가져옴" 배지 표시
- 재가져오기 시 업데이트 또는 스킵 선택 옵션

---

## 5. 구현 단계 제안

### Phase 1: 백엔드 API 연동 (핵심)
1. 환경변수 추가: `REDMINE_URL`, `REDMINE_API_KEY`
2. `RedmineApiService` 생성: Redmine REST API 호출 래퍼
3. Controller 확장: 프로젝트 목록, 이슈 목록, 상세 조회 엔드포인트
4. 선택적 가져오기: `importSelectedIssues()` 메서드

### Phase 2: 프론트엔드 UI
1. Redmine 이슈 가져오기 페이지 (관리자 메뉴)
2. 프로젝트 선택 → 이슈 목록 → 체크박스 선택 → 가져오기
3. 가져오기 결과 표시 (성공/실패/스킵)

### Phase 3: 품질 개선 (선택)
1. Textile → HTML 변환 (Redmine 기본 마크업)
2. 첨부파일 가져오기 (Redmine attachment → Google Drive)
3. 증분 동기화 (updated_on 기반)

---

## 6. 기술 제약사항

| 항목 | 제약 | 대응 |
|------|------|------|
| **Redmine API Key** | 관리자 권한 필요 | Redmine 설정에서 REST API 활성화 + API Key 발급 |
| **페이징** | max 100/page | offset/limit 반복 호출 |
| **Rate Limit** | Redmine 기본 설정 없음 | 대량 조회 시 적절한 딜레이 |
| **Textile 마크업** | Redmine description은 Textile 형식 | textile-js 라이브러리로 HTML 변환 |
| **네트워크** | AMA 서버 → Redmine 서버 접근 | 동일 네트워크 (14.161.40.143) 내이므로 문제 없음 |
| **첨부파일** | Redmine 파일 다운로드 별도 API | Phase 3에서 처리 |

---

## 7. 영향도 분석

| 영역 | 영향 | 설명 |
|------|------|------|
| 기존 마이그레이션 코드 | 변경 없음 | 신규 서비스/엔드포인트 추가 (기존 코드 유지) |
| 이슈 시스템 | 변경 없음 | 기존 이슈 테이블에 INSERT (redmine_id 추적) |
| 프로젝트 시스템 | 변경 없음 | 기존 프로젝트 테이블에 INSERT (redmine_id 추적) |
| 환경변수 | 추가 | `REDMINE_URL`, `REDMINE_API_KEY` |
| 메뉴 시스템 | 추가 가능 | 관리자 메뉴에 "Redmine 이슈 가져오기" 항목 |
