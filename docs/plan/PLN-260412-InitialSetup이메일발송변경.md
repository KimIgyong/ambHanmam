# 작업 계획서: Initial Setup 이메일 발송 및 비밀번호 최초 설정

**문서번호**: PLN-260412-InitialSetup이메일발송변경  
**작성일**: 2026-04-12  
**근거 분석서**: REQ-260412-InitialSetup이메일발송변경 (v5)  
**상태**: 작성 완료

---

## 1. 작업 개요

Portal(www.amoeba.site) 가입 후 AMA(ama.amoeba.site) InitialSetup 단계에서:
- 임시 비밀번호 이메일을 제거하고 (R1)
- 사용자가 직접 설정한 비밀번호를 Portal/AMA 양쪽에 동일 저장하며 (R6, 이후 동기화 없음)
- 설정 완료 이메일(비밀번호 마스킹 + 이메일 평문 + 회사코드)을 발송하고 (R3, R5)
- OWNER 플래그를 기록하는 (R4) 작업

---

## 2. 구현 단계 (Phase)

### Phase 1: DB 스키마 변경 (R4)
### Phase 2: 백엔드 — 임시PW 이메일 제거 + OWNER 플래그 (R1, R4)
### Phase 3: 백엔드 — InitialSetup 이메일 발송 + Portal PW 동일 설정 (R3, R5, R6)
### Phase 4: 프론트엔드 — 비밀번호 기억 안내 (R2)
### Phase 5: 빌드 검증 + 통합 테스트

---

## 3. Phase별 상세 계획

### Phase 1: DB 스키마 변경

**목표**: `amb_hr_entity_user_roles` 테이블에 `eur_is_owner` 컬럼 추가

**변경 파일**:

| # | 파일 | 변경 | 내용 |
|---|------|------|------|
| 1 | `apps/api/src/domain/hr/entity/entity-user-role.entity.ts` | 수정 | `eurIsOwner: boolean` 컬럼 추가 |
| 2 | SQL (수동 실행) | 신규 | 스테이징/프로덕션 마이그레이션 SQL |

**엔티티 변경**:
```typescript
// entity-user-role.entity.ts 에 추가
@Column({ name: 'eur_is_owner', type: 'boolean', default: false })
eurIsOwner: boolean;
```

**마이그레이션 SQL**:
```sql
-- 스테이징/프로덕션 수동 실행
ALTER TABLE amb_hr_entity_user_roles 
  ADD COLUMN eur_is_owner BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN amb_hr_entity_user_roles.eur_is_owner 
  IS '포탈 직접 서비스 신청 법인 소유자 여부';
```

**사이드 임팩트**: DEFAULT FALSE → 기존 데이터 영향 없음. 기존 MASTER 사용자는 모두 false.

**검증**: 개발 환경 TypeORM synchronize로 자동 적용 확인

---

### Phase 2: 백엔드 — 임시PW 이메일 제거 + OWNER 플래그

**목표**: 
- `createInternalAccount()`에서 이메일 발송 try-catch 블록 제거
- EntityUserRole 생성 시 `eurIsOwner: true` 설정 (autoProvision 경로)

**변경 파일**:

| # | 파일 | 변경 | 내용 |
|---|------|------|------|
| 1 | `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts` | 수정 | 이메일 발송 블록 제거 + OWNER 플래그 |

**상세 변경 1 — 이메일 발송 제거** (L289-300):

현재:
```typescript
// L289-300: ACCOUNT_CREATED 이메일 발송 try-catch 블록
try {
  const emailVariables = { ... };
  const { subject, html } = await this.emailTemplateService.resolve('ACCOUNT_CREATED', emailVariables, null);
  await this.mailService.sendRawEmail({ to: [customer.pctEmail], subject, html });
} catch (error) {
  this.logger.warn(`Failed to send account creation email: ${error.message}`);
}
```

변경: try-catch 블록 전체를 **주석 처리** (완전 삭제하지 않음. 추후 초대 이메일 등 재활용 가능)
```typescript
// [R1] 임시 비밀번호 이메일 제거 — InitialSetup에서 사용자가 직접 설정
// ACCOUNT_CREATED 템플릿은 유지 (초대 등 다른 경로에서 사용 가능)
```

**상세 변경 2 — OWNER 플래그** (EntityUserRole 생성 부분, L237-249):

현재:
```typescript
const entityUserRole = this.entityUserRoleRepository.create({
  entId: entity.entId,
  usrId: user.usrId,
  eurRole: dto.role, // 'MASTER'
  eurStatus: 'ACTIVE',
});
```

