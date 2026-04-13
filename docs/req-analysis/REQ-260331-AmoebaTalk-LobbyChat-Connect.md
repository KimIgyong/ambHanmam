# REQ-AmoebaTalk-LobbyChat-Connect

## AmoebaTalk Service Menu & Registration via Lobby Chat
## AmoebaTalk 서비스 메뉴 & 로비 채팅을 통한 회원가입
## Menu Dịch Vụ AmoebaTalk & Đăng Ký Qua Lobby Chat

**Version / 문서버전 / Phiên bản:** v1.0
**Date / 작성일 / Ngày tạo:** 2026-03-31
**Extends / 확장 / Mở rộng:** `REQ-AmoebaTalk-AccountConnect-20260330.md`

---

## 1. Requirement Summary / 요구사항 요약 / Tóm Tắt Yêu Cầu

| EN | KR | VI |
|----|----|----|
| Add "AmoebaTalk" submenu under Lobby Chat in AMB sidebar | AMB 사이드바의 Lobby Chat 아래에 "AmoebaTalk" 서브메뉴 추가 | Thêm submenu "AmoebaTalk" dưới Lobby Chat trong sidebar AMB |
| Show static service description page when clicked | 클릭 시 정적 서비스 소개 페이지 표시 | Hiển thị trang giới thiệu dịch vụ tĩnh khi nhấn |
| "Start using AmoebaTalk" button opens pre-filled register form on AmoebaTalk | "서비스 시작하기" 버튼으로 AmoebaTalk에 사전 채움된 회원가입 폼 열기 | Nút "Bắt đầu sử dụng" mở form đăng ký đã điền sẵn trên AmoebaTalk |
| User only enters password + confirm password (no email verification) | 사용자는 password + 확인만 입력 (이메일 인증 없음) | User chỉ nhập password + xác nhận (không cần xác minh email) |
| Pre-filled fields: email, name, avatar, company name (editable) | 사전 채움: email, name, avatar, company name (수정 가능) | Điền sẵn: email, name, avatar, company name (có thể sửa) |
| If email already exists → switch to login flow (enter password only) | 이메일 이미 존재 시 → 로그인 흐름 전환 (password만 입력) | Nếu email đã tồn tại → chuyển sang flow đăng nhập (chỉ nhập password) |
| Only MASTER/ADMIN+ can see menu and use the feature | MASTER/ADMIN+ 역할만 메뉴 및 기능 사용 가능 | Chỉ vai trò MASTER/ADMIN+ mới thấy menu và dùng tính năng |
| After register/login → auto-login to AmoebaTalk | 가입/로그인 후 → AmoebaTalk 자동 로그인 | Sau đăng ký/đăng nhập → tự động đăng nhập AmoebaTalk |

---

## 2. Consolidated User Flow / 통합 사용자 흐름 / Luồng Người Dùng Tổng Hợp

