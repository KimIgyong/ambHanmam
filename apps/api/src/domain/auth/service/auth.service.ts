import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from '../entity/user.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { PasswordResetEntity } from '../entity/password-reset.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { Response } from 'express';
import { LoginRequest } from '../dto/request/login.request';
import { RegisterRequest } from '../dto/request/register.request';
import { InitialSetupRequest } from '../dto/request/initial-setup.request';
import { AuthTokenResponse } from '../dto/response/auth.response';
import { AuthMapper } from '../mapper/auth.mapper';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { InvitationService } from '../../invitation/service/invitation.service';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BCRYPT_SALT_ROUNDS } from '@amb/common';
import { LoginHistoryEntity } from '../../entity-settings/entity/login-history.entity';
import { PortalUserMappingEntity } from '../../portal-bridge/entity/portal-user-mapping.entity';
import { EmailTemplateService } from '../../settings/service/email-template.service';
import { createDefaultProfileImage } from '../util/profile-avatar.util';
import type { JwtPayload } from '../interface/jwt-payload.interface';

/** 로그인 응답 - 백엔드 전용 */
type LoginResult = { step: 'complete'; tokens: AuthTokenResponse };

const MAX_LOGIN_ATTEMPTS = 15;
const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes

/** 법인 검색 결과 */
export interface EntitySearchResult {
  entityId: string;
  code: string;
  name: string;
  nameEn: string | null;
  country: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userGroupRepository: Repository<UserCellEntity>,
    @InjectRepository(PasswordResetEntity)
    private readonly passwordResetRepository: Repository<PasswordResetEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepository: Repository<HrEntityEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepository: Repository<EntityUserRoleEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepository: Repository<UserUnitRoleEntity>,
    @InjectRepository(LoginHistoryEntity)
    private readonly loginHistoryRepository: Repository<LoginHistoryEntity>,
    @InjectRepository(PortalUserMappingEntity)
    private readonly portalUserMappingRepository: Repository<PortalUserMappingEntity>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly invitationService: InvitationService,
    private readonly mailService: MailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly dataSource: DataSource,
  ) {}

  // ─────────────────────────────────────────
  // 법인 검색 (Public)
  // ─────────────────────────────────────────

  async searchEntities(query: string): Promise<EntitySearchResult[]> {
    if (!query || query.length < 2) return [];

    const pattern = `%${query}%`;
    const entities = await this.entityRepository.find({
      where: [
        { entName: ILike(pattern), entStatus: 'ACTIVE' },
        { entNameEn: ILike(pattern), entStatus: 'ACTIVE' },
        { entCode: ILike(pattern), entStatus: 'ACTIVE' },
      ],
      order: { entCode: 'ASC' },
      take: 10,
    });

    return entities.map((e) => ({
      entityId: e.entId,
      code: e.entCode,
      name: e.entName,
      nameEn: e.entNameEn || null,
      country: e.entCountry,
    }));
  }

  // ─────────────────────────────────────────
  // Find Organizations by Email (Public)
  // ─────────────────────────────────────────

  async findOrganizationsByEmail(email: string): Promise<void> {
    const users = await this.userRepository.find({
      where: { usrEmail: email },
    });

    if (users.length === 0) {
      // Security: don't reveal whether email exists
      return;
    }

    // Find all entity-user-role mappings for these users
    const userIds = users.map((u) => u.usrId);
    const roles = await this.entityUserRoleRepository
      .createQueryBuilder('eur')
      .innerJoinAndSelect('eur.hrEntity', 'ent')
      .where('eur.usrId IN (:...userIds)', { userIds })
      .andWhere('ent.entStatus = :status', { status: 'ACTIVE' })
      .getMany();

    if (roles.length === 0) {
      return;
    }

    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:5189',
    );
    const tableRows = roles
      .map((r) => {
        const entity = r.hrEntity;
        const loginLink = `${frontendUrl}/login?entityCode=${encodeURIComponent(entity.entCode)}&entityName=${encodeURIComponent(entity.entName)}`;
        return `
          <tr>
            <td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; color:#111827;">${entity.entName}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; color:#374151; font-family:monospace;">${entity.entCode}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; color:#374151;">${entity.entCountry}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #E5E7EB; color:#374151;">${r.eurRole}</td>
            <td style="padding:10px 12px; border-bottom:1px solid #E5E7EB;">
              <a href="${loginLink}" style="display:inline-block; background:#4F46E5; color:white; padding:6px 16px; border-radius:6px; text-decoration:none; font-size:13px; font-weight:600;">Login</a>
            </td>
          </tr>`;
      })
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #4F46E5; font-size:22px; margin:0 0 16px 0;">AMB Management</h2>
        <p style="font-size:15px; color:#111827;">Here are the organizations associated with <strong>${email}</strong>:</p>
        <table style="width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #E5E7EB; border-radius:8px; overflow:hidden;">
          <thead>
            <tr style="background:#F9FAFB;">
              <th style="padding:10px 12px; text-align:left; font-size:13px; color:#6B7280; border-bottom:2px solid #E5E7EB;">Organization</th>
              <th style="padding:10px 12px; text-align:left; font-size:13px; color:#6B7280; border-bottom:2px solid #E5E7EB;">Code</th>
              <th style="padding:10px 12px; text-align:left; font-size:13px; color:#6B7280; border-bottom:2px solid #E5E7EB;">Country</th>
              <th style="padding:10px 12px; text-align:left; font-size:13px; color:#6B7280; border-bottom:2px solid #E5E7EB;">Role</th>
              <th style="padding:10px 12px; text-align:left; font-size:13px; color:#6B7280; border-bottom:2px solid #E5E7EB;"></th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        <p style="color:#6B7280; font-size:14px;">Click the "Login" button next to the organization you want to access.</p>
        <hr style="border:none; border-top:1px solid #E5E7EB; margin:24px 0;" />
        <p style="color:#9CA3AF; font-size:12px;">This email was sent by AMB Management.<br/>If you did not request this, you can safely ignore it.</p>
      </div>
    `;

    await this.mailService.sendRawEmail({
      to: [email],
      subject: 'AMB Management - Your Organizations',
      html,
    });
  }

  // ─────────────────────────────────────────
  // 로그인: entity_code + email + password
  // ─────────────────────────────────────────

  async login(request: LoginRequest, ip?: string, userAgent?: string): Promise<LoginResult> {
    if (request.entity_code) {
      // ── 법인코드 지정 로그인 (USER_LEVEL) ──
      const entity = await this.entityRepository.findOne({
        where: { entCode: request.entity_code, entStatus: 'ACTIVE' },
      });

      if (!entity) {
        throw new BusinessException(
          ERROR_CODE.INVALID_CREDENTIALS.code,
          ERROR_CODE.INVALID_CREDENTIALS.message,
          HttpStatus.UNAUTHORIZED,
        );
      }

      // 해당 법인 소속 사용자 조회
      let user = await this.userRepository.findOne({
        where: { usrEmail: request.email, usrCompanyId: entity.entId },
        relations: ['company'],
      });

      // ADMIN_LEVEL 사용자는 usrCompanyId가 NULL이므로 fallback 조회
      if (!user) {
        const adminUser = await this.userRepository.findOne({
          where: { usrEmail: request.email, usrLevelCode: 'ADMIN_LEVEL' },
          relations: ['company'],
        });
        if (adminUser) user = adminUser;
      }

      if (!user) {
        throw new BusinessException(
          ERROR_CODE.EMAIL_NOT_FOUND.code,
          ERROR_CODE.EMAIL_NOT_FOUND.message,
          HttpStatus.UNAUTHORIZED,
        );
      }

      this.checkAccountLocked(user);

      if (!(await bcrypt.compare(request.password, user.usrPassword))) {
        await this.recordFailedLogin(user);
        throw new BusinessException(
          ERROR_CODE.PASSWORD_INCORRECT.code,
          ERROR_CODE.PASSWORD_INCORRECT.message,
          HttpStatus.UNAUTHORIZED,
        );
      }

      if (['WITHDRAWN', 'SUSPENDED', 'INACTIVE'].includes(user.usrStatus)) {
        throw new BusinessException(
          ERROR_CODE.INVALID_CREDENTIALS.code,
          ERROR_CODE.INVALID_CREDENTIALS.message,
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.resetFailedLogin(user);
      await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
      this.recordLoginHistory(user, ip, userAgent);
      return { step: 'complete', tokens: await this.generateTokens(user) };
    }

    // ── 법인코드 미지정 로그인 (ADMIN_LEVEL 호환) ──
    const users = await this.userRepository.find({
      where: { usrEmail: request.email },
      relations: ['company'],
    });

    if (users.length === 0) {
      throw new BusinessException(
        ERROR_CODE.EMAIL_NOT_FOUND.code,
        ERROR_CODE.EMAIL_NOT_FOUND.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const matchedUsers: UserEntity[] = [];
    for (const user of users) {
      if (await bcrypt.compare(request.password, user.usrPassword)) {
        this.checkAccountLocked(user);
        if (!['WITHDRAWN', 'SUSPENDED', 'INACTIVE'].includes(user.usrStatus)) {
          matchedUsers.push(user);
        }
      }
    }

    if (matchedUsers.length === 0) {
      // Record failed login for all matching email users
      for (const user of users) {
        await this.recordFailedLogin(user);
      }
      throw new BusinessException(
        ERROR_CODE.PASSWORD_INCORRECT.code,
        ERROR_CODE.PASSWORD_INCORRECT.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // ADMIN_LEVEL → 바로 JWT 발급
    const adminUser = matchedUsers.find((u) => u.usrLevelCode === 'ADMIN_LEVEL');
    if (adminUser) {
      await this.resetFailedLogin(adminUser);
      await this.userRepository.update(adminUser.usrId, { usrLastLoginAt: new Date() });
      this.recordLoginHistory(adminUser, ip, userAgent);
      return { step: 'complete', tokens: await this.generateTokens(adminUser) };
    }

    // USER_LEVEL 단일 법인 → 직접 JWT 발급
    if (matchedUsers.length === 1) {
      const user = matchedUsers[0];
      await this.resetFailedLogin(user);
      await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
      this.recordLoginHistory(user, ip, userAgent);
      return { step: 'complete', tokens: await this.generateTokens(user) };
    }

    // USER_LEVEL 다중 법인 + 법인코드 미지정 → 에러
    throw new BusinessException(
      'E1010',
      'Entity code is required for multi-entity users. Please select your organization.',
      HttpStatus.BAD_REQUEST,
    );
  }

  // ─────────────────────────────────────────
  // (Legacy) 법인 선택 → JWT 발급 — 하위 호환
  // ─────────────────────────────────────────

  async selectEntity(
    selectToken: string,
    userId: string,
    ip?: string,
    userAgent?: string,
  ): Promise<AuthTokenResponse> {
    let payload: any;
    try {
      payload = this.jwtService.verify(selectToken);
    } catch {
      throw new BusinessException(
        ERROR_CODE.INVALID_TOKEN.code,
        'Select token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (payload.sub !== 'entity-select') {
      throw new BusinessException(
        ERROR_CODE.INVALID_TOKEN.code,
        'Invalid token type',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!payload.userIds?.includes(userId)) {
      throw new BusinessException(
        ERROR_CODE.INVALID_TOKEN.code,
        'User ID not authorized for this token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userRepository.findOne({
      where: { usrId: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
    this.recordLoginHistory(user, ip, userAgent);

    return this.generateTokens(user);
  }

  // ─────────────────────────────────────────
  // 회원가입 (email+companyId 기준 중복 체크)
  // ─────────────────────────────────────────

  async register(request: RegisterRequest): Promise<AuthTokenResponse> {
    const hashedPassword = await bcrypt.hash(request.password, BCRYPT_SALT_ROUNDS);

    let role = 'MEMBER';
    let unit = request.unit || request.department || 'GENERAL';
    let groupId: string | null = null;
    let levelCode = 'USER_LEVEL';
    let joinMethod = 'REGISTER';
    let companyId: string | null = null;
    let autoApprove = false;

    // If invitation token provided, use invited role/unit/group
    if (request.invitation_token) {
      const validation = await this.invitationService.validateToken(
        request.invitation_token,
      );
      role = validation.role;
      unit = validation.unit || unit;
      groupId = validation.groupId || null;
      levelCode = (validation as any).levelCode || 'USER_LEVEL';
      companyId = (validation as any).companyId || null;
      autoApprove = (validation as any).autoApprove || false;
      joinMethod = 'INVITE';
    }

    // (email + companyId) 기준 중복 체크 (법인별 독립)
    const existingUser = await this.userRepository.findOne({
      where: {
        usrEmail: request.email,
        usrCompanyId: companyId || IsNull(),
      },
      withDeleted: true,
    });

    if (existingUser && !existingUser.usrDeletedAt) {
      throw new BusinessException(
        ERROR_CODE.USER_ALREADY_EXISTS.code,
        ERROR_CODE.USER_ALREADY_EXISTS.message,
        HttpStatus.CONFLICT,
      );
    }

    const userStatus = autoApprove ? 'ACTIVE' : 'PENDING';

    let savedUser: UserEntity;

    if (existingUser && existingUser.usrDeletedAt) {
      // Restore soft-deleted user and update fields
      existingUser.usrDeletedAt = null as any;
      existingUser.usrPassword = hashedPassword;
      existingUser.usrName = request.name;
      existingUser.usrUnit = unit;
      existingUser.usrRole = role;
      existingUser.usrLevelCode = levelCode;
      existingUser.usrStatus = userStatus;
      existingUser.usrJoinMethod = joinMethod;
      existingUser.usrCompanyId = companyId;
      if (!existingUser.usrProfileImage) {
        existingUser.usrProfileImage = createDefaultProfileImage(request.name, request.email);
      }
      savedUser = await this.userRepository.save(existingUser);
    } else {
      const user = this.userRepository.create({
        usrEmail: request.email,
        usrPassword: hashedPassword,
        usrName: request.name,
        usrUnit: unit,
        usrRole: role,
        usrLevelCode: levelCode,
        usrStatus: userStatus,
        usrJoinMethod: joinMethod,
        usrCompanyId: companyId,
        usrProfileImage: createDefaultProfileImage(request.name, request.email),
      });
      savedUser = await this.userRepository.save(user);
    }

    // Assign to group if invitation had a group
    if (groupId) {
      const userGroup = this.userGroupRepository.create({
        usrId: savedUser.usrId,
        celId: groupId,
      });
      await this.userGroupRepository.save(userGroup);
    }

    // Assign entity role if invitation had a company
    if (companyId) {
      const entityRole = this.entityUserRoleRepository.create({
        usrId: savedUser.usrId,
        entId: companyId,
        eurRole: role,
        eurStatus: userStatus,
      });
      await this.entityUserRoleRepository.save(entityRole);

      // Assign to Holding unit by default
      const holdingUnit = await this.unitRepository.findOne({
        where: { entId: companyId, untName: 'Holding' },
      });
      if (holdingUnit) {
        const unitRole = this.userUnitRoleRepository.create({
          usrId: savedUser.usrId,
          untId: holdingUnit.untId,
          uurRole: 'MEMBER',
          uurIsPrimary: true,
          uurStartedAt: new Date(),
        });
        await this.userUnitRoleRepository.save(unitRole);
      }
    }

    // Mark invitation as accepted
    if (request.invitation_token) {
      await this.invitationService.markAccepted(request.invitation_token);
    }

    return this.generateTokens(savedUser);
  }

  async refresh(refreshToken: string): Promise<AuthTokenResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { usrId: payload.sub },
        relations: ['company'],
      });

      if (!user) {
        throw new BusinessException(
          ERROR_CODE.USER_NOT_FOUND.code,
          ERROR_CODE.USER_NOT_FOUND.message,
          HttpStatus.NOT_FOUND,
        );
      }

      // Token rotation: verify token version matches
      if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.usrTokenVersion) {
        throw new BusinessException(
          ERROR_CODE.INVALID_TOKEN.code,
          'Refresh token has been revoked',
          HttpStatus.UNAUTHORIZED,
        );
      }

      // Increment token version to invalidate old refresh tokens
      user.usrTokenVersion = (user.usrTokenVersion || 0) + 1;
      await this.userRepository.save(user);

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof BusinessException) throw err;
      throw new BusinessException(
        ERROR_CODE.INVALID_TOKEN.code,
        ERROR_CODE.INVALID_TOKEN.message,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // ─────────────────────────────────────────
  // Forgot Password (법인코드 기반)
  // ─────────────────────────────────────────

  async forgotPassword(email: string, entityCode?: string): Promise<void> {
    if (entityCode) {
      // 법인코드 지정: 해당 법인 계정에만 리셋 이메일 발송
      const entity = await this.entityRepository.findOne({
        where: { entCode: entityCode, entStatus: 'ACTIVE' },
      });
      if (!entity) return; // Security: don't reveal
      const user = await this.userRepository.findOne({
        where: { usrEmail: email, usrCompanyId: entity.entId },
      });
      if (!user) return;
      await this.sendPasswordResetForUser(user);
    } else {
      // 법인코드 미지정: ADMIN_LEVEL 전용
      const user = await this.userRepository.findOne({
        where: { usrEmail: email, usrLevelCode: 'ADMIN_LEVEL' },
      });
      if (!user) return;
      await this.sendPasswordResetForUser(user);
    }
  }

  async sendPasswordResetForUser(user: UserEntity): Promise<void> {
    // Invalidate existing unused tokens for this user
    await this.passwordResetRepository.update(
      { usrId: user.usrId, prsUsedAt: IsNull() },
      { prsUsedAt: new Date() },
    );

    // Create new token with 1-hour expiry
    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    const resetEntity = this.passwordResetRepository.create({
      usrId: user.usrId,
      prsToken: token,
      prsExpiresAt: expiresAt,
    });
    await this.passwordResetRepository.save(resetEntity);

    // Send reset email
    await this.mailService.sendPasswordResetEmail(
      user.usrEmail,
      user.usrName,
      token,
    );
  }

  async verifyResetToken(token: string): Promise<{ email: string; entityName: string | null }> {
    const resetEntity = await this.passwordResetRepository.findOne({
      where: { prsToken: token },
      relations: ['user', 'user.company'],
    });

    if (!resetEntity || resetEntity.prsUsedAt) {
      throw new BusinessException(
        ERROR_CODE.RESET_TOKEN_INVALID.code,
        ERROR_CODE.RESET_TOKEN_INVALID.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (new Date() > resetEntity.prsExpiresAt) {
      throw new BusinessException(
        ERROR_CODE.RESET_TOKEN_EXPIRED.code,
        ERROR_CODE.RESET_TOKEN_EXPIRED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    const maskedEmail = this.maskEmail(resetEntity.user.usrEmail);
    return {
      email: maskedEmail,
      entityName: resetEntity.user.company?.entName || null,
    };
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const masked = local.length <= 2
      ? local[0] + '***'
      : local.slice(0, 2) + '***' + local.slice(-1);
    return `${masked}@${domain}`;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const resetEntity = await this.passwordResetRepository.findOne({
      where: { prsToken: token },
    });

    if (!resetEntity) {
      throw new BusinessException(
        ERROR_CODE.RESET_TOKEN_INVALID.code,
        ERROR_CODE.RESET_TOKEN_INVALID.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (resetEntity.prsUsedAt) {
      throw new BusinessException(
        ERROR_CODE.RESET_TOKEN_INVALID.code,
        ERROR_CODE.RESET_TOKEN_INVALID.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (new Date() > resetEntity.prsExpiresAt) {
      throw new BusinessException(
        ERROR_CODE.RESET_TOKEN_EXPIRED.code,
        ERROR_CODE.RESET_TOKEN_EXPIRED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.update(
      { usrId: resetEntity.usrId },
      { usrPassword: hashedPassword },
    );

    // Mark token as used
    resetEntity.prsUsedAt = new Date();
    await this.passwordResetRepository.save(resetEntity);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { usrId: userId },
    });

    if (!user) {
      throw new BusinessException(
        ERROR_CODE.USER_NOT_FOUND.code,
        ERROR_CODE.USER_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.usrPassword);
    if (!isPasswordValid) {
      throw new BusinessException(
        ERROR_CODE.CURRENT_PASSWORD_WRONG.code,
        ERROR_CODE.CURRENT_PASSWORD_WRONG.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.update(
      { usrId: userId },
      { usrPassword: hashedPassword, usrMustChangePw: false },
    );
  }

  // ─────────────────────────────────────────
  // Token 생성
  // ─────────────────────────────────────────

  /** 비밀번호 앞 1자 + 마지막 1자만 표시, 나머지 * */
  private maskPasswordForDisplay(password: string): string {
    if (password.length <= 2) return password;
    return password[0] + '*'.repeat(password.length - 2) + password[password.length - 1];
  }

  private async generateTokens(user: UserEntity): Promise<AuthTokenResponse> {
    // 소속 조직이 HQ인지 확인
    let isHq = false;
    if (user.company) {
      isHq = user.company.entIsHq ?? false;
    } else if (user.usrCompanyId) {
      const company = await this.entityRepository.findOne({
        where: { entId: user.usrCompanyId },
      });
      isHq = company?.entIsHq ?? false;
    }

    // USER_LEVEL인 경우 소속 엔티티(법인) ID를 JWT에 포함
    let entityId: string | undefined;
    if ((user.usrLevelCode || 'USER_LEVEL') === 'USER_LEVEL' && user.usrCompanyId) {
      entityId = user.usrCompanyId;
    }

    // CLIENT_LEVEL인 경우 소속 고객사 ID를 JWT에 포함
    let cliId: string | undefined;
    if (user.usrLevelCode === 'CLIENT_LEVEL' && user.usrCliId) {
      cliId = user.usrCliId;
    }

    // PARTNER_LEVEL인 경우 소속 파트너사 ID를 JWT에 포함
    let partnerId: string | undefined;
    if (user.usrLevelCode === 'PARTNER_LEVEL' && user.usrPartnerId) {
      partnerId = user.usrPartnerId;
    }

    const payload: JwtPayload = {
      sub: user.usrId,
      email: user.usrEmail,
      level: user.usrLevelCode || 'USER_LEVEL',
      role: user.usrRole,
      status: user.usrStatus || 'ACTIVE',
      companyId: user.usrCompanyId || null,
      isHq,
      mustChangePw: user.usrMustChangePw ?? false,
      timezone: user.usrTimezone || 'Asia/Ho_Chi_Minh',
      locale: user.usrLocale || 'vi',
      ...(entityId && { entityId }),
      ...(cliId && { cliId }),
      ...(partnerId && { partnerId }),
    };

    const tokenVersion = user.usrTokenVersion || 0;
    return {
      accessToken: this.jwtService.sign({ ...payload, tokenVersion }, { expiresIn: '4h' }),
      refreshToken: this.jwtService.sign(
        { ...payload, tokenVersion },
        { expiresIn: '7d' },
      ),
      user: AuthMapper.toUserResponse(user),
    };
  }

  // ─────────────────────────────────────────
  // 로그인 이력
  // ─────────────────────────────────────────

  private checkAccountLocked(user: UserEntity): void {
    if (user.usrLockedUntil && user.usrLockedUntil > new Date()) {
      throw new BusinessException(
        ERROR_CODE.ACCOUNT_LOCKED.code,
        ERROR_CODE.ACCOUNT_LOCKED.message,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async recordFailedLogin(user: UserEntity): Promise<void> {
    const count = (user.usrFailedLoginCount || 0) + 1;
    const update: Partial<UserEntity> = { usrFailedLoginCount: count } as any;
    if (count >= MAX_LOGIN_ATTEMPTS) {
      (update as any).usrLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    }
    await this.userRepository.update(user.usrId, update);
  }

  private async resetFailedLogin(user: UserEntity): Promise<void> {
    if (user.usrFailedLoginCount > 0 || user.usrLockedUntil) {
      await this.userRepository.update(user.usrId, {
        usrFailedLoginCount: 0,
        usrLockedUntil: null,
      } as any);
    }
  }

  private recordLoginHistory(user: UserEntity, ip?: string, userAgent?: string): void {
    this.loginHistoryRepository.save({
      usrId: user.usrId,
      entId: user.usrCompanyId || undefined,
      lghIp: ip || undefined,
      lghUserAgent: userAgent ? userAgent.substring(0, 500) : undefined,
    }).catch((err) => this.logger.warn(`Login history save failed: ${err.message}`));
  }

  // ─────────────────────────────────────────
  // 쿠키 관리
  // ─────────────────────────────────────────

  setTokenCookies(res: Response, tokens: AuthTokenResponse): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('access_token', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
      path: '/',
    });
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });
  }

  clearTokenCookies(res: Response): void {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });
  }

  // ─────────────────────────────────────────
  // 자동 로그인 (Portal 가입 후)
  // ─────────────────────────────────────────

  async autoLogin(token: string, ip?: string, userAgent?: string): Promise<LoginResult> {
    let payload: { type?: string; sub?: string; email?: string; entityCode?: string };
    try {
      payload = this.jwtService.verify(token) as typeof payload;
    } catch {
      throw new BusinessException(
        'E1030',
        'Invalid or expired auto-login token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (payload.type !== 'portal_auto_login' || !payload.sub) {
      throw new BusinessException(
        'E1030',
        'Invalid auto-login token type',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userRepository.findOne({
      where: { usrId: payload.sub },
      relations: ['company'],
    });

    if (!user || ['WITHDRAWN', 'SUSPENDED', 'INACTIVE'].includes(user.usrStatus)) {
      throw new BusinessException(
        'E1030',
        'User not found or inactive',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.resetFailedLogin(user);
    await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
    this.recordLoginHistory(user, ip, userAgent);
    return { step: 'complete', tokens: await this.generateTokens(user) };
  }

  // ─────────────────────────────────────────
  // 초기설정 (비밀번호 + 이름 + 회사/국가)
  // ─────────────────────────────────────────

  async initialSetup(userId: string, dto: InitialSetupRequest): Promise<LoginResult> {
    const user = await this.userRepository.findOne({
      where: { usrId: userId },
      relations: ['company'],
    });
    if (!user) {
      throw new BusinessException(
        ERROR_CODE.INVALID_CREDENTIALS.code,
        ERROR_CODE.INVALID_CREDENTIALS.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 비밀번호 변경
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);
    user.usrPassword = hashedPassword;
    user.usrMustChangePw = false;
    user.usrName = dto.name;
    await this.userRepository.save(user);

    // [R6] Portal 비밀번호 최초 동일 설정 (이후 동기화 없음)
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

    // 회사명/국가 → Entity 업데이트
    if (user.usrCompanyId && (dto.company_name || dto.country_code)) {
      const entity = await this.entityRepository.findOne({
        where: { entId: user.usrCompanyId },
      });
      if (entity) {
        if (dto.company_name) {
          entity.entName = dto.company_name;
          entity.entNameEn = dto.company_name;
        }
        if (dto.country_code) {
          entity.entCountry = dto.country_code;
        }
        await this.entityRepository.save(entity);
      }
    }

    // [R5] Setup 완료 이메일 발송 (비밀번호 마스킹 [R3])
    try {
      const emailEntity = user.usrCompanyId
        ? await this.entityRepository.findOne({ where: { entId: user.usrCompanyId } })
        : null;
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
      const variables: Record<string, string> = {
        userName: dto.name,
        userEmail: user.usrEmail,
        maskedPassword: this.maskPasswordForDisplay(dto.password),
        entityCode,
        entityName: emailEntity?.entName ?? dto.company_name ?? '',
        loginUrl: `${frontendUrl}/${entityCode}/login`,
      };
      const { subject, html } = await this.emailTemplateService.resolve(
        'SETUP_COMPLETE', variables, emailEntity?.entId ?? null,
      );
      await this.mailService.sendRawEmail({ to: [user.usrEmail], subject, html });
    } catch (error) {
      this.logger.warn(`Failed to send setup complete email: ${error.message}`);
    }

    // 새 토큰 발급 (mustChangePw: false 반영)
    // company 관계를 다시 로드
    const refreshedUser = await this.userRepository.findOne({
      where: { usrId: userId },
      relations: ['company'],
    });
    return { step: 'complete', tokens: await this.generateTokens(refreshedUser!) };
  }

  // ─────────────────────────────────────────
  // App Store 리다이렉트 토큰 (Phase B)
  // ─────────────────────────────────────────

  /**
   * App Store용 단기 JWT 발급 (5분 만료).
   * 타겟 사이트에서 동일 JWT_SECRET으로 검증하여 사용자/법인 식별.
   */
  async generateStoreRedirectToken(user: UserPayload): Promise<{ token: string }> {
    const entity = user.entityId
      ? await this.entityRepository.findOne({ where: { entId: user.entityId } })
      : null;

    const payload = {
      sub: user.userId,
      email: user.email,
      entityId: user.entityId || null,
      entityCode: entity?.entCode || null,
      entityName: entity?.entName || null,
      purpose: 'store_redirect',
    };

    const token = this.jwtService.sign(payload, { expiresIn: '5m' });
    return { token };
  }
}