변경: `eurIsOwner` 추가
```typescript
const entityUserRole = this.entityUserRoleRepository.create({
  entId: entity.entId,
  usrId: user.usrId,
  eurRole: dto.role,
  eurStatus: 'ACTIVE',
  eurIsOwner: true, // [R4] 포탈 직접 가입자 = 법인 소유자
});
```

> **주의**: `autoProvisionPortalCustomer()` → `createInternalAccount(role='MASTER')` 경로에서만 OWNER 설정. 향후 초대(invite) 경로에서 MASTER 추가 시에는 eurIsOwner: false.

**사이드 임팩트**:
- 임시PW 이메일이 사라지므로 autoLoginToken(5분) 만료 시 재로그인 불가 → AMA forgot-password로 보완
- `ACCOUNT_CREATED` 템플릿 자체는 유지 (DB에 존재할 수 있음)

**검증**: 
- `npm run -w @amb/api build` 성공 확인
- createInternalAccount() 호출 시 이메일 미발송 확인

---

### Phase 3: 백엔드 — InitialSetup 이메일 발송 + Portal PW 동일 설정

**목표**:
- `initialSetup()` 완료 후 SETUP_COMPLETE 이메일 발송 (비밀번호 마스킹, 이메일 평문)
- 동시에 Portal `pct_password`도 동일 해시로 저장 (1회성)

**변경 파일**:

| # | 파일 | 변경 | 내용 |
|---|------|------|------|
| 1 | `apps/api/src/domain/auth/auth.module.ts` | 수정 | `SettingsModule` import + `PortalUserMappingEntity` 추가 |
| 2 | `apps/api/src/domain/auth/service/auth.service.ts` | 수정 | 의존성 주입 + initialSetup() 로직 추가 |
| 3 | `apps/api/src/domain/settings/service/email-template.service.ts` | 수정 | `SETUP_COMPLETE` 기본 템플릿 + `maskPasswordForDisplay()` |

#### 3-1. auth.module.ts 변경

```typescript
// 추가 import
import { SettingsModule } from '../../settings/settings.module';
import { PortalUserMappingEntity } from '../../portal-bridge/entity/portal-user-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ..., // 기존 엔티티들
      PortalUserMappingEntity,  // ← 추가
    ]),
    InvitationModule,
    MailModule,
    WebmailModule,
    SettingsModule,  // ← 추가 (EmailTemplateService)
    PassportModule,
    JwtModule.registerAsync({ ... }),
  ],
  ...
})
```

**순환 참조 확인**: `SettingsModule`은 `AuthModule`을 import하지 않으므로 순환 없음.

#### 3-2. auth.service.ts 변경

**(a) Constructor 의존성 추가**:
```typescript
import { DataSource } from 'typeorm';
import { EmailTemplateService } from '../../settings/service/email-template.service';
import { PortalUserMappingEntity } from '../../portal-bridge/entity/portal-user-mapping.entity';

constructor(
  ..., // 기존
  @InjectRepository(PortalUserMappingEntity)
  private readonly portalUserMappingRepository: Repository<PortalUserMappingEntity>,
  private readonly emailTemplateService: EmailTemplateService,
  private readonly dataSource: DataSource,
) {}
```

**(b) maskPasswordForDisplay() 유틸 메서드 추가**:
```typescript
/** 비밀번호 앞 1자 + 마지막 1자만 표시, 나머지 * */
private maskPasswordForDisplay(password: string): string {
  if (password.length <= 2) return password;
  return password[0] + '*'.repeat(password.length - 2) + password[password.length - 1];
}
// "MyP@ss1234" → "M********4"
```

**(c) initialSetup() — AMA 비밀번호 저장 직후 추가 로직**:

기존 코드 (L911-914):
```typescript
const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
user.usrPassword = hashedPassword;
user.usrMustChangePw = false;
user.usrName = dto.name;
await this.userRepository.save(user);
```

