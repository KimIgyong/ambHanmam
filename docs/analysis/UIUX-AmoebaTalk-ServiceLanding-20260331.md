# UI/UX — AmoebaTalk Service Landing Page (Promotional)
# UI/UX — AmoebaTalk 서비스 소개 페이지 (프로모션)
# UI/UX — Trang Giới Thiệu Dịch Vụ AmoebaTalk (Quảng bá)

**Version / 문서버전 / Phiên bản:** v1.0
**Date / 작성일 / Ngày tạo:** 2026-03-31

---

## Design Philosophy / 디자인 철학 / Triết Lý Thiết Kế

| EN | KR | VI |
|----|----|----|
| Modern SaaS landing page inside AMB | AMB 내부의 모던 SaaS 랜딩 페이지 | Landing page SaaS hiện đại trong AMB |
| Scroll-based storytelling | 스크롤 기반 스토리텔링 | Kể chuyện theo cuộn trang |
| Visual-first, minimal text | 비주얼 우선, 최소 텍스트 | Hình ảnh trước, chữ tối giản |
| Trust signals + social proof | 신뢰 요소 + 소셜 증거 | Yếu tố tin cậy + bằng chứng xã hội |
| Single clear CTA | 하나의 명확한 CTA | Một CTA rõ ràng duy nhất |

---

## Full Page Layout / 전체 페이지 레이아웃 / Bố Cục Toàn Trang

```
┌─ Sidebar ─┐ ┌─ Main Content (scrollable) ──────────────────────────┐
│            │ │                                                      │
│  ...       │ │  ┌── Section 1: HERO ─────────────────────────────┐ │
│  💬 Lobby  │ │  │  Gradient background + Headline + CTA          │ │
│   └ 💬 ATK │ │  └───────────────────────────────────────────────┘ │
│     ◀      │ │                                                      │
│  ...       │ │  ┌── Section 2: CHANNELS ─────────────────────────┐ │
│            │ │  │  Supported platforms grid                      │ │
│            │ │  └───────────────────────────────────────────────┘ │
│            │ │                                                      │
│            │ │  ┌── Section 3: FEATURES ─────────────────────────┐ │
│            │ │  │  3-column feature highlights                   │ │
│            │ │  └───────────────────────────────────────────────┘ │
│            │ │                                                      │
│            │ │  ┌── Section 4: HOW IT WORKS ─────────────────────┐ │
│            │ │  │  3-step visual flow                            │ │
│            │ │  └───────────────────────────────────────────────┘ │
│            │ │                                                      │
│            │ │  ┌── Section 5: STATS ────────────────────────────┐ │
│            │ │  │  Key metrics / numbers                         │ │
│            │ │  └───────────────────────────────────────────────┘ │
│            │ │                                                      │
│            │ │  ┌── Section 6: CTA + ACCOUNT INFO ───────────────┐ │
│            │ │  │  Final CTA with pre-filled account preview     │ │
│            │ │  └───────────────────────────────────────────────┘ │
│            │ │                                                      │
└────────────┘ └──────────────────────────────────────────────────────┘
```

---