```
┌─── AMB Management (ama.amoeba.site) ─────────────────────────────────────┐
│                                                                           │
│  Sidebar                        Main Content Area                         │
│  ┌──────────┐                   ┌──────────────────────────────────────┐  │
│  │ ...      │                   │                                      │  │
│  │ 💬 Lobby │                   │                                      │  │
│  │  Chat    │                   │                                      │  │
│  │  └─ 💬   │ ── click ──────▶ │   SERVICE DESCRIPTION PAGE           │  │
│  │   AmoebaTalk                 │   (Static, rendered by AMB)          │  │
│  │   🔴     │                   │                                      │  │
│  │ ...      │                   │   [🚀 서비스 시작하기]                 │  │
│  └──────────┘                   │      Bắt đầu sử dụng                 │  │
│                                 │                                      │  │
│                                 └────────────────┬─────────────────────┘  │
│                                                  │                        │
│                                            click button                   │
│                                                  │                        │
│                                                  ▼                        │
│                                   AMB Backend: POST /connect-token        │
│                                   → Signed JWT (5min, 1-time use)         │
│                                                  │                        │
│                                                  ▼                        │
│                                   window.open(talk.amoeba.site/           │
│                                     auth/amb-connect?token=xxx)           │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
┌─── AmoebaTalk (talk.amoeba.site) — New Tab/Popup ────────────────────────┐
│                                                                           │
│   ④ GET /auth/amb-connect?token=xxx                                       │
│      → Verify JWT → Check email                                           │
│                                                                           │
│      ┌───────────────────────┬──────────────────────────┐                │
│      │                       │                          │                │
│      ▼                       ▼                          ▼                │
│  [Email chưa có]       [Email đã có]           [Email đã có +            │
│  [Email 미존재]         [Email 존재]             Active session           │
│  [Chưa có email]       [Đã có email]            같은 email]              │
│      │                       │                          │                │
│      ▼                       ▼                          ▼                │
│  ┌──────────────┐   ┌──────────────┐          Auto-link +                │
│  │  REGISTER    │   │   LOGIN      │          redirect dashboard         │
│  │  PAGE (NEW)  │   │   PAGE       │                                     │
│  │              │   │              │                                     │
│  │ email    🔒  │   │ email    🔒  │                                     │
│  │ name     🔒  │   │              │                                     │
│  │ avatar   🔒  │   │ password *   │                                     │
│  │ company  ✏️  │   │              │                                     │
│  │ password *   │   │ [Đăng nhập]  │                                     │
│  │ confirm  *   │   │              │                                     │
│  │              │   │ Quên MK?     │                                     │
│  │ [Tạo TK]    │   └──────┬───────┘                                     │
│  └──────┬───────┘          │                                             │
│         │                  │                                             │
│         └────────┬─────────┘                                             │
│                  │                                                        │
│                  ▼                                                        │
│        ⑦ Success: Create/Login                                           │
│           • User created (no email verify)                               │
│           • Company created (OWNER role)                                 │
│           • atk_amb_account_links saved                                  │
│           • JWT tokens issued                                            │
│           • postMessage → AMB                                            │
│           • Stay on AmoebaTalk dashboard                                 │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
                                                   │
                                            postMessage
                                                   │
                                                   ▼
┌─── AMB Management (receives callback) ───────────────────────────────────┐
│                                                                           │
│   ⑧ Toast "✅ 연결 성공! / Kết nối thành công!"                           │
│      Sidebar: 🔴 → ✅                                                    │
│      Service page → iframe (authenticated)                               │
│      Next visit: AmoebaTalk menu → load iframe directly                  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Screens / 상세 화면 / Màn Hình Chi Tiết

### Screen 1: AMB Sidebar — AmoebaTalk Menu
### AMB 사이드바 — AmoebaTalk 메뉴
### Sidebar AMB — Menu AmoebaTalk

```
┌────────────────────────┐
│                        │
│  ── 커뮤니케이션 ──     │
│  ── Communication ──   │
│                        │
│  💬 Lobby Chat         │
│  │                     │
│  └── 💬 AmoebaTalk 🔴  │ ◀── MASTER/ADMIN+ 만 표시
│                        │      Chỉ hiển thị MASTER/ADMIN+
│  📧 웹메일              │
│     Webmail            │
│                        │
└────────────────────────┘

Visibility rules / 표시 규칙 / Quy tắc hiển thị:
- MASTER/ADMIN/SUPER_ADMIN: ✅ 표시 / hiển thị
- MANAGER/MEMBER/VIEWER:    ❌ 숨김 / ẩn

