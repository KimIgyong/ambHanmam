# 요구사항 분석서: 포탈 회원가입 GDPR 약관 동의

> 문서 ID: REQ-포탈회원가입-GDPR약관동의-20260327
> 작성일: 2026-03-27
> 대상 URL: https://stg-www.amoeba.site/register
> 앱: portal-web (Frontend) + portal-api (Backend)

---

## 1. AS-IS 현황 분석

### 1.1 프론트엔드 (RegisterPage.tsx)

**파일**: `apps/portal-web/src/pages/auth/RegisterPage.tsx`

| 항목 | 현재 상태 |
|------|----------|
| 폼 필드 순서 | name → email → password → company_name → phone + country (2열) |
| company_name | `optional` (zod: `z.string().optional()`) |
| phone | `optional` (zod: `z.string().optional()`) |
| country | `optional` (zod: `z.string().optional()`) |
| 국가 선택 | `<select>` 하드코딩 5개 (KR, VN, US, JP, SG) |
| 서비스 이용약관 동의 | **없음** |
| 개인정보보호 약관 | **없음** |
| 쿠키 설정 | **없음** |
| GDPR 관련 처리 | **없음** |

### 1.2 백엔드 (Register DTO / Service)

**DTO 파일**: `apps/portal-api/src/domain/auth/dto/request/register.request.ts`

| 필드 | 데코레이터 | 필수 여부 |
|------|-----------|----------|
| email | `@IsEmail()` | 필수 |
| password | `@IsString() @MinLength(8) @Matches(...)` | 필수 |
| name | `@IsString() @MinLength(1)` | 필수 |
| company_name | `@IsOptional() @IsString() @MaxLength(300)` | **선택** |
| phone | `@IsOptional() @IsString() @MaxLength(30)` | **선택** |
| country | `@IsOptional() @IsString() @MaxLength(5)` | **선택** |
| terms_agreed | **없음** | - |
| privacy_agreed | **없음** | - |
| marketing_agreed | **없음** | - |

### 1.3 엔티티 (PortalCustomerEntity)

**파일**: `apps/portal-api/src/domain/auth/entity/portal-customer.entity.ts`
**테이블**: `amb_svc_portal_customers`

| 컬럼 | 타입 | Nullable | 약관 관련 |
|------|------|----------|----------|
| pct_company_name | varchar(300) | nullable | - |
| pct_phone | varchar(30) | nullable | - |
| pct_country | varchar(5) | nullable | - |
| (약관 관련 컬럼) | 없음 | - | **미구현** |

### 1.4 i18n 번역 파일

- `apps/portal-web/src/locales/{en,ko,vi}/common.json`
- 약관 관련 번역 키: **없음**

### 1.5 약관/정책 페이지

- 서비스 이용약관 페이지: **없음**
- 개인정보보호 정책 페이지: **없음**
- 쿠키 정책/설정 페이지: **없음**

---

## 2. TO-BE 요구사항

### 2.1 회원가입 폼 변경

#### REQ-01: 필수 필드 변경
| 필드 | AS-IS | TO-BE | 비고 |
|------|-------|-------|------|
| company_name (회사명) | 선택 | **필수** | 빈 값 제출 불가 |
| country (국가) | 선택 | **필수** | 미선택 시 제출 불가 |
| phone (전화번호) | 선택 | **필수** | 빈 값 제출 불가 |

#### REQ-02: 폼 필드 순서 변경
| AS-IS 순서 | TO-BE 순서 |
|-----------|-----------|
| 1. name | 1. name |
| 2. email | 2. email |
| 3. password | 3. password |
| 4. company_name | 4. **company_name** (필수, 독립 행) |
| 5. phone + country (2열) | 5. **country** (필수, 독립 행 또는 전화번호와 함께) |
| | 6. **phone** (필수, 국가 코드 연동 고려) |

> **순서 원칙**: 개인정보(이름→이메일→비밀번호) → 회사정보(회사명→국가→전화번호) → 약관동의

#### REQ-03: 국가 선택 개선
- 현재 5개국 하드코딩 → **전체 국가 목록** 또는 주요 국가 확대
- 국가 코드에 따른 전화번호 국가번호 자동 표시 고려 (UX 개선)

