# PLAN-AmoebaTalk-AccountConnect

## AMB ↔ AmoebaTalk Account Connection — Implementation Plan
## AMB ↔ AmoebaTalk 계정 연동 — 작업계획
## AMB ↔ AmoebaTalk Liên Kết Tài Khoản — Kế Hoạch Triển Khai

**Version / 문서버전 / Phiên bản:** v1.1
**Date / 작성일 / Ngày tạo:** 2026-03-30
**Author / 작성자 / Tác giả:** Claude Code
**Reference / 참조 / Tham chiếu:** `docs/analysis/REQ-AmoebaTalk-AccountConnect-20260330.md`

---

## 1. Current System Status / 시스템 개발 현황 분석 / Phân Tích Hiện Trạng Hệ Thống

### 1.1 AMB Management

| EN | KR | VI | Status | Note |
|----|----|----|--------|------|
| Custom App SSO | 커스텀 앱 SSO | SSO App tuỳ chỉnh | ✅ Exists / 존재 / Có | `generateStoreRedirectToken()` — reusable / 재활용 가능 / tái sử dụng được |
| OAuth Module | OAuth 모듈 | Module OAuth | ✅ Exists | Authorization code flow + PKCE |
| AmoebaTalk iframe embed | AmoebaTalk iframe 임베드 | AmoebaTalk iframe embed | ✅ Exists | Already integrated in Web / 이미 Web에 통합 / Đã tích hợp trong Web |
| Integration Module | 통합 모듈 | Module tích hợp | ❌ None / 미존재 / Chưa có | Needs creation / 신규 생성 필요 / Cần tạo mới |
| Entity Settings UI | Entity 설정 UI | UI cài đặt Entity | ✅ Exists | Only needs button addition / 버튼 추가만 필요 / Chỉ cần thêm nút |

### 1.2 AmoebaTalk

| EN | KR | VI | Status | Note |
|----|----|----|--------|------|
| Auth Module | 인증 모듈 | Module xác thực | ✅ Exists | email/password + social auth |
| Company creation logic | Company 생성 로직 | Logic tạo Company | ✅ Exists | Includes slug auto-generate / slug 자동 생성 포함 / bao gồm tự tạo slug |
| CompanyMember logic | CompanyMember 로직 | Logic CompanyMember | ✅ Exists | OWNER/ADMIN/MEMBER |
| AMB integration endpoints | AMB 연동 엔드포인트 | Endpoints tích hợp AMB | ❌ None | Needs creation / 신규 생성 필요 / Cần tạo mới |
| AMB integration UI | AMB 연동 UI | UI tích hợp AMB | ❌ None | Needs new pages / 신규 페이지 필요 / Cần trang mới |
| Account Link table | 계정 연결 테이블 | Bảng liên kết tài khoản | ❌ None | Needs migration / 신규 migration 필요 / Cần migration mới |

### 1.3 Shared Infrastructure / 공유 인프라 / Hạ tầng chung

| EN | KR | VI | Status |
|----|----|----|--------|
| Shared Secret env vars | Shared Secret 환경변수 | Biến môi trường Shared Secret | ❌ Not set — need to add to both `.env` / 미설정 — 양쪽 `.env`에 추가 필요 / Chưa thiết lập — cần thêm vào `.env` cả 2 bên |
| CORS config | CORS 설정 | Cấu hình CORS | ⚠️ Partial — need to add AMB origin to AmoebaTalk / 부분 — AmoebaTalk에 AMB origin 추가 필요 / Một phần — cần thêm origin AMB vào AmoebaTalk |
| postMessage handler | postMessage 핸들러 | Handler postMessage | ❌ None — need to add listener to AMB Web / 미존재 — AMB Web에 listener 추가 필요 / Chưa có — cần thêm listener vào AMB Web |

---

## 2. Phased Implementation Plan / 단계별 구현 계획 / Kế Hoạch Triển Khai Theo Giai Đoạn

### Overview / 개요 / Tổng quan

```
Phase 1: Infrastructure & Shared Config / 인프라 & 공유 설정 / Hạ tầng & Cấu hình chung    (0.5d)
Phase 2: AmoebaTalk Backend                                                                  (2d)
Phase 3: AmoebaTalk Frontend                                                                 (1.5d)
Phase 4: AMB Management Backend                                                              (1d)
Phase 5: AMB Management Frontend                                                             (1d)
Phase 6: Integration Test & Finalization / 통합 테스트 & 마무리 / Test tích hợp & Hoàn thiện  (1d)
                                                                               Total / 총 / Tổng: ~7d
```

---

### Phase 1: Infrastructure & Shared Config / 인프라 & 공유 설정 / Hạ tầng & Cấu hình chung (0.5d)

**Goal / 목표 / Mục tiêu:**
- EN: Establish secure communication foundation between both systems
- KR: 양쪽 시스템 간 보안 통신 기반 마련
- VI: Thiết lập nền tảng giao tiếp bảo mật giữa hai hệ thống

#### 1-1. Environment Variables / 환경변수 / Biến môi trường

**AMB Management** (`env/backend/.env.development`):
```env
# AmoebaTalk Integration
AMB_ATK_SHARED_SECRET=<random-64-char-hex>
AMB_ATK_CONNECT_URL=http://localhost:3000/auth/amb-connect
AMB_ATK_API_URL=http://localhost:3000/api
AMB_ATK_API_KEY=<random-api-key>
```

