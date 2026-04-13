import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PortalCustomerEntity } from '../entity/portal-customer.entity';
import { SvcClientEntity } from '../../../shared-entities/client.entity';
import { RegisterRequest } from '../dto/request/register.request';
import { LoginRequest } from '../dto/request/login.request';
import { GoogleOnboardingRequest } from '../dto/request/google-onboarding.request';
import { EmailVerifyStore } from './email-verify.store';
import { PortalMailService } from './portal-mail.service';
import { PORTAL_CONSTANTS } from '@amb/portal-shared';

@Injectable()
export class PortalAuthService {
  private readonly logger = new Logger(PortalAuthService.name);

  constructor(
    @InjectRepository(PortalCustomerEntity)
    private readonly customerRepo: Repository<PortalCustomerEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailVerifyStore: EmailVerifyStore,
    private readonly portalMailService: PortalMailService,
  ) {}

  async sendVerifyCode(email: string) {
    // 이메일 중복 확인
    const existing = await this.customerRepo.findOne({ where: { pctEmail: email } });
    if (existing) {
      throw new ConflictException({ code: 'E1024', message: 'Email already registered' });
    }

    // 발송 한도 확인
    const canSend = this.emailVerifyStore.canSend(email);
    if (!canSend.allowed) {
      throw new BadRequestException({ code: 'E1028', message: 'Too many verification code requests' });
    }

    // 코드 생성 및 저장
    const code = this.emailVerifyStore.generateCode();
    this.emailVerifyStore.saveCode(email, code);

    // 이메일 발송
    const sent = await this.portalMailService.sendVerificationCode(email, code);
    if (!sent) {
      throw new InternalServerErrorException('Failed to send verification email');
    }

    return { success: true, message: 'Verification code sent' };
  }

  async verifyEmailCode(email: string, code: string) {
    const result = this.emailVerifyStore.verify(email, code);

    if (!result.valid) {
      if (result.reason === 'CODE_EXPIRED' || result.reason === 'CODE_NOT_FOUND') {
        throw new BadRequestException({ code: 'E1026', message: 'Verification code expired' });
      }
      if (result.reason === 'TOO_MANY_ATTEMPTS') {
        throw new BadRequestException({ code: 'E1025', message: 'Too many verification attempts' });
      }
      throw new BadRequestException({ code: 'E1025', message: 'Invalid verification code' });
    }

    // 인증 성공 → verify_token (JWT, 10분 TTL) 발급
    const verifyToken = this.jwtService.sign(
      { type: 'email_verify', email: email.toLowerCase() },
      { expiresIn: '10m' },
    );

    return { success: true, verify_token: verifyToken };
  }