Status indicator / 상태 표시 / Chỉ báo trạng thái:
- 🔴 미연결 / Chưa kết nối
- ✅ 연결됨 / Đã kết nối
```

---

### Screen 2: Service Description Page (Static, AMB-rendered)
### 서비스 소개 페이지 (정적, AMB 렌더링)
### Trang Giới Thiệu Dịch Vụ (Tĩnh, AMB render)

**조건 / Điều kiện:** AmoebaTalk 미연결 시 표시 / Hiển thị khi chưa kết nối AmoebaTalk

```
┌─────────────────────────────────────────────────────────────────────────┐
│  사이드바   │                                                           │
│            │  AmoebaTalk                                                │
│  ...       │  ══════════════════════════════════════════════════════    │
│            │                                                           │
│  💬 Lobby  │  ┌─────────────────────────────────────────────────────┐  │
│   └ 💬 ATK │  │                                                     │  │
│     ◀ 선택 │  │         ┌──────────────────┐                        │  │
│            │  │         │                  │                        │  │
│  ...       │  │         │    💬            │                        │  │
│            │  │         │   AmoebaTalk     │                        │  │
│            │  │         │                  │                        │  │
│            │  │         └──────────────────┘                        │  │
│            │  │                                                     │  │
│            │  │   옴니채널 고객 메시징 플랫폼                          │  │
│            │  │   Nền tảng nhắn tin khách hàng đa kênh              │  │
│            │  │                                                     │  │
│            │  │   ─────────────────────────────────────────────     │  │
│            │  │                                                     │  │
│            │  │   ┌─────────────────────────────────────────────┐  │  │
│            │  │   │                                             │  │  │
│            │  │   │  📱 다양한 채널 통합 관리                     │  │  │
│            │  │   │     Quản lý tập trung nhiều kênh             │  │  │
│            │  │   │                                             │  │  │
│            │  │   │  Facebook · Zalo · LINE · KakaoTalk         │  │  │
│            │  │   │  WhatsApp · Instagram · Webchat             │  │  │
│            │  │   │                                             │  │  │
│            │  │   ├─────────────────────────────────────────────┤  │  │
│            │  │   │                                             │  │  │
│            │  │   │  🤖 AI 기반 스마트 응대                      │  │  │
│            │  │   │     Hỗ trợ thông minh bằng AI               │  │  │
│            │  │   │                                             │  │  │
│            │  │   │  자동 응답 · 고객 분석 · 감정 분석            │  │  │
│            │  │   │  Tự động trả lời · Phân tích · Cảm xúc      │  │  │
│            │  │   │                                             │  │  │
│            │  │   ├─────────────────────────────────────────────┤  │  │
│            │  │   │                                             │  │  │
│            │  │   │  🛒 이커머스 연동                             │  │  │
│            │  │   │     Tích hợp thương mại điện tử              │  │  │
│            │  │   │                                             │  │  │
│            │  │   │  Shopify · Odoo · WooCommerce               │  │  │
│            │  │   │                                             │  │  │
│            │  │   ├─────────────────────────────────────────────┤  │  │
│            │  │   │                                             │  │  │
│            │  │   │  👥 팀 협업 & 실시간 대화                     │  │  │
│            │  │   │     Cộng tác nhóm & trò chuyện thời gian thực│  │  │
│            │  │   │                                             │  │  │
│            │  │   │  대화 배정 · 메모 · 태그 · 보고서             │  │  │
│            │  │   │  Phân công · Ghi chú · Tag · Báo cáo        │  │  │
│            │  │   │                                             │  │  │
│            │  │   └─────────────────────────────────────────────┘  │  │
│            │  │                                                     │  │
│            │  │   ─────────────────────────────────────────────     │  │
│            │  │                                                     │  │
│            │  │   ┌─────────────────────────────────────────────┐  │  │
│            │  │   │  현재 법인 정보로 등록됩니다                    │  │  │
│            │  │   │  Đăng ký bằng thông tin pháp nhân hiện tại   │  │  │
│            │  │   │                                             │  │  │
│            │  │   │  🏢  AMOEBA CO., LTD (VN01)                 │  │  │
│            │  │   │  📧  master@amoeba.vn                       │  │  │
│            │  │   │  👤  VN Master                               │  │  │
│            │  │   └─────────────────────────────────────────────┘  │  │
│            │  │                                                     │  │
│            │  │   ┌─────────────────────────────────────────────┐  │  │
│            │  │   │                                             │  │  │
│            │  │   │    🚀 AmoebaTalk 서비스 시작하기              │  │  │
│            │  │   │       Bắt đầu sử dụng dịch vụ AmoebaTalk    │  │  │
│            │  │   │                                             │  │  │
│            │  │   └─────────────────────────────────────────────┘  │  │
│            │  │   ▲ Primary button: bg-blue-600 text-white w-full  │  │
│            │  │                                                     │  │
│            │  └─────────────────────────────────────────────────────┘  │
│            │                                                           │
└────────────┴───────────────────────────────────────────────────────────┘
```

---

### Screen 3: AmoebaTalk Register Page (Pre-filled, New Tab)
### AmoebaTalk 회원가입 페이지 (사전 채움, 새 탭)
### Trang Đăng Ký AmoebaTalk (Điền Sẵn, Tab Mới)

**조건 / Điều kiện:** Email chưa tồn tại trên AmoebaTalk

```
┌───────────────────────────────────────────────────────┐
│  AmoebaTalk                                    [New Tab]│
│                                                        │
│   ┌────────┐         ┌────────┐                       │
│   │  AMB   │   ──▶   │  💬    │                       │
│   │  Mgmt  │         │  ATK   │                       │
│   └────────┘         └────────┘                       │
│                                                        │
│   AMB Management에서 계정 생성                          │
│   Tạo tài khoản từ AMB Management                      │
│                                                        │
│   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │  📋 AMB 전달 정보 / Thông tin từ AMB            │   │
│   │                                                │   │
│   │  ┌──────┐  master@amoeba.vn                    │   │
│   │  │  👤  │  VN Master                           │   │
│   │  │avatar│  AMOEBA CO., LTD                     │   │
│   │  └──────┘                                      │   │
│   │                                                │   │
│   │  bg-blue-50 border-blue-100 rounded-lg         │   │
│   └────────────────────────────────────────────────┘   │
│                                                        │
│   ━━━ 계정 정보 / Thông tin tài khoản ━━━━━━━━━━━━━━   │
│                                                        │
│   📧 이메일 / Email                                     │
│   ┌────────────────────────────────────────────────┐   │
│   │ master@amoeba.vn                          🔒   │   │
│   └────────────────────────────────────────────────┘   │
│   ▲ readonly, bg-gray-100                              │
│                                                        │
│   👤 이름 / Họ tên                                      │
│   ┌────────────────────────────────────────────────┐   │
│   │ VN Master                                 🔒   │   │
│   └────────────────────────────────────────────────┘   │
│   ▲ readonly, bg-gray-100                              │
│                                                        │
│   🖼️ 프로필 이미지 / Ảnh đại diện                       │
│   ┌──────┐                                             │
│   │  👤  │  AMB 프로필 / Ảnh từ AMB                     │
│   └──────┘  (없으면 기본 아이콘 / Mặc định nếu không có) │
│   ▲ readonly                                           │
│                                                        │
│   ━━━ 회사 정보 / Thông tin công ty ━━━━━━━━━━━━━━━━━   │
│                                                        │
│   🏢 회사명 / Tên công ty *                              │
│   ┌────────────────────────────────────────────────┐   │
│   │ AMOEBA CO., LTD                               │   │
│   └────────────────────────────────────────────────┘   │
│   ▲ editable (기본값 = AMB entityName, 수정 가능)       │
│     Có thể sửa (mặc định = tên pháp nhân AMB)         │
│   ℹ️ 회사명은 나중에 변경할 수 있습니다                    │
│      Bạn có thể đổi tên công ty sau                    │
│                                                        │
│   ━━━ 보안 / Bảo mật ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                        │
│   🔑 비밀번호 / Mật khẩu *                               │
│   ┌────────────────────────────────────────────────┐   │
│   │                                           👁   │   │
│   └────────────────────────────────────────────────┘   │
│   ■■□□□□□□□□□□ 약함 / Yếu                              │
│                                                        │
│   ✅ 8자 이상 / Tối thiểu 8 ký tự                       │
│   ❌ 대문자 포함 / Có chữ hoa                            │
│   ❌ 소문자 포함 / Có chữ thường                         │
│   ❌ 숫자 포함 / Có số                                   │
│   ❌ 특수문자 포함 / Có ký tự đặc biệt                    │
│                                                        │
│   🔑 비밀번호 확인 / Xác nhận mật khẩu *                  │
│   ┌────────────────────────────────────────────────┐   │
│   │                                           👁   │   │
│   └────────────────────────────────────────────────┘   │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │                                                │   │
│   │         계정 생성 / Tạo tài khoản               │   │
│   │                                                │   │
│   └────────────────────────────────────────────────┘   │
│                                                        │
│   ┌────────────────────────────────────────────────┐   │
│   │  ℹ️ 이메일 인증 없이 바로 사용 가능합니다          │   │
│   │     Có thể sử dụng ngay mà không cần           │   │
│   │     xác minh email                              │   │
│   │                                                │   │
│   │  이 계정은 AMB Management의                     │   │
│   │  AMOEBA CO., LTD 법인과 연결됩니다               │   │
│   │  Tài khoản này sẽ được liên kết với pháp nhân  │   │
│   │  AMOEBA CO., LTD của AMB Management            │   │
│   └────────────────────────────────────────────────┘   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

