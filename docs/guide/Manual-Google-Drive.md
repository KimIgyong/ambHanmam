# Google Cloud 서비스 계정 키 생성 및 Google Drive 연동 가이드

## 1. Google Cloud Console 접속

- https://console.cloud.google.com 접속
- 사용할 프로젝트 선택 (없으면 새 프로젝트 생성)

## 2. Google Drive API 활성화

- 좌측 메뉴 **APIs & Services** → **Library**
- "Google Drive API" 검색 → **Enable** 클릭

## 3. 서비스 계정 생성

- **IAM & Admin** → **Service Accounts**
- **+ CREATE SERVICE ACCOUNT** 클릭
- 이름 입력 (예: `amb-drive-service`) → **CREATE AND CONTINUE**
- 역할은 건너뛰어도 됨 → **DONE**

## 4. JSON 키 다운로드

- 생성된 서비스 계정 클릭
- **Keys** 탭 → **ADD KEY** → **Create new key**
- **JSON** 선택 → **CREATE**
- JSON 파일이 자동 다운로드됨

## 5. 도메인 전체 위임 (Domain-Wide Delegation) 설정

서비스 계정이 사용자(`pm@amoeba.group`)를 대신하여 Drive에 접근하려면 이 설정이 필수입니다.

### 서비스 계정 쪽

- Service Accounts 목록에서 해당 계정 클릭
- **Details** 탭 → **Advanced settings** → **Domain-wide delegation** 체크
- **Client ID** 복사 (숫자로 된 ID)

### Google Workspace 관리 콘솔 쪽

- https://admin.google.com 접속 (Workspace 관리자 계정)
- **Security** → **Access and data control** → **API controls**
- **Domain-wide delegation** → **MANAGE DOMAIN WIDE DELEGATION**
- **Add new** 클릭
- **Client ID**: 위에서 복사한 숫자 ID 붙여넣기
- **OAuth scopes**: `https://www.googleapis.com/auth/drive`
- **AUTHORIZE** 클릭

## 6. 스테이징 서버에 설정

다운로드한 JSON 파일 내용을 한 줄로 만들어서 `.env.staging`에 설정합니다.

```bash
# 스테이징 서버에서
vi /home/ambmanager/ambManagement/docker/staging/.env.staging
```

추가할 내용:

```
GOOGLE_SERVICE_ACCOUNT_KEY_JSON={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"amb-drive-service@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
GOOGLE_DRIVE_IMPERSONATE_EMAIL=pm@amoeba.group
```

설정 후 컨테이너 재시작:

```bash
cd /home/ambmanager/ambManagement
bash docker/staging/deploy.sh
```

이후 `/settings/drive` 페이지에서 "연결 테스트"와 "찾아보기" 버튼이 활성화됩니다.
