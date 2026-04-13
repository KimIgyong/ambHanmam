# Google Analytics 전환 측정 작업 가이드

## 1. 개요

### 추적 대상 퍼널
```
[1] www.amoeba.site (랜딩페이지 방문)
 ↓
[2] www.amoeba.site/register (회원가입 페이지)
 ↓
[3] 가입 완료 (SignupCompleteScreen)
 ↓
[4] ama.amoeba.site/user/login → 첫 로그인 비밀번호 변경 (ForceChangePasswordPage)
 ↓
[5] ama.amoeba.site/today (서비스 진입 완료)
```

### 현재 상태 (AS-IS)

| 단계 | 위치 | 기존 gtag 이벤트 | 상태 |
|------|------|------------------|------|
| 1. 랜딩 방문 | portal-web | `landing_page_view` | ✅ 있음 |
| 2. CTA 클릭 | portal-web | `cta_register_click` | ✅ 있음 |
| 3. 가입 제출 | portal-web | `register_submit` | ✅ 있음 |
| 4. 가입 완료 | portal-web | ❌ 없음 | 🔴 추가 필요 |
| 5. AMA 첫 로그인 | web | ❌ 없음 | 🔴 추가 필요 |
| 6. 비밀번호 변경 | web | `first_login_password_change` | ✅ 있음 |
| 7. /today 진입 | web | ❌ 없음 | 🟡 선택 추가 |

### 크로스 도메인 추적 현황

| 항목 | 상태 |
|------|------|
| 측정 ID | `G-S8K2WQYGM9` (양쪽 동일) |
| gtag.js | portal-web ✅ / web ✅ |
| 리링커 (cross-domain) | `domains: ['www.amoeba.site', 'ama.amoeba.site']` 양쪽 설정 ✅ |

---

## 2. Google Analytics 콘솔 작업 (GA4 Admin)

### 2-1. GA4 속성 확인
- **GA4 속성**: `G-S8K2WQYGM9`
- **GA4 Admin** → https://analytics.google.com → 속성 선택

### 2-2. 크로스 도메인 측정 확인
> GA4 Admin → 데이터 스트림 → 웹 스트림 선택 → 태그 설정 구성 → **도메인 구성**

| 도메인 | 일치 조건 |
|--------|----------|
| `www.amoeba.site` | 포함 |
| `ama.amoeba.site` | 포함 |
| `stg-www.amoeba.site` | 포함 (스테이징 테스트용) |
| `stg-ama.amoeba.site` | 포함 (스테이징 테스트용) |

> ⚠️ **중요**: 리링커(`linker`)는 index.html에 이미 설정되어 있으나, GA4 콘솔의 **도메인 구성**에도 반드시 등록해야 크로스 도메인 세션이 유지됩니다.

### 2-3. 이벤트를 전환으로 표시
> GA4 Admin → 이벤트 → 해당 이벤트의 **"전환으로 표시"** 토글 ON

| 이벤트 이름 | 전환 표시 | 설명 |
|------------|----------|------|
| `register_complete` | ✅ ON | 회원가입 완료 (핵심 전환) |
| `first_login_password_change` | ✅ ON | 첫 로그인 완료 (최종 전환) |
| `register_submit` | 선택 | 가입 폼 제출 |
| `cta_register_click` | 선택 | CTA 클릭 |

### 2-4. 전환 퍼널 탐색 설정
> GA4 → 탐색 → 유입경로 탐색 만들기

**퍼널 단계 설정:**
| 단계 | 이벤트 | 선택 사항 |
|------|--------|----------|
| 1 | `landing_page_view` | 시작점 |
| 2 | `cta_register_click` | |
| 3 | `register_submit` | |
| 4 | `register_complete` | 핵심 |
| 5 | `first_login_password_change` | 최종 |

---

## 3. 코드 작업 (이벤트 추가)

### 3-1. 가입 완료 이벤트 추가 (portal-web)

**파일**: `apps/portal-web/src/components/signup/SignupCompleteScreen.tsx`

```tsx
// useEffect 추가 (컴포넌트 마운트 시 가입 완료 이벤트 발생)
useEffect(() => {
  window.gtag?.('event', 'register_complete', {
    method: 'email',
  });
}, []);
```

### 3-2. 가입 완료 → AMA 이동 링크 수정 (portal-web)

**파일**: `apps/portal-web/src/components/signup/SignupCompleteScreen.tsx`

현재 `handleGoAma`에서 `/login`으로 이동 → `/user/login`으로 수정 필요:
```tsx
const handleGoAma = () => {
  reset();
  window.gtag?.('event', 'signup_go_ama_click');
  window.location.href = `${AMA_URL}/user/login`;
};
```

### 3-3. (선택) 서비스 진입 완료 이벤트 (web)

