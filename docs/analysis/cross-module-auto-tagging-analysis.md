# 크로스 모듈 자동 태깅 및 통합 검색 요구사항 분석 (1차 초안)

> **작성일**: 2026-02-19
> **상태**: Draft v1
> **요청**: 할일, 계약서 등 모든 새로 입력한 데이터에서 키워드를 분석하여 KMS 태그로 자동 저장 및 카테고리화, 통합 검색 연결

---

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| **데이터 소스** | Todo(할일), Contract(계약), Invoice(청구서), Meeting Notes, Webmail 등 신규 입력 데이터 |
| **키워드 분석** | 제목/내용에서 자동 키워드 추출 (AI + 규칙 기반) |
| **태그 저장** | 추출된 키워드를 KMS 태그(`amb_kms_tags`)에 정규화하여 저장 |
| **카테고리화** | 3레벨 분류 체계 (DOMAIN → TOPIC → CONTEXT)로 계층 분류 |
| **검색 연결** | 태그 기반 크로스 모듈 통합 검색 제공 |

---

## 2. 현행 시스템 분석

### 2.1 이미 구축된 KMS 인프라

| 구성요소 | 파일 | 상태 | 비고 |
|----------|------|------|------|
| TagExtractionService | `kms/service/tag-extraction.service.ts` | 구현 완료 | Claude AI 기반 3-8개 태그 추출 |
| TagNormalizationService | `kms/service/tag-normalization.service.ts` | 구현 완료 | 4단계 정규화 (정확→동의어→퍼지→생성) |
| TagAssignmentService | `kms/service/tag-assignment.service.ts` | 구현 완료 | WorkItem-Tag 할당 |
| AutoTaggingService | `kms/service/auto-tagging.service.ts` | 구현 완료 | WorkItem 자동 태깅 트리거 |
| ContentAnalyzerService | `kms/service/content-analyzer.service.ts` | 구현 완료 | DSED v2 콘텐츠 분석 |
| ModuleIntegrationService | `kms/service/module-integration.service.ts` | 구현 완료 | Billing/Webmail/Drive 연동 |
| TagCloudService | `kms/service/tag-cloud.service.ts` | 구현 완료 | My/Team/Company 스코프 |
| KnowledgeGraphService | `kms/service/knowledge-graph.service.ts` | 구현 완료 | 태그 관계 그래프 |

### 2.2 WorkItem 중간 테이블 구조

```
모듈 데이터 (Todo, Contract, ...)
    ↓ wit_ref_id로 참조
WorkItemEntity (amb_work_items)
    ↓ wit_id로 연결
KmsWorkItemTagEntity (amb_kms_work_item_tags)
    ↓ tag_id로 연결
KmsTagEntity (amb_kms_tags)
```

- `WorkItemEntity`의 `wit_type`: DOC | REPORT | TODO | NOTE | EMAIL | ANALYSIS
- `WorkItemEntity`의 `wit_module`: todo | meeting-notes | billing | webmail 등
- `WorkItemEntity`의 `wit_ref_id`: 원본 모듈 엔티티의 UUID

### 2.3 현재 미연결 상태 (Gap)

| 모듈 | WorkItem 자동 생성 | 자동 태깅 트리거 | 검색 연동 |
|------|:------------------:|:----------------:|:---------:|
| Todo | X | X | X |
| Contract | X | X | X |
| Invoice | X | X | X |
| Meeting Notes | X | X | X |
| Webmail | X | X | X |
| Drive | X | X | X |

**핵심 Gap**: KMS 인프라(태그 추출, 정규화, 할당)는 모두 구현되어 있으나, 각 모듈에서 데이터 생성/수정 시 **WorkItem을 자동 생성하고 AutoTaggingService를 호출하는 연결 코드**가 없음.

---

## 3. 구현 방안

### 3.1 아키텍처: 이벤트 기반 자동 태깅 파이프라인