### Screen 3-E: Register Error States
### 회원가입 에러 상태
### Trạng Thái Lỗi Đăng Ký

```
Error 1: 비밀번호 불일치 / Mật khẩu không khớp
──────────────────────────────────────────────
│  🔑 비밀번호 확인 / Xác nhận mật khẩu          │
│  ┌──────────────────────────────────────┐     │
│  │ ••••••                              │ 👁  │
│  └──────────────────────────────────────┘     │
│  ❌ 비밀번호가 일치하지 않습니다                  │
│     Mật khẩu không khớp                       │


Error 2: 비밀번호 정책 미충족 / Chưa đạt chính sách mật khẩu
──────────────────────────────────────────────
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  │  ❌ 비밀번호가 요구사항을 충족하지 않습니다 │  │
│  │     Mật khẩu chưa đạt yêu cầu          │  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │


Error 3: 회사명 비어있음 / Tên công ty trống
──────────────────────────────────────────────
│  🏢 회사명 / Tên công ty *                     │
│  ┌──────────────────────────────────────┐     │
│  │                                      │     │
│  └──────────────────────────────────────┘     │
│  ❌ 회사명을 입력해 주세요                      │
│     Vui lòng nhập tên công ty                 │


Error 4: 서버 에러 / Lỗi server
──────────────────────────────────────────────
│  ┌────────────────────────────────────────┐  │
│  │  ❌ 계정 생성에 실패했습니다               │  │
│  │     Tạo tài khoản thất bại              │  │
│  │                                        │  │
│  │  잠시 후 다시 시도해 주세요                │  │
│  │  Vui lòng thử lại sau                   │  │
│  │                                        │  │
│  │  [다시 시도 / Thử lại]                   │  │
│  └────────────────────────────────────────┘  │


Error 5: Token 만료/재사용 / Token hết hạn/đã dùng
──────────────────────────────────────────────
│  ┌────────────────────────────────────────┐  │
│  │  ⏰ 연결 링크가 만료되었습니다             │  │
│  │     Link kết nối đã hết hạn             │  │
│  │                                        │  │
│  │  AMB Management에서 다시 시도해 주세요    │  │
│  │  Vui lòng thử lại từ AMB Management     │  │
│  │                                        │  │
│  │  [창 닫기 / Đóng cửa sổ]                │  │
│  └────────────────────────────────────────┘  │
```