### 2.2 약관 동의 체크박스 추가

#### REQ-04: 서비스 이용약관 동의 (필수)
- **체크박스 레이블**: "아메바컴퍼니가 제공하는 AMA 트라이얼 서비스 이용약관에 동의합니다."
- **링크**: 서비스 이용약관 전문을 볼 수 있는 링크/모달
- **필수 여부**: **필수** — 미체크 시 가입 불가
- **GDPR 요건**: 명시적 동의 (pre-checked 금지)

#### REQ-05: 개인정보보호 약관 동의 (필수)
- **체크박스 레이블**: "개인정보 수집 및 이용에 동의합니다."
- **링크**: 개인정보보호 정책 전문을 볼 수 있는 링크/모달
- **필수 여부**: **필수** — 미체크 시 가입 불가
- **GDPR 요건**: 수집 항목, 이용 목적, 보유 기간 명시

#### REQ-06: 마케팅 수신 동의 (선택)
- **체크박스 레이블**: "마케팅 정보 수신에 동의합니다. (선택)"
- **필수 여부**: **선택** — 미체크라도 가입 가능
- **GDPR 요건**: Opt-in 방식 (기본 해제)

#### REQ-07: 전체 동의 체크박스
- "전체 약관에 동의합니다" 체크박스
- 체크 시 REQ-04, REQ-05, REQ-06 전체 체크
- 개별 해제 시 전체 동의도 해제

### 2.3 약관 문서 페이지

#### REQ-08: 기본 표준 약관 (Terms of Service)
- **경로**: `/page/terms-of-service` (CMS 페이지 또는 정적 라우트)
- **내용 구성**:
  - 서비스 개요 (AMA Trial Service)
  - 이용 자격
  - 서비스 이용 범위 및 제한
  - 계정 관리 책임
  - 지적재산권
  - 서비스 중단/변경
  - 책임 제한
  - 분쟁 해결
  - 준거법
- **언어**: 영어(기본), 한국어, 베트남어 (i18n)

#### REQ-09: 개인정보보호 정책 (Privacy Policy)
- **경로**: `/page/privacy-policy`
- **GDPR 필수 포함 사항**:
  - 데이터 컨트롤러 정보 (아메바컴퍼니)
  - 수집하는 개인정보 항목 (이름, 이메일, 전화번호, 회사명, 국가)
  - 수집 목적 (서비스 제공, 계정 관리, 커뮤니케이션)
  - 처리의 법적 근거 (동의, 계약 이행, 정당한 이익)
  - 데이터 보유 기간
  - 제3자 공유 범위 (결제 프로세서 등)
  - 국제 데이터 이전 (한국/베트남 서버)
  - 정보주체 권리 (접근권, 정정권, 삭제권, 이동권, 처리제한권, 반대권)
  - DPO (Data Protection Officer) 연락처
  - 감독기관 민원 제기 권리
  - 정책 변경 통지 방법
- **언어**: 영어(기본), 한국어, 베트남어 (i18n)

### 2.4 쿠키 설정 기능

#### REQ-10: 쿠키 동의 배너
- **표시 조건**: 최초 방문 시 또는 쿠키 동의가 없는 경우
- **위치**: 화면 하단 고정 배너
- **내용**: "이 사이트는 쿠키를 사용합니다. 필수 쿠키는 사이트 운영에 필요합니다."
- **버튼**:
  - "모두 허용" — 전체 쿠키 동의
  - "필수만 허용" — 필수 쿠키만
  - "쿠키 설정" — 상세 설정 모달/페이지 열기

#### REQ-11: 쿠키 카테고리 분류 (GDPR 기준)
| 카테고리 | 필수/선택 | 설명 | 예시 |
|---------|----------|------|------|
| Strictly Necessary (필수) | 필수 (비활성화 불가) | 사이트 기본 기능 | 세션, 인증 토큰, CSRF |
| Analytics (분석) | 선택 | 사이트 이용 통계 | Google Analytics, 페이지뷰 추적 |
| Marketing (마케팅) | 선택 | 광고/마케팅 추적 | 리타겟팅, 전환 추적 |
| Functional (기능) | 선택 | 사용자 환경설정 | 언어 설정, 테마 |