```
[Todo 생성/수정]──┐
[Contract 생성]───┤
[Invoice 생성]────┼──→ EventEmitter ──→ WorkItemSyncListener
[Meeting Note]────┤                          │
[Webmail 수신]────┘                          ▼
                                    WorkItem 생성/갱신
                                          │
                                          ▼
                                    AutoTaggingService
                                    (AI 태그 추출)
                                          │
                                          ▼
                                  TagNormalization
                                  (정규화 + 중복 방지)
                                          │
                                          ▼
                                  amb_kms_work_item_tags
                                  (태그 할당 저장)
```

### 3.2 Phase 1: WorkItem 자동 생성 (모듈별 연동)

각 모듈의 Service에 TypeORM `AfterInsert` / `AfterUpdate` 리스너 또는 NestJS EventEmitter를 추가하여 WorkItem을 자동 생성한다.

#### 3.2.1 Todo → WorkItem 매핑

| Todo 필드 | WorkItem 필드 | 비고 |
|-----------|--------------|------|
| `tdo_id` | `wit_ref_id` | 참조 ID |
| - | `wit_type` | `'TODO'` 고정 |
| - | `wit_module` | `'todo'` 고정 |
| `tdo_title` | `wit_title` | 제목 |
| `tdo_description` + `tdo_tags` | `wit_content` | 내용 결합 |
| `usr_id` | `wit_owner_id` | 소유자 |

#### 3.2.2 Contract → WorkItem 매핑

| Contract 필드 | WorkItem 필드 | 비고 |
|--------------|--------------|------|
| `ctr_id` | `wit_ref_id` | 참조 ID |
| - | `wit_type` | `'DOC'` 고정 |
| - | `wit_module` | `'billing'` 고정 |
| `ctr_title` | `wit_title` | 제목 |
| `ctr_title` + `ctr_description` + `ctr_note` + `ctr_category` + partner명 | `wit_content` | 풍부한 컨텍스트 결합 |
| `ctr_assigned_user_id` | `wit_owner_id` | 담당자 |

#### 3.2.3 추출 대상 키워드 예시 (계약 데이터)

현재 시드 데이터 기반 추출 예상:

| 계약 제목 | 추출 예상 태그 | 레벨 |
|-----------|---------------|------|
| "Basic Contract For Request Work (Happy Talk)" | `billing`, `tech-bpo`, `happy-talk`, `ambvn` | L1, L2, L3, L3 |
| "링크맘서비스 - 두손 스낵아일랜드 연동 API 서버 구축" | `si-dev`, `api-server`, `linkmom`, `integration` | L2, L2, L3, L3 |
| "Arria Online Brand site 구축" | `si-dev`, `web-development`, `brand-site`, `arria` | L2, L2, L3, L3 |
| "가비아씨엔에스 API 서버 설계 구축 및 유지보수" | `maintenance`, `api-server`, `gabia-cns` | L2, L2, L3 |

### 3.3 Phase 2: 통합 검색 구현

#### 3.3.1 검색 아키텍처

```
[검색 UI: GlobalSearchBar]
        │
        ▼
GET /api/v1/search?q=keyword&modules=todo,billing&tags=api-server
        │
        ▼
[SearchService]
    ├── 1. KMS 태그 검색 (ILIKE + trigram + embedding)
    ├── 2. 태그에 연결된 WorkItem 조회
    ├── 3. WorkItem의 wit_ref_id로 원본 엔티티 JOIN
    └── 4. 모듈별 결과 그룹핑 후 반환
```

#### 3.3.2 검색 API 설계

```
GET /api/v1/search
  ?q=string              // 검색 키워드
  &modules=string[]      // 모듈 필터 (todo,billing,webmail...)
  &tags=string[]         // 태그 필터
  &date_from=string      // 날짜 범위
  &date_to=string
  &limit=number          // 결과 수 제한 (기본 20)
```

**응답 구조**:
```typescript
interface SearchResponse {
  totalCount: number;
  results: SearchResult[];
  relatedTags: KmsTagResponse[];  // 연관 태그 제안
}

interface SearchResult {
  id: string;
  module: string;           // 'todo' | 'billing' | 'webmail' ...
  type: string;             // 'TODO' | 'DOC' | 'EMAIL' ...
  title: string;
  snippet: string;          // 매칭 텍스트 하이라이트
  tags: KmsTagResponse[];   // 연결된 태그들
  createdAt: string;
  url: string;              // 프론트엔드 상세 페이지 경로
}
```