---

### Screen 4: AmoebaTalk Login Page (Email Already Exists)
### AmoebaTalk 로그인 (이메일 이미 존재)
### Trang Đăng Nhập AmoebaTalk (Email Đã Tồn Tại)

```
┌────────────────────────────────────────────────────────┐
│  AmoebaTalk                                     [New Tab]│
│                                                         │
│   ┌────────┐         ┌────────┐                        │
│   │  AMB   │   ──▶   │  💬    │                        │
│   │  Mgmt  │         │  ATK   │                        │
│   └────────┘         └────────┘                        │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │  ℹ️ 이 이메일로 등록된 AmoebaTalk 계정이          │   │
│   │     이미 존재합니다                                │   │
│   │                                                 │   │
│   │     Đã tồn tại tài khoản AmoebaTalk đăng ký     │   │
│   │     với email này                                │   │
│   │                                                 │   │
│   │  비밀번호를 입력하여 로그인하면                     │   │
│   │  AMB Management와 연결됩니다                      │   │
│   │  Nhập mật khẩu để đăng nhập và liên kết          │   │
│   │  với AMB Management                              │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   📧 이메일 / Email                                      │
│   ┌─────────────────────────────────────────────────┐   │
│   │ master@amoeba.vn                           🔒   │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   🔑 비밀번호 / Mật khẩu *                                │
│   ┌─────────────────────────────────────────────────┐   │
│   │                                            👁   │   │
│   └─────────────────────────────────────────────────┘   │
│   ▲ auto-focus                                          │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │                                                 │   │
│   │            로그인 / Đăng nhập                     │   │
│   │                                                 │   │
│   └─────────────────────────────────────────────────┘   │
│                                                         │
│   비밀번호를 잊으셨나요? / Quên mật khẩu?                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

### Screen 5: AMB — After Connection Success
### AMB — 연결 성공 후
### AMB — Sau Khi Kết Nối Thành Công

```
┌─────────────────────────────────────────────────────────────────────────┐
│  사이드바   │                                                           │
│            │  AmoebaTalk                             ↗️ 새 탭으로 열기   │
│  ...       │  ══════════════════════════════════════  Mở trong tab mới  │
│            │                                                           │
│  💬 Lobby  │  ┌─────────────────────────────────────────────────────┐  │
│   └ 💬 ATK │  │ ┌───────────────────────────────────┐              │  │
│     ✅     │  │ │ ✅ AmoebaTalk 연결 성공!            │ ✕           │  │
│            │  │ │    Kết nối AmoebaTalk thành công!  │              │  │
│  ...       │  │ │    AMOEBA CO., LTD (Owner)        │              │  │
│            │  │ └───────────────────────────────────┘  Toast 3s    │  │
│            │  │                                                     │  │
│            │  │   ╔═══════════════════════════════════════════════╗ │  │
│            │  │   ║                                               ║ │  │
│            │  │   ║  AmoebaTalk iframe (authenticated)           ║ │  │
│            │  │   ║                                               ║ │  │
│            │  │   ║  💬 대화 │ 👥 고객 │ 📊 분석 │ ⚙️ 설정       ║ │  │
│            │  │   ║  ────────────────────────────────────        ║ │  │
│            │  │   ║                                               ║ │  │
│            │  │   ║  환영합니다! 소셜 채널을 연결하여               ║ │  │
│            │  │   ║  고객 메시징을 시작하세요                       ║ │  │
│            │  │   ║  Chào mừng! Kết nối kênh MXH để              ║ │  │
│            │  │   ║  bắt đầu nhắn tin với khách hàng             ║ │  │
│            │  │   ║                                               ║ │  │
│            │  │   ╚═══════════════════════════════════════════════╝ │  │
│            │  │                                                     │  │
│            │  │  ✅ AMOEBA CO., LTD 연결됨 (2026-03-31)            │  │
│            │  │     Đã kết nối AMOEBA CO., LTD                     │  │
│            │  └─────────────────────────────────────────────────────┘  │
│            │                                                           │
└────────────┴───────────────────────────────────────────────────────────┘

