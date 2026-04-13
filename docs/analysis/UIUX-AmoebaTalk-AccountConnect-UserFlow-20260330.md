# UI/UX User Flow — AMB ↔ AmoebaTalk Account Connection
# UI/UX 사용자 흐름 — AMB ↔ AmoebaTalk 계정 연동
# UI/UX Luồng Người Dùng — AMB ↔ AmoebaTalk Liên Kết Tài Khoản

**Version / 문서버전 / Phiên bản:** v1.0
**Date / 작성일 / Ngày tạo:** 2026-03-30

---

## 전체 흐름 개요 / Tổng Quan Luồng

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   AMB Management                          AmoebaTalk                     │
│   ┌─────────────┐                         ┌─────────────┐               │
│   │ Screen A    │──── click button ──────▶│ Screen D    │               │
│   │ Dashboard   │                         │ Token Check │               │
│   └─────────────┘                         └──────┬──────┘               │
│   ┌─────────────┐                                │                      │
│   │ Screen B    │──── click button ──────▶  ┌────┴────┐                 │
│   │ Embed Area  │                           │         │                 │
│   └─────────────┘                      미존재/     존재/                  │
│   ┌─────────────┐                     Chưa có    Đã có                  │
│   │ Screen C    │──── click button ──────▶  │         │                 │
│   │ Settings    │                    ┌──────┴──┐ ┌────┴─────┐          │
│   └─────────────┘                    │Screen E │ │ Screen F  │          │
│                                      │Register │ │  Login    │          │
│   ┌─────────────┐                    └────┬────┘ └────┬─────┘          │
│   │ Screen G    │◀── postMessage ────────┴────────────┘                │
│   │ 성공 알림    │                         │                            │
│   │ Thông báo   │                    ┌─────┴─────┐                     │
│   └─────────────┘                    │ Screen H  │                     │
│                                      │ Dashboard │                     │
│                                      └───────────┘                     │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Screen A — AMB Dashboard / Lobby Banner
## AMB 대시보드 / 로비 배너
## AMB Dashboard / Banner Lobby

### 조건 / Điều kiện
- 사용자 역할: MASTER / ADMIN 이상 / Vai trò user: MASTER / ADMIN trở lên
- AmoebaTalk 미연결 상태일 때만 표시 / Chỉ hiển thị khi chưa kết nối AmoebaTalk

