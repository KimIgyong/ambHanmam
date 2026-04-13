# REQ-AmoebaTalk-AccountConnect

## AMB ↔ AmoebaTalk Account Connection
## AMB ↔ AmoebaTalk 계정 연동
## AMB ↔ AmoebaTalk Liên Kết Tài Khoản

**Version / 문서버전 / Phiên bản:** v1.1
**Date / 작성일 / Ngày tạo:** 2026-03-30
**Author / 작성자 / Tác giả:** Claude Code
**Target Systems / 대상 시스템 / Hệ thống:** AMB Management + AmoebaTalk

---

## 1. Requirements Summary / 요구사항 요약 / Tóm Tắt Yêu Cầu

| EN | KR | VI |
|----|----|----|
| **Title** | **제목** | **Tiêu đề** |
| AMB Management → AmoebaTalk Account Connection | AMB Management → AmoebaTalk 계정 연동 | AMB Management → AmoebaTalk Liên Kết Tài Khoản |
| **Purpose** | **목적** | **Mục đích** |
| Enable AMB users to create/connect AmoebaTalk accounts with one click for omnichannel messaging | AMB 사용자가 원클릭으로 AmoebaTalk 계정을 생성/연결하여 옴니채널 메시징 사용 | Cho phép user AMB tạo/liên kết tài khoản AmoebaTalk bằng một click để sử dụng messaging đa kênh |
| **Target Users** | **대상 사용자** | **Người dùng mục tiêu** |
| AMB `MASTER` / `ADMIN` role and above (entity managers) | AMB `MASTER` / `ADMIN` 역할 이상 (법인 관리자) | AMB vai trò `MASTER` / `ADMIN` trở lên (quản lý pháp nhân) |
| **Auth Method** | **인증 방식** | **Phương thức xác thực** |
| Signed JWT (Shared Secret) — server-to-server trust | Signed JWT (Shared Secret) — 서버 간 신뢰 기반 | Signed JWT (Shared Secret) — tin cậy giữa server |
| **Data Mapping** | **데이터 매핑** | **Ánh xạ dữ liệu** |
| AMB Entity → AmoebaTalk Company (1:1, OWNER role) | AMB Entity → AmoebaTalk Company (1:1, OWNER 역할) | AMB Entity → AmoebaTalk Company (1:1, vai trò OWNER) |
| **Account Independence** | **계정 독립성** | **Tính độc lập tài khoản** |
| After linking, both accounts operate independently (no deletion/deactivation propagation) | 연동 후 양쪽 계정은 독립적으로 운영 (삭제/비활성화 전파 없음) | Sau khi liên kết, hai tài khoản hoạt động độc lập (không lan truyền xoá/vô hiệu hoá) |

### Detailed Requirements / 요구사항 상세 / Yêu Cầu Chi Tiết

