# 요구사항 분석서: Initial Setup 이메일 발송 및 비밀번호 최초 설정

**문서번호**: REQ-260412-InitialSetup이메일발송변경  
**작성일**: 2026-04-12  
**상태**: 분석 완료 (v5)

---

## 1. 요구사항 요약

### 1.1 전체 요구사항 목록

| # | 요구사항 | 상세 |
|---|---------|------|
| **R1** | 임시 비밀번호 이메일 제거 | InitialSetup에서 사용자가 직접 비밀번호를 설정하므로 임시 PW 이메일 불필요 |
| **R2** | 비밀번호 기억 안내 표시 | InitialSetupPage 비밀번호 입력 시 "반드시 기억하세요" 경고 표시 |
| **R3** | 비밀번호 마스킹 표시 | 비밀번호 앞 1자 + 마지막 1자만 표기, 나머지 * 처리. 이메일은 평문 표시 |
| **R4** | OWNER 플래그 기록 | 포탈 직접 가입자 = MASTER + OWNER 별도 기록 |
| **R5** | Setup 완료 이메일 발송 | InitialSetup 완료 후 설정된 비밀번호 + 회사코드 이메일 발송 |
| **R6** | **Portal + AMA 최초 비밀번호 동일 설정** | InitialSetup에서 설정한 비밀번호를 Portal과 AMA 양쪽에 동시 저장. **이후 양쪽 비밀번호는 독립 관리 (동기화 없음)** |

---

## 2. AS-IS 현황

### 2.1 현재 전체 가입 플로우

```
[1] www.amoeba.site/register (Portal)
    └→ Step 1: 이메일 인증 + 약관 동의 → register() API 호출
        └→ Portal-API: 임시PW(16자) 자동생성 → pct_password에 bcrypt 저장
        └→ Portal-API: triggerAutoProvision() → AMA-API 호출
            └→ AMA-API: createInternalAccount()
                ├→ 별도 임시PW(12자) 생성 → usr_password에 bcrypt 저장
                ├→ usrMustChangePw = true
                └→ 📧 ACCOUNT_CREATED 이메일 (AMA 임시PW + 회사코드) 발송
        └→ autoLoginToken(5분 TTL) 생성 → 프론트엔드 반환
        
[2] ama.amoeba.site → 자동 로그인 (autoLoginToken)
    └→ usrMustChangePw: true → InitialSetupPage 리다이렉트

[3] InitialSetupPage → PATCH /api/v1/auth/initial-setup
    └→ AMA usr_password만 변경 (Portal pct_password는 그대로)
    └→ 이메일 발송 없음 ❌
```

### 2.2 현재 비밀번호 테이블 분리 현황

| 시점 | Portal `pct_password` | AMA `usr_password` | 동기화 |
|------|----------------------|-------------------|--------|
| Portal 가입 직후 | UUID 16자 랜덤 (bcrypt) | — | — |
| Auto Provision | 변경 없음 | UUID 12자 랜덤 (bcrypt) | ❌ **서로 다른 임시PW** |
| InitialSetup 완료 | **변경 없음** ⚠️ | 사용자 입력 PW (bcrypt) | ❌ **Portal은 임시PW 그대로** |
| Portal 비밀번호 재설정 | 사용자 입력으로 변경 | 변경 없음 | ❌ **AMA는 그대로** |

> **문제**: 두 시스템의 비밀번호가 항상 다름. Portal 로그인 시 임시PW를 아무도 모르므로, 포탈 자체 로그인 불가 상태.

### 2.3 DB 구조

- **Portal과 AMA는 동일 PostgreSQL DB(`db_amb`) 사용**
- Portal 비밀번호: `amb_svc_portal_customers.pct_password`
- AMA 비밀번호: `amb_users.usr_password`
- 매핑: `amb_portal_user_mappings` (pct_id ↔ usr_id)
- AMA-API에 `PortalCustomerReadonlyEntity` 존재 → 같은 DB이므로 직접 접근 가능 (현재 SELECT 전용)