```
┌─────────────────────────────────────────────────────────────────────┐
│  AMB Management                                    👤 김이경 (MASTER)│
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  📊    │  대시보드 / Dashboard / Bảng điều khiển                     │
│ 대시보드│                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│  💬    │  │                                                      │  │
│ AI채팅  │  │  ┌──────┐                                            │  │
│        │  │  │ 💬   │  AmoebaTalk로 고객 메시징을 시작하세요       │  │
│  📋    │  │  │ Logo │  Bắt đầu nhắn tin khách hàng với AmoebaTalk │  │
│ 할 일   │  │  │      │                                            │  │
│        │  │  └──────┘  옴니채널 메시징으로 고객과 더 가까워지세요    │  │
│  📅    │  │            Tiếp cận khách hàng gần hơn với             │  │
│ 일정    │  │            messaging đa kênh                          │  │
│        │  │                                                      │  │
│  📢    │  │                      ┌──────────────────────┐        │  │
│ 공지사항 │  │                      │  연결하기 →           │        │  │
│        │  │                      │  Kết nối ngay →       │        │  │
│  📁    │  │                      └──────────────────────┘        │  │
│ 문서함   │  │                                                      │  │
│        │  └──────────────────────────────────────────────────────┘  │
│  ⚙️    │                                                            │
│ 설정    │  ┌─────────────────────┐  ┌─────────────────────┐        │
│        │  │ 오늘 할 일 3건       │  │ 최근 공지 2건        │        │
│  ...   │  │ Việc cần làm hôm nay │  │ Thông báo gần đây   │        │
│        │  └─────────────────────┘  └─────────────────────┘        │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

### 사용자 액션 / Hành động user
- `연결하기 →` / `Kết nối ngay →` 버튼 클릭 / Nhấn nút
- → AMB Backend: `POST /api/v1/integration/amoeba-talk/connect-token`
- → 새 탭(팝업) 열림 / Mở tab mới (popup)

---

## Screen B — AMB AmoebaTalk Embed Area
## AMB AmoebaTalk 임베드 영역
## AMB Vùng Embed AmoebaTalk

### 조건 / Điều kiện
- AmoebaTalk iframe이 이미 임베드된 페이지 / Trang đã embed iframe AmoebaTalk
- 미연결 시 하단 오버레이 표시 / Hiển thị overlay dưới khi chưa kết nối

```
┌─────────────────────────────────────────────────────────────────────┐
│  AMB Management                                    👤 김이경 (MASTER)│
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  📊    │  AmoebaTalk                                                │
│ 대시보드│                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│  💬    │  │                                                      │  │
│ AI채팅  │  │   ┌─────────────────────────────────────────────┐    │  │
│        │  │   │                                             │    │  │
│  📋    │  │   │         AmoebaTalk iframe 콘텐츠             │    │  │
│ 할 일   │  │   │         Nội dung iframe AmoebaTalk           │    │  │
│        │  │   │                                             │    │  │
│  💬    │  │   │         (로그인 필요 / Cần đăng nhập)         │    │  │
│AmoebaTalk│ │   │                                             │    │  │
│  ◀──── │  │   │                                             │    │  │
│ 현재 선택│  │   └─────────────────────────────────────────────┘    │  │
│        │  │                                                      │  │
│  📅    │  │  ┌──────────────────────────────────────────────────┐│  │
│ 일정    │  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░││  │
│        │  │  │                                                  ││  │
│  📢    │  │  │  💬 계정을 연결하여 AmoebaTalk를 시작하세요        ││  │
│ 공지사항 │  │  │     Kết nối tài khoản để bắt đầu AmoebaTalk      ││  │
│        │  │  │                                                  ││  │
│  ⚙️    │  │  │           ┌────────────────────┐                 ││  │
│ 설정    │  │  │           │  계정 연결하기       │                 ││  │
│        │  │  │           │  Kết nối tài khoản  │                 ││  │
│        │  │  │           └────────────────────┘                 ││  │
│        │  │  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░││  │
│        │  │  └──────────────────────────────────────────────────┘│  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘

         ▲ 오버레이 영역 (반투명 배경)
           Vùng overlay (nền bán trong suốt)