| # | EN | KR | VI | Priority |
|---|----|----|----|----|
| R1 | **Connect Button** — Provide AmoebaTalk connection button in AMB Web (outside iframe, settings, lobby banner) | **연동 버튼** — AMB Web에서 AmoebaTalk 연동 버튼 제공 (iframe 외부, settings, lobby banner) | **Nút kết nối** — Cung cấp nút kết nối AmoebaTalk trong AMB Web (ngoài iframe, settings, lobby banner) | P0 |
| R2 | **Signed Token Generation** — AMB Backend generates signed JWT with user info (5-min TTL) | **서명된 토큰 생성** — AMB Backend에서 사용자 정보를 담은 서명된 JWT 토큰 생성 (5분 TTL) | **Tạo token ký** — AMB Backend tạo JWT đã ký chứa thông tin user (TTL 5 phút) | P0 |
| R3 | **Account Existence Check** — AmoebaTalk checks existing account by email | **계정 존재 확인** — AmoebaTalk에서 email 기준으로 기존 계정 존재 여부 확인 | **Kiểm tra tài khoản** — AmoebaTalk kiểm tra tài khoản hiện có theo email | P0 |
| R4 | **Auto-fill Registration** — If not exists, auto-fill AMB info (email, name, company, avatar), user only enters password | **자동 채움 회원가입** — 미존재 시 AMB 정보(email, name, company, avatar) 자동 채움, password만 입력 | **Đăng ký tự động điền** — Nếu chưa có, tự động điền thông tin AMB (email, name, company, avatar), user chỉ nhập password | P0 |
| R5 | **Auto Company Creation** — Auto-create AmoebaTalk Company with AMB Entity name (assign OWNER role) | **Company 자동 생성** — AMB Entity name으로 AmoebaTalk Company 자동 생성 (OWNER 역할 배정) | **Tự động tạo Company** — Tạo AmoebaTalk Company với tên AMB Entity (gán vai trò OWNER) | P0 |
| R6 | **Company Name Change Option** — User can create with a different Company name if desired | **Company 이름 변경 옵션** — 사용자가 원할 경우 다른 Company 이름으로 생성 가능 | **Tùy chọn đổi tên Company** — User có thể tạo với tên Company khác nếu muốn | P1 |
| R7 | **Existing Account Login** — Existing accounts login with password → connection complete | **기존 계정 로그인** — 이미 존재하는 계정은 password 입력으로 로그인 → 연결 완료 | **Đăng nhập tài khoản có sẵn** — Tài khoản đã tồn tại nhập password để đăng nhập → hoàn tất kết nối | P0 |
| R8 | **Session Persistence** — If active session with same email exists, connect immediately | **세션 유지** — 동일 email로 이미 active session이 있으면 바로 연결 | **Duy trì session** — Nếu đã có active session cùng email, kết nối ngay | P1 |
| R9 | **postMessage Callback** — After connection, AmoebaTalk sends postMessage to AMB | **postMessage 콜백** — 연동 완료 후 AmoebaTalk → AMB로 postMessage 전달 | **Callback postMessage** — Sau khi kết nối, AmoebaTalk gửi postMessage về AMB | P0 |
| R10 | **Mapping Table** — Store connection info in AmoebaTalk DB | **매핑 테이블** — 양쪽 계정 연결 정보를 AmoebaTalk DB에 저장 | **Bảng ánh xạ** — Lưu thông tin liên kết vào AmoebaTalk DB | P0 |
| R11 | **Lobby Banner** — Display AmoebaTalk promotional banner in AMB lobby chat and embed area | **로비 배너** — AMB lobby chat 및 embed 영역에 AmoebaTalk 홍보 배너 표시 | **Banner lobby** — Hiển thị banner quảng bá AmoebaTalk trong lobby chat và vùng embed của AMB | P2 |
| R12 | **Company Slug Unique** — Use AmoebaTalk's slug generation logic to prevent duplicates | **Company Slug 유일성** — AmoebaTalk의 company slug 생성 로직으로 중복 방지 | **Slug Company duy nhất** — Sử dụng logic tạo slug của AmoebaTalk để tránh trùng lặp | P0 |
| R13 | **Multilingual** — Connection UI based on browser language setting (vi/ko/en) | **다국어** — 연동 UI는 브라우저 설정 언어 기반 (vi/ko/en) | **Đa ngôn ngữ** — UI kết nối dựa trên ngôn ngữ trình duyệt (vi/ko/en) | P1 |

---

## 2. AS-IS Current State Analysis / AS-IS 현황 분석 / Phân Tích Hiện Trạng AS-IS

### 2.1 AMB Management

#### Authentication System / 인증 시스템 / Hệ thống xác thực
- JWT-based auth (Access 4h / Refresh 7d) / JWT 기반 인증 / Xác thực dựa trên JWT
- Cookie-based token delivery (httpOnly) / Cookie 기반 토큰 전달 / Truyền token qua Cookie
- User Level: `ADMIN_LEVEL`, `USER_LEVEL`, `PARTNER_LEVEL`, `CLIENT_LEVEL`
- User Role: `SUPER_ADMIN` > `ADMIN` > `MASTER` > `MANAGER` > `MEMBER` > `VIEWER`