**AmoebaTalk** (`apps/backend/.env`):
```env
# AMB Integration
AMB_ATK_SHARED_SECRET=<same-shared-secret>
AMB_INTEGRATION_API_KEY=<same-api-key>
AMB_ALLOWED_ORIGIN=http://localhost:5179
```

#### 1-2. CORS Update / CORS 업데이트 / Cập nhật CORS

**AmoebaTalk** `apps/backend/src/main.ts`:
- Add `AMB_ALLOWED_ORIGIN` to CORS allowedOrigins / `AMB_ALLOWED_ORIGIN`을 CORS에 추가 / Thêm `AMB_ALLOWED_ORIGIN` vào CORS

**Changed Files / 변경 파일 / File thay đổi:**

| File | Type / 구분 / Loại | EN | KR | VI |
|------|------|----|----|-----|
| `ambManagement/env/backend/.env.development` | Modify / 수정 / Sửa | Add AMB_ATK_* env vars | AMB_ATK_* 환경변수 추가 | Thêm biến môi trường AMB_ATK_* |
| `ambManagement/env/backend/.env.example` | Modify | Add AMB_ATK_* examples | AMB_ATK_* 예시 추가 | Thêm ví dụ AMB_ATK_* |
| `amoeba-talk/apps/backend/.env` | Modify | Add AMB_* env vars | AMB_* 환경변수 추가 | Thêm biến môi trường AMB_* |
| `amoeba-talk/apps/backend/.env.example` | Modify | Add AMB_* examples | AMB_* 예시 추가 | Thêm ví dụ AMB_* |
| `amoeba-talk/apps/backend/src/main.ts` | Modify | Add CORS origin | CORS origin 추가 | Thêm origin CORS |

---

### Phase 2: AmoebaTalk Backend (2d)

**Goal / 목표 / Mục tiêu:**
- EN: Implement integration API endpoints + DB migration + business logic
- KR: 연동 API endpoint + DB migration + 비즈니스 로직 구현
- VI: Triển khai endpoints API tích hợp + DB migration + logic nghiệp vụ

#### 2-1. Prisma Migration — `atk_amb_account_links`

**New file / 신규 파일 / File mới:** `apps/backend/prisma/schema/amb_account_links.prisma`

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

**Existing model changes / 기존 모델 수정 / Sửa model hiện có:**
- `User` model: add `ambAccountLinks AmbAccountLink[]` relation
- `Company` model: add `ambAccountLinks AmbAccountLink[]` relation

#### 2-2. AMB Connect Session Management / 세션 관리 / Quản lý Session

**Method / 방식 / Phương pháp:** In-memory store (reuse existing OAuth session pattern / 기존 OAuth 세션 패턴 재활용 / tái sử dụng pattern OAuth session hiện có) + 5-min TTL auto-cleanup

```typescript
interface AmbConnectSession {
  sessionId: string;
  email: string;
  name: string;
  avatar: string | null;
  ambUserId: string;
  ambEntityId: string;
  ambEntityCode: string;
  entityName: string;
  userExists: boolean;    // EN: email exists / KR: email 존재 여부 / VI: email đã tồn tại
  createdAt: Date;
  consumed: boolean;      // EN: single use check / KR: 1회 사용 체크 / VI: kiểm tra dùng 1 lần
}
```

#### 2-3. New Module / 신규 모듈 / Module mới — `amb-integration`

```
apps/backend/src/modules/amb-integration/
├── amb-integration.module.ts
├── amb-integration.controller.ts     # /api/auth/amb-connect, /api/auth/amb-register, /api/auth/amb-login
├── amb-integration.service.ts        # Core business logic / 핵심 비즈니스 로직 / Logic nghiệp vụ chính
├── amb-integration.repository.ts     # AmbAccountLink CRUD
├── guards/
│   └── amb-api-key.guard.ts          # Server-to-server API Key auth / 서버간 API Key 인증 / Xác thực API Key giữa server
├── dto/
│   ├── amb-register.request.dto.ts   # { sessionId, password, confirmPassword, companyName? }
│   ├── amb-login.request.dto.ts      # { sessionId, password }
│   └── amb-check-link.response.dto.ts
└── utils/
    └── amb-token.util.ts             # JWT verify, jti tracking
```

#### 2-4. Endpoint Implementation Details / 엔드포인트 구현 상세 / Chi Tiết Triển Khai Endpoint

**`GET /api/auth/amb-connect?token=xxx`**
```
1. Extract token query param / token query param 추출 / Trích xuất token query param
2. JWT verify (SHARED_SECRET, algorithm: HS256)
3. Check jti duplicate (consumed tokens Map/Set, 10-min retention)
   jti 중복 확인 (consumed tokens Map/Set, 10분 보관)
   Kiểm tra jti trùng (Map/Set token đã dùng, giữ 10 phút)
4. Query atk_users by email / email로 atk_users 조회 / Truy vấn atk_users theo email
5. Create AmbConnectSession (in-memory, 5-min TTL)
   AmbConnectSession 생성 (in-memory, 5분 TTL)
   Tạo AmbConnectSession (in-memory, TTL 5 phút)
6. Check current active session / 현재 active session 확인 / Kiểm tra session đang hoạt động:
   - same email session exists → save mapping → redirect /dashboard
     동일 email session 존재 → 매핑 저장 → redirect /dashboard
     session cùng email tồn tại → lưu mapping → redirect /dashboard
   - different email session → redirect /auth/amb-login?session=xxx&conflict=true
     다른 email session → redirect /auth/amb-login?session=xxx&conflict=true
     session email khác → redirect /auth/amb-login?session=xxx&conflict=true
   - no session + user not exists → redirect /auth/amb-register?session=xxx
     세션 없음 + user 미존재 → redirect /auth/amb-register?session=xxx
     không có session + user chưa có → redirect /auth/amb-register?session=xxx
   - no session + user exists → redirect /auth/amb-login?session=xxx
     세션 없음 + user 존재 → redirect /auth/amb-login?session=xxx
     không có session + user đã có → redirect /auth/amb-login?session=xxx
```