#### REQ-12: 쿠키 설정 관리
- **경로**: `/page/cookie-policy` (쿠키 정책 페이지)
- **설정 접근**: 풋터 링크 또는 쿠키 배너에서 접근
- **저장**: LocalStorage에 쿠키 동의 상태 저장
- **동의 철회**: 언제든 설정 변경 가능

---

## 3. 갭 분석

### 3.1 프론트엔드 변경 사항

| # | 변경 항목 | 난이도 | 영향 범위 |
|---|---------|--------|----------|
| F-01 | RegisterPage.tsx: company_name, country, phone 필수 처리 | 낮음 | zod 스키마 변경 |
| F-02 | RegisterPage.tsx: 폼 필드 순서 재배치 | 낮음 | JSX 순서 변경 |
| F-03 | RegisterPage.tsx: 약관 동의 체크박스 3종 + 전체 동의 추가 | 중간 | 새 UI 컴포넌트 |
| F-04 | 약관 모달/페이지 컴포넌트 신규 생성 | 중간 | 새 페이지/모달 |
| F-05 | 쿠키 동의 배너 컴포넌트 신규 생성 | 중간 | PublicLayout에 추가 |
| F-06 | 쿠키 설정 모달 컴포넌트 신규 생성 | 중간 | 새 모달 컴포넌트 |
| F-07 | i18n 번역 키 추가 (en/ko/vi) | 낮음 | common.json 3개 |
| F-08 | 국가 선택 목록 확대 | 낮음 | 국가 데이터 추가 |

### 3.2 백엔드 변경 사항

| # | 변경 항목 | 난이도 | 영향 범위 |
|---|---------|--------|----------|
| B-01 | RegisterRequest DTO: company_name, phone, country → 필수 | 낮음 | DTO 검증 변경 |
| B-02 | RegisterRequest DTO: 약관 동의 필드 추가 | 낮음 | DTO 필드 추가 |
| B-03 | PortalCustomerEntity: 약관 관련 컬럼 추가 | 중간 | DB 스키마 변경 |
| B-04 | PortalAuthService.register(): 약관 동의 저장 로직 | 낮음 | 서비스 로직 변경 |
| B-05 | SvcClientEntity: cliCompanyName 필수화 이미 구현됨 | 없음 | 변경 불필요 |

### 3.3 DB 스키마 변경 사항

| # | 테이블 | 변경 | SQL 예시 |
|---|--------|------|---------|
| D-01 | amb_svc_portal_customers | pct_company_name: nullable → NOT NULL (default '') | `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` |
| D-02 | amb_svc_portal_customers | pct_phone: nullable → NOT NULL (default '') | `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` |
| D-03 | amb_svc_portal_customers | pct_country: nullable → NOT NULL (default '') | `ALTER TABLE ... ALTER COLUMN ... SET NOT NULL` |
| D-04 | amb_svc_portal_customers | 신규: pct_terms_agreed_at (timestamptz, nullable) | `ALTER TABLE ... ADD COLUMN ...` |
| D-05 | amb_svc_portal_customers | 신규: pct_privacy_agreed_at (timestamptz, nullable) | `ALTER TABLE ... ADD COLUMN ...` |
| D-06 | amb_svc_portal_customers | 신규: pct_marketing_agreed_at (timestamptz, nullable) | `ALTER TABLE ... ADD COLUMN ...` |
| D-07 | amb_svc_portal_customers | 신규: pct_terms_version (varchar(20), nullable) | `ALTER TABLE ... ADD COLUMN ...` |
| D-08 | amb_svc_portal_customers | 신규: pct_privacy_version (varchar(20), nullable) | `ALTER TABLE ... ADD COLUMN ...` |

> **주의**: 스테이징/프로덕션은 `synchronize: false`이므로 수동 SQL 마이그레이션 필수

### 3.4 신규 컴포넌트/파일 목록

