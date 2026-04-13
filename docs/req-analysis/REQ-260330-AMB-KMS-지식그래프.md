# 요구사항 분석서: AMB KMS 통합 지식그래프

- **문서 ID**: REQ-AMB-KMS-지식그래프-20260330
- **작성일**: 2026-03-30
- **경로**: `/kms/ambKMS-graph`

---

## 1. AS-IS 현황 분석

### 1.1 기존 그래프 구현

| 그래프 | 경로 | 라이브러리 | 데이터 소스 | 비고 |
|--------|------|-----------|------------|------|
| Meeting Notes Graph | `/meeting-notes/graph` | `react-force-graph-2d` | `amb_note_links` (위키링크) | D3 force-directed, 캔버스 기반 |
| KMS Knowledge Graph | `/kms/knowledge-graph` | 없음 (리스트 뷰 placeholder) | `amb_kms_tags` + `amb_kms_tag_relations` | 태그 카드 나열 |

### 1.2 기존 엔티티 관계 (DB에 이미 존재하는 연결)

#### Todo → Project / Issue
- **엔티티**: `TodoEntity` (`amb_todos`)
- **관계 컬럼**: `pjt_id` (nullable), `iss_id` (nullable)
- **자기참조**: `tdo_parent_id` (부모 Todo, 서브태스크)
- **관계**: `@ManyToOne(() => ProjectEntity)`, `@ManyToOne(() => IssueEntity)`

#### Issue → Project / Parent Issue / Epic / Component
- **엔티티**: `IssueEntity` (`amb_issues`)
- **관계 컬럼**: `pjt_id` (nullable), `iss_parent_id` (nullable), `epc_id` (nullable), `cmp_id` (nullable)
- **관계**: `@ManyToOne(() => ProjectEntity)`, `@ManyToOne(() => IssueEntity)` (self-ref)

#### MeetingNote → Project / Issue
- **엔티티**: `MeetingNoteEntity` (`amb_meeting_notes`)
- **접합 테이블**: `amb_meeting_note_projects` (mtn_id ↔ pjt_id), `amb_meeting_note_issues` (mtn_id ↔ iss_id)
- **위키링크**: `amb_note_links` (`nlk_target_type`: NOTE/MISSION/TASK/ISSUE/PROJECT)

#### Project → 계층 구조
- **엔티티**: `ProjectEntity` (`kms_projects`)
- **관계 컬럼**: `pjt_parent_id` (부모 프로젝트), `pjt_id` → Epic/Component 하위

### 1.3 관계 맵 (시스템에 존재하는 모든 연결)

```
Project (kms_projects)
  ├─ pjt_parent_id ──→ Project (부모-자식)
  ├─ OneToMany ──→ Issue (iss.pjt_id)
  ├─ OneToMany ──→ Epic (epc.pjt_id)
  │   └─ OneToMany ──→ Issue (iss.epc_id)
  ├─ OneToMany ──→ Component (cmp.pjt_id)
  │   └─ OneToMany ──→ Issue (iss.cmp_id)
  ├─ ManyToMany ──→ MeetingNote (amb_meeting_note_projects)
  └─ ManyToMany ──→ Todo (tdo.pjt_id)

Issue (amb_issues)
  ├─ iss_parent_id ──→ Issue (부모-자식)
  ├─ pjt_id ──→ Project
  ├─ epc_id ──→ Epic
  ├─ cmp_id ──→ Component
  ├─ ManyToMany ──→ MeetingNote (amb_meeting_note_issues)
  └─ OneToMany ──→ Todo (tdo.iss_id)

MeetingNote (amb_meeting_notes)
  ├─ ManyToMany ──→ Project (amb_meeting_note_projects)
  ├─ ManyToMany ──→ Issue (amb_meeting_note_issues)
  └─ OneToMany ──→ NoteLink (amb_note_links)
      ├─ [[위키링크]] ──→ Note (target_type=NOTE, nlk_target_note_id)
      ├─ [[위키링크]] ──→ Issue (target_type=ISSUE, nlk_target_ref_id)
      ├─ [[위키링크]] ──→ Project (target_type=PROJECT, nlk_target_ref_id)
      ├─ [[위키링크]] ──→ Todo (target_type=TASK, nlk_target_ref_id)
      └─ [[위키링크]] ──→ Mission (target_type=MISSION, nlk_target_ref_id)

Todo (amb_todos)
  ├─ pjt_id ──→ Project
  ├─ iss_id ──→ Issue
  └─ tdo_parent_id ──→ Todo (부모-자식)
```