**`POST /api/auth/amb-register`**
```
1. Lookup AmbConnectSession by sessionId + check consumed
   sessionId로 AmbConnectSession 조회 + consumed 확인
   Tìm AmbConnectSession theo sessionId + kiểm tra consumed
2. Validate password (reuse existing policy)
   password 유효성 검사 (기존 정책 재사용)
   Kiểm tra password (tái sử dụng chính sách hiện có)
3. password !== confirmPassword → error / 에러 / lỗi
4. Begin Transaction / 트랜잭션 시작 / Bắt đầu Transaction:
   a. INSERT atk_users (email, name, avatar, hashed password)
   b. INSERT atk_companies (name = companyName || entityName, slug = auto-generate)
   c. INSERT atk_company_members (user_id, company_id, role=OWNER, status=ACTIVE)
   d. INSERT atk_amb_account_links (mapping info / 매핑 정보 / thông tin mapping)
5. Commit Transaction / 트랜잭션 커밋 / Commit Transaction
6. Set session consumed = true / Session consumed 처리 / Đánh dấu session consumed
7. Generate JWT tokens (access + refresh) / JWT 토큰 생성 / Tạo JWT token
8. Response: { user, tokens, company }
```

**`POST /api/auth/amb-login`**
```
1. Lookup AmbConnectSession by sessionId
2. Query user by email / email로 user 조회 / Truy vấn user theo email
3. bcrypt.compare(password, user.password)
4. UPSERT atk_amb_account_links (create if not exists, update linkedAt if exists)
   UPSERT (없으면 생성, 있으면 linkedAt 갱신)
   UPSERT (tạo nếu chưa có, cập nhật linkedAt nếu đã có)
5. Set session consumed = true
6. Generate JWT tokens / JWT 토큰 생성 / Tạo JWT token
7. Response: { user, tokens }
```

**`GET /api/integration/amb/check-link?amb_user_id=xxx`**
```
1. AmbApiKeyGuard → verify request header 'x-api-key'
   request header 'x-api-key' 확인 / xác minh header 'x-api-key'
2. Query atk_amb_account_links WHERE amb_user_id = query
3. Response: { linked, atkUserId?, companyName?, linkedAt? }
```

**Changed Files / 변경 파일 / File thay đổi:**

| File | Type | EN | KR | VI |
|------|------|----|----|-----|
| `prisma/schema/amb_account_links.prisma` | New / 신규 / Mới | AmbAccountLink model | AmbAccountLink 모델 | Model AmbAccountLink |
| `prisma/schema/users.prisma` | Modify | Add ambAccountLinks relation | ambAccountLinks relation 추가 | Thêm relation ambAccountLinks |
| `prisma/schema/companies.prisma` | Modify | Add ambAccountLinks relation | ambAccountLinks relation 추가 | Thêm relation ambAccountLinks |
| `src/modules/amb-integration/**` | New | Full module (7+ files) | 전체 모듈 (7+ 파일) | Toàn bộ module (7+ file) |
| `src/modules/auth/auth.module.ts` | Modify | Import AmbIntegrationModule | AmbIntegrationModule import | Import AmbIntegrationModule |
| `src/app.module.ts` | Modify | Register AmbIntegrationModule | AmbIntegrationModule 등록 | Đăng ký AmbIntegrationModule |
| `src/config/configuration.ts` | Modify | Map AMB_* env vars | AMB_* 환경변수 매핑 | Ánh xạ biến môi trường AMB_* |

---

### Phase 3: AmoebaTalk Frontend (1.5d)

**Goal / 목표 / Mục tiêu:**
- EN: AMB connection Register/Login pages + postMessage callback
- KR: AMB 연동 전용 Register/Login 페이지 + postMessage 콜백
- VI: Trang Register/Login liên kết AMB + callback postMessage

#### 3-1. New Pages / 신규 페이지 / Trang mới

```
apps/frontend/app/pages/auth/
├── amb-register.vue    # AMB connection registration / AMB 연동 회원가입 / Đăng ký liên kết AMB
└── amb-login.vue       # AMB connection login / AMB 연동 로그인 / Đăng nhập liên kết AMB
```

#### 3-2. `amb-register.vue` UI Layout

```
┌──────────────────────────────────────┐
│  [AMB Logo] ↔ [AmoebaTalk Logo]     │
│                                      │
│  EN: "Connect from AMB Management"   │
│  KR: "AMB Management에서 연결"        │
│  VI: "Kết nối từ AMB Management"     │
│                                      │
│  ┌──── Auto-filled (readonly) ────┐  │
│  │ 📧 Email:  user@amoeba.vn     │  │
│  │ 👤 Name:   Nguyễn Văn Hưng    │  │
│  │ 🏢 Avatar: [preview]          │  │
│  └────────────────────────────────┘  │
│                                      │
│  Company Name                        │
│  [Amoeba Vietnam          ]         │
│  ☐ EN: Create with different name    │
│    KR: 다른 이름으로 생성              │
│    VI: Tạo với tên khác              │
│  ┌──────────────────────────┐        │
│  │ [Custom company name   ] │ hidden │
│  └──────────────────────────┘        │
│                                      │
│  Password                            │
│  [••••••••••••            ]         │
│                                      │
│  Confirm Password                    │
│  [••••••••••••            ]         │
│                                      │
│  EN: [     Create Account       ]    │
│  KR: [     계정 생성             ]    │
│  VI: [     Tạo Tài Khoản        ]    │
│                                      │
│  EN: ℹ️ This account will be linked  │
│       to your AMB Management         │
│  KR: ℹ️ 이 계정은 AMB Management와   │
│       연결됩니다                      │
│  VI: ℹ️ Tài khoản này sẽ được liên   │
│       kết với AMB Management của bạn  │
└──────────────────────────────────────┘
```

