# Google OAuth 2.0 Setup Guide for Amoeba Portal

> **목적**: `www.amoeba.site/register` 및 `/login`에서 "Continue with Google" 기능을 활성화하기 위한 Google Cloud Console OAuth 설정 가이드

---

## 사전 요구사항

- Google Cloud Console 접근 가능한 계정 (Owner/Editor 권한)
- GCP 프로젝트 (기존 `ambmanagement` 프로젝트 사용)

---

## Step 1. Google Cloud Console 접속

1. https://console.cloud.google.com 접속
2. 상단 프로젝트 드롭다운 → `ambmanagement` 프로젝트 선택

---

## Step 2. OAuth 동의 화면 설정 (최초 1회)

1. 좌측 메뉴 → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** 선택 → Create
3. 필수 입력:

| 항목 | 값 |
|------|-----|
| App name | `Amoeba` |
| User support email | 관리자 이메일 |
| App logo | (선택) Amoeba 로고 |
| App domain - Application home page | `https://www.amoeba.site` |
| App domain - Privacy policy link | `https://www.amoeba.site/page/privacy` |
| App domain - Terms of service link | `https://www.amoeba.site/page/terms` |
| Authorized domains | `amoeba.site` |
| Developer contact email | 관리자 이메일 |

4. **Scopes** 추가 (Add or remove scopes):
   - `openid`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

5. **Test users**: 테스트 단계에서 사용할 Google 계정 이메일 등록

6. **Summary** 확인 후 Save

> ⚠️ **PUBLISH APP**: 동의 화면이 "Testing" 상태이면 Test users에 등록된 계정만 로그인 가능합니다. 모든 사용자에게 오픈하려면 **PUBLISH APP** 버튼으로 Production 상태로 전환 필수.

---

## Step 3. OAuth Client ID 생성

1. 좌측 메뉴 → **APIs & Services** → **Credentials**
2. 상단 **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Amoeba Portal`

### Authorized JavaScript origins

| 환경 | Origin |
|------|--------|
| 로컬 | `http://localhost:5180` |
| 스테이징 | `https://stg-www.amoeba.site` |
| 프로덕션 | `https://www.amoeba.site` |

### Authorized redirect URIs

| 환경 | Redirect URI |
|------|-------------|
| 로컬 | `http://localhost:3010/api/v1/portal/auth/google/callback` |
| 스테이징 | `https://stg-www.amoeba.site/api/v1/portal/auth/google/callback` |
| 프로덕션 | `https://www.amoeba.site/api/v1/portal/auth/google/callback` |

5. **CREATE** 클릭
6. 생성된 **Client ID**와 **Client Secret** 안전하게 복사/보관

---

## Step 4. 환경변수 설정

### 필요한 환경변수

| 변수명 | 설명 | 예시 |
|--------|------|------|
| `GOOGLE_CLIENT_ID` | OAuth Client ID | `123456789-xxxxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth Client Secret | `GOCSPX-xxxxxxxxxxxxx` |
| `GOOGLE_REDIRECT_URI` | 콜백 URL | 환경별 상이 (아래 참조) |

### 4-1. 스테이징

파일: `docker/staging/.env.staging` (서버에서 직접 편집)

```bash
ssh amb-staging "nano ~/ambManagement/docker/staging/.env.staging"
```

```env
GOOGLE_CLIENT_ID=생성된_Client_ID
GOOGLE_CLIENT_SECRET=생성된_Client_Secret
GOOGLE_REDIRECT_URI=https://stg-www.amoeba.site/api/v1/portal/auth/google/callback
```

> 스테이징 docker-compose에는 이미 환경변수 매핑이 존재 (`docker/staging/docker-compose.staging.yml` L131-133)

### 4-2. 프로덕션

**① `.env.production`에 변수 추가:**

```bash
ssh amb-production "nano ~/ambManagement/docker/production/.env.production"
```

```env
GOOGLE_CLIENT_ID=생성된_Client_ID
GOOGLE_CLIENT_SECRET=생성된_Client_Secret
GOOGLE_REDIRECT_URI=https://www.amoeba.site/api/v1/portal/auth/google/callback
```

**② `docker-compose.production.yml`에 환경변수 매핑 추가:**

`amb-portal-api` 서비스의 `environment` 섹션에 아래 3줄 추가:

```yaml
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
      GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI:-}
```

> ⚠️ 프로덕션 docker-compose에는 현재 Google OAuth 환경변수 매핑이 없으므로 반드시 추가해야 합니다.

---

## Step 5. 배포 및 검증

### 스테이징

```bash
# portal-api 재시작 (env 변경이므로 up -d 사용)
ssh amb-staging "cd ~/ambManagement && docker compose -f docker/staging/docker-compose.staging.yml --env-file docker/staging/.env.staging up -d amb-portal-api"
```

### 프로덕션

```bash
# docker-compose.yml 변경 시 git push 후 서버에서 pull
ssh amb-production "cd ~/ambManagement && git pull origin production"

# portal-api 재시작 (env 변경이므로 up -d 사용)
ssh amb-production "cd ~/ambManagement && docker compose -f docker/production/docker-compose.production.yml --env-file docker/production/.env.production up -d amb-portal-api-production"
```

### 검증 방법

1. `https://www.amoeba.site/register` 접속
2. **Continue with Google** 버튼 클릭
3. Google 동의 화면이 정상 표시되면 성공
4. Google 계정 선택 → 온보딩 화면(회사명/국가/비밀번호 입력) 전환 확인
5. 온보딩 완료 → AMA 로그인 페이지 리다이렉트 확인

---

## 관련 코드 참조

| 구분 | 파일 |
|------|------|
| Google 버튼 (RegisterPage) | `apps/portal-web/src/components/signup/Step1AccountForm.tsx` |
| Google 버튼 (LoginPage) | `apps/portal-web/src/pages/auth/LoginPage.tsx` |
| Callback 처리 | `apps/portal-web/src/pages/auth/GoogleCallbackPage.tsx` |
| 온보딩 화면 | `apps/portal-web/src/pages/auth/GoogleOnboardingPage.tsx` |
| Backend - OAuth 시작 | `apps/portal-api/src/domain/auth/controller/portal-auth.controller.ts` → `getGoogleAuthStartUrl()` |
| Backend - 콜백 처리 | 동일 컨트롤러 → `googleCallback()` |
| Backend - 온보딩 완료 | 동일 컨트롤러 → `completeGoogleOnboarding()` |
| 스테이징 env | `docker/staging/.env.staging` L45-47 |
| 스테이징 compose | `docker/staging/docker-compose.staging.yml` L131-133 |
| 프로덕션 compose | `docker/production/docker-compose.production.yml` → `amb-portal-api` environment 섹션 |

---

## 트러블슈팅

### "redirect_uri_mismatch" 에러
- Google Console의 Authorized redirect URIs와 `.env`의 `GOOGLE_REDIRECT_URI` 값이 정확히 일치하는지 확인
- 후행 슬래시(`/`) 유무까지 일치해야 함

### "access_denied" 에러
- OAuth 동의 화면이 "Testing" 상태이고 해당 계정이 Test users에 미등록
- → Test users에 추가하거나 PUBLISH APP 실행

### 구글 버튼 클릭 시 에러 팝업
- `GOOGLE_CLIENT_ID`가 비어있거나 portal-api 컨테이너에 전달되지 않음
- 확인: `docker exec amb-portal-api-production env | grep GOOGLE`

### 환경변수 변경이 반영되지 않을 때
- `docker compose restart`는 env를 재로드하지 않음 → 반드시 `docker compose up -d` 사용
