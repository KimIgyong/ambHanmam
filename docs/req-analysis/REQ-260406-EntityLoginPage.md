# REQ-260406 — 로그인 페이지 정책 정리 및 개선

## 1. 요구사항 요약

| 항목 | 내용 |
|------|------|
| **요청** | `/{entCode}/login` 경로 추가 — Entity 코드로 조직을 사전 선택한 상태의 통합 로그인 페이지 제공 |
| **핵심** | USER_LEVEL(사용자) / CLIENT_LEVEL(고객사) 로그인을 탭 메뉴로 통합 |
| **대상** | `apps/web` (프론트엔드 전용, 백엔드 API 변경 없음) |

## 2. AS-IS 현황 분석

### 현재 로그인 경로 구조

| 경로 | 대상 레벨 | 페이지 컴포넌트 | 인증 흐름 |
|------|----------|----------------|----------|
| `/login` | `USER_LEVEL` | `LoginPage.tsx` | Entity 검색/선택 → 이메일 + 비밀번호 |
| `/client/login` | `CLIENT_LEVEL` | `ClientLoginPage.tsx` | Entity 검색/선택 → 이메일 + 비밀번호 |
| `/admin/login` | `ADMIN_LEVEL` | `AdminLoginPage.tsx` | 이메일 + 비밀번호만 (HQ 소속) |
| `/partner/login` | `PARTNER_LEVEL` | `PartnerLoginPage.tsx` | 파트너코드 + 이메일 + 비밀번호 |

### 현재 LoginPage.tsx 인증 흐름
```
1. Entity 검색 모달 (EntitySearchModal) 또는 최근 법인 선택
2. URL 파라미터 (?entityCode=VN01&entityName=...) 자동 세팅 지원
3. 이메일 + 비밀번호 입력
4. authService.login(email, password, entity_code) → JWT 발급
5. /select-entity로 이동 (다중 법인 지원)
```

### 현재 ClientLoginPage.tsx 인증 흐름
```
1. Entity 검색 모달 또는 최근 법인 선택
2. URL 파라미터 (?entityCode=VN01&entityName=...) 자동 세팅 지원
3. 이메일 + 비밀번호 입력
4. clientPortalApiService.login(entity_code, email, password)
5. /client 대시보드로 이동
```

### 현재 코드 구조
```
apps/web/src/
├── domain/auth/
│   ├── pages/LoginPage.tsx           ← USER_LEVEL 로그인
│   ├── components/EntitySearchModal.tsx
│   ├── service/auth.service.ts
│   ├── store/auth.store.ts
│   └── utils/recent-entities.ts
├── domain/client-portal/
│   ├── pages/ClientLoginPage.tsx     ← CLIENT_LEVEL 로그인
│   ├── service/client-portal.service.ts
│   └── store/client-auth.store.ts
└── router/index.tsx                  ← 라우트 정의
```

### 현재 백엔드 API
| Endpoint | 용도 |
|---------|------|
| `GET /api/v1/auth/entities/search?q=` | 법인 검색 (공개) |
| `POST /api/v1/auth/login` | 로그인 (entity_code + email + password) |
| `POST /api/v1/auth/find-organizations` | 이메일로 소속 조직 조회 |

### Entity 모델 (`amb_hr_entities`)
- `ent_id` (UUID) — PK
- `ent_code` (VARCHAR 10, UNIQUE) — 법인 코드 (예: `VN01`, `KR01`)
- `ent_name` — 한글명
- `ent_name_en` — 영문명
- `ent_status` — `ACTIVE` / `INACTIVE`

> **참고**: `userCode` 필드는 별도로 존재하지 않음. `{userCode}` = `ent_code`.

## 3. TO-BE 요구사항

### 신규 경로
```
/{entCode}/login    예: /VN01/login, /KR01/login
```

### 페이지 동작
1. **URL의 `{entCode}`로 Entity 자동 조회** — API `GET /api/v1/auth/entities/search?q={entCode}`로 조직 정보 조회
2. **조직이 자동 선택된 상태** — Entity 검색/선택 UI 숨기고, 조직명을 읽기 전용으로 표시
3. **탭 메뉴** — `사용자 로그인 (USER_LEVEL)` | `고객사 로그인 (CLIENT_LEVEL)` 탭으로 구분
4. **공통 폼** — 이메일 + 비밀번호 + "비밀번호를 잊으셨나요?" 링크
5. **탭별 인증 흐름 분리**:
   - 사용자 탭: `authService.login(email, password, entCode)` → `/select-entity` → 메인
   - 고객사 탭: `clientPortalApiService.login(entCode, email, password)` → `/client`