#### 3-3. `amb-login.vue` UI Layout

```
┌──────────────────────────────────────┐
│  [AMB Logo] ↔ [AmoebaTalk Logo]     │
│                                      │
│  EN: "You already have an account"   │
│  KR: "이미 AmoebaTalk 계정이 있습니다"│
│  VI: "Bạn đã có tài khoản AmoebaTalk"│
│                                      │
│  📧 user@amoeba.vn                   │
│                                      │
│  Password                            │
│  [••••••••••••            ]         │
│                                      │
│  EN: [       Sign In            ]    │
│  KR: [       로그인             ]    │
│  VI: [       Đăng Nhập          ]    │
│                                      │
│  EN: Forgot password?                │
│  KR: 비밀번호를 잊으셨나요?            │
│  VI: Quên mật khẩu?                  │
│                                      │
│  ── Session Conflict (conditional) ──│
│  EN: ⚠️ Currently logged in as       │
│       other@email.com                │
│       [Logout & continue] [Cancel]   │
│  KR: ⚠️ 현재 other@email.com으로     │
│       로그인 중입니다                  │
│       [로그아웃 후 계속] [취소]        │
│  VI: ⚠️ Đang đăng nhập với           │
│       other@email.com                │
│       [Đăng xuất & tiếp tục] [Huỷ]  │
└──────────────────────────────────────┘
```

#### 3-4. Composable — `useAmbConnect.ts`

```typescript
// apps/frontend/app/composables/useAmbConnect.ts
export function useAmbConnect() {
  // 1. Extract session ID from URL / URL에서 session ID 추출 / Trích xuất session ID từ URL
  // 2. Load session info via API (email, name, avatar, entityName)
  //    API 호출로 session 정보 로드 / Load thông tin session qua API
  // 3. Register/login submit logic / 제출 로직 / Logic submit
  // 4. On success, send postMessage / 성공 시 postMessage 발송 / Khi thành công, gửi postMessage:
  //    window.opener?.postMessage({ type: 'AMB_CONNECT_SUCCESS', ... }, ambOrigin)
  // 5. Redirect to AmoebaTalk dashboard / 대시보드로 redirect / Chuyển hướng đến dashboard
}
```

#### 3-5. Multilingual Support / 다국어 지원 / Hỗ trợ đa ngôn ngữ

```
apps/frontend/app/locales/
├── en/amb-connect.json    # English
├── ko/amb-connect.json    # 한국어
└── vi/amb-connect.json    # Tiếng Việt
```

**Changed Files / 변경 파일 / File thay đổi:**

| File | Type | EN | KR | VI |
|------|------|----|----|-----|
| `app/pages/auth/amb-register.vue` | New | AMB connection registration page | AMB 연동 회원가입 페이지 | Trang đăng ký liên kết AMB |
| `app/pages/auth/amb-login.vue` | New | AMB connection login page | AMB 연동 로그인 페이지 | Trang đăng nhập liên kết AMB |
| `app/composables/useAmbConnect.ts` | New | AMB connection composable | AMB 연동 composable | Composable liên kết AMB |
| `app/locales/en/amb-connect.json` | New | English translation | 영어 번역 | Bản dịch tiếng Anh |
| `app/locales/ko/amb-connect.json` | New | Korean translation | 한국어 번역 | Bản dịch tiếng Hàn |
| `app/locales/vi/amb-connect.json` | New | Vietnamese translation | 베트남어 번역 | Bản dịch tiếng Việt |

---

### Phase 4: AMB Management Backend (1d)

**Goal / 목표 / Mục tiêu:**
- EN: Token generation API + status check API
- KR: 연동 토큰 생성 API + 상태 확인 API
- VI: API tạo token + API kiểm tra trạng thái

#### 4-1. New Module / 신규 모듈 / Module mới — `amoeba-talk-integration`

```
apps/api/src/domain/amoeba-talk-integration/
├── amoeba-talk-integration.module.ts
├── amoeba-talk-integration.controller.ts
├── amoeba-talk-integration.service.ts
├── dto/
│   ├── connect-token.response.dto.ts
│   └── connection-status.response.dto.ts
└── config/
    └── amoeba-talk.config.ts
```

#### 4-2. Controller Implementation / 컨트롤러 구현 / Triển khai Controller

