# 요구사항 분석서: Asana 태스크 → AMA 이슈 임포트

> **문서번호**: REQ-Asana태스크임포트-20260323
> **작성일**: 2026-03-23
> **상태**: 분석 완료

---

## 1. 요구사항 개요

Asana 특정 프로젝트의 태스크 리스트를 AMA 시스템의 특정 프로젝트 이슈로 가져오는 기능 구현

### 1.1 대상 Asana 프로젝트
- **URL**: `https://app.asana.com/1/6477513906631/project/1203298713112698/list/1204029304319632`
- **Project ID**: `1203298713112698`
- **Workspace ID**: `6477513906631`

### 1.2 목표
- Asana 프로젝트의 태스크를 AMA 이슈로 1:1 매핑하여 임포트
- 임포트 후 AMA 내에서 이슈 관리 (상태 변경, 담당자 지정 등)
- 중복 임포트 방지 및 재동기화 지원

---

## 2. AS-IS 현황 분석

### 2.1 AMA 이슈 시스템
| 항목 | 현재 상태 |
|------|-----------|
| 이슈 엔티티 | `amb_issues` (14개 이상 필드, 계층구조 지원) |
| 이슈 타입 | BUG, FEATURE_REQUEST, OPINION, TASK, OTHER |
| 이슈 상태 | OPEN → APPROVED → IN_PROGRESS → RESOLVED → CLOSED |
| 심각도 | CRITICAL, MAJOR, MINOR |
| 우선순위 | 1~5 (기본값 3) |
| 외부 연동 | iss_github_id, iss_redmine_id 필드 존재 (Asana는 없음) |
| 프로젝트 연결 | pjt_id (FK, nullable) |

### 2.2 기존 외부 연동 패턴 (Slack 참조)
| 항목 | 구현 방식 |
|------|-----------|
| 인증 저장 | `amb_api_keys` 테이블 (AES-256-GCM 암호화) |
| 설정 UI | EntityExternalConnectPage → 서비스별 설정 페이지 |
| 연동 구조 | 모듈 분리 (controller/service/entity/dto) |
| 매핑 관리 | 외부 ID ↔ AMA ID 매핑 테이블 |

### 2.3 Asana API
| 항목 | 내용 |
|------|------|
| 인증 | Personal Access Token (Bearer) |
| 태스크 조회 | `GET /api/1.0/projects/{project_gid}/tasks` |
| 응답 필드 | name, notes, assignee, due_on, completed, custom_fields 등 |
| 페이지네이션 | 커서 기반 (limit 최대 100, next_page.offset) |
| 우선순위 | 커스텀 필드 (enum 타입) — 표준 필드 아님 |

---

## 3. TO-BE 요구사항

### 3.1 기능 요구사항

#### F1. Asana PAT(Personal Access Token) 등록
- Entity Settings > External Connect에서 Asana PAT 입력/저장
- 기존 `amb_api_keys` 테이블 활용 (provider: `ASANA_PAT`)
- 암호화 저장 (CryptoService 재사용)
- 연결 테스트: `GET /api/1.0/users/me` 호출로 검증

#### F2. Asana 프로젝트 연결 설정
- Asana URL 또는 Project ID 입력
- URL에서 Project ID 자동 추출 (V0/V1 형식 모두 지원)
- 프로젝트 정보 확인: 이름, 태스크 수 등
- AMA 프로젝트와 매핑 설정

#### F3. 태스크 임포트
- Asana 프로젝트의 태스크를 AMA 이슈로 벌크 생성
- 필드 매핑:

| Asana 필드 | AMA 이슈 필드 | 매핑 규칙 |
|-----------|--------------|-----------|
| `name` | `iss_title` | 그대로 매핑 |
| `notes` / `html_notes` | `iss_description` | plain text 사용 |
| `completed` | `iss_status` | true→CLOSED, false→OPEN |
| `due_on` | `iss_due_date` | 날짜 형식 변환 |
| `start_on` | `iss_start_date` | 날짜 형식 변환 |
| `assignee.name` | (참고 정보) | 자동 매핑 불가, 설명에 포함 |
| `custom_fields[Priority]` | `iss_priority` | enum→숫자 변환 |
| `memberships[0].section.name` | (참고 정보) | 설명에 포함 |
| `permalink_url` | `iss_ref_number` 또는 설명에 포함 | Asana 원본 링크 |
| `gid` | 매핑 테이블 | 중복 방지용 |