#### Existing SSO Mechanism / 기존 SSO 메커니즘 / Cơ chế SSO hiện có
- `generateStoreRedirectToken()`: 5-min JWT for external app integration / 외부 앱 연동용 5분 JWT / JWT 5 phút cho tích hợp app bên ngoài
- `EntityCustomAppEntity`: iframe/new_tab custom app integration (jwt/none/api_key auth modes) / iframe/new_tab 기반 커스텀 앱 통합 / Tích hợp app tuỳ chỉnh iframe/new_tab
- OAuth module: Authorization code flow (PKCE) supported / OAuth 모듈: Authorization code flow (PKCE) 지원 / Module OAuth: hỗ trợ Authorization code flow (PKCE)

#### Entity (Legal Entity) Model / Entity(법인) 모델 / Mô hình Entity (pháp nhân)
- `amb_hr_entities` table: `entId` (UUID), `entCode` (unique code), `entName` (entity name) / 테이블: `entId` (UUID), `entCode` (고유 코드), `entName` (법인명) / bảng: `entId` (UUID), `entCode` (mã duy nhất), `entName` (tên pháp nhân)
- Hierarchy: ROOT (HQ) → SUBSIDIARY / 계층: ROOT (본사) → SUBSIDIARY (자회사) / Phân cấp: ROOT (trụ sở) → SUBSIDIARY (công ty con)
- User-Entity mapping: `usrCompanyId` (FK → `amb_hr_entities.entId`) / 사용자-법인 매핑 / Ánh xạ user-pháp nhân

#### Current AmoebaTalk Integration / 현재 AmoebaTalk 통합 / Tích hợp AmoebaTalk hiện tại
- AmoebaTalk iframe embed already exists in AMB Web / AMB Web에 AmoebaTalk iframe embed 이미 존재 / AmoebaTalk iframe embed đã tồn tại trong AMB Web
- Account connection mechanism not yet implemented / 계정 연동 메커니즘 미구현 / Cơ chế liên kết tài khoản chưa triển khai

### 2.2 AmoebaTalk

#### Authentication System / 인증 시스템 / Hệ thống xác thực
- JWT-based (Access 15min / Refresh 7d) / JWT 기반 / Dựa trên JWT
- Multi-step login: signin → temp_token → select company → final tokens / 다단계 로그인 / Đăng nhập nhiều bước
- Social Auth: Google, Zalo, Kakao
- Phone Auth supported / Phone Auth 지원 / Hỗ trợ xác thực qua điện thoại

#### User & Company Model / 사용자 & Company 모델 / Mô hình User & Company
- `atk_users`: email, password, name, avatar, social IDs
- `atk_companies`: name, slug (unique), owner_id
- `atk_company_members`: role (OWNER/ADMIN/MEMBER), status (ACTIVE/INACTIVE/PENDING/INVITED)
- 1 User → N Companies (multi-company membership) / 1 사용자 → N Companies (다중 소속 가능) / 1 User → N Companies (thuộc nhiều company)

#### Company Slug Generation / Company Slug 생성 / Tạo Slug Company
- `atk_companies.slug`: unique constraint / unique 제약 / ràng buộc duy nhất
- Existing logic auto-generates slug (company name based, suffix on conflict) / 기존 로직으로 slug 자동 생성 (중복 시 suffix 추가) / Logic hiện có tự tạo slug (thêm suffix khi trùng)

---

## 3. TO-BE Requirements / TO-BE 요구사항 / Yêu Cầu TO-BE

### 3.1 User Flow (Overall / 전체 / Tổng quan)