## Section 1: HERO — 히어로 섹션 / Phần Hero

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░  background: linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 50%, ░░  │
│  ░░                #7c3aed 100%)                                  ░░  │
│  ░░                                                               ░░  │
│  ░░                                                               ░░  │
│  ░░     ┌──────┐                                                  ░░  │
│  ░░     │  💬  │  AmoebaTalk                                     ░░  │
│  ░░     └──────┘                                                  ░░  │
│  ░░                                                               ░░  │
│  ░░                                                               ░░  │
│  ░░     모든 고객 메시지,                                          ░░  │
│  ░░     하나의 대화로.                                              ░░  │
│  ░░                                                               ░░  │
│  ░░     Mọi tin nhắn khách hàng,                                  ░░  │
│  ░░     một cuộc trò chuyện.                                      ░░  │
│  ░░                                                               ░░  │
│  ░░     ▲ text-4xl font-bold text-white                           ░░  │
│  ░░                                                               ░░  │
│  ░░                                                               ░░  │
│  ░░     Facebook, Zalo, LINE, KakaoTalk, WhatsApp,                ░░  │
│  ░░     Instagram — 모든 채널을 하나로                               ░░  │
│  ░░     Tất cả kênh trong một nơi                                 ░░  │
│  ░░                                                               ░░  │
│  ░░     ▲ text-lg text-white/80                                   ░░  │
│  ░░                                                               ░░  │
│  ░░                                                               ░░  │
│  ░░     ┌──────────────────────────────────────┐                  ░░  │
│  ░░     │                                      │                  ░░  │
│  ░░     │   🚀 지금 무료로 시작하기               │                  ░░  │
│  ░░     │      Bắt đầu miễn phí ngay            │                  ░░  │
│  ░░     │                                      │                  ░░  │
│  ░░     └──────────────────────────────────────┘                  ░░  │
│  ░░     ▲ bg-white text-blue-700 font-bold px-8 py-4             ░░  │
│  ░░       rounded-xl shadow-xl hover:shadow-2xl                   ░░  │
│  ░░       transform hover:scale-105 transition                    ░░  │
│  ░░                                                               ░░  │
│  ░░                                                               ░░  │
│  ░░     ✨ 설정 1분 · 신용카드 불필요 · 즉시 사용                    ░░  │
│  ░░        Cài đặt 1 phút · Không cần thẻ · Dùng ngay             ░░  │
│  ░░     ▲ text-sm text-white/60                                   ░░  │
│  ░░                                                               ░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section 2: CHANNELS — 지원 채널 / Các Kênh Hỗ Trợ

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  bg-white py-16                                                      │
│                                                                      │
│       고객이 있는 곳, 어디서든 대화하세요                                │
│       Trò chuyện ở bất cứ nơi nào có khách hàng                      │
│       ▲ text-2xl font-bold text-center text-gray-900                 │
│                                                                      │
│       7개 이상의 메시징 채널을 하나의 인박스에서 관리                     │
│       Quản lý hơn 7 kênh nhắn tin trong một hộp thư                  │
│       ▲ text-gray-500 text-center                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │    │
│  │   │         │  │         │  │         │  │         │      │    │
│  │   │  📘     │  │  💬     │  │  💚     │  │  💛     │      │    │
│  │   │Facebook │  │  Zalo   │  │  LINE   │  │ Kakao   │      │    │
│  │   │         │  │         │  │         │  │  Talk   │      │    │
│  │   └─────────┘  └─────────┘  └─────────┘  └─────────┘      │    │
│  │                                                              │    │
│  │   ┌─────────┐  ┌─────────┐  ┌─────────┐                    │    │
│  │   │         │  │         │  │         │                    │    │
│  │   │  💬     │  │  📸     │  │  🌐     │                    │    │
│  │   │WhatsApp │  │Instagram│  │ Webchat │                    │    │
│  │   │         │  │         │  │         │                    │    │
│  │   └─────────┘  └─────────┘  └─────────┘                    │    │
│  │                                                              │    │
│  │   각 카드: bg-gray-50 rounded-xl p-6 hover:shadow-md         │    │
│  │   Mỗi card: nền xám nhạt, bo tròn, hover có shadow          │    │
│  │   transition hover:scale-105                                 │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│       + Shopify · Odoo · WooCommerce 이커머스 연동                    │
│         Tích hợp thương mại điện tử                                   │
│       ▲ text-sm text-gray-400 text-center                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section 3: FEATURES — 핵심 기능 / Tính Năng Nổi Bật

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  bg-gradient-to-b from-gray-50 to-white py-16                       │
│                                                                      │
│       왜 AmoebaTalk인가?                                              │
│       Tại sao chọn AmoebaTalk?                                       │
│       ▲ text-2xl font-bold text-center                               │
│                                                                      │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐│
│  │                    │ │                    │ │                    ││
│  │   ┌────────────┐   │ │   ┌────────────┐   │ │   ┌────────────┐   ││
│  │   │            │   │ │   │            │   │ │   │            │   ││
│  │   │   📥       │   │ │   │   🤖       │   │ │   │   📊       │   ││
│  │   │            │   │ │   │            │   │ │   │            │   ││
│  │   └────────────┘   │ │   └────────────┘   │ │   └────────────┘   ││
│  │                    │ │                    │ │                    ││
│  │  통합 인박스         │ │  AI 스마트 응대     │ │  실시간 분석         ││
│  │  Hộp thư tập trung  │ │  AI thông minh     │ │  Phân tích          ││
│  │                    │ │                    │ │  thời gian thực     ││
│  │  ─────────────     │ │  ─────────────     │ │  ─────────────     ││
│  │                    │ │                    │ │                    ││
│  │  모든 채널의 메시지를│ │  AI가 고객 의도를   │ │  대화량, 응답 시간,  ││
│  │  한 곳에서 확인하고  │ │  분석하고 자동으로   │ │  만족도를 실시간으로 ││
│  │  응답합니다          │ │  최적의 답변을      │ │  모니터링합니다       ││
│  │                    │ │  제안합니다          │ │                    ││
│  │  Xem và trả lời    │ │                    │ │  Theo dõi lượng     ││
│  │  tin nhắn từ tất   │ │  AI phân tích ý    │ │  tin nhắn, thời    ││
│  │  cả kênh tại một   │ │  định khách hàng   │ │  gian phản hồi,    ││
│  │  nơi                │ │  và tự đề xuất     │ │  mức hài lòng      ││
│  │                    │ │  câu trả lời       │ │  theo thời gian    ││
│  │                    │ │  tối ưu            │ │  thực              ││
│  │                    │ │                    │ │                    ││
│  └────────────────────┘ └────────────────────┘ └────────────────────┘│
│                                                                      │
│  ┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐│
│  │                    │ │                    │ │                    ││
│  │   ┌────────────┐   │ │   ┌────────────┐   │ │   ┌────────────┐   ││
│  │   │   👥       │   │ │   │   🛒       │   │ │   │   🔒       │   ││
│  │   └────────────┘   │ │   └────────────┘   │ │   └────────────┘   ││
│  │                    │ │                    │ │                    ││
│  │  팀 협업            │ │  이커머스 연동      │ │  엔터프라이즈 보안   ││
│  │  Cộng tác nhóm     │ │  Tích hợp TMĐT     │ │  Bảo mật doanh     ││
│  │                    │ │                    │ │  nghiệp            ││
│  │  ─────────────     │ │  ─────────────     │ │  ─────────────     ││
│  │                    │ │                    │ │                    ││
│  │  대화 배정, 내부    │ │  Shopify, Odoo     │ │  데이터 암호화,     ││
│  │  메모, 태그로 팀원과│ │  주문 정보와 고객    │ │  역할 기반 접근     ││
│  │  효율적으로 협업     │ │  대화를 자동 연결    │ │  제어로 안전하게    ││
│  │                    │ │                    │ │  운영               ││
│  │  Phân công, ghi    │ │  Tự động kết nối   │ │  Mã hoá dữ liệu,   ││
│  │  chú nội bộ, tag   │ │  đơn hàng Shopify, │ │  kiểm soát truy    ││
│  │  để cộng tác hiệu  │ │  Odoo với cuộc     │ │  cập theo vai trò  ││
│  │  quả               │ │  trò chuyện        │ │  để vận hành        ││
│  │                    │ │                    │ │  an toàn            ││
│  └────────────────────┘ └────────────────────┘ └────────────────────┘│
│                                                                      │
│  각 카드: bg-white rounded-2xl shadow-sm border p-8                   │
│  hover:shadow-lg transition-all duration-300                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section 4: HOW IT WORKS — 사용 방법 / Cách Hoạt Động

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  bg-white py-16                                                      │
│                                                                      │
│       3단계로 시작하세요                                                │
│       Bắt đầu chỉ trong 3 bước                                       │
│       ▲ text-2xl font-bold text-center                               │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                                                                │  │
│  │  ┌──────────┐          ┌──────────┐          ┌──────────┐    │  │
│  │  │          │          │          │          │          │    │  │
│  │  │  ①  🔗   │ ───────▶ │  ②  💬   │ ───────▶ │  ③  🚀   │    │  │
│  │  │          │          │          │          │          │    │  │
│  │  └──────────┘          └──────────┘          └──────────┘    │  │
│  │                                                                │  │
│  │  계정 연결              채널 추가              대화 시작          │  │
│  │  Kết nối tài khoản     Thêm kênh             Bắt đầu           │  │
│  │                                              trò chuyện        │  │
│  │  ──────────────        ──────────────        ──────────────    │  │
│  │                                                                │  │
│  │  AMB 계정 정보로        Facebook, Zalo 등      고객 메시지가       │  │
│  │  원클릭 가입            소셜 채널을 연결        즉시 인박스에       │  │
│  │  비밀번호만 설정         OAuth로 간편하게       도착합니다          │  │
│  │                                                                │  │
│  │  Đăng ký 1 click       Kết nối các kênh      Tin nhắn khách    │  │
│  │  bằng thông tin AMB    MXH: Facebook, Zalo   hàng đến ngay     │  │
│  │  Chỉ cần đặt mật khẩu  OAuth đơn giản        trong hộp thư     │  │
│  │                                                                │  │
│  │  ① bg-blue-100 text-blue-700 rounded-full w-12 h-12           │  │
│  │  Arrow: border-dashed border-gray-300                          │  │
│  │                                                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section 5: STATS — 수치 하이라이트 / Số Liệu Nổi Bật

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  bg-gradient-to-r from-blue-600 to-indigo-700 py-12                  │
│  text-white                                                          │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐│
│  │              │  │              │  │              │  │          ││
│  │    7+        │  │    50%       │  │    24/7      │  │   1분     ││
│  │              │  │              │  │              │  │   1 phút  ││
│  │  지원 채널     │  │  응답 시간    │  │  AI 자동     │  │  설정     ││
│  │  Kênh hỗ trợ │  │  단축         │  │  응대        │  │  시간     ││
│  │              │  │  Giảm thời   │  │  AI tự động  │  │  Thời gian││
│  │              │  │  gian phản   │  │  trả lời     │  │  cài đặt ││
│  │              │  │  hồi         │  │              │  │          ││
│  │              │  │              │  │              │  │          ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘│
│                                                                      │
│  각 수치: text-4xl font-extrabold + 카운트업 애니메이션                 │
│  Mỗi số: text-4xl font-extrabold + animation đếm lên                │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Section 6: CTA + ACCOUNT INFO — 최종 행동 유도 / CTA Cuối + Thông Tin Tài Khoản

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  bg-gray-50 py-16                                                    │
│                                                                      │
│       지금 바로 시작하세요                                              │
│       Bắt đầu ngay bây giờ                                           │
│       ▲ text-2xl font-bold text-center                               │
│                                                                      │
│       현재 법인 정보로 즉시 가입됩니다                                   │
│       Đăng ký ngay lập tức bằng thông tin pháp nhân hiện tại         │
│       ▲ text-gray-500 text-center                                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                                                              │    │
│  │  bg-white rounded-2xl shadow-lg border p-8 max-w-lg mx-auto │    │
│  │                                                              │    │
│  │   ┌─────────────────────────────────────────────────────┐   │    │
│  │   │                                                     │   │    │
│  │   │  ┌──────┐                                           │   │    │
│  │   │  │  👤  │  VN Master                                │   │    │
│  │   │  │avatar│  master@amoeba.vn                         │   │    │
│  │   │  └──────┘                                           │   │    │
│  │   │                                                     │   │    │
│  │   │  ──────────────────────────────────────────────     │   │    │
│  │   │                                                     │   │    │
│  │   │  🏢  AMOEBA CO., LTD                                │   │    │
│  │   │  🌍  Vietnam (VN01)                                 │   │    │
│  │   │  👑  Owner 역할로 등록 / Đăng ký với vai trò Owner    │   │    │
│  │   │                                                     │   │    │
│  │   │  bg-blue-50 border-blue-100 rounded-xl p-6          │   │    │
│  │   └─────────────────────────────────────────────────────┘   │    │
│  │                                                              │    │
│  │   ┌─────────────────────────────────────────────────────┐   │    │
│  │   │                                                     │   │    │
│  │   │    🚀 AmoebaTalk 서비스 시작하기                      │   │    │
│  │   │       Bắt đầu sử dụng dịch vụ AmoebaTalk            │   │    │
│  │   │                                                     │   │    │
│  │   └─────────────────────────────────────────────────────┘   │    │
│  │   ▲ bg-blue-600 hover:bg-blue-700 text-white               │    │
│  │     w-full py-4 text-lg font-bold rounded-xl                │    │
│  │     shadow-lg hover:shadow-xl transition                    │    │
│  │                                                              │    │
│  │   ┌─────────────────────────────────────────────────────┐   │    │
│  │   │  ✅ 이메일 인증 없이 즉시 사용                         │   │    │
│  │   │     Sử dụng ngay không cần xác minh email             │   │    │
│  │   │  ✅ AMB 법인 정보 자동 연결                             │   │    │
│  │   │     Tự động liên kết thông tin pháp nhân AMB          │   │    │
│  │   │  ✅ 비밀번호만 설정하면 바로 사용 가능                   │   │    │
│  │   │     Chỉ cần đặt mật khẩu là dùng ngay                │   │    │
│  │   │                                                     │   │    │
│  │   │  text-sm text-gray-500                               │   │    │
│  │   └─────────────────────────────────────────────────────┘   │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Responsive / 반응형 / Responsive