```typescript
@Controller('integration/amoeba-talk')
export class AmoebaTalkIntegrationController {

  @Post('connect-token')
  @Auth()
  @RequireRoles('MASTER', 'ADMIN', 'SUPER_ADMIN')
  async generateConnectToken(
    @CurrentUser() user: UserPayload,
  ): Promise<StandardResponse<ConnectTokenResponseDto>> {
    // 1. Query user entity info (entId, entCode, entName)
    //    User entity 정보 조회 / Truy vấn thông tin entity của user
    // 2. Sign JWT (SHARED_SECRET, 5-min TTL, jti=uuid)
    //    JWT 서명 / Ký JWT
    // 3. Build connectUrl / connectUrl 조립 / Tạo connectUrl
    return { success: true, data: { connectUrl } };
  }

  @Get('status')
  @Auth()
  @RequireRoles('MASTER', 'ADMIN', 'SUPER_ADMIN')
  async getConnectionStatus(
    @CurrentUser() user: UserPayload,
  ): Promise<StandardResponse<ConnectionStatusResponseDto>> {
    // Call AmoebaTalk API: GET /api/integration/amb/check-link?amb_user_id=xxx
    // AmoebaTalk API 호출 / Gọi API AmoebaTalk
    return { success: true, data: { linked, linkedAt, companyName } };
  }
}
```

#### 4-3. Service Implementation / 서비스 구현 / Triển khai Service

```typescript
@Injectable()
export class AmoebaTalkIntegrationService {

  generateConnectToken(user: UserPayload, entity: HrEntityEntity): string {
    const payload: AmbConnectTokenPayload = {
      sub: user.userId,
      email: user.email,
      name: user.name,
      avatar: user.profileImage,
      entityId: entity.entId,
      entityCode: entity.entCode,
      entityName: entity.entName,
      jti: randomUUID(),
    };
    return jwt.sign(payload, this.sharedSecret, { expiresIn: '5m' });
  }

  async checkConnectionStatus(ambUserId: string): Promise<ConnectionStatus> {
    const response = await axios.get(
      `${this.atkApiUrl}/api/integration/amb/check-link`,
      { params: { amb_user_id: ambUserId }, headers: { 'x-api-key': this.apiKey } }
    );
    return response.data;
  }
}
```

**Changed Files / 변경 파일 / File thay đổi:**

| File | Type | EN | KR | VI |
|------|------|----|----|-----|
| `src/domain/amoeba-talk-integration/**` | New | Full module (6+ files) | 전체 모듈 (6+ 파일) | Toàn bộ module (6+ file) |
| `src/app.module.ts` | Modify | Register module | 모듈 등록 | Đăng ký module |
| `src/config/configuration.ts` | Modify | Map AMB_ATK_* env vars | AMB_ATK_* 환경변수 매핑 | Ánh xạ biến môi trường AMB_ATK_* |

---

### Phase 5: AMB Management Frontend (1d)

**Goal / 목표 / Mục tiêu:**
- EN: Connect button + postMessage receiver + status UI
- KR: Connect 버튼 + postMessage 수신 + 상태 UI
- VI: Nút Connect + nhận postMessage + UI trạng thái

#### 5-1. Entry Point ① — Entity Settings

```tsx
// EN: Display based on connection status / KR: 연동 상태에 따라 표시 / VI: Hiển thị theo trạng thái kết nối
{isLinked ? (
  <div className="flex items-center gap-2">
    <CheckCircle className="text-green-500" />
    <span>{t('settings.amoebaTalkConnected', { companyName })}</span>
    <span className="text-gray-400 text-sm">{linkedAt}</span>
  </div>
) : (
  <Button onClick={handleConnect}>
    {t('settings.amoebaTalkConnect')}
  </Button>
)}
```

#### 5-2. Entry Point ② — AmoebaTalk Embed Area / Embed 영역 / Vùng Embed

```tsx
<div className="relative">
  <iframe src={atkUrl} ... />
  {!isLinked && (
    <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-3 border-t">
      <Button size="sm" onClick={handleConnect}>
        {t('settings.amoebaTalkConnectEmbed')}
      </Button>
    </div>
  )}
</div>
```

#### 5-3. Entry Point ③ — Lobby Banner

```tsx
{!isLinked && (
  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
    <CardContent className="flex items-center justify-between p-4">
      <div>
        <h4>{t('dashboard.amoebaTalkBannerTitle')}</h4>
        <p className="text-sm text-gray-500">
          {t('dashboard.amoebaTalkBannerDesc')}
        </p>
      </div>
      <Button onClick={handleConnect}>{t('dashboard.amoebaTalkBannerCta')}</Button>
    </CardContent>
  </Card>
)}
```

#### 5-4. Shared Hook — `useAmoebaTalkConnect`

```typescript
// apps/web/src/hooks/useAmoebaTalkConnect.ts
export function useAmoebaTalkConnect() {
  const [status, setStatus] = useState<ConnectionStatus>();

  // Check connection status / 연동 상태 조회 / Kiểm tra trạng thái kết nối
  useEffect(() => {
    api.get('/integration/amoeba-talk/status').then(setStatus);
  }, []);

  // Connect button handler / Connect 버튼 핸들러 / Handler nút Connect
  const handleConnect = async () => {
    const { connectUrl } = await api.post('/integration/amoeba-talk/connect-token');
    window.open(connectUrl, '_blank', 'width=500,height=700');
  };

  // Receive postMessage / postMessage 수신 / Nhận postMessage
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== ATK_ORIGIN) return;
      if (event.data.type === 'AMB_CONNECT_SUCCESS') {
        toast.success(t('settings.amoebaTalkConnectSuccess'));
        setStatus({ linked: true, ...event.data });
        reloadIframe();
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  return { status, handleConnect, isLinked: status?.linked };
}
```

#### 5-5. i18n Keys / i18n 키 / Khoá i18n