#### 3.3.3 프론트엔드: GlobalSearchBar 컴포넌트

- 헤더 영역에 상시 노출되는 검색 입력 UI
- 타이핑 시 debounce (300ms) → 태그 자동완성 + 최근 검색어
- 결과를 모듈별 탭으로 그룹핑 (전체 | 할일 | 계약 | 메일 | ...)
- 태그 클릭 시 해당 태그 필터 추가

---

## 4. 사이드 임팩트 분석

### 4.1 성능 영향

| 영향 영역 | 위험도 | 설명 | 완화 방안 |
|-----------|:------:|------|----------|
| **AI API 호출 증가** | 높음 | 데이터 생성마다 Claude API 호출 → 비용 + 지연 | 비동기 큐 처리, 배치 처리, 짧은 콘텐츠 스킵 (5단어 미만) |
| **DB 쓰기 부하** | 중간 | WorkItem + WorkItemTag INSERT 추가 | 비동기 이벤트로 분리, 트랜잭션 분리 |
| **기존 API 응답 지연** | 높음 | Todo/Contract 생성 API에 태깅 로직 추가 시 동기 처리하면 응답 느려짐 | 반드시 EventEmitter 비동기 처리 |
| **검색 쿼리 성능** | 중간 | 다중 테이블 JOIN (work_items + tags + 원본 엔티티) | 인덱스 추가, 검색 결과 캐싱 |

### 4.2 데이터 무결성

| 영향 영역 | 위험도 | 설명 | 완화 방안 |
|-----------|:------:|------|----------|
| **WorkItem 고아 레코드** | 중간 | 원본 삭제 시 WorkItem이 남을 수 있음 | 원본 soft delete 시 WorkItem도 soft delete 처리 |
| **태그 폭증** | 높음 | AI가 유사한 태그를 다양한 형태로 생성 | 정규화 서비스(이미 구현) 활용, 동의어 병합, 관리자 리뷰 UI |
| **기존 TodoEntity.tdoTags** | 낮음 | Todo에 이미 콤마 구분 `tdo_tags` 필드 존재 → KMS 태그와 이중 관리 | 마이그레이션: 기존 tdo_tags → KMS 태그로 일괄 변환 후 tdo_tags deprecated |
| **엔티티(법인) 격리** | 중간 | KMS 태그는 ent_id별로 격리 → Todo에는 ent_id가 없음 | Todo에 ent_id 컬럼 추가 또는 WorkItem 생성 시 사용자의 기본 법인 사용 |

### 4.3 기존 모듈 변경 영향

| 파일 | 변경 유형 | 영향 범위 |
|------|----------|----------|
| `todo.service.ts` | EventEmitter emit 추가 | createTodo, updateTodo 메서드 |
| `contract.service.ts` | EventEmitter emit 추가 | create, update 메서드 |
| `todo.entity.ts` | ent_id 컬럼 추가 (선택) | DB 마이그레이션 필요 |
| `TodoResponse` (types) | completedAt 필드 추가 (별도 이슈) | 프론트엔드 타입 변경 |
| `TodoMapper` | completedAt 매핑 추가 (별도 이슈) | 응답 구조 변경 |
| `kms.module.ts` | WorkItemSyncListener 등록 | 모듈 의존성 추가 |
| 프론트엔드 헤더 | GlobalSearchBar 추가 | 레이아웃 변경 |

### 4.4 보안 고려사항

| 항목 | 설명 |
|------|------|
| **접근 제어** | WorkItem의 `wit_visibility` + `wit_owner_id`로 검색 결과 필터링 필수 |
| **태그를 통한 정보 노출** | 비공개 데이터에서 추출된 태그가 태그 클라우드에 노출될 수 있음 → 태그 가시성 정책 필요 |
| **AI 프롬프트 주입** | 사용자 입력 데이터가 AI 태그 추출에 전달 → sanitization 필요 |

---

## 5. 구현 우선순위