### Desktop (≥1280px)

```
Hero: full-width gradient, text-4xl
Channels: 4 columns → 3 columns
Features: 3 columns × 2 rows
Stats: 4 columns inline
CTA: max-w-lg centered card
```

### Tablet (768px ~ 1279px)

```
Hero: text-3xl, padding reduced
Channels: 4 columns → 2 rows
Features: 2 columns × 3 rows
Stats: 2 × 2 grid
CTA: max-w-md
```

### Mobile (< 768px) — iframe embedded 에서는 해당 없음

```
(AMB Management는 desktop-first이므로 mobile 최적화 불필요)
(AMB Management là desktop-first nên không cần tối ưu mobile)
```

---

## Animation & Micro-interactions / 애니메이션 / Hiệu Ứng

```
Section 진입 시 / Khi vào section:

Hero:
  - Logo: fade-in + scale (0.8 → 1.0, 300ms)
  - Headline: fade-in-up (translate-y 20px → 0, 500ms, delay 200ms)
  - Sub-headline: fade-in-up (delay 400ms)
  - CTA button: fade-in-up (delay 600ms) + pulse glow

Channels:
  - Cards: stagger fade-in (각 100ms delay / mỗi card delay 100ms)
  - Hover: scale(1.05) + shadow-md

Features:
  - Cards: IntersectionObserver → fade-in-up on scroll
  - Icon: bounce animation on hover

Stats:
  - Numbers: countUp animation (0 → target, 2s, easeOutExpo)
  - Trigger: IntersectionObserver (viewport 진입 시 시작 / khi vào viewport)

CTA:
  - Card: fade-in-up + shadow grow
  - Button: subtle pulse (box-shadow oscillation)
```