### 2.4 현재 Portal → AMA 통신

| 방향 | 방식 | 인증 |
|------|------|------|
| Portal-API → AMA-API | `fetch()` (native) | `x-portal-bridge-token` 헤더 |
| AMA-API → Portal-API | **없음** ❌ | — |
| AMA-API → Portal DB | `PortalCustomerReadonlyEntity` (SELECT 전용) | 같은 DB |

### 2.5 관련 엔티티/서비스 현황

| 항목 | 상태 | 비고 |
|------|------|------|
| `PortalCustomerReadonlyEntity` | SELECT 전용, `pct_password` 필드 없음 | UPDATE 불가 |
| `AuthService`에 `EmailTemplateService` | 미주입 | `SettingsModule` 미임포트 |
| `EntityUserRoleEntity`에 OWNER 플래그 | 없음 | `eur_is_owner` 필드 없음 |
| 비밀번호 동기화 메커니즘 | 없음 | 양방향 모두 |

---

## 3. TO-BE 설계

### 3.1 변경된 전체 플로우

```
[1] www.amoeba.site/register (Portal)
    └→ Step 1: 이메일 인증 + 약관 동의 → register()
        └→ Portal-API: 임시PW(16자) → pct_password 저장 (유지)
        └→ Auto Provision → AMA 계정 생성 (MASTER + OWNER)
            └→ ❌ 임시PW 이메일 발송 제거 [R1]
        └→ autoLoginToken → 프론트엔드

[2] ama.amoeba.site → 자동 로그인
    └→ usrMustChangePw: true → InitialSetupPage
    └→ ⚠️ 비밀번호 기억 안내 표시 [R2]

[3] InitialSetupPage → PATCH /api/v1/auth/initial-setup (변경)
    ├→ ✅ AMA usr_password 변경 (기존)
    ├→ ✅ Portal pct_password 동시 저장 [R6] ← 신규 (최초 1회만, 이후 동기화 없음)
    ├→ ✅ OWNER 플래그 기록 [R4] (autoProvision 시점)
    └→ 📧 SETUP_COMPLETE 이메일 발송 [R5]
        ├→ 이메일: 평문 (hong@example.com)
        ├→ 비밀번호: 마스킹 (M********4) [R3]
        └→ 회사코드 + Login Now 버튼
```

### 3.2 R6 최초 비밀번호 동일 설정 — 설계

**정책**: InitialSetup 시점에 사용자가 설정한 비밀번호를 Portal(`pct_password`)과 AMA(`usr_password`) 양쪽에 동일하게 저장한다. **이후 한쪽에서 비밀번호를 변경해도 다른 쪽에 전파하지 않는다** (독립 관리).

| 시점 | Portal `pct_password` | AMA `usr_password` | 동일 여부 |
|------|----------------------|-------------------|----------|
| InitialSetup 직후 | ✅ 사용자 설정 PW | ✅ 사용자 설정 PW | **동일** |
| 이후 AMA에서 PW 변경 | 이전 PW 유지 | 새 PW | 불일치 (의도된 동작) |
| 이후 Portal에서 PW 리셋 | 새 PW | 이전 PW 유지 | 불일치 (의도된 동작) |

**구현 방식**: 같은 DB(`db_amb`)를 사용하므로 AMA-API에서 직접 Raw Query로 `pct_password` UPDATE.
- 트랜잭션 보장 가능 (같은 DB)
- HTTP 통신 실패 위험 없음
- 1회성 저장이므로 지속적 동기화 복잡도 없음

### 3.3 최초 비밀번호 동일 설정 구현 상세

```typescript
// auth.service.ts → initialSetup() 내부

// 1. AMA 비밀번호 변경 (기존)
const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
user.usrPassword = hashedPassword;

// 2. Portal 비밀번호 동일 설정 [R6] — 최초 1회만
const mapping = await this.portalUserMappingRepository.findOne({
  where: { usrId: userId, pumStatus: 'ACTIVE' },
});
if (mapping) {
  await this.dataSource.query(
    `UPDATE amb_svc_portal_customers SET pct_password = $1 WHERE pct_id = $2`,
    [hashedPassword, mapping.pctId],
  );
}
```