```
[AMB Management]                           [AmoebaTalk]
      │                                          │
      │  ① User(MASTER/ADMIN+) clicks            │
      │     "Connect AmoebaTalk" button           │
      │     User(MASTER/ADMIN+) 버튼 클릭          │
      │     User(MASTER/ADMIN+) nhấn nút          │
      │                                          │
      │  ② POST /api/v1/integration/             │
      │     amoeba-talk/connect-token             │
      │     → Signed JWT (5min TTL)               │
      │                                          │
      │  ③ window.open(connectUrl)    ──────────▶│
      │                                          │
      │                               ④ GET /auth/amb-connect?token=xxx
      │                                  → Verify JWT
      │                                  → Check email exists
      │                                          │
      │                               ┌──────────┴──────────┐
      │                               │                     │
      │                       [Not exists /            [Exists /
      │                        미존재 /                  존재 /
      │                        Chưa có]                Đã có]
      │                               │                     │
      │                     ⑤ Register Form          ⑥ Login Form
      │                        (auto-fill)           (email readonly)
      │                        password only          password only
      │                               │                     │
      │                               └──────────┬──────────┘
      │                                          │
      │                               ⑦ Account created / Login complete
      │                                  계정 생성 / 로그인 완료
      │                                  Tạo tài khoản / Đăng nhập xong
      │                                  → Save mapping / 매핑 저장 / Lưu ánh xạ
      │                                  → Continue using AmoebaTalk
      │                                          │
      │  ⑧ postMessage received  ◀───────────────│
      │     → Toast "Connection successful!"      │
      │     → Toast "연결 성공!"                   │
      │     → Toast "Kết nối thành công!"          │
      │     → iframe reload                       │
      │     → Button state update                  │
```

### 3.2 Entry Points (AMB Web, 3 locations / 3곳 / 3 vị trí)

| EN | KR | VI | UI Element | Condition |
|----|----|----|-----------|-----------|
| Entity Settings | Entity Settings | Entity Settings | "Connect AmoebaTalk Account" button | MASTER/ADMIN+ role |
| AmoebaTalk Embed area | AmoebaTalk Embed 영역 | Vùng Embed AmoebaTalk | "Connect account" button below/above iframe | Only when not connected / 미연결 시 / Khi chưa kết nối |
| Lobby Chat / Dashboard | 로비 채팅 / 대시보드 | Lobby Chat / Dashboard | Promotional banner card | Only when not connected / 미연결 시 / Khi chưa kết nối |

### 3.3 Signed JWT Token Payload

```typescript
// AMB → AmoebaTalk transfer token / 전달 토큰 / Token truyền
interface AmbConnectTokenPayload {
  sub: string;           // amb_users.usr_id
  email: string;         // amb_users.usr_email
  name: string;          // amb_users.usr_name
  avatar: string | null; // amb_users.usr_profile_image
  entityId: string;      // amb_hr_entities.ent_id
  entityCode: string;    // amb_hr_entities.ent_code
  entityName: string;    // amb_hr_entities.ent_name
  iat: number;           // issued at
  exp: number;           // expires at (iat + 300s)
  jti: string;           // unique token ID (single use / 1회 사용 / dùng 1 lần)
}
```

### 3.4 Register Form (Account not exists / 미존재 시 / Khi chưa có tài khoản)

| Field | Source | Editable | EN | KR | VI |
|-------|--------|----------|----|----|-----|
| Email | `payload.email` | ❌ readonly | Grey background + lock icon | 회색 배경 + 자물쇠 아이콘 | Nền xám + icon khoá |
| Name | `payload.name` | ❌ readonly | Grey background + lock icon | 회색 배경 + 자물쇠 아이콘 | Nền xám + icon khoá |
| Avatar | `payload.avatar` | ❌ readonly | Preview only | 미리보기만 | Chỉ xem trước |
| Company Name | `payload.entityName` | ✅ changeable | Default = entityName, checkbox to change | 기본값 = entityName, 체크박스로 변경 | Mặc định = entityName, checkbox để đổi |
| Password | User input | ✅ required | Password policy applied | 비밀번호 정책 적용 | Áp dụng chính sách mật khẩu |
| Confirm Password | User input | ✅ required | Must match password | Password와 일치 확인 | Phải khớp với password |