---

## Tailwind CSS Class Reference / 스타일 참조 / Tham Chiếu CSS

```
Hero Section:
  container: bg-gradient-to-br from-[#1e3a5f] via-[#0ea5e9] to-[#7c3aed]
             min-h-[400px] flex flex-col items-center justify-center
             px-8 py-16 rounded-2xl mx-4 mt-4
  headline:  text-4xl font-extrabold text-white tracking-tight
  sub:       text-lg text-white/80 mt-4
  cta:       bg-white text-blue-700 font-bold px-8 py-4 rounded-xl
             shadow-xl hover:shadow-2xl transform hover:scale-105
             transition-all duration-300 mt-8

Channel Cards:
  grid:      grid grid-cols-4 gap-4 px-8
  card:      bg-gray-50 rounded-xl p-6 flex flex-col items-center gap-3
             hover:shadow-md hover:scale-105 transition-all duration-200
  icon:      w-12 h-12
  name:      text-sm font-medium text-gray-700

Feature Cards:
  grid:      grid grid-cols-3 gap-6 px-8
  card:      bg-white rounded-2xl shadow-sm border border-gray-100 p-8
             hover:shadow-lg transition-all duration-300
  icon-wrap: w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center
  title:     text-lg font-bold text-gray-900 mt-4
  desc:      text-sm text-gray-500 mt-2 leading-relaxed

Stats:
  container: bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl
             mx-4 px-8 py-12
  grid:      grid grid-cols-4 gap-8 text-center text-white
  number:    text-4xl font-extrabold
  label:     text-sm text-white/70 mt-1

CTA Card:
  wrapper:   bg-gray-50 px-8 py-16
  card:      bg-white rounded-2xl shadow-lg border max-w-lg mx-auto p-8
  info-box:  bg-blue-50 border border-blue-100 rounded-xl p-6
  button:    bg-blue-600 hover:bg-blue-700 text-white w-full py-4
             text-lg font-bold rounded-xl shadow-lg hover:shadow-xl
             transition-all duration-300
```