  async register(dto: RegisterRequest) {
    // verify_token 검증
    let tokenPayload: { type?: string; email?: string };
    try {
      tokenPayload = this.jwtService.verify(dto.verify_token) as { type?: string; email?: string };
    } catch {
      throw new BadRequestException({ code: 'E1020', message: 'Email verification token expired' });
    }
    if (tokenPayload.type !== 'email_verify' || tokenPayload.email !== dto.email.toLowerCase()) {
      throw new BadRequestException({ code: 'E1020', message: 'Invalid email verification token' });
    }

    const existing = await this.customerRepo.findOne({
      where: { pctEmail: dto.email },
      withDeleted: true,
    });
    if (existing && !existing.pctDeletedAt) {
      throw new ConflictException({ code: 'E1024', message: 'Email already registered' });
    }
    // Soft-deleted record with same email — hard-delete to allow re-registration
    if (existing && existing.pctDeletedAt) {
      if (existing.pctCliId) {
        await this.clientRepo.delete(existing.pctCliId);
      }
      await this.customerRepo.delete(existing.pctId);
    }

    if (!dto.terms_agreed || !dto.privacy_agreed) {
      throw new BadRequestException({ code: 'E1027', message: 'Required agreements not accepted' });
    }

    // 임시 비밀번호 자동 생성 (사용자 입력 없음)
    const tempPassword = uuidv4().replace(/-/g, '').slice(0, 16);
    const hashedPassword = await bcrypt.hash(tempPassword, PORTAL_CONSTANTS.BCRYPT_SALT_ROUNDS);

    // 이메일에서 기본값 추출
    const defaultName = dto.email.split('@')[0];
    const emailDomain = dto.email.split('@')[1] || 'company';
    const defaultCompany = emailDomain.split('.')[0] || 'My Company';

    // Create client record
    const clientCode = await this.generateClientCode();
    const client = new SvcClientEntity();
    client.cliCode = clientCode;
    client.cliType = 'COMPANY';
    client.cliCompanyName = defaultCompany;
    client.cliCountry = 'VN';
    client.cliStatus = 'PROSPECT';
    client.cliPortalSource = 'PORTAL';
    const savedClient = await this.clientRepo.save(client);

    // Create customer record — 이메일 인증 완료 상태로 생성
    const now = new Date();
    const customer = new PortalCustomerEntity();
    customer.pctEmail = dto.email;
    customer.pctPassword = hashedPassword;
    customer.pctName = defaultName;
    customer.pctCompanyName = defaultCompany;
    customer.pctCountry = 'VN';
    customer.pctEmailVerified = true;
    customer.pctCliId = savedClient.cliId;
    customer.pctTermsAgreedAt = dto.terms_agreed ? now : undefined;
    customer.pctPrivacyAgreedAt = dto.privacy_agreed ? now : undefined;
    customer.pctMarketingAgreedAt = dto.marketing_agreed ? now : undefined;
    customer.pctTermsVersion = dto.terms_agreed ? 'v1.0' : undefined;
    customer.pctPrivacyVersion = dto.privacy_agreed ? 'v1.0' : undefined;
    const saved = await this.customerRepo.save(customer);

    let provisionResult: { entityCode?: string; entityName?: string } = {};
    try {
      provisionResult = await this.triggerAutoProvision(saved.pctId);
    } catch (error) {
      await this.customerRepo.delete(saved.pctId);
      await this.clientRepo.delete(savedClient.cliId);
      this.logger.error(
        `Auto provisioning failed for portal customer ${saved.pctId}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to complete account provisioning');
    }

    // 자동 로그인 토큰 요청
    let autoLoginToken: string | null = null;
    try {
      autoLoginToken = await this.requestAutoLoginToken(saved.pctId);
    } catch (error) {
      this.logger.warn(
        `Auto login token request failed for ${saved.pctId}: ${error instanceof Error ? error.message : error}`,
      );
    }

    return {
      customerId: saved.pctId,
      email: saved.pctEmail,
      emailVerified: saved.pctEmailVerified,
      entityCode: provisionResult?.entityCode,
      entityName: provisionResult?.entityName,
      autoLoginToken,
    };
  }

  async verifyEmail(token: string) {
    const customer = await this.customerRepo.findOne({
      where: { pctEmailVerifyToken: token },
    });

    if (!customer) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (customer.pctEmailVerifyExpires && customer.pctEmailVerifyExpires < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    customer.pctEmailVerified = true;
    customer.pctEmailVerifyToken = undefined;
    customer.pctEmailVerifyExpires = undefined;
    await this.customerRepo.save(customer);

    // Update client email_verified
    if (customer.pctCliId) {
      await this.clientRepo.update(customer.pctCliId, { cliEmailVerified: true });
    }

    return { verified: true };
  }

  async login(dto: LoginRequest) {
    const customer = await this.customerRepo.findOne({ where: { pctEmail: dto.email } });

    if (!customer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (customer.pctStatus !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, customer.pctPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login
    customer.pctLastLoginAt = new Date();
    await this.customerRepo.save(customer);

    const tokens = this.generateTokens(customer);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      customer: {
        customerId: customer.pctId,
        email: customer.pctEmail,
        name: customer.pctName,
        companyName: customer.pctCompanyName,
        emailVerified: customer.pctEmailVerified,
        clientId: customer.pctCliId,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const customer = await this.customerRepo.findOne({ where: { pctId: payload.sub } });

      if (!customer || customer.pctStatus !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const tokens = this.generateTokens(customer);
      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async forgotPassword(email: string) {
    const customer = await this.customerRepo.findOne({ where: { pctEmail: email } });
    // Always return success to prevent email enumeration
    if (!customer) return { sent: true };

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + PORTAL_CONSTANTS.PASSWORD_RESET_TOKEN_EXPIRATION);

    customer.pctPasswordResetToken = resetToken;
    customer.pctPasswordResetExpires = resetExpires;
    await this.customerRepo.save(customer);

    // TODO: Send reset email via MailService

    return { sent: true };
  }

  async resetPassword(token: string, newPassword: string) {
    const customer = await this.customerRepo.findOne({
      where: { pctPasswordResetToken: token },
    });

    if (!customer) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (customer.pctPasswordResetExpires && customer.pctPasswordResetExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    customer.pctPassword = await bcrypt.hash(newPassword, PORTAL_CONSTANTS.BCRYPT_SALT_ROUNDS);
    customer.pctPasswordResetToken = undefined;
    customer.pctPasswordResetExpires = undefined;
    await this.customerRepo.save(customer);

    return { reset: true };
  }

  async getProfile(customerId: string) {
    const customer = await this.customerRepo.findOne({ where: { pctId: customerId } });
    if (!customer) {
      throw new UnauthorizedException('Customer not found');
    }

    return {
      customerId: customer.pctId,
      email: customer.pctEmail,
      name: customer.pctName,
      phone: customer.pctPhone,
      companyName: customer.pctCompanyName,
      country: customer.pctCountry,
      emailVerified: customer.pctEmailVerified,
      clientId: customer.pctCliId,
      createdAt: customer.pctCreatedAt,
    };
  }

  getGoogleAuthStartUrl() {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI', '');

    if (!clientId || !redirectUri) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    const state = this.jwtService.sign(
      {
        type: 'portal_google_oauth_state',
        nonce: uuidv4(),
      },
      { expiresIn: '10m' },
    );

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    url.searchParams.set('prompt', 'select_account');

    return { url: url.toString() };
  }

  async handleGoogleCallback(code: string, state: string) {
    if (!code || !state) {
      throw new BadRequestException('Invalid Google callback parameters');
    }

    let statePayload: { type?: string };
    try {
      statePayload = this.jwtService.verify(state) as { type?: string };
    } catch {
      throw new BadRequestException('Invalid Google state token');
    }

    if (statePayload.type !== 'portal_google_oauth_state') {
      throw new BadRequestException('Invalid Google state token type');
    }

    const googleUser = await this.fetchGoogleUserInfo(code);
    if (!googleUser.email || !googleUser.email_verified) {
      throw new BadRequestException('Google account email is not verified');
    }

    const normalizedEmail = googleUser.email.toLowerCase();
    this.logger.log(`Google OAuth callback for email: ${normalizedEmail}`);

    const portalUrl = this.configService.get<string>('PORTAL_URL', 'http://localhost:5190');

    // withDeleted: true로 soft-delete된 레코드도 포함하여 검색
    let customer = await this.customerRepo.findOne({
      where: { pctEmail: normalizedEmail },
      withDeleted: true,
    });

    // 대소문자가 다르게 저장된 기존 레코드도 확인
    if (!customer) {
      customer = await this.customerRepo
        .createQueryBuilder('c')
        .withDeleted()
        .where('LOWER(c.pct_email) = :email', { email: normalizedEmail })
        .getOne() || null;
    }

    // 이메일 중복 체크: 활성 MASTER(온보딩 완료) + Google 등록자만 차단
    if (customer) {
      const isActiveMasterGoogle =
        !customer.pctDeletedAt &&
        customer.pctCliId &&
        customer.pctAuthProvider === 'GOOGLE';

      if (isActiveMasterGoogle) {
        this.logger.warn(`Google OAuth: email already registered as MASTER via Google: ${normalizedEmail}`);
        const errorUrl = new URL('/auth/google/callback', portalUrl);
        errorUrl.searchParams.set('error', 'email_exists');
        return errorUrl.toString();
      }

      // 비활성/미완료/이메일 등록 기존 레코드 → 재사용 (Google 전환)
      this.logger.log(`Google OAuth: reusing existing record for ${normalizedEmail} (deleted=${!!customer.pctDeletedAt}, cliId=${customer.pctCliId || 'none'}, provider=${customer.pctAuthProvider})`);
      if (customer.pctDeletedAt) {
        customer.pctDeletedAt = null as any;
      }
      const randomPassword = uuidv4().replace(/-/g, '').slice(0, 16);
      customer.pctPassword = await bcrypt.hash(randomPassword, PORTAL_CONSTANTS.BCRYPT_SALT_ROUNDS);
      customer.pctName = googleUser.name || normalizedEmail.split('@')[0];
      customer.pctEmailVerified = true;
      customer.pctStatus = 'ACTIVE';
      customer.pctAuthProvider = 'GOOGLE';
      customer = await this.customerRepo.save(customer);
    } else {
      // 신규 고객 생성
      try {
        const randomPassword = uuidv4().replace(/-/g, '').slice(0, 16);
        const hashedPassword = await bcrypt.hash(randomPassword, PORTAL_CONSTANTS.BCRYPT_SALT_ROUNDS);

        customer = new PortalCustomerEntity();
        customer.pctEmail = normalizedEmail;
        customer.pctPassword = hashedPassword;
        customer.pctName = googleUser.name || normalizedEmail.split('@')[0];
        customer.pctEmailVerified = true;
        customer.pctStatus = 'ACTIVE';
        customer.pctAuthProvider = 'GOOGLE';
        customer = await this.customerRepo.save(customer);
      } catch (error: any) {
        if (error.code === '23505') {
          this.logger.warn(`Duplicate key during Google OAuth insert: ${normalizedEmail}`);
          const errorUrl = new URL('/auth/google/callback', portalUrl);
          errorUrl.searchParams.set('error', 'email_exists');
          return errorUrl.toString();
        }
        throw error;
      }
    }

    const onboardingToken = this.jwtService.sign(
      {
        type: 'portal_google_onboarding',
        sub: customer.pctId,
        email: customer.pctEmail,
      },
      { expiresIn: '20m' },
    );

    const redirectUrl = new URL('/auth/google/callback', portalUrl);
    redirectUrl.searchParams.set('onboarding_token', onboardingToken);

    return redirectUrl.toString();
  }

  async completeGoogleOnboarding(dto: GoogleOnboardingRequest) {
    let payload: { type?: string; sub?: string };
    try {
      payload = this.jwtService.verify(dto.token) as { type?: string; sub?: string };
    } catch {
      throw new BadRequestException('Invalid onboarding token');
    }

    if (payload.type !== 'portal_google_onboarding' || !payload.sub) {
      throw new BadRequestException('Invalid onboarding token type');
    }

    const customer = await this.customerRepo.findOne({ where: { pctId: payload.sub } });
    if (!customer) {
      throw new BadRequestException('Portal customer not found');
    }

    const hashedPassword = await bcrypt.hash(dto.password, PORTAL_CONSTANTS.BCRYPT_SALT_ROUNDS);
    const now = new Date();

    customer.pctPassword = hashedPassword;
    customer.pctCompanyName = dto.company_name;
    customer.pctCountry = dto.country;
    customer.pctPhone = dto.phone;
    customer.pctTermsAgreedAt = dto.terms_agreed ? now : customer.pctTermsAgreedAt;
    customer.pctPrivacyAgreedAt = dto.privacy_agreed ? now : customer.pctPrivacyAgreedAt;
    customer.pctMarketingAgreedAt = dto.marketing_agreed ? now : customer.pctMarketingAgreedAt;
    customer.pctTermsVersion = dto.terms_agreed ? 'v1.0' : customer.pctTermsVersion;
    customer.pctPrivacyVersion = dto.privacy_agreed ? 'v1.0' : customer.pctPrivacyVersion;

    if (!customer.pctCliId) {
      const clientCode = await this.generateClientCode();
      const client = new SvcClientEntity();
      client.cliCode = clientCode;
      client.cliType = 'COMPANY';
      client.cliCompanyName = dto.company_name;
      client.cliCountry = dto.country;
      client.cliStatus = 'PROSPECT';
      client.cliPortalSource = 'PORTAL';
      const savedClient = await this.clientRepo.save(client);
      customer.pctCliId = savedClient.cliId;
    }

    const saved = await this.customerRepo.save(customer);

    let provisionResult: { entityCode?: string; entityName?: string } = {};
    try {
      provisionResult = await this.triggerAutoProvision(saved.pctId);
    } catch (error) {
      this.logger.warn(`Auto provisioning failed for google customer ${saved.pctId}: ${error instanceof Error ? error.message : error}`);
    }

    const amaBaseUrl = this.configService.get<string>('AMA_LOGIN_URL', 'https://ama.amoeba.site/login');
    const amaLoginUrl = provisionResult?.entityCode
      ? amaBaseUrl.replace(/\/login$/, `/${provisionResult.entityCode}/login`)
      : amaBaseUrl;

    return {
      completed: true,
      amaLoginUrl,
      customer: {
        customerId: saved.pctId,
        email: saved.pctEmail,
        name: saved.pctName,
        companyName: saved.pctCompanyName,
      },
      entityCode: provisionResult?.entityCode,
      entityName: provisionResult?.entityName,
    };
  }

  private generateTokens(customer: PortalCustomerEntity) {
    const payload = { sub: customer.pctId, email: customer.pctEmail, type: 'portal' };
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: PORTAL_CONSTANTS.JWT_ACCESS_EXPIRATION }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: PORTAL_CONSTANTS.JWT_REFRESH_EXPIRATION }),
    };
  }

  private async generateClientCode(): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `C-${ym}-`;

    const latest = await this.clientRepo
      .createQueryBuilder('cli')
      .withDeleted()
      .where('cli.cliCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('cli.cliCode', 'DESC')
      .getOne();

    let seq = 1;
    if (latest) {
      const parts = latest.cliCode.split('-');
      seq = parseInt(parts[2], 10) + 1;
    }
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  private async triggerAutoProvision(pctId: string): Promise<{ entityCode?: string; entityName?: string }> {
    const amaApiUrl = this.configService.get<string>('AMA_API_URL', 'http://localhost:3019/api/v1');
    const internalToken = this.configService.get<string>('PORTAL_BRIDGE_INTERNAL_TOKEN', '');

    if (!internalToken) {
      throw new InternalServerErrorException('PORTAL_BRIDGE_INTERNAL_TOKEN is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(
        `${amaApiUrl}/portal-bridge/customers/${pctId}/auto-provision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-portal-bridge-token': internalToken,
          },
          body: JSON.stringify({ role: 'MASTER' }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const payload = await response.text();
        throw new Error(`Auto-provision request failed: ${response.status} ${payload}`);
      }

      const result = await response.json();
      return {
        entityCode: result?.data?.entityCode,
        entityName: result?.data?.entityName,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private async requestAutoLoginToken(pctId: string): Promise<string | null> {
    const amaApiUrl = this.configService.get<string>('AMA_API_URL', 'http://localhost:3019/api/v1');
    const internalToken = this.configService.get<string>('PORTAL_BRIDGE_INTERNAL_TOKEN', '');

    if (!internalToken) return null;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `${amaApiUrl}/portal-bridge/auto-login-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-portal-bridge-token': internalToken,
          },
          body: JSON.stringify({ pct_id: pctId }),
          signal: controller.signal,
        },
      );

      if (!response.ok) return null;
      const result = await response.json();
      return result?.data?.token || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async fetchGoogleUserInfo(code: string): Promise<{
    email: string;
    email_verified: boolean;
    name?: string;
    sub?: string;
  }> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID', '');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET', '');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI', '');

    if (!clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Google OAuth is not configured');
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const payload = await tokenResponse.text();
      throw new BadRequestException(`Failed to get Google access token: ${payload}`);
    }

    const tokenJson = (await tokenResponse.json()) as { access_token?: string };
    if (!tokenJson.access_token) {
      throw new BadRequestException('Google access token is missing');
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenJson.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const payload = await userResponse.text();
      throw new BadRequestException(`Failed to fetch Google user info: ${payload}`);
    }

    return userResponse.json() as Promise<{
      email: string;
      email_verified: boolean;
      name?: string;
      sub?: string;
    }>;
  }
}