```

### 사용자 액션 / Hành động user
- `계정 연결하기` / `Kết nối tài khoản` 버튼 클릭 / Nhấn nút
- → 새 탭(팝업) 열림 / Mở tab mới (popup)

---

## Screen C — AMB Entity Settings
## AMB Entity 설정 페이지
## AMB Trang Cài Đặt Entity

### 미연결 상태 / Trạng thái chưa kết nối

```
┌─────────────────────────────────────────────────────────────────────┐
│  AMB Management                                    👤 김이경 (MASTER)│
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  📊    │  법인 설정 / Cài đặt pháp nhân                              │
│ 대시보드│                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│  💬    │  │  기본 정보 / Thông tin cơ bản                         │  │
│ AI채팅  │  │                                                      │  │
│        │  │  법인명 / Tên pháp nhân:    Amoeba Vietnam            │  │
│  ⚙️    │  │  법인코드 / Mã pháp nhân:   AMB-VN                   │  │
│ 설정    │  │  국가 / Quốc gia:           Vietnam                  │  │
│  ◀──── │  │  통화 / Tiền tệ:            VND                      │  │
│ 현재 선택│  └──────────────────────────────────────────────────────┘  │
│        │                                                            │
│        │  ┌──────────────────────────────────────────────────────┐  │
│        │  │  외부 서비스 연동 / Tích hợp dịch vụ bên ngoài         │  │
│        │  │                                                      │  │
│        │  │  ┌────────────────────────────────────────────────┐  │  │
│        │  │  │                                                │  │  │
│        │  │  │  ┌──────┐  AmoebaTalk                          │  │  │
│        │  │  │  │ 💬   │                                      │  │  │
│        │  │  │  │ Logo │  옴니채널 고객 메시징 플랫폼            │  │  │
│        │  │  │  │      │  Nền tảng nhắn tin khách hàng đa kênh │  │  │
│        │  │  │  └──────┘                                      │  │  │
│        │  │  │                                                │  │  │
│        │  │  │  상태 / Trạng thái:  ⚪ 미연결 / Chưa kết nối    │  │  │
│        │  │  │                                                │  │  │
│        │  │  │  ┌──────────────────────────────────────┐      │  │  │
│        │  │  │  │  🔗 AmoebaTalk 계정 연결               │      │  │  │
│        │  │  │  │     Kết nối tài khoản AmoebaTalk      │      │  │  │
│        │  │  │  └──────────────────────────────────────┘      │  │  │
│        │  │  │                                                │  │  │
│        │  │  └────────────────────────────────────────────────┘  │  │
│        │  │                                                      │  │
│        │  │  ┌────────────────────────────────────────────────┐  │  │
│        │  │  │  Google Drive     ✅ 연결됨 / Đã kết nối        │  │  │
│        │  │  └────────────────────────────────────────────────┘  │  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘
```

### 연결 완료 상태 / Trạng thái đã kết nối

```
│        │  │  ┌────────────────────────────────────────────────┐  │  │
│        │  │  │                                                │  │  │
│        │  │  │  ┌──────┐  AmoebaTalk                          │  │  │
│        │  │  │  │ 💬   │                                      │  │  │
│        │  │  │  │ Logo │  옴니채널 고객 메시징 플랫폼            │  │  │
│        │  │  │  │      │  Nền tảng nhắn tin khách hàng đa kênh │  │  │
│        │  │  │  └──────┘                                      │  │  │
│        │  │  │                                                │  │  │
│        │  │  │  상태 / Trạng thái:  ✅ 연결됨 / Đã kết nối      │  │  │
│        │  │  │                                                │  │  │
│        │  │  │  ✅ Amoeba Vietnam (연결: 2026-03-30)           │  │  │
│        │  │  │     Amoeba Vietnam (kết nối: 2026-03-30)       │  │  │
│        │  │  │                                                │  │  │
│        │  │  └────────────────────────────────────────────────┘  │  │
```

### 사용자 액션 / Hành động user
- `🔗 AmoebaTalk 계정 연결` / `Kết nối tài khoản AmoebaTalk` 버튼 클릭 / Nhấn nút
- → 새 탭(팝업) 열림 / Mở tab mới (popup)

---

## Screen D — AmoebaTalk Token Verification (Loading)
## AmoebaTalk 토큰 검증 (로딩)
## AmoebaTalk Xác Minh Token (Loading)

### 설명 / Mô tả
- 새 탭이 열리며 자동으로 토큰 검증 진행 / Tab mới mở và tự động xác minh token
- 사용자는 잠깐 로딩 화면을 봄 / User thấy màn hình loading ngắn

```
┌─────────────────────────────────────────────┐
│  AmoebaTalk                          [새 탭] │
│                                              │
│                                              │
│                                              │
│                                              │
│                                              │
│              ┌──────┐                        │
│              │ 💬   │                        │
│              │ Logo │                        │
│              │      │                        │
│              └──────┘                        │
│                                              │
│              ⏳ 연결 확인 중...                │
│                 Đang xác minh kết nối...      │
│                                              │
│              AMB Management에서                │
│              계정을 확인하고 있습니다            │
│              Đang xác minh tài khoản           │
│              từ AMB Management                 │
│                                              │
│                                              │
│                                              │
└──────────────────────────────────────────────┘
```

### 자동 분기 / Tự động phân nhánh

```
Token 검증 완료 / Xác minh token xong
        │
        ├── ❌ 토큰 만료 / Token hết hạn ──────▶ Screen D-1 (에러 / Lỗi)
        ├── ❌ 토큰 재사용 / Token đã dùng ────▶ Screen D-2 (에러 / Lỗi)
        │
        ├── ✅ email 미존재 / email chưa có ───▶ Screen E (회원가입 / Đăng ký)
        │
        └── ✅ email 존재 / email đã có
             │
             ├── 동일 email 세션 활성 ─────────▶ Screen H (대시보드로 직행 / Đi thẳng dashboard)
             │   Session cùng email đang hoạt động
             │
             ├── 다른 email 세션 활성 ─────────▶ Screen F-1 (세션 충돌 / Xung đột session)
             │   Session email khác đang hoạt động
             │
             └── 세션 없음 / Không có session ─▶ Screen F (로그인 / Đăng nhập)