다음 방문 시: AmoebaTalk 메뉴 클릭 → iframe 바로 로드 (서비스 소개 페이지 스킵)
Lần truy cập sau: Nhấn menu AmoebaTalk → load iframe ngay (bỏ qua trang giới thiệu)
```

---

## 4. API Endpoints (Updated) / API 엔드포인트 (갱신) / Endpoints API (Cập nhật)

### AMB Management — No Changes from Previous Design
### AMB Management — 이전 설계 변경 없음
### AMB Management — Không thay đổi so với thiết kế trước

| Endpoint | Method | Purpose / 목적 / Mục đích |
|----------|--------|--------------------------|
| `/api/v1/integration/amoeba-talk/connect-token` | POST | Generate signed JWT / 서명 토큰 생성 / Tạo JWT đã ký |
| `/api/v1/integration/amoeba-talk/status` | GET | Check connection status / 연결 상태 확인 / Kiểm tra trạng thái |

### AmoebaTalk — Updated Endpoints
### AmoebaTalk — 갱신된 엔드포인트
### AmoebaTalk — Endpoints cập nhật

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/amb-connect?token=xxx` | GET | Verify token → redirect register/login / 토큰 검증 → 리다이렉트 / Xác minh token → chuyển hướng |
| `/api/auth/amb-register` | POST | Create account (no email verify) / 계정 생성 (이메일 인증 없음) / Tạo TK (không xác minh email) |
| `/api/auth/amb-login` | POST | Login existing account / 기존 계정 로그인 / Đăng nhập TK hiện có |
| `/api/integration/amb/check-link` | GET | Server-to-server status check / 서버 간 상태 확인 / Kiểm tra trạng thái server-server |

### Register Request / 회원가입 요청 / Yêu cầu đăng ký

```typescript
// POST /api/auth/amb-register
{
  sessionId: string;          // amb-connect session ID
  password: string;           // 사용자 입력 / User nhập
  confirmPassword: string;    // 사용자 입력 / User nhập
  companyName: string;        // 수정 가능 (기본값 = entityName)
                              // Có thể sửa (mặc định = entityName)
}
```

### Register Backend Logic / 백엔드 로직 / Logic backend