### Phase 1: 기본 연동 (예상 3-4일)

1. **WorkItemSyncListener** 생성 - 이벤트 기반 WorkItem 자동 생성
2. **TodoService** 이벤트 emit 추가 (create/update)
3. **ContractService** 이벤트 emit 추가 (create/update)
4. **기존 데이터 백필** - 배치 스크립트로 기존 Todo, Contract → WorkItem + 태그 생성

### Phase 2: 검색 연동 (예상 3-4일)

5. **SearchService** 구현 - 통합 검색 API
6. **SearchController** 구현 - `GET /api/v1/search`
7. **GlobalSearchBar** 프론트엔드 컴포넌트
8. **검색 결과 페이지** - 모듈별 그룹핑 뷰

### Phase 3: 고도화 (예상 2-3일)

9. **태그 관리자 리뷰** - AI 태그 확인/거부/병합 대시보드
10. **기존 tdo_tags → KMS 태그 마이그레이션**
11. **벡터 검색 활성화** - 의미 기반 유사 문서 검색

---

## 6. 필요한 신규 파일

```
apps/api/src/domain/kms/
  ├── listener/work-item-sync.listener.ts      # 이벤트 리스너
  └── event/module-data.event.ts               # 이벤트 정의

apps/api/src/domain/search/
  ├── search.module.ts
  ├── controller/search.controller.ts
  ├── service/search.service.ts
  └── dto/response/search.response.ts

apps/web/src/components/common/
  └── GlobalSearchBar.tsx

apps/web/src/domain/search/
  ├── pages/SearchResultPage.tsx
  ├── hooks/useSearch.ts
  └── service/search.service.ts
```

---

## 7. 기존 코드 활용도

| 기존 서비스 | 활용 방법 | 수정 필요 |
|------------|----------|:---------:|
| `TagExtractionService` | AI 태그 추출 호출 | 없음 |
| `TagNormalizationService` | 태그 정규화 (중복 방지) | 없음 |
| `TagAssignmentService` | WorkItem-Tag 할당 | 없음 |
| `AutoTaggingService` | 자동 태깅 오케스트레이션 | 없음 |
| `ContentAnalyzerService` | 콘텐츠 분석 (언어 감지 등) | 없음 |
| `ModuleIntegrationService` | Billing 전용 태깅 | 확장 필요 (Todo 메서드 추가) |
| `TagCloudService` | 태그 클라우드 시각화 | 없음 |
| `KnowledgeGraphService` | 지식 그래프 | 없음 |

**결론**: KMS 핵심 서비스는 추가 수정 없이 그대로 활용 가능. 필요한 것은 **모듈 → KMS 연결 이벤트 레이어**와 **통합 검색 모듈** 신규 구현.

---

## 8. 의존성 다이어그램

```
TodoModule ─────emit('module.data.created')──┐
BillingModule ──emit('module.data.created')──┤
WebmailModule ──emit('module.data.created')──┤
                                              ▼
                                     KmsModule
                                    (Listener)
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
             WorkItemService   AutoTaggingService   TagCloudService
             (ACL Module)      (AI 추출+할당)       (시각화)
                    │                  │
                    ▼                  ▼
             amb_work_items    amb_kms_work_item_tags
                                       │
                                       ▼
                                 amb_kms_tags
                                       │
                                       ▼
                              SearchModule (신규)
                              (통합 검색 제공)
```

---

## 9. 미결정 사항

1. **AI 태그 추출 비용 정책**: 모든 데이터에 AI 추출 적용할 것인가, 일정 길이 이상만 적용할 것인가?
2. **Todo의 엔티티(법인) 귀속**: Todo에 `ent_id`를 추가할 것인가, 사용자 기본 법인을 사용할 것인가?
3. **기존 tdo_tags 처리**: deprecated 후 삭제할 것인가, KMS 태그와 병행 사용할 것인가?
4. **검색 결과 권한**: 팀원의 할일/메모를 검색에서 볼 수 있는가? (WorkItem visibility 정책)
5. **태그 자동 삭제**: 사용 횟수 0인 태그를 일정 기간 후 자동 정리할 것인가?