| Key | EN | KR | VI |
|-----|----|----|-----|
| `settings.amoebaTalkConnect` | Connect AmoebaTalk Account | AmoebaTalk 계정 연결 | Kết nối tài khoản AmoebaTalk |
| `settings.amoebaTalkConnected` | Connected to AmoebaTalk ({companyName}) | AmoebaTalk 연결됨 ({companyName}) | Đã kết nối AmoebaTalk ({companyName}) |
| `settings.amoebaTalkConnectEmbed` | Connect your account to start using AmoebaTalk | 계정을 연결하여 AmoebaTalk를 시작하세요 | Kết nối tài khoản để bắt đầu sử dụng AmoebaTalk |
| `settings.amoebaTalkConnectSuccess` | AmoebaTalk connection successful! | AmoebaTalk 연결 성공! | Kết nối AmoebaTalk thành công! |
| `dashboard.amoebaTalkBannerTitle` | Start customer messaging with AmoebaTalk | AmoebaTalk로 고객 메시징을 시작하세요 | Bắt đầu nhắn tin khách hàng với AmoebaTalk |
| `dashboard.amoebaTalkBannerDesc` | Get closer to your customers with omnichannel messaging | 옴니채널 메시징으로 고객과 더 가까워지세요 | Tiếp cận khách hàng gần hơn với messaging đa kênh |
| `dashboard.amoebaTalkBannerCta` | Connect now → | 연결하기 → | Kết nối ngay → |

**Changed Files / 변경 파일 / File thay đổi:**

| File | Type | EN | KR | VI |
|------|------|----|----|-----|
| `src/hooks/useAmoebaTalkConnect.ts` | New | Connection logic hook | 연동 로직 hook | Hook logic kết nối |
| Entity Settings page | Modify | Add connection section | 연동 섹션 추가 | Thêm section kết nối |
| AmoebaTalk embed component | Modify | Button overlay when not connected | 미연결 시 버튼 오버레이 | Overlay nút khi chưa kết nối |
| Dashboard/Lobby page | Modify | Promotional banner | 홍보 배너 추가 | Thêm banner quảng bá |
| `src/locales/{en,ko,vi}/settings.json` | Modify | Add i18n keys | i18n 키 추가 | Thêm khoá i18n |

---

### Phase 6: Integration Test & Finalization / 통합 테스트 & 마무리 / Test Tích Hợp & Hoàn Thiện (1d)

#### 6-1. Test Scenarios / 테스트 시나리오 / Kịch bản test

| # | EN | KR | VI | Expected Result |
|---|----|----|-----|----------------|
| T1 | MASTER user clicks Connect button | MASTER 유저가 Connect 버튼 클릭 | User MASTER nhấn nút Connect | New tab opens AmoebaTalk connection page / 새 탭에 연동 페이지 열림 / Tab mới mở trang kết nối |
| T2 | MEMBER user attempts Connect | MEMBER 유저가 Connect 시도 | User MEMBER thử Connect | 403 Forbidden |
| T3 | Non-existent email → Register form | 미존재 email → Register form | Email chưa có → Form đăng ký | Auto-fill email, name, company / 자동 채움 / Tự động điền |
| T4 | Registration success | 회원가입 성공 | Đăng ký thành công | Create atk_users + atk_companies + atk_company_members + atk_amb_account_links |
| T5 | After register, AMB tab | Register 후 AMB 탭 | Sau đăng ký, tab AMB | Receive postMessage, show toast, button → "Connected" / postMessage 수신, toast 표시, "연결됨" / Nhận postMessage, hiển thị toast, "Đã kết nối" |
| T6 | Existing email → Login form | 존재하는 email → Login form | Email đã có → Form đăng nhập | Email readonly, enter password / email readonly, password 입력 / Email readonly, nhập password |
| T7 | Login success | 로그인 성공 | Đăng nhập thành công | Save mapping, AmoebaTalk dashboard / 매핑 저장 / Lưu mapping |
| T8 | Same email active session | 동일 email 활성 세션 | Session cùng email đang hoạt động | Redirect to dashboard immediately / 바로 dashboard redirect / Chuyển hướng dashboard ngay |
| T9 | Different email active session | 다른 email 활성 세션 | Session email khác đang hoạt động | "Logged in with another account" warning / "다른 계정 로그인 중" 경고 / Cảnh báo "Đang đăng nhập bằng tài khoản khác" |
| T10 | Token expired (>5min) | Token 만료 (5분 초과) | Token hết hạn (>5 phút) | Error page "Link expired" / 에러 페이지 "링크 만료" / Trang lỗi "Link đã hết hạn" |
| T11 | Token reuse (jti duplicate) | Token 재사용 (jti 중복) | Dùng lại token (jti trùng) | Error page "Already used link" / 에러 페이지 "이미 사용된 링크" / Trang lỗi "Link đã được sử dụng" |
| T12 | Company name change option | Company 이름 변경 옵션 | Tùy chọn đổi tên Company | Create company with custom name / 커스텀 이름으로 company 생성 / Tạo company với tên tuỳ chỉnh |
| T13 | Company slug conflict | Company slug 충돌 | Xung đột slug Company | Auto suffix added, normal creation / 자동 suffix 추가, 정상 생성 / Tự thêm suffix, tạo bình thường |
| T14 | Status check when already connected | 이미 연결 시 status 조회 | Kiểm tra status khi đã kết nối | `{ linked: true, companyName, linkedAt }` |
| T15 | CORS — AMB → AmoebaTalk postMessage | CORS — AMB → AmoebaTalk postMessage | CORS — AMB → AmoebaTalk postMessage | Origin verification passes / origin 검증 통과 / Xác minh origin thành công |