직후 추가:
```typescript
// ──── [R6] Portal 비밀번호 최초 동일 설정 (이후 동기화 없음) ────
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

// ──── [R5] Setup 완료 이메일 발송 (비밀번호 마스킹 [R3]) ────
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

#### 3-3. email-template.service.ts 변경

`DEFAULT_TEMPLATES` 객체에 `SETUP_COMPLETE` 추가:

```typescript
SETUP_COMPLETE: {
  subject: '[AMB Management] Your account setup is complete',
  body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
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
</div>`,
},
```

**사이드 임팩트**:
- `AuthModule` 의존성 증가 (`SettingsModule`, `PortalUserMappingEntity`, `DataSource`) — 순환 참조 없음 확인 필요
- Portal `pct_password` 직접 UPDATE — 같은 DB이므로 기술적 문제 없음
- `maskPasswordForDisplay()`는 AuthService private 메서드로 캡슐화

**검증**:
- `npm run -w @amb/api build` 성공
- InitialSetup 호출 시 이메일 수신 확인
- Portal 비밀번호 업데이트 확인 (DB 조회)

---

### Phase 4: 프론트엔드 — 비밀번호 기억 안내

**목표**: InitialSetupPage 비밀번호 입력 필드 하단에 경고 문구 추가

**변경 파일**:

| # | 파일 | 변경 | 내용 |
|---|------|------|------|
| 1 | `apps/web/src/domain/auth/pages/InitialSetupPage.tsx` | 수정 | AlertTriangle 아이콘 + 경고 텍스트 |
| 2 | `apps/web/src/locales/en/auth.json` | 수정 | `passwordRememberWarning` 키 추가 |
| 3 | `apps/web/src/locales/ko/auth.json` | 수정 | 〃 |
| 4 | `apps/web/src/locales/vi/auth.json` | 수정 | 〃 |

#### 4-1. InitialSetupPage.tsx

비밀번호 입력 필드 직후 (Confirm Password 필드 전):
```tsx
import { AlertTriangle } from 'lucide-react';

{/* Password 입력 필드 */}
<input type={showPassword ? 'text' : 'password'} ... />

{/* [R2] 비밀번호 기억 안내 */}
<p className="mt-1 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
  <AlertTriangle className="w-4 h-4 shrink-0" />
  {t('initialSetup.passwordRememberWarning')}
</p>

{/* Confirm Password 입력 필드 */}
<input type={showConfirm ? 'text' : 'password'} ... />
```

#### 4-2. i18n 키 추가

**en/auth.json**:
```json
"passwordRememberWarning": "Please remember your password. It will not be displayed again."
```

**ko/auth.json**:
```json
"passwordRememberWarning": "비밀번호를 반드시 기억하세요. 다시 표시되지 않습니다."
```

**vi/auth.json**:
```json
"passwordRememberWarning": "Vui lòng ghi nhớ mật khẩu. Mật khẩu sẽ không được hiển thị lại."
```

**검증**: `npm run -w @amb/web build` 성공 + 브라우저에서 경고 표시 확인

---

### Phase 5: 빌드 검증 + 통합 테스트

**검증 항목**:

| # | 항목 | 명령 / 방법 | 기대 결과 |
|---|------|------------|----------|
| 1 | API 빌드 | `npm run -w @amb/api build` | 에러 없음 |
| 2 | Web 빌드 | `npm run -w @amb/web build` | 에러 없음 |
| 3 | 전체 빌드 | `npm run build` | 에러 없음 |
| 4 | 로컬 개발 실행 | `npm run dev` | api + web 정상 실행 |
| 5 | 가입 → InitialSetup | 브라우저 테스트 | 경고 문구 표시, 비밀번호 설정 성공 |
| 6 | Setup 완료 이메일 | 이메일 수신 확인 | 이메일 평문, 비밀번호 마스킹(앞1+끝1), 회사코드 정상 |
| 7 | Portal PW 확인 | DB 조회 | `pct_password` = `usr_password` 동일 해시 |
| 8 | AMA 로그인 | 설정한 PW로 로그인 | 정상 로그인 |
| 9 | Portal 로그인 | 동일 PW로 Portal 로그인 | 정상 로그인 |
| 10 | OWNER 플래그 | DB 조회 | `eur_is_owner = true` (신규 가입자) |
| 11 | 기존 계정 영향 | DB 조회 | `eur_is_owner = false` (기존 사용자 변경 없음) |
| 12 | 임시PW 이메일 | 가입 직후 이메일 확인 | ACCOUNT_CREATED 이메일 미수신 |

---

## 4. 변경 파일 총괄

| # | 파일 경로 | 유형 | Phase | 요구사항 |
|---|----------|------|-------|---------|
| 1 | `apps/api/src/domain/hr/entity/entity-user-role.entity.ts` | 수정 | P1 | R4 |
| 2 | `apps/api/src/domain/portal-bridge/service/portal-bridge.service.ts` | 수정 | P2 | R1, R4 |
| 3 | `apps/api/src/domain/auth/auth.module.ts` | 수정 | P3 | R5, R6 |
| 4 | `apps/api/src/domain/auth/service/auth.service.ts` | 수정 | P3 | R3, R5, R6 |
| 5 | `apps/api/src/domain/settings/service/email-template.service.ts` | 수정 | P3 | R3, R5 |
| 6 | `apps/web/src/domain/auth/pages/InitialSetupPage.tsx` | 수정 | P4 | R2 |
| 7 | `apps/web/src/locales/en/auth.json` | 수정 | P4 | R2 |
| 8 | `apps/web/src/locales/ko/auth.json` | 수정 | P4 | R2 |
| 9 | `apps/web/src/locales/vi/auth.json` | 수정 | P4 | R2 |
| 10 | DD SQL (수동) | 신규 | P1 | R4 |
| | **총 변경 파일** | | | **10개** |

---

## 5. 사이드 임팩트 분석

| # | 영향 | 심각도 | 대응 |
|---|------|--------|------|
| S1 | autoLoginToken 만료 시 임시PW 이메일 없음 → 재로그인 불가 | **높음** | AMA forgot-password로 보완. 필요 시 TTL 연장(5→30분) 검토 |
| S2 | Portal 자체 로그인 활성화 | 낮음 | 의도된 동작 |
| S3 | Portal/AMA PW 이후 불일치 | 없음 | 의도된 독립 관리 정책 |
| S4 | AMA-API → Portal 테이블 직접 UPDATE | 낮음 | 같은 DB, 1회성, Parameterized Query |
| S5 | AuthModule 의존성 증가 | 낮음 | 순환 참조 없음 확인 |
| S6 | DB 스키마 변경 (eur_is_owner) | 낮음 | DEFAULT FALSE, 기존 데이터 무영향 |

---

## 6. 배포 계획

### 6.1 스테이징 배포

```bash
# 1. DB 마이그레이션 (스테이징 서버)
ssh amb-staging "docker exec -i amb-postgres psql -U amb_user -d db_amb" <<'SQL'
ALTER TABLE amb_hr_entity_user_roles 
  ADD COLUMN IF NOT EXISTS eur_is_owner BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN amb_hr_entity_user_roles.eur_is_owner 
  IS '포탈 직접 서비스 신청 법인 소유자 여부';
SQL

# 2. 코드 배포
ssh amb-staging "cd ~/ambManagement && git pull origin main && bash docker/staging/deploy-staging.sh"
```

### 6.2 프로덕션 배포

```bash
# 1. main → production PR + merge
# 2. DB 마이그레이션 (프로덕션 서버)
ssh amb-production "docker exec -i amb-postgres psql -U amb_user -d db_amb" <<'SQL'
ALTER TABLE amb_hr_entity_user_roles 
  ADD COLUMN IF NOT EXISTS eur_is_owner BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN amb_hr_entity_user_roles.eur_is_owner 
  IS '포탈 직접 서비스 신청 법인 소유자 여부';
SQL

# 3. 코드 배포
ssh amb-production "cd ~/ambManagement && git pull origin production && bash docker/production/deploy-production.sh"
```

> **순서 중요**: DB 마이그레이션 → 코드 배포 (컬럼 없으면 INSERT 실패)

---

## 7. 롤백 계획

| 단계 | 롤백 방법 |
|------|----------|
| 코드 | `git revert` + 재배포 |
| DB | `ALTER TABLE amb_hr_entity_user_roles DROP COLUMN eur_is_owner;` |
| Portal PW | 이미 설정된 PW는 유효하므로 롤백 불필요. 단, 신규 이메일 발송만 중단됨 |

---

## 8. 구현 순서 요약

```
Phase 1: entity-user-role.entity.ts — eur_is_owner 컬럼 추가
    ↓
Phase 2: portal-bridge.service.ts — 이메일 제거 + OWNER 플래그
    ↓
Phase 3: auth.module.ts + auth.service.ts + email-template.service.ts
         — 의존성 추가 + PW 동일 설정 + SETUP_COMPLETE 이메일
    ↓
Phase 4: InitialSetupPage.tsx + auth.json (3언어)
         — 비밀번호 기억 경고
    ↓
Phase 5: 빌드 검증 + 로컬 통합 테스트
    ↓
배포: DB 마이그레이션 → 스테이징 → 검증 → 프로덕션
```