```

---

## Screen D-1 — Token Error: Expired
## 토큰 에러: 만료
## Lỗi Token: Hết Hạn

```
┌─────────────────────────────────────────────┐
│  AmoebaTalk                                  │
│                                              │
│                                              │
│                                              │
│              ┌──────────────────────┐        │
│              │                      │        │
│              │     ⏰ 만료됨         │        │
│              │        Đã hết hạn    │        │
│              │                      │        │
│              └──────────────────────┘        │
│                                              │
│      연결 링크가 만료되었습니다 (5분 초과)      │
│      Link kết nối đã hết hạn (quá 5 phút)    │
│                                              │
│      AMB Management에서 다시 시도해 주세요     │
│      Vui lòng thử lại từ AMB Management       │
│                                              │
│              ┌──────────────────────┐        │
│              │  창 닫기              │        │
│              │  Đóng cửa sổ         │        │
│              └──────────────────────┘        │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Screen D-2 — Token Error: Already Used
## 토큰 에러: 이미 사용됨
## Lỗi Token: Đã Sử Dụng

```
┌─────────────────────────────────────────────┐
│  AmoebaTalk                                  │
│                                              │
│                                              │
│                                              │
│              ┌──────────────────────┐        │
│              │                      │        │
│              │     🚫 사용됨         │        │
│              │        Đã sử dụng    │        │
│              │                      │        │
│              └──────────────────────┘        │
│                                              │
│      이 연결 링크는 이미 사용되었습니다         │
│      Link kết nối này đã được sử dụng         │
│                                              │
│      AMB Management에서 새 링크를              │
│      생성해 주세요                              │
│      Vui lòng tạo link mới                     │
│      từ AMB Management                         │
│                                              │
│              ┌──────────────────────┐        │
│              │  창 닫기              │        │
│              │  Đóng cửa sổ         │        │
│              └──────────────────────┘        │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Screen E — AmoebaTalk Registration (Auto-fill)
## AmoebaTalk 회원가입 (자동 채움)
## AmoebaTalk Đăng Ký (Tự Động Điền)

### 설명 / Mô tả
- AMB에서 전달된 정보가 자동으로 채워짐 / Thông tin từ AMB được tự động điền
- 사용자는 password만 입력하면 됨 / User chỉ cần nhập password

```
┌─────────────────────────────────────────────┐
│  AmoebaTalk                                  │
│                                              │
│      ┌──────┐    ↔    ┌──────┐              │
│      │ AMB  │         │ 💬   │              │
│      │ Logo │         │ ATK  │              │
│      └──────┘         └──────┘              │
│                                              │
│      AMB Management에서 연결                  │
│      Kết nối từ AMB Management                │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │  자동 입력된 정보 / Thông tin tự động    │   │
│  │                                       │   │
│  │  📧 이메일 / Email                     │   │
│  │  ┌─────────────────────────────┐ 🔒  │   │
│  │  │ hung@amoeba.vn              │      │   │
│  │  └─────────────────────────────┘      │   │
│  │                                       │   │
│  │  👤 이름 / Họ tên                      │   │
│  │  ┌─────────────────────────────┐ 🔒  │   │
│  │  │ Nguyễn Văn Hưng            │      │   │
│  │  └─────────────────────────────┘      │   │
│  │                                       │   │
│  │  🖼️ 프로필 이미지 / Ảnh đại diện       │   │
│  │  ┌──────┐                             │   │
│  │  │  👤  │  AMB 프로필 / Ảnh từ AMB     │   │
│  │  └──────┘                             │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ─────── 회사 정보 / Thông tin công ty ─────  │
│                                              │
│  🏢 회사명 / Tên công ty                      │
│  ┌─────────────────────────────────────┐     │
│  │ Amoeba Vietnam                      │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ☐ 다른 이름으로 생성 / Tạo với tên khác      │
│                                              │
│  ─── (체크 시 표시 / Hiện khi check) ───      │
│  │  새 회사명 / Tên công ty mới               │
│  │  ┌─────────────────────────────────┐      │
│  │  │                                 │      │
│  │  └─────────────────────────────────┘      │
│  ────────────────────────────────────────     │
│                                              │
│  ─────── 보안 / Bảo mật ──────────────────   │
│                                              │
│  🔑 비밀번호 / Mật khẩu                       │
│  ┌─────────────────────────────────────┐     │
│  │ ••••••••••••                        │ 👁  │
│  └─────────────────────────────────────┘     │
│  ℹ️ 8자 이상, 대소문자, 숫자, 특수문자 포함     │
│     Tối thiểu 8 ký tự, chữ hoa/thường,       │
│     số, ký tự đặc biệt                        │
│                                              │
│  🔑 비밀번호 확인 / Xác nhận mật khẩu          │
│  ┌─────────────────────────────────────┐     │
│  │ ••••••••••••                        │ 👁  │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │                                     │     │
│  │         계정 생성                     │     │
│  │         Tạo tài khoản                │     │
│  │                                     │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  ℹ️ 이 계정은 AMB Management의                │
│     Amoeba Vietnam 법인과 연결됩니다           │
│     Tài khoản này sẽ được liên kết với        │
│     pháp nhân Amoeba Vietnam                  │
│     của AMB Management                        │
│                                              │
└──────────────────────────────────────────────┘
```

### 유효성 검사 / Validation

```
┌─────────────────────────────────────────┐
│  에러 상태 예시 / Ví dụ trạng thái lỗi    │
│                                         │
│  🔑 비밀번호 / Mật khẩu                  │
│  ┌───────────────────────────┐          │
│  │ abc123                    │ 👁       │
│  └───────────────────────────┘          │
│  ❌ 대문자와 특수문자를 포함해야 합니다     │
│     Phải bao gồm chữ hoa và ký tự       │
│     đặc biệt                             │
│                                         │
│  🔑 비밀번호 확인 / Xác nhận mật khẩu     │
│  ┌───────────────────────────┐          │
│  │ abc1234                   │ 👁       │
│  └───────────────────────────┘          │
│  ❌ 비밀번호가 일치하지 않습니다            │
│     Mật khẩu không khớp                  │
└─────────────────────────────────────────┘
```

### 사용자 액션 / Hành động user
1. (선택) 회사명 변경 체크박스 체크 → 새 이름 입력 / (Tuỳ chọn) Check đổi tên công ty → nhập tên mới
2. 비밀번호 입력 / Nhập mật khẩu
3. 비밀번호 확인 입력 / Nhập xác nhận mật khẩu
4. `계정 생성` / `Tạo tài khoản` 클릭 / Nhấn
5. → `POST /api/auth/amb-register`
6. → 성공 시 Screen H (대시보드) / Thành công → Screen H (Dashboard)
7. → AMB에 postMessage 전송 / Gửi postMessage về AMB

---

## Screen F — AmoebaTalk Login (Existing Account)
## AmoebaTalk 로그인 (기존 계정)
## AmoebaTalk Đăng Nhập (Tài Khoản Có Sẵn)

```
┌─────────────────────────────────────────────┐
│  AmoebaTalk                                  │
│                                              │
│      ┌──────┐    ↔    ┌──────┐              │
│      │ AMB  │         │ 💬   │              │
│      │ Logo │         │ ATK  │              │
│      └──────┘         └──────┘              │
│                                              │
│      이미 AmoebaTalk 계정이 있습니다           │
│      Bạn đã có tài khoản AmoebaTalk           │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │                                       │   │
│  │  이 이메일로 등록된 계정이 발견되었습니다 │   │
│  │  Đã tìm thấy tài khoản đăng ký với    │   │
│  │  email này                             │   │
│  │                                       │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  📧 이메일 / Email                            │
│  ┌─────────────────────────────────────┐     │
│  │ hung@amoeba.vn                      │ 🔒 │
│  └─────────────────────────────────────┘     │
│                                              │
│  🔑 비밀번호 / Mật khẩu                       │
│  ┌─────────────────────────────────────┐     │
│  │                                     │ 👁  │
│  └─────────────────────────────────────┘     │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │                                     │     │
│  │          로그인                       │     │
│  │          Đăng nhập                   │     │
│  │                                     │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  비밀번호를 잊으셨나요?                        │
│  Quên mật khẩu?                               │
│                                              │
│  ℹ️ 로그인하면 AMB Management의                │
│     Amoeba Vietnam 법인과 연결됩니다           │
│     Đăng nhập sẽ liên kết với pháp nhân       │
│     Amoeba Vietnam của AMB Management         │
│                                              │
└──────────────────────────────────────────────┘
```

### 로그인 실패 / Đăng nhập thất bại

```
│  🔑 비밀번호 / Mật khẩu                       │
│  ┌─────────────────────────────────────┐     │
│  │ ••••••••                            │ 👁  │
│  └─────────────────────────────────────┘     │
│  ❌ 비밀번호가 올바르지 않습니다                 │
│     Mật khẩu không đúng                       │
```

### 사용자 액션 / Hành động user
1. 비밀번호 입력 / Nhập mật khẩu
2. `로그인` / `Đăng nhập` 클릭 / Nhấn
3. → `POST /api/auth/amb-login`
4. → 성공 시 Screen H / Thành công → Screen H
5. → AMB에 postMessage 전송 / Gửi postMessage về AMB

---

## Screen F-1 — Session Conflict
## 세션 충돌 경고
## Cảnh Báo Xung Đột Session

### 설명 / Mô tả
- 현재 다른 이메일로 AmoebaTalk에 로그인된 상태 / Hiện đang đăng nhập AmoebaTalk bằng email khác
- AMB에서 전달된 이메일과 현재 세션 이메일이 다름 / Email từ AMB khác với email session hiện tại

```
┌─────────────────────────────────────────────┐
│  AmoebaTalk                                  │
│                                              │
│      ┌──────┐    ↔    ┌──────┐              │
│      │ AMB  │         │ 💬   │              │
│      │ Logo │         │ ATK  │              │
│      └──────┘         └──────┘              │
│                                              │
│  ┌───────────────────────────────────────┐   │
│  │                                       │   │
│  │  ⚠️ 세션 충돌 / Xung đột session       │   │
│  │                                       │   │
│  │  현재 다른 계정으로 로그인되어 있습니다   │   │
│  │  Hiện đang đăng nhập bằng              │   │
│  │  tài khoản khác                        │   │
│  │                                       │   │
│  │  현재 세션 / Session hiện tại:          │   │
│  │  📧 other@company.com                  │   │
│  │                                       │   │
│  │  AMB 연결 요청 / Yêu cầu kết nối AMB:  │   │
│  │  📧 hung@amoeba.vn                     │   │
│  │                                       │   │
│  │  계속하려면 현재 계정에서 로그아웃해야     │   │
│  │  합니다                                 │   │
│  │  Để tiếp tục, bạn cần đăng xuất        │   │
│  │  khỏi tài khoản hiện tại               │   │
│  │                                       │   │
│  └───────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────┐ ┌──────────────────┐  │
│  │                  │ │                  │  │
│  │  로그아웃 후 계속  │ │  취소             │  │
│  │  Đăng xuất &     │ │  Huỷ             │  │
│  │  tiếp tục        │ │                  │  │
│  │                  │ │                  │  │
│  └──────────────────┘ └──────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### 사용자 액션 / Hành động user
- `로그아웃 후 계속` / `Đăng xuất & tiếp tục`:
  → 현재 세션 종료 → Screen F (로그인) 또는 Screen E (회원가입)
  → Kết thúc session hiện tại → Screen F (Đăng nhập) hoặc Screen E (Đăng ký)
