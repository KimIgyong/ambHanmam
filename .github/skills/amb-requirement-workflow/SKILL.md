---
name: amb-requirement-workflow
description: "AMA 프로젝트 요구사항 작업 워크플로우. `[요구사항]` 타이틀로 요청된 건에 대해 요구사항분석서 → 작업계획서 → 구현 → 테스트케이스 → 작업완료보고서 순서로 진행한다. USE FOR: 요구사항 기반 기능 개발, 신규 모듈 구현, 대규모 변경 작업. DO NOT USE FOR: 단순 버그 수정, 스타일 변경, 설정 변경 등 소규모 작업."
---

# AMA 요구사항 작업 워크플로우

## 트리거 조건
사용자 요청에 `[요구사항]` 타이틀이 포함된 경우 반드시 이 워크플로우를 따른다.

## 작업 순서

### 1단계: 요구사항 분석서
- **출력 파일**: `docs/analysis/REQ-{YYMMDD}-{제목}.md`
- **필수 포함 내용**:
  - AS-IS 현황 분석 (현재 시스템 상태, 관련 코드/테이블 현황)
  - TO-BE 요구사항 (목표 상태, 기능 명세)
  - 갭 분석 (AS-IS ↔ TO-BE 차이점)
  - 사용자 플로우 (UI/UX 흐름, 시퀀스)
  - 기술 제약사항 (호환성, 성능, 보안)
- **작성 전 확인**: 관련 기존 코드, DB 스키마, API 엔드포인트를 반드시 탐색하여 정확한 현황 파악

### 2단계: 작업 계획서
- **출력 파일**: `docs/plan/PLN-{YYMMDD}-{제목}.md`
- **필수 포함 내용**:
  - 시스템 개발 현황 분석 기반 계획 수립
  - 단계별 구현 계획 (Phase 분리, 각 Phase 목표/산출물 명시)
  - 변경 대상 파일 목록 (신규/수정/삭제)
  - 사이드 임팩트 분석 (기존 기능 영향도, 의존성)
  - DB 마이그레이션 필요 여부 (스테이징/프로덕션은 수동 SQL 필수)

### 3단계: 구현
- 작업 계획서의 Phase별로 순차 구현
- 각 Phase 완료 시 빌드 검증 (`npm run -w @amb/web build` 또는 `npm run -w @amb/api build`)
- **코드 규칙 준수**:
  - DB 네이밍: `amb_` prefix + snake_case, 컬럼 3자 prefix
  - API: `/api/v1` base path, Request snake_case, Response camelCase
  - USER_LEVEL 엔드포인트: `@Auth()` + `@UseGuards(OwnEntityGuard)` + `resolveEntityId()` 필수
  - i18n: UI 텍스트 하드코딩 금지, `t()` 함수 사용 (ko/en/vi 3개 언어)
  - 새 네임스페이스 추가 시 `i18n.ts`에 등록

### 4단계: 테스트 케이스
- **출력 파일**: `docs/test/TCR-{YYMMDD}-{제목}.md`
- **필수 포함 내용**:
  - 단위 테스트 케이스 (입력/기대출력/검증항목)
  - 통합 테스트 시나리오 (엔드투엔드 플로우)
  - 엣지 케이스 (경계값, 에러 상황, 권한 시나리오)
  - 데이터 격리 검증 (USER_LEVEL 간 데이터 접근 차단 확인)

### 5단계: 작업 완료 보고
- **출력 파일**: `docs/implementation/RPT-{YYMMDD}-{제목}.md`
- **필수 포함 내용**:
  - 구현 내용 요약
  - 변경 파일 목록 (신규/수정, 파일 경로)
  - DB 변경사항 (테이블/컬럼 추가, 마이그레이션 SQL)
  - 테스트 결과 요약
  - 배포 상태 (미배포/스테이징/프로덕션)
  - 후속 작업 (있을 경우)

## 프로젝트 컨텍스트

### 기술 스택
- Frontend: React 18 + TypeScript 5 + TailwindCSS 3 + Vite 5
- Backend: NestJS 10 + TypeORM + PostgreSQL 15
- 모노레포: npm workspaces + Turborepo
- `apps/api/` (백엔드), `apps/web/` (프론트엔드), `packages/types/` (공유 타입)

### 데이터 격리 (필수 확인)
- `USER_LEVEL` 사용자는 소속 법인(`ent_id`) 범위만 접근 가능
- 모든 USER_LEVEL API: `@Auth()` → `@UseGuards(OwnEntityGuard)` → `resolveEntityId()` → entityId 필터링
- `ADMIN_LEVEL`은 모든 법인 접근 (OwnEntityGuard 바이패스)
- `ent_id` 필터 누락 = 타 법인 데이터 노출 보안 사고

### 배포 참고
- 스테이징/프로덕션: TypeORM synchronize 비활성화 → DB 변경 시 수동 SQL 필수
- 배포: `bash docker/staging/deploy-staging.sh` (직접 `docker compose build` 금지)
