import { Injectable, Logger, UnauthorizedException, BadRequestException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../auth/entity/user.entity';
import { InvitationEntity } from '../../invitation/entity/invitation.entity';
import { PartnerOrganizationEntity } from '../../partner/entity/partner-organization.entity';
import { createDefaultProfileImage } from '../../auth/util/profile-avatar.util';
import { BCRYPT_SALT_ROUNDS } from '@amb/common';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { AuthService } from '../../auth/service/auth.service';
import type { JwtPayload } from '../../auth/interface/jwt-payload.interface';

@Injectable()
export class PartnerAuthService {
  private readonly logger = new Logger(PartnerAuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(PartnerOrganizationEntity)
    private readonly partnerRepository: Repository<PartnerOrganizationEntity>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 파트너 로그인 (Partner Code + 이메일 + 비밀번호)
   */
  async login(partnerCode: string, email: string, password: string) {
    // 1. Partner Code로 파트너사 조회
    const partner = await this.partnerRepository.findOne({
      where: { ptnCode: partnerCode, ptnStatus: 'ACTIVE' },
    });
    if (!partner) {
      throw new BusinessException(
        ERROR_CODE.INVALID_CREDENTIALS.code,
        ERROR_CODE.INVALID_CREDENTIALS.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 2. PARTNER_LEVEL 사용자 조회
    const user = await this.userRepository.findOne({
      where: {
        usrEmail: email,
        usrLevelCode: 'PARTNER_LEVEL',
        usrPartnerId: partner.ptnId,
      },
    });

    if (!user) {
      throw new BusinessException(
        ERROR_CODE.EMAIL_NOT_FOUND.code,
        ERROR_CODE.EMAIL_NOT_FOUND.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 3. 비밀번호 검증
    if (!(await bcrypt.compare(password, user.usrPassword))) {
      throw new BusinessException(
        ERROR_CODE.PASSWORD_INCORRECT.code,
        ERROR_CODE.PASSWORD_INCORRECT.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (['WITHDRAWN', 'SUSPENDED', 'INACTIVE'].includes(user.usrStatus)) {
      throw new BusinessException(
        ERROR_CODE.INVALID_CREDENTIALS.code,
        'Account is not active.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.userRepository.update(user.usrId, { usrLastLoginAt: new Date() });
    return this.generateTokens(user, partner);
  }

  /**
   * 파트너 비밀번호 재설정 이메일 발송
   */
  async forgotPassword(partnerCode: string, email: string): Promise<void> {
    const partner = await this.partnerRepository.findOne({
      where: { ptnCode: partnerCode, ptnStatus: 'ACTIVE' },
    });
    if (!partner) return; // Security: don't reveal

    const user = await this.userRepository.findOne({
      where: {
        usrEmail: email,
        usrLevelCode: 'PARTNER_LEVEL',
        usrPartnerId: partner.ptnId,
      },
    });
    if (!user) return; // Security: don't reveal

    await this.authService.sendPasswordResetForUser(user);
  }

  /**
   * 초대 토큰 검증 (기존 InvitationEntity 기반)
   */
  async verifyInvitation(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invToken: token, invStatus: 'PENDING' },
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (invitation.invLevelCode !== 'PARTNER_LEVEL') {
      throw new BadRequestException('Invalid invitation type');
    }

    if (new Date() > invitation.invExpiresAt) {
      await this.invitationRepository.update(invitation.invId, { invStatus: 'EXPIRED' });
      throw new BadRequestException('Invitation has expired');
    }

    let partnerName: string | null = null;
    let partnerCode: string | null = null;
    if (invitation.invPartnerId) {
      const partner = await this.partnerRepository.findOne({
        where: { ptnId: invitation.invPartnerId },
      });
      partnerName = partner?.ptnCompanyName || null;
      partnerCode = partner?.ptnCode || null;
    }

    return {
      email: invitation.invEmail,
      role: invitation.invRole,
      partnerName,
      partnerCode,
    };
  }

  /**
   * 초대 기반 가입
   */
  async register(token: string, name: string, password: string, jobTitle?: string, phone?: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invToken: token, invStatus: 'PENDING' },
    });

    if (!invitation || invitation.invLevelCode !== 'PARTNER_LEVEL') {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (new Date() > invitation.invExpiresAt) {
      await this.invitationRepository.update(invitation.invId, { invStatus: 'EXPIRED' });
      throw new BadRequestException('Invitation has expired');
    }

    // 이미 같은 이메일+파트너 ID로 계정이 있는지 확인
    const existingUser = await this.userRepository.findOne({
      where: {
        usrEmail: invitation.invEmail,
        usrLevelCode: 'PARTNER_LEVEL',
        usrPartnerId: invitation.invPartnerId as any,
      },
    });
    if (existingUser) {
      throw new BadRequestException('Account already exists for this email');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = this.userRepository.create({
      usrEmail: invitation.invEmail,
      usrPassword: hashedPassword,
      usrName: name,
      usrUnit: 'Partner',
      usrRole: invitation.invRole || 'PARTNER_MEMBER',
      usrLevelCode: 'PARTNER_LEVEL',
      usrStatus: 'ACTIVE',
      usrJoinMethod: 'PARTNER_INVITE',
      usrPartnerId: invitation.invPartnerId || null,
      usrJobTitle: jobTitle || null,
      usrPhone: phone || null,
      usrMustChangePw: false,
      usrProfileImage: createDefaultProfileImage(name, invitation.invEmail),
    });

    const savedUser = await this.userRepository.save(user);

    // 초대 상태 업데이트
    await this.invitationRepository.update(invitation.invId, {
      invStatus: 'ACCEPTED',
      invAcceptedAt: new Date(),
    });

    const partner = invitation.invPartnerId
      ? await this.partnerRepository.findOne({ where: { ptnId: invitation.invPartnerId } })
      : null;

    return this.generateTokens(savedUser, partner);
  }

  /**
   * 현재 사용자 프로필 조회
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: userId },
      relations: ['partner'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user.usrId,
      email: user.usrEmail,
      name: user.usrName,
      role: user.usrRole,
      level: user.usrLevelCode,
      jobTitle: user.usrJobTitle,
      phone: user.usrPhone,
      timezone: user.usrTimezone,
      locale: user.usrLocale,
      partnerId: user.usrPartnerId,
      partnerName: user.partner?.ptnCompanyName || null,
      partnerCode: user.partner?.ptnCode || null,
    };
  }

  /**
   * 프로필 수정
   */
  async updateProfile(userId: string, data: { name?: string; job_title?: string; phone?: string; timezone?: string; locale?: string }) {
    const updateData: Partial<UserEntity> = {};
    if (data.name) updateData.usrName = data.name;
    if (data.job_title !== undefined) updateData.usrJobTitle = data.job_title;
    if (data.phone !== undefined) updateData.usrPhone = data.phone;
    if (data.timezone) updateData.usrTimezone = data.timezone;
    if (data.locale) updateData.usrLocale = data.locale;

    await this.userRepository.update(userId, updateData);
    return this.getProfile(userId);
  }

  /**
   * 비밀번호 변경
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { usrId: userId } });
    if (!user) throw new UnauthorizedException('User not found');

    if (!(await bcrypt.compare(currentPassword, user.usrPassword))) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.userRepository.update(userId, { usrPassword: hashedPassword });
    return { success: true };
  }

  /**
   * JWT 토큰 생성
   */
  private generateTokens(user: UserEntity, partner: PartnerOrganizationEntity | null) {
    const payload: JwtPayload = {
      sub: user.usrId,
      email: user.usrEmail,
      level: 'PARTNER_LEVEL',
      role: user.usrRole,
      status: user.usrStatus || 'ACTIVE',
      companyId: null,
      isHq: false,
      mustChangePw: false,
      partnerId: user.usrPartnerId || undefined,
      timezone: user.usrTimezone || 'Asia/Ho_Chi_Minh',
      locale: user.usrLocale || 'vi',
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '4h' }),
      refreshToken: this.jwtService.sign(
        { ...payload, tokenVersion: user.usrTokenVersion || 0 },
        { expiresIn: '7d' },
      ),
      user: {
        id: user.usrId,
        email: user.usrEmail,
        name: user.usrName,
        role: user.usrRole,
        level: user.usrLevelCode,
        partnerId: user.usrPartnerId,
        partnerName: partner?.ptnCompanyName || null,
        partnerCode: partner?.ptnCode || null,
      },
    };
  }
}