### UI 와이어프레임
```
┌─────────────────────────────────────────┐
│              🏢 VN01 — Amoeba Vietnam   │ ← 조직 정보 (읽기 전용)
│                                         │
│  ┌─────────────────┬──────────────────┐ │
│  │ 사용자 로그인    │  고객사 로그인    │ │ ← 탭 메뉴
│  └─────────────────┴──────────────────┘ │
│                                         │
│  이메일                                  │
│  ┌─────────────────────────────────────┐ │
│  │                                     │ │
│  └─────────────────────────────────────┘ │
│                                         │
│  비밀번호                                │
│  ┌─────────────────────────────────────┐ │
│  │                                  👁 │ │
│  └─────────────────────────────────────┘ │
│                                         │
│         [ 로그인 ]                       │
│                                         │
│      비밀번호를 잊으셨나요?               │
│                                         │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─── │
│  다른 조직으로 로그인 → /login           │
└─────────────────────────────────────────┘
```

### 에러 처리
| 상황 | 처리 |
|------|------|
| `entCode`가 존재하지 않는 법인 | 에러 메시지 + `/login`으로 이동 안내 |
| `entCode` 법인이 `INACTIVE` | "비활성 조직" 메시지 표시 |
| 로그인 실패 (E1014/E1015/E1020) | 기존 에러 메시지 동일 적용 |

### 기존 경로 유지
| 경로 | 변경 |
|------|------|
| `/login` | **유지** — 기존 Entity 검색 방식 그대로 |
| `/client/login` | **유지** — 기존 방식 그대로 |
| `/admin/login` | **유지** — 변경 없음 |
| `/partner/login` | **유지** — 변경 없음 |

## 4. 갭 분석

| 영역 | AS-IS | TO-BE | 갭 |
|------|-------|-------|-----|
| `/{entCode}/login` 경로 | 없음 | 동적 라우트 추가 | **신규 라우트 + 페이지** |
| Entity 사전 선택 | URL 파라미터 방식 | URL 경로 기반 자동 조회 | 라우트 파라미터 → API 조회 |
| USER + CLIENT 통합 | 별도 페이지 | 탭 메뉴 통합 | **신규 컴포넌트** |
| Entity 검색 UI | 항상 표시 | `/{entCode}` 접근 시 숨김 | 조건부 렌더링 |
| 백엔드 API | 변경 없음 | 변경 없음 | 없음 |

## 5. 사용자 플로우

### Flow 1: `/{entCode}/login` 접속
```
사용자 → /{entCode}/login 접속
  → API: GET /auth/entities/search?q={entCode}
  → 법인 확인 → 조직 정보 표시 (읽기 전용)
  → 탭 선택: 사용자(기본) | 고객사
  → 이메일 + 비밀번호 입력
  → 탭별 로그인 API 호출
  → 성공 시 각 대시보드로 이동
```

### Flow 2: 잘못된 entCode 접속
```
사용자 → /INVALID/login 접속
  → API: GET /auth/entities/search?q=INVALID
  → 결과 없음 → "존재하지 않는 조직" 에러
  → "/login에서 조직 검색" 링크 제공
```

### Flow 3: 기존 `/login` 접속 (변경 없음)
```
사용자 → /login 접속
  → Entity 검색/선택 → 이메일 + 비밀번호
  → 기존 흐름 그대로
```

## 6. 기술 제약사항

- **프론트엔드 전용** — 백엔드 API 변경 없음 (`POST /auth/login` 기존 사용)
- **동적 라우트** — `/:entCode/login`은 다른 라우트와 충돌하지 않아야 함 (우선순위 주의)
- **i18n** — ko/en/vi 3개 언어 번역 키 추가 필요
- **반응형** — 모바일/데스크톱 대응
- **보안** — entCode 기반 Entity 조회 시 ACTIVE 상태만 허용 (기존 API가 이미 처리)