### 3.5 Login Form (Account exists / 존재 시 / Khi đã có tài khoản)

| Field | Source | Editable | EN | KR | VI |
|-------|--------|----------|----|----|-----|
| Email | `payload.email` | ❌ readonly | Message: "Account already exists" | 안내: "이미 존재하는 계정입니다" | Thông báo: "Tài khoản đã tồn tại" |
| Password | User input | ✅ required | | | |
| Forgot Password | Link | - | Existing password reset flow | 기존 비밀번호 재설정 flow | Flow đặt lại mật khẩu hiện có |

### 3.6 Session Handling / 세션 처리 / Xử Lý Session

| EN | KR | VI | Action |
|----|----|----|--------|
| Active session + same email | 활성 세션 + 동일 email | Session đang hoạt động + cùng email | Redirect to dashboard immediately, save mapping / 바로 dashboard redirect, 매핑 저장 / Chuyển hướng dashboard ngay, lưu mapping |
| Active session + different email | 활성 세션 + 다른 email | Session đang hoạt động + email khác | Keep current session, prompt "Already logged in with another account" → suggest logout and retry / 기존 session 유지, "다른 계정으로 로그인 중" 안내 → 로그아웃 후 재시도 / Giữ session hiện tại, thông báo "Đang đăng nhập bằng tài khoản khác" → đề nghị logout và thử lại |
| No session | 세션 없음 | Không có session | Show Register or Login form / Register 또는 Login form 표시 / Hiển thị form Đăng ký hoặc Đăng nhập |

### 3.7 Post-Connection Callback

```typescript
// AmoebaTalk → AMB (postMessage)
interface AmbConnectResult {
  type: 'AMB_CONNECT_SUCCESS' | 'AMB_CONNECT_FAILED';
  email: string;
  companyId?: string;    // atk_companies.id
  companyName?: string;  // atk_companies.name
  error?: string;        // Error message on failure / 실패 시 에러 메시지 / Thông báo lỗi khi thất bại
}
```

```typescript
// AMB side listener
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://talk.amoeba.site') return;
  if (event.data.type === 'AMB_CONNECT_SUCCESS') {
    showToast('AmoebaTalk connection successful!');   // EN
    // showToast('AmoebaTalk 연결 성공!');             // KR
    // showToast('Kết nối AmoebaTalk thành công!');    // VI
    reloadIframe();
    updateButtonState('connected');
  }
});
```

---

## 4. Data Model / 데이터 모델 / Mô Hình Dữ Liệu

### 4.1 New Table (AmoebaTalk DB — MySQL) / 신규 테이블 / Bảng mới