| # | 경로 | 설명 |
|---|------|------|
| N-01 | `apps/portal-web/src/components/consent/CookieConsentBanner.tsx` | 쿠키 동의 배너 |
| N-02 | `apps/portal-web/src/components/consent/CookieSettingsModal.tsx` | 쿠키 설정 모달 |
| N-03 | `apps/portal-web/src/components/consent/TermsAgreementSection.tsx` | 약관 동의 체크박스 그룹 |
| N-04 | `apps/portal-web/src/hooks/useCookieConsent.ts` | 쿠키 동의 상태 관리 훅 |
| N-05 | `apps/portal-web/src/data/countries.ts` | 국가 목록 데이터 |

---

## 4. 사용자 플로우

### 4.1 회원가입 플로우 (변경 후)

```
[사용자] → /register 접속
    │
    ├─ (1) 쿠키 동의 배너 표시 (최초 방문 시)
    │     ├─ "모두 허용" → 모든 쿠키 활성화
    │     ├─ "필수만 허용" → 필수 쿠키만
    │     └─ "쿠키 설정" → 카테고리별 선택 모달
    │
    ├─ (2) 회원가입 폼 입력
    │     ├─ 이름 * (필수)
    │     ├─ 이메일 * (필수)
    │     ├─ 비밀번호 * (필수, 복잡도 검증)
    │     ├─ 회사명 * (필수) ← 변경: optional → required
    │     ├─ 국가 * (필수, 드롭다운) ← 변경: optional → required, 순서 변경
    │     └─ 전화번호 * (필수) ← 변경: optional → required, 순서 변경
    │
    ├─ (3) 약관 동의 영역
    │     ├─ [□] 전체 약관에 동의합니다
    │     ├─ [□] 서비스 이용약관에 동의합니다 (필수) → [약관 보기] 링크
    │     ├─ [□] 개인정보 수집 및 이용에 동의합니다 (필수) → [약관 보기] 링크
    │     └─ [□] 마케팅 정보 수신에 동의합니다 (선택)
    │
    ├─ (4) [계정 만들기] 버튼 클릭
    │     ├─ 유효성 검증 (필수 필드 + 필수 약관 체크)
    │     ├─ 실패 → 에러 메시지 표시
    │     └─ 성공 → API POST /portal/auth/register
    │
    └─ (5) /verify-email-sent 페이지로 이동
```

### 4.2 쿠키 설정 플로우

```
[사용자] → 사이트 접속 (어느 페이지든)
    │
    ├─ LocalStorage에 cookie_consent 없음
    │     └─ 하단 CookieConsentBanner 표시
    │         ├─ [모두 허용] → consent:{necessary:true, analytics:true, marketing:true, functional:true} 저장
    │         ├─ [필수만 허용] → consent:{necessary:true, analytics:false, marketing:false, functional:false} 저장
    │         └─ [쿠키 설정] → CookieSettingsModal 표시
    │               ├─ 필수 쿠키 (토글 비활성화, 항상 ON)
    │               ├─ 분석 쿠키 (토글 ON/OFF)
    │               ├─ 마케팅 쿠키 (토글 ON/OFF)
    │               ├─ 기능 쿠키 (토글 ON/OFF)
    │               └─ [설정 저장] → consent 저장, 배너 닫기
    │
    ├─ LocalStorage에 cookie_consent 있음
    │     └─ 배너 미표시 (동의 상태에 따라 쿠키 관리)
    │
    └─ 풋터 "쿠키 설정" 링크
          └─ CookieSettingsModal 재표시 (기존 설정 로드)
```

### 4.3 약관 열람 플로우

```
[사용자] → 회원가입 폼의 [서비스 이용약관 보기] 클릭
    │
    ├─ 방식 A: 새 탭에서 /page/terms-of-service 열기
    └─ 방식 B: 인라인 모달로 약관 전문 표시 (스크롤)
         └─ 하단 [닫기] 버튼

[사용자] → 회원가입 폼의 [개인정보보호정책 보기] 클릭
    │
    ├─ 방식 A: 새 탭에서 /page/privacy-policy 열기
    └─ 방식 B: 인라인 모달로 정책 전문 표시 (스크롤)
         └─ 하단 [닫기] 버튼
```

---

## 5. GDPR 컴플라이언스 체크리스트

### 5.1 회원가입 관련