---

## 2. TO-BE 요구사항

### 2.1 목표
기존 엔티티 간 관계(FK, 접합 테이블)를 **옵시디언 스타일 위키링크 그래프**로 시각화하는 통합 지식그래프 페이지 `/kms/ambKMS-graph` 구현.

### 2.2 기능 명세

#### 노드 타입 (6종)

| 노드 타입 | 데이터 소스 | 색상 | 아이콘 의미 |
|-----------|------------|------|------------|
| PROJECT | `kms_projects` | `#22c55e` (green) | 프로젝트 |
| ISSUE | `amb_issues` | `#ef4444` (red) | 이슈 |
| TODO | `amb_todos` | `#8b5cf6` (violet) | 할일/태스크 |
| NOTE | `amb_meeting_notes` | `#6366f1` (indigo) | 회의노트 |
| EPIC | `amb_project_epics` | `#f59e0b` (amber) | 에픽 |
| COMPONENT | `amb_project_components` | `#06b6d4` (cyan) | 컴포넌트 |

#### 엣지 타입 (관계)

**A. FK 기반 관계 (엔티티 직접 연결)**

| 엣지 | 설명 | 데이터 소스 |
|------|------|------------|
| Issue → Project | 이슈가 소속된 프로젝트 | `amb_issues.pjt_id` |
| Issue → Parent Issue | 상위 이슈 | `amb_issues.iss_parent_id` |
| Issue → Epic | 이슈가 속한 에픽 | `amb_issues.epc_id` |
| Issue → Component | 이슈가 속한 컴포넌트 | `amb_issues.cmp_id` |
| Todo → Project | Todo가 연결된 프로젝트 | `amb_todos.pjt_id` |
| Todo → Issue | Todo가 연결된 이슈 | `amb_todos.iss_id` |
| Todo → Parent Todo | 서브태스크 관계 | `amb_todos.tdo_parent_id` |
| Note → Project | 노트가 연결된 프로젝트 | `amb_meeting_note_projects` |
| Note → Issue | 노트가 연결된 이슈 | `amb_meeting_note_issues` |
| Epic → Project | 에픽이 속한 프로젝트 | `amb_project_epics.pjt_id` |
| Component → Project | 컴포넌트가 속한 프로젝트 | `amb_project_components.pjt_id` |
| Project → Parent Project | 부모-자식 프로젝트 | `kms_projects.pjt_parent_id` |

**B. 위키링크 기반 관계 (`[[]]` 콘텐츠 본문 링크)**

| 엣지 | 설명 | 데이터 소스 |
|------|------|------------|
| Note →(wiki)→ Note | 노트 본문에서 다른 노트로 위키링크 | `amb_note_links` (target_type=NOTE) |
| Note →(wiki)→ Issue | 노트 본문에서 이슈로 위키링크 | `amb_note_links` (target_type=ISSUE) |
| Note →(wiki)→ Project | 노트 본문에서 프로젝트로 위키링크 | `amb_note_links` (target_type=PROJECT) |
| Note →(wiki)→ Todo | 노트 본문에서 Todo로 위키링크 | `amb_note_links` (target_type=TASK) |
| Note →(wiki)→ Mission | 노트 본문에서 미션으로 위키링크 | `amb_note_links` (target_type=MISSION) |

**위키링크 데이터 구조 (`amb_note_links`):**
- `nlk_source_note_id`: 소스 (항상 MeetingNote)
- `nlk_target_type`: NOTE / ISSUE / PROJECT / TASK / MISSION
- `nlk_target_note_id`: NOTE 타입일 때 대상 노트 UUID
- `nlk_target_ref_id`: NOTE 외 타입일 때 대상 엔티티 UUID
- 파싱: `parseAndSaveLinks()` (MeetingNote 생성/수정 시 자동 호출)
- HTML: `<span class="wiki-link" data-type="NOTE" data-id="uuid" data-text="제목">제목</span>`