> **핵심**: 동일한 `hashedPassword`를 양쪽에 저장. 이후 각 시스템에서 비밀번호를 독립적으로 변경 가능하며, 상호 전파하지 않음.

---

## 4. 이메일 내용 구성 화면 (TO-BE 목업)

### 4.1 SETUP_COMPLETE 이메일 목업

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  AMB Management                                     │
│  ─────────────────                                  │
│                                                     │
│  Hello Hong 님,                                     │
│                                                     │
│  Your account setup has been completed              │
│  successfully. Here are your login details:         │
│                                                     │
│  ┃  Login Email:    hong@example.com                 │
│  ┃  Password:       M********4       ← 마스킹 [R3]  │
│  ┃  Company Code:   VN01                            │
│  ┃  Company:        Amoeba Vietnam                  │
│  ┃                                                  │
│                                                     │
│  ⚠ For security, please memorize your password      │
│    and delete this email.                           │
│                                                     │
│  ┌──────────────────┐                               │
│  │   Login Now       │                               │
│  └──────────────────┘                               │
│                                                     │
│  If the button doesn't work, copy this link:        │
│  https://ama.amoeba.site/VN01/login                 │
│                                                     │
│  ─────────────────────────────────────              │
│  This email was sent by AMB Management System.      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2 HTML 템플릿 코드

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
  <h2 style="color: #4F46E5; margin: 0 0 16px 0;">AMB Management</h2>
  <p style="font-size:15px; color:#111827;">Hello <strong>{{userName}}</strong>,</p>
  <p style="color:#374151;">Your account setup has been completed successfully.<br/>Here are your login details:</p>
  <table style="border-left:3px solid #4F46E5; padding-left:12px; margin:16px 0; border-spacing:0;">
    <tr>
      <td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Login Email:</strong></td>
      <td style="color:#111827;">{{userEmail}}</td>
    </tr>
    <tr>
      <td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Password:</strong></td>
      <td style="color:#111827; font-family:monospace;">{{maskedPassword}}</td>
    </tr>
    <tr>
      <td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Company Code:</strong></td>
      <td style="color:#111827; font-family:monospace; font-weight:bold;">{{entityCode}}</td>
    </tr>
    <tr>
      <td style="color:#6B7280; padding:4px 8px 4px 0;"><strong>Company:</strong></td>
      <td style="color:#111827;">{{entityName}}</td>
    </tr>
  </table>
  <p style="color:#DC2626; font-size:13px; margin:8px 0 16px 0;">
    ⚠ For security, please memorize your password and delete this email.
  </p>
  <a href="{{loginUrl}}" style="display:inline-block; background:#4F46E5; color:white; padding:12px 28px; border-radius:8px; text-decoration:none; font-size:15px; font-weight:600; margin:8px 0 24px 0;">
    Login Now
  </a>
  <p style="color:#6B7280; font-size:13px;">If the button doesn't work, copy and paste this link: {{loginUrl}}</p>
  <hr style="border:none; border-top:1px solid #E5E7EB; margin:20px 0;" />
  <p style="color:#9CA3AF; font-size:12px;">This email was sent by AMB Management System.</p>