#### F4. 중복 방지
- Asana task GID ↔ AMA issue ID 매핑 테이블
- 이미 임포트된 태스크는 스킵
- 재동기화 시 변경사항만 업데이트 (선택 기능)

#### F5. 임포트 결과 표시
- 임포트 완료 후 결과 요약 (총 N건, 성공 N건, 스킵 N건, 실패 N건)

### 3.2 비기능 요구사항
- Asana API Rate Limit 준수 (150 req/min)
- 대량 태스크 임포트 시 배치 처리
- PAT 암호화 저장 (AES-256-GCM)

---

## 4. 갭 분석

| 항목 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| Asana 인증 | 없음 | PAT 저장/관리 | `amb_api_keys`에 provider 추가 |
| Asana API 호출 | 없음 | REST API 클라이언트 | 신규 서비스 구현 |
| 프로젝트 매핑 | 없음 | Asana↔AMA 프로젝트 매핑 | 신규 테이블 또는 설정 |
| 태스크→이슈 변환 | 없음 | 필드 매핑 로직 | 신규 서비스 구현 |
| 중복 방지 | 없음 | GID↔이슈ID 매핑 | 신규 테이블 |
| 이슈 엔티티 | iss_github_id, iss_redmine_id 있음 | iss_asana_gid 추가 | 컬럼 추가 |
| UI | External Connect 페이지 있음 | Asana 설정 카드 추가 | 신규 페이지 |

---

## 5. 데이터 모델 설계

### 5.1 신규 테이블: `amb_asana_project_mappings`
```sql
CREATE TABLE amb_asana_project_mappings (
  apm_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ent_id          UUID NOT NULL,                    -- 법인 ID
  apm_asana_project_gid VARCHAR(50) NOT NULL,       -- Asana Project GID
  apm_asana_project_name VARCHAR(200),              -- Asana 프로젝트 이름
  pjt_id          UUID,                             -- AMA 프로젝트 ID (FK)
  apm_status      VARCHAR(20) DEFAULT 'ACTIVE',     -- ACTIVE | PAUSED
  apm_last_synced_at TIMESTAMP,                     -- 마지막 동기화 시각
  apm_created_at  TIMESTAMP DEFAULT NOW(),
  apm_updated_at  TIMESTAMP DEFAULT NOW(),
  apm_deleted_at  TIMESTAMP
);
```

### 5.2 신규 테이블: `amb_asana_task_mappings`
```sql
CREATE TABLE amb_asana_task_mappings (
  atm_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apm_id          UUID NOT NULL,                    -- FK → project mapping
  atm_asana_task_gid VARCHAR(50) NOT NULL,          -- Asana Task GID
  iss_id          UUID NOT NULL,                    -- FK → amb_issues
  atm_direction   VARCHAR(20) DEFAULT 'INBOUND',    -- INBOUND
  atm_created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(apm_id, atm_asana_task_gid)                -- 중복 방지
);
```

### 5.3 이슈 엔티티 확장
```sql
ALTER TABLE amb_issues ADD COLUMN iss_asana_gid VARCHAR(50);
```

---

## 6. 시스템 구조 설계

### 6.1 백엔드 모듈 구조
```
apps/api/src/domain/asana-integration/
├── asana-integration.module.ts
├── controller/
│   └── asana-admin.controller.ts        -- /entity-settings/asana/*
├── service/
│   ├── asana-api.service.ts             -- Asana REST API 클라이언트
│   └── asana-import.service.ts          -- 태스크→이슈 변환/임포트
├── entity/
│   ├── asana-project-mapping.entity.ts
│   └── asana-task-mapping.entity.ts
└── dto/
    ├── create-asana-project-mapping.dto.ts
    └── import-asana-tasks.dto.ts
```

