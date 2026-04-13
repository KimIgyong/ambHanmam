# 작업 계획서: AMB KMS 통합 지식그래프

- **문서 ID**: PLAN-AMB-KMS-지식그래프-작업계획-20260330
- **작성일**: 2026-03-30
- **관련 요구사항**: REQ-AMB-KMS-지식그래프-20260330

---

## 1. 시스템 개발 현황 분석

### 참조 패턴
- **NoteGraphPage**: `react-force-graph-2d` 기반 force-directed 그래프 (프론트엔드 참조 패턴)
- **KnowledgeGraphService**: 태그 기반 그래프 데이터 조회 (백엔드 참조 패턴)
- **NoteLinkService.getGraphData()**: scope(MY/ENTITY) + entityId 기반 격리 (데이터 격리 참조 패턴)

### 기존 인프라 활용 가능 항목
- `react-force-graph-2d@^1.29.1` 이미 설치됨
- KMS 모듈 라우팅/레이아웃 구조 존재 (KmsLayout → navItems → Outlet)
- KMS 백엔드 모듈에 controller/service 추가 용이

---

## 2. 단계별 구현 계획

### Phase 1: 백엔드 API (Controller + Service)

**목표**: 6개 엔티티의 관계를 nodes/edges로 집계하는 API 엔드포인트 생성

**변경 파일:**

| 파일 | 작업 | 설명 |
|------|------|------|
| `apps/api/src/domain/kms/service/amb-graph.service.ts` | **신규** | 6개 테이블 조회 + nodes/edges 조합 서비스 |
| `apps/api/src/domain/kms/controller/amb-graph.controller.ts` | **신규** | `GET /api/v1/kms/amb-graph` 엔드포인트 |
| `apps/api/src/domain/kms/kms.module.ts` | **수정** | 새 컨트롤러/서비스 등록 + TypeOrmModule에 외부 엔티티 추가 (NoteLinkEntity 포함) |

**서비스 로직:**
```
1. scope=MY → userId 기반 필터, scope=ENTITY → entityId 범위
2. 각 테이블에서 데이터 조회:
   - Projects: kms_projects WHERE ent_id + deleted IS NULL
   - Issues: amb_issues WHERE ent_id + deleted IS NULL
   - Todos: amb_todos WHERE ent_id + deleted IS NULL
   - Notes: amb_meeting_notes WHERE ent_id + deleted IS NULL
   - Epics: amb_project_epics WHERE ent_id
   - Components: amb_project_components WHERE ent_id
3. FK 관계로 edges 구축 (Issue→Project, Todo→Issue, Note→Project 등)
4. 위키링크 edges 구축 (amb_note_links 조회):
   - Note →(wiki)→ Note: nlk_target_type=NOTE, nlk_target_note_id 사용
   - Note →(wiki)→ Issue: nlk_target_type=ISSUE, nlk_target_ref_id 사용
   - Note →(wiki)→ Project: nlk_target_type=PROJECT, nlk_target_ref_id 사용
   - Note →(wiki)→ Todo: nlk_target_type=TASK, nlk_target_ref_id 사용
   - Note →(wiki)→ Mission: nlk_target_type=MISSION, nlk_target_ref_id 사용
   - 위키링크로 참조된 대상 노드가 이미 nodeMap에 있으면 edge만 추가
   - 없으면 대상 노드도 추가 (linkText를 label로 사용)
5. MY scope: Issues.reporter/assignee = userId, Todos.usr_id = userId, Notes.usr_id = userId 등
6. 결과 노드 수 제한 (500개)
```

**인증/격리:**
- `@Auth()` + `@UseGuards(OwnEntityGuard)` + `resolveEntityId()`
- `ent_id` 기반 모든 쿼리 필터링

### Phase 2: 프론트엔드 그래프 페이지

**목표**: `react-force-graph-2d` 기반 옵시디언 스타일 그래프 UI

**변경 파일:**

| 파일 | 작업 | 설명 |
|------|------|------|
| `apps/web/src/domain/kms/pages/AmbKmsGraphPage.tsx` | **신규** | Force-directed 그래프 페이지 (NoteGraphPage 패턴 참조) |
| `apps/web/src/domain/kms/service/amb-graph.service.ts` | **신규** | API 호출 서비스 |
| `apps/web/src/router/index.tsx` | **수정** | `/kms/ambKMS-graph` 라우트 추가 |
| `apps/web/src/domain/kms/pages/KmsLayout.tsx` | **수정** | navItems에 탭 추가 |

**UI 구성:**
- 헤더: 뒤로 가기 + 제목 + 스코프 토글(MY/ENTITY) + 필터 버튼
- 필터 패널: 6개 타입 체크박스 + 노드/엣지 카운트
- 그래프 영역: react-force-graph-2d (다크 배경 #111827)
- 범례: 하단 좌측 (6개 노드 타입 + 색상)

### Phase 3: i18n 번역 + 라우팅 연결

**변경 파일:**

| 파일 | 작업 | 설명 |
|------|------|------|
| `apps/web/src/locales/ko/kms.json` | **수정** | ambGraph 네임스페이스 번역 추가 |
| `apps/web/src/locales/en/kms.json` | **수정** | 영어 번역 |
| `apps/web/src/locales/vi/kms.json` | **수정** | 베트남어 번역 |

---

## 3. 변경 대상 파일 목록

### 신규 파일 (4개)
1. `apps/api/src/domain/kms/service/amb-graph.service.ts`
2. `apps/api/src/domain/kms/controller/amb-graph.controller.ts`
3. `apps/web/src/domain/kms/pages/AmbKmsGraphPage.tsx`
4. `apps/web/src/domain/kms/service/amb-graph.service.ts`

### 수정 파일 (5개)
1. `apps/api/src/domain/kms/kms.module.ts` — 컨트롤러/서비스/엔티티 등록
2. `apps/web/src/router/index.tsx` — 라우트 추가
3. `apps/web/src/domain/kms/pages/KmsLayout.tsx` — 탭 네비게이션 추가
4. `apps/web/src/locales/ko/kms.json` — 한국어 번역
5. `apps/web/src/locales/en/kms.json` — 영어 번역
6. `apps/web/src/locales/vi/kms.json` — 베트남어 번역

---

## 4. 사이드 임팩트 분석

| 영향 범위 | 위험도 | 설명 |
|-----------|--------|------|
| KMS 모듈 | 낮음 | 새 컨트롤러/서비스 추가만, 기존 로직 변경 없음 |
| 기존 API | 없음 | 새 엔드포인트만 추가 |
| DB | 없음 | 기존 테이블/관계만 읽기, 스키마 변경 없음 |
| 프론트엔드 라우팅 | 낮음 | KMS children에 라우트 1개 추가 |
| 성능 | 중간 | 6개 테이블 조회 → 쿼리 최적화 + 노드 수 제한으로 대응 |

---

## 5. DB 마이그레이션

**필요 없음** — 기존 테이블의 FK 관계만 읽기 전용으로 사용. 새 테이블/컬럼 추가 없음.

---

## 6. 구현 우선순위

1. **Phase 1** (백엔드) → 빌드 검증
2. **Phase 2** (프론트엔드) → 빌드 검증
3. **Phase 3** (i18n + 라우팅) → 전체 빌드 검증 → 커밋 → 배포