| # | GDPR 요건 | 현재 상태 | TO-BE |
|---|----------|----------|-------|
| G-01 | 명시적 동의 (Explicit Consent) | ❌ 없음 | ✅ 체크박스 (Pre-checked 금지) |
| G-02 | 목적 제한 (Purpose Limitation) | ❌ 명시 없음 | ✅ 수집 목적 별도 명시 |
| G-03 | 데이터 최소화 (Data Minimisation) | ⚠️ 부분 | ✅ 필요 항목만 수집 |
| G-04 | 동의 철회 권리 (Right to Withdraw) | ❌ 없음 | ✅ 설정에서 마케팅 동의 철회 가능 |
| G-05 | 정보주체 권리 고지 | ❌ 없음 | ✅ 개인정보 정책에 명시 |
| G-06 | 아동 보호 (최소 16세) | ❌ 없음 | ✅ 이용약관에 연령 제한 명시 |
| G-07 | 데이터 이동권 (Portability) | ❌ 없음 | ✅ 개인정보 정책에 명시 + 향후 구현 |
| G-08 | DPO 연락처 공개 | ❌ 없음 | ✅ 개인정보 정책에 명시 |
| G-09 | 동의 기록 보관 (Record of Consent) | ❌ 없음 | ✅ DB에 동의 시각/버전 기록 |
| G-10 | 동의 입증 가능성 (Accountability) | ❌ 없음 | ✅ pct_terms_agreed_at + version 저장 |

### 5.2 쿠키 관련 (ePrivacy Directive + GDPR)

| # | 요건 | 현재 상태 | TO-BE |
|---|------|----------|-------|
| C-01 | 쿠키 사용 전 동의 획득 | ❌ 없음 | ✅ 쿠키 배너에서 사전 동의 |
| C-02 | 쿠키 카테고리별 선택 | ❌ 없음 | ✅ 4개 카테고리별 토글 |
| C-03 | 필수 쿠키 구분 | ❌ 없음 | ✅ Strictly Necessary 분리 |
| C-04 | 동의 거부 시 서비스 이용 가능 | ❌ 없음 | ✅ 필수 쿠키만으로 동작 |
| C-05 | 동의 철회 용이성 | ❌ 없음 | ✅ 풋터 링크로 재설정 |
| C-06 | 쿠키 정책 문서 제공 | ❌ 없음 | ✅ /page/cookie-policy |

---

## 6. 기술 제약사항

### 6.1 DB 스키마 변경시 주의
- **스테이징/프로덕션**: `synchronize: false` → 수동 SQL 마이그레이션 필수
- 기존 `pct_company_name`, `pct_phone`, `pct_country`가 NULL인 기존 레코드에 대한 마이그레이션 전략 필요
  - 기존 NULL 값에 기본값 설정 후 NOT NULL 제약 추가
  - 또는 애플리케이션 레벨에서만 필수 처리 (기존 데이터 호환)

### 6.2 기존 CMS 시스템 연동
- 포탈에 `/page/:slug` 라우트가 이미 존재 (`CmsPage` 컴포넌트)
- 약관 문서를 CMS 페이지로 관리할 경우 `amb_cms_pages` 테이블에 등록
- 또는 정적 컴포넌트로 프론트엔드에 직접 포함 (CMS 의존성 없이)

### 6.3 i18n
- 약관 문서 본문은 3개 언어(en/ko/vi) 모두 번역 필요
- 약관 버전 관리와 언어별 동시 업데이트 필요
- UI 텍스트는 기존 common.json에 키 추가

### 6.4 쿠키 동의 범위
- 포탈 사이트(`stg-www.amoeba.site`)에만 적용
- AMA 관리자 앱(`stg-ama.amoeba.site`)은 별도 (내부 사용자 대상)
- 쿠키 동의 상태는 서버가 아닌 LocalStorage에 저장 (GDPR 표준 관행)

### 6.5 약관 버전 관리
- 약관 변경 시 새 버전 번호 부여 (예: "v1.0", "v1.1")
- 사용자가 동의한 버전 기록 (`pct_terms_version`, `pct_privacy_version`)
- 약관 변경 시 기존 사용자에 대한 재동의 요청 로직은 향후 구현