---

## i18n Keys / 번역 키 / Khoá dịch

```json
{
  "amoebaTalk": {
    "hero": {
      "headline": "모든 고객 메시지, 하나의 대화로. / Mọi tin nhắn khách hàng, một cuộc trò chuyện.",
      "sub": "Facebook, Zalo, LINE, KakaoTalk, WhatsApp, Instagram — 모든 채널을 하나로",
      "cta": "지금 무료로 시작하기 / Bắt đầu miễn phí ngay",
      "badges": "설정 1분 · 신용카드 불필요 · 즉시 사용"
    },
    "channels": {
      "title": "고객이 있는 곳, 어디서든 대화하세요",
      "sub": "7개 이상의 메시징 채널을 하나의 인박스에서 관리",
      "ecommerce": "+ Shopify · Odoo · WooCommerce 이커머스 연동"
    },
    "features": {
      "title": "왜 AmoebaTalk인가?",
      "inbox": { "title": "통합 인박스", "desc": "..." },
      "ai": { "title": "AI 스마트 응대", "desc": "..." },
      "analytics": { "title": "실시간 분석", "desc": "..." },
      "team": { "title": "팀 협업", "desc": "..." },
      "ecommerce": { "title": "이커머스 연동", "desc": "..." },
      "security": { "title": "엔터프라이즈 보안", "desc": "..." }
    },
    "howItWorks": {
      "title": "3단계로 시작하세요",
      "step1": { "title": "계정 연결", "desc": "..." },
      "step2": { "title": "채널 추가", "desc": "..." },
      "step3": { "title": "대화 시작", "desc": "..." }
    },
    "stats": {
      "channels": "7+ 지원 채널",
      "responseTime": "50% 응답 시간 단축",
      "ai": "24/7 AI 자동 응대",
      "setup": "1분 설정 시간"
    },
    "cta": {
      "title": "지금 바로 시작하세요",
      "sub": "현재 법인 정보로 즉시 가입됩니다",
      "button": "AmoebaTalk 서비스 시작하기",
      "benefits": {
        "noVerify": "이메일 인증 없이 즉시 사용",
        "autoLink": "AMB 법인 정보 자동 연결",
        "passwordOnly": "비밀번호만 설정하면 바로 사용 가능"
      }
    }
  }
}
```

---

## Change Log / 변경 이력 / Lịch Sử Thay Đổi

| Version | Date | KR | VI |
|---------|------|----|----|
| v1.0 | 2026-03-31 | AmoebaTalk 서비스 랜딩 페이지 프로모션 디자인 | Thiết kế trang landing quảng bá dịch vụ AmoebaTalk |