```
1. Validate session (sessionId → AmbConnectSession)
2. Validate password policy
3. Validate password === confirmPassword
4. Validate companyName not empty
5. Transaction:
   a. INSERT atk_users (email, name, avatar, hashed password)
      → email_verified = true  ◀── 핵심: 이메일 인증 스킵
      → auth_providers = ['amb']          Skip email verification
      → primary_auth_method = 'amb'       Bỏ qua xác minh email
   b. INSERT atk_companies (name=companyName, slug=auto, owner_id)
   c. INSERT atk_company_members (role=OWNER, status=ACTIVE)
   d. INSERT atk_amb_account_links (mapping)
6. Generate JWT tokens
7. Response: { user, tokens, company }
```

---

## 5. AMB Frontend Changes / AMB 프론트엔드 변경 / Thay đổi Frontend AMB

### New Files / 신규 파일 / File mới

```
apps/web/src/domain/amoeba-talk/
├── pages/
│   └── AmoebaTalkPage.tsx          # Main page (description or iframe)
├── components/
│   ├── AmoebaTalkServiceInfo.tsx    # Static service description
│   ├── AmoebaTalkEmbed.tsx         # iframe wrapper (authenticated)
│   └── AmoebaTalkConnectionStatus.tsx  # Status bar
├── hooks/
│   └── useAmoebaTalkConnect.ts     # Connection logic
└── constants/
    └── service-features.ts          # Static feature list content
```

### Page Logic / 페이지 로직 / Logic trang

```typescript
// AmoebaTalkPage.tsx
function AmoebaTalkPage() {
  const { isLinked, status, handleConnect } = useAmoebaTalkConnect();

  // 미연결 → 서비스 소개 / Chưa kết nối → Giới thiệu dịch vụ
  if (!isLinked) {
    return <AmoebaTalkServiceInfo onConnect={handleConnect} />;
  }

  // 연결됨 → iframe / Đã kết nối → iframe
  return (
    <>
      <AmoebaTalkEmbed />
      <AmoebaTalkConnectionStatus status={status} />
    </>
  );
}
```

### Sidebar Route / 사이드바 라우트 / Route sidebar

```typescript
// Add under Lobby Chat section
{
  path: '/amoeba-talk',
  name: 'AmoebaTalk',
  icon: MessageCircle,
  component: AmoebaTalkPage,
  roles: ['MASTER', 'ADMIN', 'SUPER_ADMIN'],  // MASTER/ADMIN+ only
  parent: 'lobby-chat',
  badge: isLinked ? '✅' : '🔴',
}
```

---

## 6. State Transitions / 상태 전환 / Chuyển Đổi Trạng Thái

```
┌─────────────┐    click menu    ┌──────────────────────┐
│  Sidebar     │ ───────────────▶│  Service Description │
│  AmoebaTalk  │                 │  Page (AMB)          │
│  🔴          │                 │                      │
└─────────────┘                  │  [🚀 서비스 시작하기]  │
                                 └──────────┬───────────┘
                                            │ click
                                            ▼
                                 ┌──────────────────────┐
                                 │  Loading              │
                                 │  "토큰 생성 중..."     │
                                 │  "Đang tạo token..."  │
                                 └──────────┬───────────┘
                                            │ window.open
                                            ▼
                                 ┌──────────────────────┐
                                 │  AMB: Waiting         │
                                 │  "새 창에서 진행 중..." │
                                 │  ATK: Register/Login  │
                                 └──────────┬───────────┘
                                            │ postMessage
                                            ▼
                                 ┌──────────────────────┐
                                 │  Success Toast        │
                                 │  Service Page →       │
┌─────────────┐                  │  → iframe (auto)      │
│  Sidebar     │ ◀───────────────│                      │
│  AmoebaTalk  │   UI update     └──────────────────────┘
│  ✅          │
└─────────────┘

다음 방문 / Lần sau:
┌─────────────┐    click menu    ┌──────────────────────┐
│  Sidebar     │ ───────────────▶│  iframe (direct)     │
│  AmoebaTalk  │                 │  (skip description)  │
│  ✅          │                 │                      │
└─────────────┘                  └──────────────────────┘
```

---

## Change Log / 변경 이력 / Lịch Sử Thay Đổi

| Version | Date | KR | VI |
|---------|------|----|----|
| v1.0 | 2026-03-31 | Lobby Chat 서비스 메뉴 & 회원가입 흐름 요구사항 | Yêu cầu menu dịch vụ Lobby Chat & luồng đăng ký |
