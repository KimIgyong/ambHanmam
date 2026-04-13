# 작업 계획서: Google 가입 미완료 처리

- **문서번호**: PLN-260412-Google가입미완료처리
- **작성일**: 2026-04-12
- **관련 분석서**: REQ-260412-Google가입미완료처리

---

## 시스템 현황 분석

### 백엔드 (`handleGoogleCallback`)
- Google OAuth 콜백 시점에 `portal_customer` 레코드를 즉시 생성/재사용
- `pct_cli_id=NULL` + `pct_auth_provider='GOOGLE'` → 온보딩 미완료 상태
- 같은 이메일 재시도 시 `isActiveMasterGoogle` 체크:
  - `!pctDeletedAt && pctCliId && pctAuthProvider === 'GOOGLE'` → true면 email_exists 차단
  - 그 외 → 레코드 재사용 (정상 재진행 가능)
- **결론**: 백엔드 로직은 이미 올바름. 미완료 레코드 재사용이 동작하므로 수정 불필요.

### 프론트엔드 문제점
1. **GoogleCallbackPage**: 팝업 모드에서 `email_exists` 에러 시 `window.close()` 전에 postMessage를 보내므로 **팝업은 이미 정상** 동작. 리다이렉트 모드에서 "Sign in" 링크가 `<Link to="/login">`으로 되어 있어 같은 탭에서 이동 → 요구사항: 팝업이면 창 닫기
2. **온보딩 미완료 취소**: 프론트엔드에서 온보딩 페이지를 벗어나면 백엔드 레코드가 남지만, 재시도 시 재사용되므로 실질적 문제 없음. UX 관점에서 "뒤로가기" 시 안내 메시지 표시하면 충분.

---

## 작업 계획

### Phase 1: GoogleCallbackPage — 팝업 감지 + 창 닫기 처리

**목표**: 리다이렉트 모드의 에러 화면에서 "Sign in" 클릭 시 팝업이면 창 닫기

**변경 파일**: `apps/portal-web/src/pages/auth/GoogleCallbackPage.tsx`

**변경 내용**:
1. "Sign in" / "Sign up" 링크를 `<button>`으로 변경
2. 클릭 핸들러에서 `window.opener` 존재 여부 체크:
   - 팝업이면: `window.opener.postMessage({ type: 'google_oauth_error', error }, ORIGIN)` 후 `window.close()`
   - 리다이렉트면: `navigate('/login')` 또는 `navigate('/register')`
3. 기존 `useEffect`의 팝업 모드 로직은 유지 (자동 postMessage + close)

**사이드 임팩트**: 없음. 기존 팝업 모드 자동 닫기는 그대로 유지.

### Phase 2: GoogleCallbackPage — 팝업 모드 자동 닫기 보강

**목표**: 팝업 모드에서 `window.close()` 실패 시(브라우저 정책) 수동 닫기 버튼 표시

**변경 파일**: `apps/portal-web/src/pages/auth/GoogleCallbackPage.tsx`

**변경 내용**:
1. `useEffect`에서 `window.close()` 후 setTimeout으로 아직 열려있는지 체크
2. 닫히지 않았으면 state 설정 → 수동 "창 닫기" 버튼 표시
3. 에러 화면에 `window.opener` 있으면 "창을 닫아주세요" 안내 추가

### Phase 3: Step1AccountForm — email_exists 에러 UI 개선

**목표**: 팝업에서 `email_exists` postMessage 수신 시 에러 메시지에 "Sign in" 링크 추가

**변경 파일**: `apps/portal-web/src/components/signup/Step1AccountForm.tsx`

**변경 내용**:
- 현재 `googleError` 상태에 에러 메시지만 표시되고 하단에 `<a href="/login">` 링크가 있음
- 이미 구현되어 있으므로 확인만 필요

---

## 변경 대상 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `apps/portal-web/src/pages/auth/GoogleCallbackPage.tsx` | **수정** | 팝업 감지 + 창 닫기, 수동 닫기 버튼 |
| `apps/portal-web/src/locales/ko/common.json` | **수정** | 에러 관련 i18n 키 추가 (필요시) |
| `apps/portal-web/src/locales/en/common.json` | **수정** | 동일 |
| `apps/portal-web/src/locales/vi/common.json` | **수정** | 동일 |

---

## 사이드 임팩트 분석

| 영향 범위 | 영향도 | 설명 |
|-----------|--------|------|
| 팝업 모드 정상 플로우 | 없음 | 기존 자동 postMessage + close 그대로 유지 |
| 리다이렉트 모드 플로우 | 낮음 | Link → button 변경, 동일 동작 |
| 백엔드 | 없음 | 변경 없음 |
| DB | 없음 | 변경 없음 |

---

## DB 마이그레이션
해당 없음 (프론트엔드만 변경)