</div>
```

---

## 5. 구현 변경 사항

### 5.1 변경 파일 총괄

| # | 파일 | 변경 유형 | 요구사항 | 설명 |
|---|------|----------|---------|------|
| 1 | `portal-bridge.service.ts` | 수정 | R1, R4 | 임시PW 이메일 발송 제거 + EntityUserRole에 OWNER 설정 |
| 2 | `entity-user-role.entity.ts` | 수정 | R4 | `eur_is_owner: boolean` 컬럼 추가 |
| 3 | `auth.module.ts` | 수정 | R5, R6 | `SettingsModule` import + `PortalUserMappingEntity` TypeORM 추가 |
| 4 | `auth.service.ts` | 수정 | R3, R5, R6 | EmailTemplateService 주입 + initialSetup()에 이메일 발송 + Portal PW 최초 동일 설정 |
| 5 | `email-template.service.ts` | 수정 | R3, R5 | `SETUP_COMPLETE` 템플릿 + `maskPasswordForDisplay()` 유틸 |
| 6 | `InitialSetupPage.tsx` | 수정 | R2 | 비밀번호 기억 경고 문구 추가 |
| 7 | `auth.json` (en/ko/vi) | 수정 | R2 | `passwordRememberWarning` i18n 키 추가 |
| 8 | DB 마이그레이션 | 신규 | R4 | `eur_is_owner` 컬럼 |

### 5.2 상세 구현

#### 5.2.1 R1 — 임시 비밀번호 이메일 제거

**파일**: `portal-bridge.service.ts` → `createInternalAccount()`

제거 대상 (line ~300-310): 이메일 발송 try-catch 블록 전체 삭제.
임시 비밀번호 **생성/저장**은 유지 (autoLoginToken 만료 시 fallback 로그인용).

#### 5.2.2 R2 — 비밀번호 기억 안내

**파일**: `InitialSetupPage.tsx`, `auth.json` (3개 언어)

```tsx
<p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
  <AlertTriangle className="w-4 h-4 shrink-0" />
  {t('initialSetup.passwordRememberWarning')}
</p>
```

i18n:
- en: `"Please remember your password. It will not be displayed again."`
- ko: `"비밀번호를 반드시 기억하세요. 다시 표시되지 않습니다."`
- vi: `"Vui lòng ghi nhớ mật khẩu. Mật khẩu sẽ không được hiển thị lại."`

#### 5.2.3 R3 — 비밀번호 마스킹

**유틸** (`email-template.service.ts` 내부):

```typescript
/** 비밀번호 앞 1자 + 마지막 1자만 표시, 나머지 * */
private maskPasswordForDisplay(password: string): string {
  if (password.length <= 2) return password;
  return password[0] + '*'.repeat(password.length - 2) + password[password.length - 1];
}
// "MyP@ss1234" → "M********4"
```

#### 5.2.4 R4 — OWNER 플래그

**엔티티 변경**: `entity-user-role.entity.ts`
```typescript
@Column({ name: 'eur_is_owner', type: 'boolean', default: false })
eurIsOwner: boolean;
```

**설정 시점**: `portal-bridge.service.ts` → `createInternalAccount()` → EntityUserRole 생성 시 `eurIsOwner: true`

**DB 마이그레이션**:
```sql
ALTER TABLE amb_hr_entity_user_roles ADD COLUMN eur_is_owner BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN amb_hr_entity_user_roles.eur_is_owner IS '포탈 직접 서비스 신청 법인 소유자 여부';
```

#### 5.2.5 R5 — Setup 완료 이메일 발송

**파일**: `auth.service.ts` → `initialSetup()` 끝부분

```typescript
try {
  const entity = user.usrCompanyId
    ? await this.entityRepository.findOne({ where: { entId: user.usrCompanyId } })
    : null;
  const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5179');
  const entityCode = entity?.entCode ?? '';
  const variables: Record<string, string> = {
    userName: dto.name,
    userEmail: user.usrEmail,
    maskedPassword: this.maskPasswordForDisplay(dto.password),
    entityCode,
    entityName: entity?.entName ?? dto.company_name ?? '',
    loginUrl: `${frontendUrl}/${entityCode}/login`,
  };
  const { subject, html } = await this.emailTemplateService.resolve(
    'SETUP_COMPLETE', variables, entity?.entId ?? null,
  );
  await this.mailService.sendRawEmail({ to: [user.usrEmail], subject, html });
} catch (error) {
  this.logger.warn(`Failed to send setup complete email: ${error.message}`);
}
```

#### 5.2.6 R6 — Portal 최초 비밀번호 동일 설정

**파일**: `auth.service.ts` → `initialSetup()` 내부, AMA 비밀번호 변경 직후

```typescript
// AMA 비밀번호 변경 (기존)
const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
user.usrPassword = hashedPassword;
user.usrMustChangePw = false;
user.usrName = dto.name;
await this.userRepository.save(user);