```sql
CREATE TABLE atk_amb_account_links (
    id              VARCHAR(36) PRIMARY KEY,
    user_id         VARCHAR(36) NOT NULL,
    company_id      VARCHAR(36) NOT NULL,
    amb_user_id     VARCHAR(36) NOT NULL,
    amb_entity_id   VARCHAR(36) NOT NULL,
    amb_entity_code VARCHAR(10) NOT NULL,
    linked_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_aal_user    FOREIGN KEY (user_id)    REFERENCES atk_users(id),
    CONSTRAINT fk_aal_company FOREIGN KEY (company_id) REFERENCES atk_companies(id),
    CONSTRAINT uq_aal_amb_user    UNIQUE (amb_user_id),
    CONSTRAINT uq_aal_user_entity UNIQUE (user_id, amb_entity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 4.2 Prisma Schema (AmoebaTalk)

```prisma
model AmbAccountLink {
  id            String   @id @default(uuid())
  userId        String   @map("user_id")
  companyId     String   @map("company_id")
  ambUserId     String   @unique @map("amb_user_id")
  ambEntityId   String   @map("amb_entity_id")
  ambEntityCode String   @map("amb_entity_code") @db.VarChar(10)
  linkedAt      DateTime @default(now()) @map("linked_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user    User    @relation(fields: [userId], references: [id])
  company Company @relation(fields: [companyId], references: [id])

  @@unique([userId, ambEntityId])
  @@map("atk_amb_account_links")
}
```

### 4.3 AMB Side Changes / AMB측 변경 / Thay đổi phía AMB

No changes to `amb_users` table. Connection status is checked via AmoebaTalk's `atk_amb_account_links` query or AMB calling AmoebaTalk API.

`amb_users` 테이블 변경 없음. 연동 상태는 AmoebaTalk의 `atk_amb_account_links` 조회 또는 AmoebaTalk API 호출로 확인.

Không thay đổi bảng `amb_users`. Trạng thái kết nối được kiểm tra qua truy vấn `atk_amb_account_links` của AmoebaTalk hoặc AMB gọi API AmoebaTalk.

---

## 5. API Design / API 설계 / Thiết Kế API

### 5.1 AMB Management — New Endpoints / 신규 Endpoints / Endpoints mới

#### `POST /api/v1/integration/amoeba-talk/connect-token`

| EN | KR | VI | Value |
|----|----|----|-------|
| Auth | 인증 | Xác thực | `@Auth()` — MASTER/ADMIN role and above / 역할 이상 / vai trò trở lên |
| Purpose | 목적 | Mục đích | Generate signed token for AmoebaTalk connection / AmoebaTalk 연동용 서명된 토큰 생성 / Tạo token đã ký cho kết nối AmoebaTalk |
| Request | 요청 | Yêu cầu | (none — uses current logged-in user info / 없음 — 현재 로그인 사용자 정보 사용 / không — dùng thông tin user đang đăng nhập) |
| Response | 응답 | Phản hồi | `{ success: true, data: { connectUrl: string } }` |
| Errors | 에러 | Lỗi | E_ROLE_INSUFFICIENT, E_ENTITY_NOT_FOUND |

#### `GET /api/v1/integration/amoeba-talk/status`

| EN | KR | VI | Value |
|----|----|----|-------|
| Auth | 인증 | Xác thực | `@Auth()` — MASTER/ADMIN role and above |
| Purpose | 목적 | Mục đích | Check AmoebaTalk connection status / AmoebaTalk 연동 상태 확인 / Kiểm tra trạng thái kết nối AmoebaTalk |
| Response | 응답 | Phản hồi | `{ success: true, data: { linked: boolean, linkedAt?: string, companyName?: string } }` |
| Implementation | 구현 | Triển khai | Calls AmoebaTalk API (`/api/integration/amb/check-link`) / AmoebaTalk API 호출 / Gọi API AmoebaTalk |

### 5.2 AmoebaTalk — New Endpoints / 신규 Endpoints / Endpoints mới

#### `GET /api/auth/amb-connect`

| EN | KR | VI | Value |
|----|----|----|-------|
| Auth | 인증 | Xác thực | Public (token via query param) / Public (토큰은 query param) / Public (token qua query param) |
| Query | 쿼리 | Query | `token: string` (Signed JWT) |
| Purpose | 목적 | Mục đích | Verify AMB token → redirect to Register/Login page / AMB 토큰 검증 → 페이지 redirect / Xác minh token AMB → chuyển hướng trang Đăng ký/Đăng nhập |
| Logic | 로직 | Logic | Verify JWT → check jti duplicate → check email exists → create session → redirect / JWT 검증 → jti 중복 확인 → email 존재 확인 → 세션 생성 → redirect / Xác minh JWT → kiểm tra jti trùng → kiểm tra email → tạo session → redirect |
| Redirect | 리다이렉트 | Chuyển hướng | Not exists: `/auth/amb-register?session=xxx`, Exists: `/auth/amb-login?session=xxx` |

#### `POST /api/auth/amb-register`

| EN | KR | VI | Value |
|----|----|----|-------|
| Auth | 인증 | Xác thực | Public (requires amb-connect session) / Public (amb-connect 세션 필요) / Public (cần session amb-connect) |
| Request | 요청 | Yêu cầu | `{ sessionId, password, confirmPassword, companyName? }` |
| Purpose | 목적 | Mục đích | AMB connection registration / AMB 연동 회원가입 / Đăng ký liên kết AMB |
| Logic | 로직 | Logic | Validate session → Create User → Create Company (auto-generate slug) → Create CompanyMember (OWNER) → Save AmbAccountLink → Issue tokens / 세션 검증 → User 생성 → Company 생성 → CompanyMember (OWNER) → AmbAccountLink 저장 → 토큰 발급 / Xác minh session → Tạo User → Tạo Company (tự tạo slug) → Tạo CompanyMember (OWNER) → Lưu AmbAccountLink → Cấp token |
| Response | 응답 | Phản hồi | `{ user, tokens, company }` |

#### `POST /api/auth/amb-login`

| EN | KR | VI | Value |
|----|----|----|-------|
| Auth | 인증 | Xác thực | Public (requires amb-connect session) |
| Request | 요청 | Yêu cầu | `{ sessionId, password }` |
| Purpose | 목적 | Mục đích | AMB connection existing account login / AMB 연동 기존 계정 로그인 / Đăng nhập tài khoản hiện có qua liên kết AMB |
| Logic | 로직 | Logic | Validate session → Verify password → UPSERT AmbAccountLink → Issue tokens / 세션 검증 → Password 확인 → AmbAccountLink UPSERT → 토큰 발급 / Xác minh session → Kiểm tra password → UPSERT AmbAccountLink → Cấp token |
| Response | 응답 | Phản hồi | `{ user, tokens }` |

#### `GET /api/integration/amb/check-link`

| EN | KR | VI | Value |
|----|----|----|-------|
| Auth | 인증 | Xác thực | API Key (server-to-server) / API Key (서버 간 통신) / API Key (giữa server) |
| Query | 쿼리 | Query | `amb_user_id: string` |
| Purpose | 목적 | Mục đích | Check AMB user's AmoebaTalk connection status / AMB 사용자의 AmoebaTalk 연동 상태 확인 / Kiểm tra trạng thái kết nối AmoebaTalk của user AMB |
| Response | 응답 | Phản hồi | `{ linked: boolean, atkUserId?: string, companyName?: string, linkedAt?: string }` |

---

## 6. Security Requirements / 보안 요구사항 / Yêu Cầu Bảo Mật

| EN | KR | VI | Requirement |
|----|----|----|-------------|
| Token Signing | 토큰 서명 | Ký token | HMAC-SHA256, Shared Secret (env: `AMB_ATK_SHARED_SECRET`) |
| Token TTL | 토큰 유효기간 | Thời hạn token | 5 minutes (300 seconds) / 5분 (300초) / 5 phút (300 giây) |
| Single Use | 1회 사용 | Dùng 1 lần | `jti` claim prevents replay attacks, used jti stored in DB/Redis / `jti` claim으로 replay attack 방지 / `jti` claim ngăn tấn công replay |
| HTTPS | HTTPS | HTTPS | Required on both sides (different domains) / 양쪽 모두 필수 / Bắt buộc cả hai phía |
| CORS | CORS | CORS | AmoebaTalk allows AMB domain origin / AmoebaTalk에서 AMB origin 허용 / AmoebaTalk cho phép origin AMB |
| postMessage origin | postMessage origin | postMessage origin | AMB only accepts AmoebaTalk domain / AMB에서 AmoebaTalk 도메인만 수신 / AMB chỉ nhận domain AmoebaTalk |
| API Key | API Key | API Key | For server-to-server communication (env: `AMB_INTEGRATION_API_KEY`) / 서버 간 통신용 / Cho giao tiếp giữa server |
| Password Policy | 비밀번호 정책 | Chính sách mật khẩu | Apply AmoebaTalk's existing policy / AmoebaTalk 기존 정책 적용 / Áp dụng chính sách hiện có của AmoebaTalk |
| Rate Limiting | 속도 제한 | Giới hạn tốc độ | connect-token endpoint: 5 requests/minute / 분당 5회 / 5 yêu cầu/phút |

---

## 7. Technical Constraints / 기술 제약사항 / Ràng Buộc Kỹ Thuật

| EN | KR | VI | Impact | Mitigation |
|----|----|----|--------|------------|
| Different DBs (PostgreSQL vs MySQL) | 서로 다른 DB | DB khác nhau | No direct joins / 직접 조인 불가 / Không thể join trực tiếp | API-based communication / API 기반 통신 / Giao tiếp qua API |
| Different domains | 서로 다른 도메인 | Domain khác nhau | No cookie sharing / Cookie 공유 불가 / Không chia sẻ cookie | Signed JWT + postMessage |
| AmoebaTalk multi-step login | AmoebaTalk 다단계 로그인 | Đăng nhập nhiều bước AmoebaTalk | Company select step required / company select 단계 필요 / Cần bước chọn company | Auto company creation bypasses this / 자동 company 생성으로 우회 / Tự tạo company để bỏ qua |
| Company slug unique constraint | Company slug unique 제약 | Ràng buộc slug unique | Name conflict possible / 이름 충돌 가능 / Có thể xung đột tên | Use AmoebaTalk's existing slug logic / 기존 slug 생성 로직 활용 / Dùng logic slug hiện có |
| Account independence | 계정 독립성 | Tính độc lập tài khoản | AMB deletion doesn't affect AmoebaTalk / AMB 삭제 시 AmoebaTalk 영향 없음 / Xoá AMB không ảnh hưởng AmoebaTalk | Mapping table is reference only / 매핑 테이블은 참조용 / Bảng mapping chỉ để tham chiếu |

---

## 8. Non-functional Requirements / 비기능 요구사항 / Yêu Cầu Phi Chức Năng

| EN | KR | VI | Criteria |
|----|----|----|----------|
| Response Time | 응답 시간 | Thời gian phản hồi | Token generation < 200ms, Connection check < 500ms / 토큰 생성 < 200ms, 연동 확인 < 500ms / Tạo token < 200ms, Kiểm tra kết nối < 500ms |
| Availability | 가용성 | Tính sẵn sàng | One system failure doesn't affect the other / 한쪽 장애 시 다른 쪽 정상 / Sự cố một bên không ảnh hưởng bên kia |
| Logging | 로깅 | Ghi log | Audit log for all connection attempts/successes/failures / 연동 시도/성공/실패 모두 audit log / Ghi audit log tất cả kết nối thử/thành công/thất bại |
| Monitoring | 모니터링 | Giám sát | Track token expiry/retry counts / Token 만료/재시도 횟수 추적 / Theo dõi token hết hạn/số lần thử lại |
| Multilingual | 다국어 | Đa ngôn ngữ | Connection UI based on browser language (vi/ko/en) / 브라우저 언어 설정 기반 / Dựa trên ngôn ngữ trình duyệt |

---

## Change Log / 변경 이력 / Lịch Sử Thay Đổi

| Version | Date | EN | KR | VI |
|---------|------|----|----|-----|
| v1.0 | 2026-03-30 | Initial requirements analysis | 초기 요구사항 분석서 작성 | Tạo phân tích yêu cầu ban đầu |
| v1.1 | 2026-03-30 | Added trilingual support (EN/KR/VI) | 3개 국어 지원 추가 (영/한/베) | Thêm hỗ trợ 3 ngôn ngữ (Anh/Hàn/Việt) |