---

## 7. 데이터 수집 항목 정리 (개인정보보호 정책용)

### 7.1 직접 수집 항목

| 항목 | 필수/선택 | 수집 목적 | 보유 기간 |
|------|----------|----------|----------|
| 이름 | 필수 | 계정 식별, 서비스 제공 | 회원 탈퇴 시까지 |
| 이메일 | 필수 | 로그인, 이메일 인증, 알림 | 회원 탈퇴 시까지 |
| 비밀번호 (해시) | 필수 | 인증 | 회원 탈퇴 시까지 |
| 회사명 | 필수 | 서비스 제공, 고객 관리 | 회원 탈퇴 시까지 |
| 국가 | 필수 | 서비스 현지화, 법적 준수 | 회원 탈퇴 시까지 |
| 전화번호 | 필수 | 본인 확인, 긴급 연락 | 회원 탈퇴 시까지 |

### 7.2 자동 수집 항목

| 항목 | 수집 시점 | 수집 목적 | 보유 기간 |
|------|----------|----------|----------|
| IP 주소 | 접속 시 | 보안, 부정 사용 방지 | 6개월 |
| 브라우저/OS 정보 | 접속 시 | 서비스 최적화 | 6개월 |
| 접속 로그 | 접속 시 | 보안, 감사 | 1년 |
| 쿠키 ID | 동의 시 | 세션 관리, 분석 | 쿠키별 상이 |

---

## 8. 구현 우선순위 제안

| 단계 | 범위 | 내용 |
|------|------|------|
| **Phase 1** (필수) | 회원가입 폼 변경 | 필수 필드 전환, 순서 변경, 약관 체크박스 추가, 백엔드 DTO/엔티티 수정 |
| **Phase 2** (필수) | 약관 문서 | 서비스 이용약관, 개인정보보호 정책 문서 작성 및 페이지 생성 |
| **Phase 3** (필수) | 쿠키 동의 | 쿠키 배너, 쿠키 설정 모달, 쿠키 정책 페이지 |
| **Phase 4** (향후) | 고급 기능 | 약관 변경 시 재동의, 데이터 이동권 API, 계정 삭제 셀프서비스 |

---

## 9. 와이어프레임 (텍스트)

### 9.1 회원가입 폼 (변경 후)

```
┌─────────────────────────────────────────┐
│           계정 만들기                     │
│     오늘 무료 체험을 시작하세요            │
│                                          │
│  이름 *                                  │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  이메일 *                                │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  비밀번호 *                              │
│  ┌──────────────────────────────────┐    │
│  │                              👁  │    │
│  └──────────────────────────────────┘    │
│  8자 이상, 대소문자·숫자·특수문자 포함     │
│                                          │
│  회사명 *                                │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  국가 *                                  │
│  ┌──────────────────────────────────┐    │
│  │ 선택하세요...                 ▼  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  전화번호 *                              │
│  ┌──────────────────────────────────┐    │
│  │ +82                              │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ─────────────────────────────────────   │
│                                          │
│  ☐ 전체 약관에 동의합니다                 │
│                                          │
│  ☐ (필수) 서비스 이용약관에 동의합니다     │
│          [약관 보기]                      │
│  ☐ (필수) 개인정보 수집 및 이용에          │
│          동의합니다 [정책 보기]            │
│  ☐ (선택) 마케팅 정보 수신에 동의합니다    │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │    👤  계정 만들기                │    │
│  └──────────────────────────────────┘    │
│                                          │
│  이미 계정이 있으신가요? 로그인            │
└─────────────────────────────────────────┘
```

### 9.2 쿠키 동의 배너

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 🍪 이 사이트는 쿠키를 사용합니다.                                        │
│ 최적의 서비스를 위해 쿠키를 사용합니다. 자세한 내용은 쿠키 정책을 확인하세요. │
│                                                                          │
│               [쿠키 설정]    [필수만 허용]    [모두 허용]                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

> **다음 단계**: 본 요구사항 분석서를 기반으로 `PLAN-포탈회원가입-GDPR약관동의-작업계획-20260327.md` 작업 계획서를 작성할 예정입니다.