### 6.2 API 엔드포인트
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/entity-settings/asana/config` | Asana PAT 저장 |
| GET | `/entity-settings/asana/config` | Asana 설정 조회 |
| DELETE | `/entity-settings/asana/config` | Asana PAT 삭제 |
| POST | `/entity-settings/asana/test-connection` | 연결 테스트 |
| GET | `/entity-settings/asana/projects/:gid` | Asana 프로젝트 정보 조회 |
| GET | `/entity-settings/asana/projects/:gid/tasks` | Asana 태스크 미리보기 |
| POST | `/entity-settings/asana/mappings` | 프로젝트 매핑 생성 |
| GET | `/entity-settings/asana/mappings` | 프로젝트 매핑 목록 |
| DELETE | `/entity-settings/asana/mappings/:id` | 프로젝트 매핑 삭제 |
| POST | `/entity-settings/asana/mappings/:id/import` | 태스크 임포트 실행 |

### 6.3 프론트엔드
```
apps/web/src/domain/entity-settings/pages/
└── EntityAsanaIntegrationPage.tsx       -- Asana 연동 설정 페이지

apps/web/src/domain/asana-integration/
├── service/asana-integration.service.ts
└── hooks/useAsanaIntegration.ts
```

---

## 7. Asana → AMA 필드 매핑 상세

### 7.1 상태 매핑
| Asana completed | Section Name (참고) | AMA Status |
|----------------|---------------------|------------|
| false | (any) | OPEN |
| true | (any) | CLOSED |

### 7.2 우선순위 매핑 (커스텀 필드)
| Asana Priority | AMA Priority |
|---------------|-------------|
| High | 1 |
| Medium | 3 |
| Low | 5 |
| (없음) | 3 (기본값) |

### 7.3 이슈 타입
- 모든 Asana 태스크는 `TASK` 타입으로 임포트
- Section name을 참고 정보로 설명에 포함

---

## 8. 사용자 플로우

```
1. Entity Settings > External Connect > Asana 카드 클릭
2. Asana PAT 입력 → 연결 테스트 → 저장
3. "프로젝트 연결" 버튼 → Asana URL/ID 입력
4. Asana 프로젝트 정보 확인 (이름, 태스크 수)
5. AMA 프로젝트 선택 (드롭다운)
6. "매핑 생성" → 프로젝트 매핑 저장
7. 매핑 목록에서 "Import" 버튼 클릭
8. 태스크 미리보기 → "임포트 실행"
9. 결과 표시: N건 임포트, N건 스킵, N건 실패
```

---

## 9. 기술 제약사항

1. **Asana API Rate Limit**: 150 requests/minute — 배치 임포트 시 throttle 필요
2. **담당자 매핑 불가**: Asana 사용자 ↔ AMA 사용자 자동 매핑이 어려움 → 담당자 정보는 설명에 텍스트로 포함
3. **커스텀 필드 다양성**: Asana 프로젝트마다 커스텀 필드가 다를 수 있음 → Priority 등 알려진 필드만 매핑
4. **실시간 동기화**: 초기 버전에서는 수동 임포트만 지원 (Asana Webhooks는 향후 확장)
5. **서브태스크**: 1단계에서는 최상위 태스크만 임포트 (서브태스크는 향후)

---

## 10. 구현 우선순위

| 단계 | 기능 | 우선순위 |
|------|------|----------|
| Phase 1 | PAT 등록/연결 테스트 + 프로젝트 매핑 | 필수 |
| Phase 1 | 태스크 벌크 임포트 (→ AMA 이슈 생성) | 필수 |
| Phase 1 | 중복 방지 (GID 매핑) | 필수 |
| Phase 2 | 재동기화 (변경사항 업데이트) | 선택 |
| Phase 2 | 서브태스크 임포트 | 선택 |
| Phase 3 | Asana Webhooks (실시간 동기화) | 향후 |