// Portal 비밀번호 최초 동일 설정 [R6] — 이후 동기화 없음
try {
  const mapping = await this.portalUserMappingRepository.findOne({
    where: { usrId: userId, pumStatus: 'ACTIVE' },
  });
  if (mapping) {
    await this.dataSource.query(
      `UPDATE amb_svc_portal_customers SET pct_password = $1 WHERE pct_id = $2`,
      [hashedPassword, mapping.pctId],
    );
    this.logger.log(`Portal password set for user ${userId}, pctId ${mapping.pctId}`);
  }
} catch (error) {
  this.logger.warn(`Failed to set portal password: ${error.message}`);
}
```

> **참고**: 이후 AMA 또는 Portal에서 개별적으로 비밀번호를 변경해도 상대방에 전파하지 않음 (독립 관리 정책).

**필요한 의존성 주입**:
- `DataSource` (TypeORM) — raw query 실행용
- `PortalUserMappingEntity` Repository — 매핑 조회용

**`auth.module.ts` 변경**:
```typescript
imports: [
  TypeOrmModule.forFeature([
    ..., PortalUserMappingEntity,  // ← 추가
  ]),
  SettingsModule,  // ← 추가 (EmailTemplateService)
]
```

```typescript
// auth.service.ts constructor
constructor(
  ...,
  @InjectRepository(PortalUserMappingEntity)
  private readonly portalUserMappingRepository: Repository<PortalUserMappingEntity>,
  private readonly emailTemplateService: EmailTemplateService,
  private readonly dataSource: DataSource,
) {}
```

---

## 6. 사이드 임팩트 분석

### 6.1 임팩트 총괄

| # | 영향 범위 | 심각도 | 요구사항 | 설명 | 대응 방안 |
|---|----------|--------|---------|------|----------|
| **S1** | autoLoginToken 만료 시 로그인 | **높음** | R1 | 임시PW 이메일 제거 후, 5분 내 InitialSetup 미완료 시 재로그인 불가 | AMA 비밀번호 재설정 기능(forgot-password)으로 보완. 또는 autoLoginToken TTL 연장(5분→30분) 검토 |
| **S2** | Portal 자체 로그인 활성화 | **낮음** | R6 | Portal PW가 설정되면 www.amoeba.site에서도 직접 로그인 가능해짐 | 의도된 동작 — 양쪽 동일 비밀번호로 시작 |
| **S3** | Portal/AMA 비밀번호 불일치 (이후) | **없음** | R6 | 이후 한쪽에서 비밀번호를 변경하면 양쪽이 달라짐 | **의도된 동작** — 동기화하지 않는 정책 |
| **S4** | 도메인 경계 침범 | **낮음** | R6 | AMA-API가 Portal 테이블(`amb_svc_portal_customers`)을 직접 UPDATE | 같은 DB이므로 기술적 문제 없음. 1회성 저장이므로 영향 최소 |
| **S5** | `AuthModule` 의존성 증가 | **낮음** | R5, R6 | `SettingsModule` import + `PortalUserMappingEntity` + `DataSource` 추가 | 순환참조 확인 필요 |
| **S6** | DB 스키마 변경 | **낮음** | R4 | `eur_is_owner` 컬럼 추가 | DEFAULT FALSE → 기존 데이터 영향 없음 |
| **S7** | 기존 MASTER 구분 불가 | **낮음** | R4 | 기존 MASTER 사용자는 모두 `eur_is_owner: false` | 필요 시 별도 SQL로 수동 업데이트 |
| **S8** | `ACCOUNT_CREATED` 템플릿 | **없음** | R1 | 템플릿 자체는 유지 (초대 사용자 등 다른 경로에서 사용 가능) | 삭제하지 않음 |

### 6.2 비밀번호 독립 관리 정책

R6은 **InitialSetup 시점의 1회성 동일 설정**이며, 이후 동기화하지 않음:

| 시나리오 | Portal PW | AMA PW | 비고 |
|---------|-----------|--------|------|
| InitialSetup 직후 | ✅ 동일 | ✅ 동일 | 최초 1회 설정 |
| 이후 AMA에서 PW 변경 | 이전 PW | 새 PW | 의도된 독립 관리 |
| 이후 Portal에서 PW 리셋 | 새 PW | 이전 PW | 의도된 독립 관리 |

> 각 시스템의 비밀번호는 독립적으로 관리되며, 사용자가 각각 변경 가능.

### 6.3 autoLoginToken 만료 시나리오 분석

```
[정상 경로] autoLoginToken(5분) 내에 InitialSetup 완료
  └→ 비밀번호 설정됨 → 이메일 수신 → 이후 AMA/Portal 모두 로그인 가능 ✅