#### UI 기능
1. **Force-directed 그래프**: `react-force-graph-2d` (NoteGraphPage와 동일 라이브러리)
2. **스코프 전환**: MY (내 데이터) / ENTITY (법인 전체)
3. **노드 타입 필터**: 체크박스로 6개 타입별 표시/숨김
4. **노드 크기**: 연결 수(degree)에 비례하여 동적 크기
5. **노드 라벨**: 줌 레벨 1.2배 이상에서 표시
6. **노드 클릭**: 해당 상세 페이지로 네비게이션
7. **범례(Legend)**: 하단 좌측에 노드 타입별 색상 표시
8. **노드/엣지 수 표시**: 필터 패널에 현재 표시 중인 노드/엣지 수
9. **다크 배경**: `#111827` (기존 NoteGraphPage와 통일)

### 2.3 백엔드 API

```
GET /api/v1/kms/amb-graph
Query Parameters:
  - scope: 'MY' | 'ENTITY' (default: 'MY')
  - types: string (comma-separated, 예: 'PROJECT,ISSUE,TODO')
```

**응답 형식:**
```typescript
{
  success: true,
  data: {
    nodes: Array<{
      id: string;          // 엔티티 UUID
      type: string;        // PROJECT | ISSUE | TODO | NOTE | EPIC | COMPONENT
      label: string;       // 표시명 (프로젝트명, 이슈 제목 등)
    }>,
    edges: Array<{
      source: string;      // 소스 노드 UUID
      target: string;      // 타겟 노드 UUID
      relation: string;    // 관계 타입 (BELONGS_TO, PARENT_CHILD, LINKED 등)
    }>
  }
}
```

---

## 3. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|----|
| 그래프 시각화 | 태그 리스트 뷰(KMS), force-graph(Notes) | Force-directed 통합 그래프 | 신규 페이지 필요 |
| 데이터 집계 | 단일 도메인(태그/노트) | 6개 엔티티 교차 조회 | 새 백엔드 서비스/API 필요 |
| 노드 타입 | KMS: 태그 레벨(1-3), Notes: NOTE/TASK/ISSUE/PROJECT/MISSION | 6종 엔티티 타입 | 통합 타입 정의 필요 |
| 엣지 데이터 | KMS: tag_relations, Notes: note_links | FK + 접합 테이블 + `amb_note_links` 위키링크 | 새 쿼리 로직 필요 |
| 스코프 격리 | Notes: MY/ENTITY | MY/ENTITY | 패턴 동일, 재활용 가능 |
| 라이브러리 | `react-force-graph-2d` 설치됨 | 동일 | 추가 설치 불필요 |

---

## 4. 사용자 플로우

```
1. 사용자 → KMS 메뉴 → "AMB 지식그래프" 탭 클릭
2. 페이지 로딩 → API 호출 (GET /api/v1/kms/amb-graph?scope=MY)
3. Force-directed 그래프 렌더링 (프로젝트 중심으로 이슈/Todo/노트 연결)
4. 줌/팬으로 탐색, 줌 확대 시 노드 라벨 표시
5. 필터 버튼 → 타입별 체크박스 토글
6. 스코프 전환 (MY ↔ ENTITY) → 데이터 다시 로딩
7. 노드 클릭 → 해당 엔티티 상세 페이지로 이동
   - PROJECT → /projects/{id}
   - ISSUE → /issues/{id}
   - TODO → /todos (+ 필터)
   - NOTE → /meeting-notes/{id}
```

---

## 5. 기술 제약사항

1. **성능**: 대규모 데이터 시 노드 수 제한 필요 (기본 500개). 6개 테이블 조인으로 쿼리 최적화 중요
2. **데이터 격리**: `ent_id` 기반 필터링 필수. `OwnEntityGuard` + `resolveEntityId` 적용
3. **스테이징/프로덕션 DB**: `synchronize: false` → 새 테이블 생성 불필요 (기존 테이블/관계만 사용)
4. **라이브러리**: `react-force-graph-2d@^1.29.1` 이미 설치됨
5. **i18n**: 한국어/영어/베트남어 3개 언어 번역 필요