#### 6-2. Environment Verification / 환경별 검증 / Kiểm tra theo môi trường

| ENV | AMB URL | AmoebaTalk URL | EN | KR | VI |
|-----|---------|---------------|----|----|-----|
| Dev | localhost:5179 | localhost:3000 | CORS, postMessage origin | CORS, postMessage origin | CORS, postMessage origin |
| Staging | stg-ama.amoeba.site | stg-talk.amoeba.site | HTTPS, Cookie SameSite | HTTPS, Cookie SameSite | HTTPS, Cookie SameSite |
| Production | ama.amoeba.site | talk.amoeba.site | Full E2E flow | 전체 E2E flow | Toàn bộ flow E2E |

#### 6-3. Security Checklist / 보안 체크리스트 / Checklist bảo mật

- [ ] JWT Shared Secret: min 64-char hex, matching on both sides / 최소 64자 hex, 양쪽 일치 / tối thiểu 64 ký tự hex, khớp cả 2 bên
- [ ] jti single-use verification working / jti 1회 사용 검증 동작 / Xác minh jti dùng 1 lần hoạt động
- [ ] Token rejection after expiry / Token 만료 후 거부 확인 / Từ chối token sau khi hết hạn
- [ ] 401 on missing API Key header / API Key 헤더 누락 시 401 / 401 khi thiếu header API Key
- [ ] postMessage origin verification working / postMessage origin 검증 동작 / Xác minh origin postMessage hoạt động
- [ ] HTTPS enforced (staging/production) / HTTPS 강제 / Bắt buộc HTTPS
- [ ] Password hashing (bcrypt) verified / Password 해싱 (bcrypt) 확인 / Xác nhận hash password (bcrypt)
- [ ] SQL Injection / XSS prevention verified / SQL Injection / XSS 방지 확인 / Xác nhận phòng chống SQL Injection / XSS
- [ ] Rate Limiting working (connect-token 5/min) / Rate Limiting 동작 확인 / Rate Limiting hoạt động

---

## 3. Complete Changed Files List / 변경 대상 파일 목록 / Danh Sách File Thay Đổi

### AmoebaTalk Side / AmoebaTalk 측 / Phía AmoebaTalk

| File | Type | EN | KR | VI |
|------|------|----|----|-----|
| `prisma/schema/amb_account_links.prisma` | New | AmbAccountLink model definition | AmbAccountLink 모델 정의 | Định nghĩa model AmbAccountLink |
| `prisma/schema/users.prisma` | Modify | Add relation | relation 추가 | Thêm relation |
| `prisma/schema/companies.prisma` | Modify | Add relation | relation 추가 | Thêm relation |
| `src/modules/amb-integration/amb-integration.module.ts` | New | Module definition | 모듈 정의 | Định nghĩa module |
| `src/modules/amb-integration/amb-integration.controller.ts` | New | 3 endpoints | 3 엔드포인트 | 3 endpoints |
| `src/modules/amb-integration/amb-integration.service.ts` | New | Business logic | 비즈니스 로직 | Logic nghiệp vụ |
| `src/modules/amb-integration/amb-integration.repository.ts` | New | DB access | DB 접근 | Truy cập DB |
| `src/modules/amb-integration/guards/amb-api-key.guard.ts` | New | API Key auth | API Key 인증 | Xác thực API Key |
| `src/modules/amb-integration/dto/*.ts` | New | DTOs (3-4 files) | DTO (3-4개) | DTO (3-4 file) |
| `src/modules/amb-integration/utils/amb-token.util.ts` | New | JWT verify, jti tracking | JWT 검증, jti 추적 | Xác minh JWT, theo dõi jti |
| `src/app.module.ts` | Modify | Register module | 모듈 등록 | Đăng ký module |
| `src/config/configuration.ts` | Modify | Map env vars | 환경변수 매핑 | Ánh xạ biến môi trường |
| `src/main.ts` | Modify | Add CORS origin | CORS origin 추가 | Thêm origin CORS |
| `app/pages/auth/amb-register.vue` | New | Registration page | 회원가입 페이지 | Trang đăng ký |
| `app/pages/auth/amb-login.vue` | New | Login page | 로그인 페이지 | Trang đăng nhập |
| `app/composables/useAmbConnect.ts` | New | Connection composable | 연동 composable | Composable kết nối |
| `app/locales/{en,ko,vi}/amb-connect.json` | New | Translations (3 files) | 번역 (3개) | Bản dịch (3 file) |
| `.env` / `.env.example` | Modify | AMB_* env vars | AMB_* 환경변수 | Biến môi trường AMB_* |

### AMB Management Side / AMB Management 측 / Phía AMB Management

| File | Type | EN | KR | VI |
|------|------|----|----|-----|
| `apps/api/src/domain/amoeba-talk-integration/*.ts` | New | Full module (6+ files) | 전체 모듈 (6+ 파일) | Toàn bộ module (6+ file) |
| `apps/api/src/app.module.ts` | Modify | Register module | 모듈 등록 | Đăng ký module |
| `apps/api/src/config/configuration.ts` | Modify | Map env vars | 환경변수 매핑 | Ánh xạ biến môi trường |
| `apps/web/src/hooks/useAmoebaTalkConnect.ts` | New | React hook | React hook | React hook |
| Entity Settings page | Modify | Connection section UI | 연동 섹션 UI | UI section kết nối |
| AmoebaTalk embed component | Modify | Button overlay | 버튼 오버레이 | Overlay nút |
| Dashboard/Lobby page | Modify | Banner card | 배너 카드 | Card banner |
| `apps/web/src/locales/{en,ko,vi}/settings.json` | Modify | Add i18n keys | i18n 키 추가 | Thêm khoá i18n |
| `env/backend/.env.development` | Modify | AMB_ATK_* env vars | AMB_ATK_* 환경변수 | Biến môi trường AMB_ATK_* |
| `env/backend/.env.example` | Modify | AMB_ATK_* examples | AMB_ATK_* 예시 | Ví dụ AMB_ATK_* |