[비정상 경로] autoLoginToken 만료 후 InitialSetup 미완료
  └→ AMA: 임시PW로 로그인 시도 → 사용자가 임시PW를 모름 ❌
  └→ Portal: 임시PW로 로그인 시도 → 사용자가 임시PW를 모름 ❌
  └→ 해결: AMA 비밀번호 재설정 기능 사용 (forgot-password)
```

> **위험 완화**: AMA 로그인 페이지에 "비밀번호를 잊으셨나요?" 링크가 있으므로, 사용자가 비밀번호 재설정 가능. 임시PW 이메일 제거의 실질적 위험은 낮음.

---

## 7. 보안 고려사항

| 항목 | 위험 | 완화 방안 |
|------|------|----------|
| 마스킹 비밀번호 이메일 | 마스킹(앞1+끝1)으로 힌트만 노출, 전체 비밀번호 미노출 | "확인 후 삭제" 경고 + "기억하세요" 안내 |
| 이메일 평문 표시 | 이메일 주소 전체 노출 | 사용자 확인 목적. 이메일은 비밀정보가 아님 |
| Portal 테이블 직접 UPDATE | SQL Injection 위험 | Parameterized Query (`$1, $2`) 사용 |
| bcrypt 해시 재사용 | 동일 해시를 양쪽에 1회 저장 | 보안상 문제 없음 (동일 비밀번호의 동일 해시) |
| 비밀번호 로그 노출 | error 로그에 평문 PW 포함 가능 | try-catch에서 `error.message`만 로깅 |

---

## 8. 결정 완료 항목

| # | 항목 | 결정 | 사유 |
|---|------|------|------|
| 1 | 임시PW 이메일 | **제거** | InitialSetup에서 직접 설정 |
| 2 | 비밀번호 마스킹 | **앞1+끝1** | 보안 강화, 삭제 경고 포함 |
| 3 | 이메일 표시 | **평문** | 사용자 확인 목적 |
| 4 | OWNER 위치 | **`eur_is_owner`** | 법인별 소유자 구분 |
| 5 | PW 설정 방식 | **직접 DB UPDATE** | 같은 DB, 1회성 저장 |
| 6 | PW 이후 동기화 | **하지 않음** | Portal과 AMA 비밀번호 독립 관리 |
| 7 | 이메일 템플릿 | **`SETUP_COMPLETE`** 영어 고정 | 현행 동일 |

---

## 9. 구현 공수

| 작업 | 범위 | 변경 파일 수 |
|------|------|------------|
| 백엔드 (PW 최초설정 + 이메일 + OWNER) | 중규모 | 5개 |
| 프론트엔드 (경고 문구) | 소규모 | 4개 |
| DB 마이그레이션 | 소규모 | 1개 |
| **총 변경 파일** | | **~10개** |