- `취소` / `Huỷ`:
  → 현재 세션 유지, 창 닫기
  → Giữ session hiện tại, đóng cửa sổ

---

## Screen G — AMB Success Notification (postMessage received)
## AMB 성공 알림 (postMessage 수신)
## AMB Thông Báo Thành Công (nhận postMessage)

### 설명 / Mô tả
- AmoebaTalk에서 연동 완료 후 AMB 탭에 알림 표시 / Sau khi kết nối xong ở AmoebaTalk, hiển thị thông báo ở tab AMB
- Toast 알림 + UI 상태 업데이트 / Toast thông báo + cập nhật trạng thái UI

```
┌─────────────────────────────────────────────────────────────────────┐
│  AMB Management                                    👤 김이경 (MASTER)│
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  📊    │  ┌──────────────────────────────────────────┐              │
│ 대시보드│  │  ✅ AmoebaTalk 연결 성공!                  │ ✕           │
│        │  │     Kết nối AmoebaTalk thành công!        │              │
│  💬    │  │                                          │              │
│ AI채팅  │  │  Amoeba Vietnam으로 연결되었습니다         │              │
│        │  │  Đã kết nối với Amoeba Vietnam            │              │
│  📋    │  └──────────────────────────────────────────┘              │
│ 할 일   │                                               ▲            │
│        │                                          Toast 알림         │
│  💬    │  ┌──────────────────────────────────────────────────────┐  │
│AmoebaTalk│ │                                                      │  │
│        │  │   ┌─────────────────────────────────────────────┐    │  │
│  📅    │  │   │                                             │    │  │
│ 일정    │  │   │         AmoebaTalk iframe 콘텐츠             │    │  │
│        │  │   │         Nội dung iframe AmoebaTalk           │    │  │
│  📢    │  │   │                                             │    │  │
│ 공지사항 │  │   │         (이제 인증됨 / Đã xác thực)          │    │  │
│        │  │   │         ← iframe 자동 새로고침                │    │  │
│  ⚙️    │  │   │            iframe tự reload                 │    │  │
│ 설정    │  │   │                                             │    │  │
│        │  │   └─────────────────────────────────────────────┘    │  │
│        │  │                                                      │  │
│        │  │  ── 오버레이 사라짐 / Overlay biến mất ──              │  │
│        │  │     (연결 완료로 버튼 오버레이 제거)                    │  │
│        │  │     (Đã kết nối nên xoá overlay nút)                  │  │
│        │  │                                                      │  │
│        │  └──────────────────────────────────────────────────────┘  │
└────────┴────────────────────────────────────────────────────────────┘
```

