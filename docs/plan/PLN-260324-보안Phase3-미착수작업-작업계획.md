# 보안 Phase 3 — 미착수 작업 리스트

**작성일**: 2026-03-24  
**기준 문서**: `docs/plan/PLAN-보안전체점검조치-작업계획-20260323.md`  
**상태**: Phase 1+2 완료 (17/26건), Phase 3 미착수 (9건)

---

## 개요

Phase 3는 중기 보안/성능 개선 항목으로, 현재 단일 인스턴스 운영 환경에서 즉시 위험도가 낮은 작업들입니다.  
SameSite=lax 쿠키, JWT HttpOnly, Rate Limiting 등 기본 방어가 이미 갖춰져 있어 긴급도는 낮습니다.

---

## 미착수 작업 목록

### 🟢 P18. CSRF 토큰 미들웨어
- **원본**: 주의3
- **현황**: SameSite=lax + httpOnly 쿠키로 기본 방어 중
- **작업**: `csurf` 또는 커스텀 CSRF 토큰 미들웨어 도입 (이중 방어)
- **규모**: S (반나절)
- **우선순위**: 낮음 — SameSite=lax가 주요 공격 벡터를 차단하고 있음
- **대상 파일**:
  - `apps/api/src/main.ts` — CSRF 미들웨어 등록
  - `apps/web/src/global/api/` — 요청 시 CSRF 토큰 헤더 포함

### 🟢 P19. 동시 로그인 제한
- **원본**: 주의6
- **현황**: 동일 계정 다중 디바이스 로그인 무제한
- **작업**: 세션/디바이스 추적 테이블 생성, 로그인 시 기존 세션 무효화 옵션
- **규모**: M (1일)
- **선행 조건**: 세션 관리 정책 결정 (최대 동시 세션 수, 강제 로그아웃 여부)
- **대상 파일**:
  - `apps/api/src/domain/auth/entity/` — 세션 엔티티 신설
  - `apps/api/src/domain/auth/service/auth.service.ts` — 로그인 시 세션 관리

### 🟢 P20. 이메일/전화번호 PII 암호화 저장
- **원본**: 주의8
- **현황**: `usr_email`, `usr_phone` 등 PII 데이터 평문 저장
- **작업**: CryptoService로 암호화 저장, 검색 시 해시 인덱스 활용
- **규모**: L (2일 이상)
- **선행 조건**: 검색 기능 영향 분석 (이메일 검색, 중복 확인 등)
- **주의사항**: 암호화 시 LIKE 검색 불가 → blind index 또는 검색 전략 변경 필요
- **대상 파일**:
  - `apps/api/src/domain/auth/entity/user.entity.ts`
  - `apps/api/src/domain/settings/service/crypto.service.ts`
  - 이메일 검색/중복확인 관련 서비스 전체

### 🟢 P21. DB SSL 연결
- **원본**: 주의9
- **현황**: Docker 내부 네트워크 통신, SSL 미적용
- **작업**: TypeORM `ssl` 옵션 환경별 적용 (production만)
- **규모**: XS (1시간 이내)
- **선행 조건**: PostgreSQL 서버 SSL 인증서 설정
- **대상 파일**:
  - `apps/api/src/app.module.ts` — TypeORM 설정
  - `env/backend/.env.production` — `DB_SSL=true` 환경변수

### 🟢 P22. AI 프롬프트 입력 이스케이프
- **원본**: 주의11
- **현황**: 거래처명, 이슈 제목 등 사용자 입력이 Claude 프롬프트에 직접 삽입
- **작업**: 프롬프트 템플릿에 사용자 입력 이스케이프/구분자 적용
- **규모**: S (반나절)
- **주의사항**: 프롬프트 인젝션 완전 방어는 불가, 피해 범위 제한에 초점
- **대상 파일**:
  - `apps/api/src/infrastructure/external/claude/claude.service.ts`
  - 각 도메인별 AI 프롬프트 생성 서비스들

### 🟢 P23. 체계적 로깅 도입 (Winston/Pino)
- **원본**: 주의12
- **현황**: NestJS 기본 Logger + console.log 혼용
- **작업**: Winston 또는 Pino 도입, 구조화된 JSON 로그 포맷, 레벨별 분리
- **규모**: M (1일)
- **대상 파일**:
  - `apps/api/src/main.ts` — 커스텀 Logger 등록
  - 전체 서비스의 `console.log` → Logger 전환
  - Docker 로그 드라이버 설정

### 🟢 P24. Git 히스토리 민감 데이터 정리
- **원본**: 위험1 연관
- **현황**: 과거 커밋에 `.env` 파일 등 민감 데이터가 남아있을 수 있음
- **작업**: BFG Repo-Cleaner로 히스토리 정리, 노출된 키 전체 로테이션
- **규모**: M (1일)
- **주의사항**: force push 필요 → 팀 전원 로컬 리포 재클론 필요
- **선행 조건**: 전 개발자에게 사전 고지, 백업 후 진행

### 🟢 P25. Cron 분산 락 도입
- **원본**: PLAN-보안점검조치 P6
- **현황**: 메일 동기화(5분), 빌링 자동화(매일) — 메모리 플래그 기반 중복 방지
- **작업**: Redis 또는 DB advisory lock 기반 분산 락 유틸리티 도입
- **규모**: M (1일)
- **조건**: 다중 인스턴스 스케일링 시에만 필요, **현재 단일 인스턴스면 불요**
- **대상 파일**:
  - `apps/api/src/global/util/distributed-lock.ts` — 신설
  - `mail-sync-cron.service.ts`, `billing-automation.service.ts` — 적용

### 🟢 P26. KMS 배치 태깅 N+1 해소
- **원본**: PLAN-보안점검조치 P7
- **현황**: workItem 조회는 배치 처리 완료, `safeAutoTag()` 루프 내 개별 호출
- **작업**: autoTaggingService에 배치 태깅 메서드 추가
- **규모**: S (반나절)
- **대상 파일**:
  - `auto-tagging.service.ts` — 배치 메서드 추가
  - `batch-sync.service.ts` — 배치 호출로 전환

---

## 우선순위 권장 순서

| 순서 | 항목 | 이유 |
|------|------|------|
| 1 | P21 DB SSL | 규모 XS, 독립적, 즉시 적용 가능 |
| 2 | P22 AI 프롬프트 이스케이프 | 규모 S, 프롬프트 인젝션 방어 |
| 3 | P26 KMS 배치 태깅 | 규모 S, 성능 개선 효과 높음 |
| 4 | P18 CSRF 토큰 | 규모 S, 이중 방어 강화 |
| 5 | P23 로깅 도입 | 규모 M, 운영 모니터링 개선 |
| 6 | P19 동시 로그인 제한 | 규모 M, 정책 결정 선행 필요 |
| 7 | P25 Cron 분산 락 | 규모 M, 스케일링 시에만 필요 |
| 8 | P24 Git 히스토리 정리 | 규모 M, 팀 협조 필요 |
| 9 | P20 PII 암호화 | 규모 L, 검색 영향 분석 필수 |

---

## 보안 점수 현황

| 시점 | 점수 | 등급 |
|------|------|------|
| 점검 시 (2026-03-23) | 73점 | B- |
| Phase 1+2 완료 (현재) | **~88점** | **A-** |
| Phase 3 완료 시 (예상) | ~95점 | A+ |

---

*작성: Claude Code*  
*참조: `docs/implementation/RPT-보안전체점검조치-작업완료보고-20260324.md`*