---

## 4. Side Impact Analysis / 사이드 임팩트 분석 / Phân Tích Tác Động Phụ

| EN | KR | VI | Risk | Mitigation |
|----|----|----|------|------------|
| AmoebaTalk auth flow | AmoebaTalk 인증 흐름 | Flow xác thực AmoebaTalk | Low / 낮음 / Thấp | Isolated in new module / 신규 모듈로 격리 / Cách ly trong module mới |
| AmoebaTalk DB migration | AmoebaTalk DB 마이그레이션 | Migration DB AmoebaTalk | Medium / 중간 / Trung bình | Migration test required / migration 테스트 필수 / Cần test migration |
| AMB auth/guard | AMB 인증/가드 | AMB xác thực/guard | Low | Reuse existing guards / 기존 guard 재사용 / Tái sử dụng guard hiện có |
| CORS config | CORS 설정 | Cấu hình CORS | Medium | Per-environment separation / 환경별 분리 / Phân tách theo môi trường |
| Performance | 성능 | Hiệu năng | Low | In-memory session (5-min TTL), single API call / API 호출 1회 / 1 lần gọi API |
| Security | 보안 | Bảo mật | Medium | Follow security checklist / 보안 체크리스트 준수 / Tuân theo checklist bảo mật |

---

## 5. Dependency & Execution Order / 의존관계 & 구현 순서 / Phụ Thuộc & Thứ Tự Thực Hiện

```
Phase 1 (Infrastructure / 인프라 / Hạ tầng)
    │
    ├──▶ Phase 2 (ATK Backend) ──▶ Phase 3 (ATK Frontend)
    │                                       │
    └──▶ Phase 4 (AMB Backend) ──▶ Phase 5 (AMB Frontend)
                                            │
                                            ▼
                              Phase 6 (Integration Test / 통합 테스트 / Test tích hợp)
```

- EN: Phase 2 and 4 can run in **parallel** after Phase 1
- KR: Phase 2, 4는 Phase 1 이후 **병렬 진행 가능**
- VI: Phase 2 và 4 có thể chạy **song song** sau Phase 1

- EN: Phase 3 requires Phase 2 completion (API endpoints must exist for frontend integration)
- KR: Phase 3은 Phase 2 완료 필요 (API endpoint 존재해야 프론트 연동)
- VI: Phase 3 cần Phase 2 hoàn thành (cần endpoints API để tích hợp frontend)

- EN: Phase 5 requires Phase 4 completion (AMB API must exist for hook implementation)
- KR: Phase 5는 Phase 4 완료 필요 (AMB API 존재해야 hook 구현)
- VI: Phase 5 cần Phase 4 hoàn thành (cần API AMB để triển khai hook)

---

## 6. Deliverables / 산출물 / Sản phẩm bàn giao

| Phase | EN | KR | VI | Verification Criteria |
|-------|----|----|-----|----------------------|
| 1 | Env vars setup, CORS update | 환경변수 설정, CORS 업데이트 | Thiết lập biến môi trường, cập nhật CORS | Both servers start normally / 양쪽 서버 정상 구동 / Cả 2 server khởi động bình thường |
| 2 | AmoebaTalk integration APIs (3) + Migration | AmoebaTalk 연동 API 3개 + Migration | 3 API tích hợp AmoebaTalk + Migration | Unit tests pass / 단위 테스트 통과 / Unit test pass |
| 3 | Connection Register/Login pages | 연동 Register/Login 페이지 | Trang Register/Login kết nối | UI renders + form submit works / UI 렌더링 + form submit 동작 / UI render + form submit hoạt động |
| 4 | AMB token generation APIs (2) | AMB 토큰 생성 API 2개 | 2 API tạo token AMB | Unit tests pass / 단위 테스트 통과 / Unit test pass |
| 5 | Connect button + postMessage + status UI | Connect 버튼 + postMessage + 상태 UI | Nút Connect + postMessage + UI trạng thái | Click → new tab → connect → callback / 클릭 → 새탭 → 연동 → 콜백 / Click → tab mới → kết nối → callback |
| 6 | Integration tests passed, security checklist complete | 통합 테스트 통과, 보안 체크리스트 완료 | Test tích hợp pass, checklist bảo mật hoàn thành | T1-T15 all pass / T1-T15 전체 통과 / T1-T15 tất cả pass |

---

## Change Log / 변경 이력 / Lịch Sử Thay Đổi

| Version | Date | EN | KR | VI |
|---------|------|----|----|-----|
| v1.0 | 2026-03-30 | Initial implementation plan | 초기 작업계획서 작성 | Tạo kế hoạch triển khai ban đầu |
| v1.1 | 2026-03-30 | Added trilingual support (EN/KR/VI) | 3개 국어 지원 추가 (영/한/베) | Thêm hỗ trợ 3 ngôn ngữ (Anh/Hàn/Việt) |