**파일**: `apps/web/src/domain/today/pages/TodayPage.tsx`

첫 로그인 후 Today 페이지 도달을 추적하려면:
```tsx
useEffect(() => {
  // 세션당 1회만 발생
  const key = 'amb_today_tracked';
  if (!sessionStorage.getItem(key)) {
    window.gtag?.('event', 'service_first_visit');
    sessionStorage.setItem(key, '1');
  }
}, []);
```

---

## 4. Google Ads 전환 연동 (선택)

Google Ads 캠페인에서 전환 추적이 필요한 경우:

### 4-1. Google Ads 전환 액션 만들기
1. Google Ads → 도구 → 전환 → + 새 전환 액션
2. **웹사이트** 선택
3. 전환 이름: `AMA 가입 완료` / 카테고리: `가입`
4. **Conversion ID**와 **Conversion Label** 얻기

### 4-2. 전환 스니펫 추가

**파일**: `apps/portal-web/src/components/signup/SignupCompleteScreen.tsx`

```tsx
useEffect(() => {
  // GA4 이벤트
  window.gtag?.('event', 'register_complete', { method: 'email' });
  
  // Google Ads 전환 (Conversion ID/Label은 Ads 콘솔에서 확인)
  window.gtag?.('event', 'conversion', {
    send_to: 'AW-XXXXXXXXX/YYYYYYYYYYY',  // Ads 전환 ID/라벨
    value: 1.0,
    currency: 'USD',
  });
}, []);
```

### 4-3. GA4 ↔ Google Ads 연결
> GA4 Admin → 제품 링크 → Google Ads 링크 → 연결

이렇게 하면 GA4 전환 이벤트를 Ads에서 자동 가져올 수 있어 수동 스니펫 없이도 전환 추적 가능.

---

## 5. 테스트 및 검증

### 5-1. GA4 DebugView로 실시간 검증
1. Chrome 확장 프로그램 **Google Analytics Debugger** 설치
2. 활성화 후 가입 플로우 실행
3. GA4 Admin → DebugView → 이벤트 실시간 확인

### 5-2. 크로스 도메인 검증 체크리스트

| 확인 항목 | 방법 |
|----------|------|
| `_gl` 파라미터 전달 | www → ama 이동 시 URL에 `?_gl=...` 파라미터 확인 |
| 세션 유지 | GA4 DebugView에서 동일 `session_id` 확인 |
| Client ID 동일 | 양쪽 도메인에서 `_ga` 쿠키 값 동일 확인 |
| 리퍼러 제외 | `ama.amoeba.site`가 리퍼러 제외 목록에 포함 확인 |

### 5-3. 스테이징 테스트 순서
1. `stg-www.amoeba.site` 접속 → `landing_page_view` 확인
2. "무료 시작" 클릭 → `cta_register_click` 확인
3. `/register` 페이지에서 회원가입 → `register_submit` 확인
4. 가입 완료 화면 → `register_complete` 확인 (코드 추가 후)
5. "AMA 로그인하기" 클릭 → `stg-ama.amoeba.site/user/login` 이동 확인
6. 첫 로그인 + 비밀번호 변경 → `first_login_password_change` 확인
7. GA4 DebugView에서 **5~6번이 동일 세션**인지 확인

---

## 6. 즉시 필요한 코드 변경 요약

| 우선순위 | 파일 | 변경 내용 |
|---------|------|----------|
| 🔴 필수 | `portal-web/.../SignupCompleteScreen.tsx` | `register_complete` 이벤트 추가 |
| 🔴 필수 | `portal-web/.../SignupCompleteScreen.tsx` | AMA 이동 URL `/login` → `/user/login` |
| 🟡 권장 | GA4 콘솔 | 도메인 구성에 4개 도메인 등록 |
| 🟡 권장 | GA4 콘솔 | `register_complete`, `first_login_password_change` 전환 표시 |
| 🟢 선택 | GA4 콘솔 | 유입경로 탐색 설정 |
| 🟢 선택 | `web/.../TodayPage.tsx` | `service_first_visit` 이벤트 (세션당 1회) |

---

## 7. 전체 이벤트 맵 (완성 후)

```
www.amoeba.site
├─ landing_page_view         ← 랜딩 페이지 조회
├─ cta_register_click        ← CTA 버튼 클릭
│
├─ /register
│  ├─ register_submit        ← 가입 폼 제출
│  └─ register_complete      ← 🆕 가입 완료
│     └─ signup_go_ama_click ← 🆕 AMA 이동 클릭
│
ama.amoeba.site (크로스 도메인 세션 유지)
├─ /user/login
│  └─ first_login_password_change ← 첫 비밀번호 변경
└─ /today
   └─ service_first_visit    ← 🆕 (선택) 서비스 진입
```