### 자동 변경사항 / Thay đổi tự động
1. Toast 알림 표시 (3초 후 자동 닫힘) / Hiển thị toast (tự đóng sau 3 giây)
2. Embed 영역 오버레이 제거 / Xoá overlay vùng embed
3. iframe 새로고침 (인증된 상태) / Reload iframe (trạng thái đã xác thực)
4. Settings 페이지: 상태 `✅ 연결됨`으로 변경 / Trang Settings: đổi trạng thái → `✅ Đã kết nối`
5. Dashboard 배너 숨김 / Ẩn banner Dashboard

---

## Screen H — AmoebaTalk Dashboard (Post-Connection)
## AmoebaTalk 대시보드 (연결 후)
## AmoebaTalk Dashboard (Sau Khi Kết Nối)

### 설명 / Mô tả
- 회원가입/로그인 성공 후 AmoebaTalk 대시보드로 이동 / Sau khi đăng ký/đăng nhập thành công, chuyển đến dashboard AmoebaTalk
- 사용자는 이 탭에서 AmoebaTalk을 계속 사용 / User tiếp tục sử dụng AmoebaTalk trong tab này

```
┌─────────────────────────────────────────────────────────────────────┐
│  AmoebaTalk                                  👤 Nguyễn Văn Hưng     │
├────────┬────────────────────────────────────────────────────────────┤
│        │                                                            │
│  💬    │  ┌──────────────────────────────────────────┐              │
│ 대화    │  │  🎉 환영합니다! / Chào mừng bạn!          │ ✕           │
│        │  │                                          │              │
│  👥    │  │  AMB Management에서 성공적으로             │              │
│ 고객    │  │  연결되었습니다                             │              │
│        │  │  Kết nối thành công từ                    │              │
│  📊    │  │  AMB Management                          │              │
│ 분석    │  └──────────────────────────────────────────┘              │
│        │                                                            │
│  🤖    │  회사 / Công ty: Amoeba Vietnam                            │
│ AI     │  역할 / Vai trò: Owner                                     │
│        │                                                            │
│  ⚙️    │  ┌──────────────────────────────┐                          │
│ 설정    │  │                              │                          │
│        │  │  시작하기 / Bắt đầu           │                          │
│        │  │                              │                          │
│        │  │  • 소셜 채널 연결              │                          │
│        │  │    Kết nối kênh mạng xã hội  │                          │
│        │  │                              │                          │
│        │  │  • 팀원 초대                   │                          │
│        │  │    Mời thành viên nhóm        │                          │
│        │  │                              │                          │
│        │  │  • 웹챗 위젯 설치              │                          │
│        │  │    Cài đặt widget webchat     │                          │
│        │  │                              │                          │
│        │  └──────────────────────────────┘                          │
│        │                                                            │
└────────┴────────────────────────────────────────────────────────────┘
```

---

## 전체 인터랙션 타임라인 / Timeline Tương Tác Tổng Thể

```
시간 / Thời gian    AMB Management                    AmoebaTalk
─────────────────────────────────────────────────────────────────────
    T+0s            [A/B/C] 버튼 클릭
                    Nhấn nút
                            │
    T+0.2s          POST /connect-token
                    → connectUrl 수신
                    → nhận connectUrl
                            │
    T+0.5s          window.open() ──────────▶ [D] 토큰 검증 중
                    새 탭 열림                  Đang xác minh token
                    Mở tab mới
                            │                         │
    T+1s                    │                 email 확인 완료
                            │                 Kiểm tra email xong
                            │                         │
                            │                         ▼
    T+1.5s                  │                 [E] 회원가입 폼
                            │                     Form đăng ký
                            │                     또는 / hoặc
                            │                 [F] 로그인 폼
                            │                     Form đăng nhập
                            │                         │
    T+10~30s                │                 사용자 비밀번호 입력
    (사용자 입력)              │                 User nhập mật khẩu
    (User nhập)              │                         │
                            │                         ▼
    T+30s                   │                 POST /amb-register
                            │                 또는 / hoặc
                            │                 POST /amb-login
                            │                         │
    T+31s           [G] postMessage 수신  ◀── 성공! postMessage 전송
                    nhận postMessage           Thành công! Gửi postMessage
                            │                         │
                    Toast 표시                         │
                    Hiển thị toast                     │
                    iframe 새로고침                     ▼
                    Reload iframe             [H] 대시보드
                    UI 상태 업데이트                Dashboard
                    Cập nhật trạng thái UI
                            │                         │
    T+∞             사용자 AMB 계속 사용        사용자 ATK 계속 사용
                    User tiếp tục dùng AMB     User tiếp tục dùng ATK
─────────────────────────────────────────────────────────────────────
```

---

## 반응형 고려사항 / Cân Nhắc Responsive

### AmoebaTalk 연동 페이지 (Screen E, F, F-1)

```
데스크톱 (>768px)                     모바일 (<768px)
Desktop                              Mobile

┌─────────────────────┐              ┌──────────────────┐
│  ┌─────┐ ↔ ┌─────┐ │              │ ┌─────┐↔┌─────┐  │
│  │ AMB │   │ ATK │ │              │ │ AMB ││ ATK │  │
│  └─────┘   └─────┘ │              │ └─────┘ └─────┘  │
│                     │              │                  │
│  ┌───────────────┐  │              │ 연결 / Kết nối    │
│  │ 자동 입력 정보  │  │              │ from AMB          │
│  │ Thông tin tự   │  │              │                  │
│  │ động           │  │              │ 📧 hung@...  🔒  │
│  │                │  │              │ 👤 Hung      🔒  │
│  │ 📧 email  🔒  │  │              │                  │
│  │ 👤 name   🔒  │  │              │ 🏢 Company       │
│  └───────────────┘  │              │ [Amoeba VN    ]  │
│                     │              │                  │
│  🏢 Company Name   │              │ 🔑 Password      │
│  [Amoeba Vietnam ] │              │ [•••••••••   ]   │
│                     │              │                  │
│  🔑 Password       │              │ 🔑 Confirm       │
│  [•••••••••••   ]  │              │ [•••••••••   ]   │
│                     │              │                  │
│  🔑 Confirm        │              │ [  생성 / Tạo  ]  │
│  [•••••••••••   ]  │              │                  │
│                     │              │ ℹ️ AMB 연결       │
│  [  계정 생성    ]  │              │    Liên kết AMB   │
│  [  Tạo tài khoản ] │              └──────────────────┘
│                     │
│  ℹ️ AMB 연결 안내   │
│     Thông tin       │
│     liên kết AMB    │
└─────────────────────┘

max-width: 480px                     width: 100%
padding: 40px                        padding: 16px
```

---

## 접근성 / Accessibility

| 항목 / Mục | 설명 / Mô tả |
|---|---|
| 키보드 네비게이션 / Điều hướng bàn phím | Tab 순서: email(readonly) → name(readonly) → company → password → confirm → submit / Thứ tự Tab |
| 스크린 리더 / Trình đọc màn hình | readonly 필드: `aria-readonly="true"`, lock icon: `aria-label="AMB에서 제공된 정보 / Thông tin từ AMB"` |
| 에러 알림 / Thông báo lỗi | `aria-live="polite"` validation 에러 / lỗi validation |
| 포커스 관리 / Quản lý focus | 페이지 로드 시 첫 입력 가능 필드(password)로 자동 포커스 / Tự động focus vào trường nhập đầu tiên (password) khi load trang |
| 색상 대비 / Tương phản màu | readonly 필드: 배경 `#F3F4F6`, 텍스트 `#374151` (4.5:1 이상) / Nền `#F3F4F6`, chữ `#374151` (trên 4.5:1) |

---

## 변경 이력 / Lịch Sử Thay Đổi

| Version | Date | KR | VI |
|---------|------|----|----|
| v1.0 | 2026-03-30 | 초기 UI/UX 사용자 흐름 작성 | Tạo luồng UI/UX người dùng ban đầu |
