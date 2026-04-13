import { Injectable, Logger, UnauthorizedException, BadRequestException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from '../../auth/entity/user.entity';
import { ClientInvitationEntity } from '../entity/client-invitation.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { BCRYPT_SALT_ROUNDS } from '@amb/common';
import { AuthMapper } from '../../auth/mapper/auth.mapper';
import { AuthService } from '../../auth/service/auth.service';
import type { JwtPayload } from '../../auth/interface/jwt-payload.interface';
import { createDefaultProfileImage } from '../../auth/util/profile-avatar.util';

@Injectable()
export class ClientAuthService {
  private readonly logger = new Logger(ClientAuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ClientInvitationEntity)
    private readonly invitationRepository: Repository<ClientInvitationEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepository: Repository<SvcClientEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepository: Repository<HrEntityEntity>,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 고객 로그인 (Entity Code + 이메일 + 비밀번호)
   */
  async login(entityCode: string, email: string, password: string) {
    // 1. Entity Code로 Entity 조회
    const entity = await this.entityRepository.findOne({
      where: { entCode: entityCode, entStatus: 'ACTIVE' },
    });
    if (!entity) {
      throw new BusinessException(
        ERROR_CODE.INVALID_CREDENTIALS.code,
        ERROR_CODE.INVALID_CREDENTIALS.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 2. CLIENT_LEVEL 사용자 조회
    const user = await this.userRepository.findOne({
      where: { usrEmail: email, usrLevelCode: 'CLIENT_LEVEL' },
      relations: ['client', 'client.hrEntity'],
    });

    // 3. 사용자 존재 + Client의 Entity 일치 검증
    if (!user || !user.client || user.client.cliEntId !== entity.entId) {
      throw new BusinessException(
        ERROR_CODE.EMAIL_NOT_FOUND.code,
        ERROR_CODE.EMAIL_NOT_FOUND.message,
        HttpStatus.UNAUTHORIZED,
      );
    }

    // 4. 비밀번호 검증
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
    return this.generateTokens(user);
  }

  /**
   * 고객 비밀번호 재설정 이메일 발송
   */
  async forgotPassword(entityCode: string, email: string): Promise<void> {
    await this.authService.forgotPassword(email, entityCode);
  }

  /**
   * 초대 토큰 검증
   */
  async verifyInvitation(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { civToken: token, civStatus: 'PENDING' },
      relations: ['client', 'client.hrEntity'],
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (new Date() > invitation.civTokenExpires) {
      await this.invitationRepository.update(invitation.civId, { civStatus: 'EXPIRED' });
      throw new BadRequestException('Invitation has expired');
    }

    return {
      email: invitation.civEmail,
      name: invitation.civName,
      clientName: invitation.client?.cliCompanyName,
      role: invitation.civRole,
      entityCode: invitation.client?.hrEntity?.entCode || null,
      entityName: invitation.client?.hrEntity?.entName || null,
    };
  }

  /**
   * 초대 기반 가입
   */
  async register(token: string, name: string, password: string, jobTitle?: string, phone?: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { civToken: token, civStatus: 'PENDING' },
      relations: ['client'],
    });

    if (!invitation) {
      throw new BadRequestException('Invalid or expired invitation');
    }

    if (new Date() > invitation.civTokenExpires) {
      await this.invitationRepository.update(invitation.civId, { civStatus: 'EXPIRED' });
      throw new BadRequestException('Invitation has expired');
    }

    // 이미 같은 이메일로 CLIENT_LEVEL 계정이 있는지 확인
    const existingUser = await this.userRepository.findOne({
      where: { usrEmail: invitation.civEmail, usrLevelCode: 'CLIENT_LEVEL' },
    });
    if (existingUser) {
      throw new BadRequestException('Account already exists for this email');
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = this.userRepository.create({
      usrEmail: invitation.civEmail,
      usrPassword: hashedPassword,
      usrName: name,
      usrUnit: 'CLIENT',
      usrRole: invitation.civRole || 'CLIENT_MEMBER',
      usrLevelCode: 'CLIENT_LEVEL',
      usrStatus: 'ACTIVE',
      usrJoinMethod: 'CLIENT_INVITE',
      usrCliId: invitation.cliId,
      usrJobTitle: jobTitle || null,
      usrPhone: phone || null,
      usrMustChangePw: false,
      usrProfileImage: createDefaultProfileImage(name, invitation.civEmail),
    });

    const savedUser = await this.userRepository.save(user);

    // 초대 상태 업데이트
    await this.invitationRepository.update(invitation.civId, {
      civStatus: 'ACCEPTED',
      civAcceptedAt: new Date(),
    });

    // 저장된 사용자에 client relation 로드
    const fullUser = await this.userRepository.findOne({
      where: { usrId: savedUser.usrId },
      relations: ['client', 'client.hrEntity'],
    });

    return this.generateTokens(fullUser!);
  }

  /**
   * 현재 사용자 프로필 조회
   */
  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: userId },
      relations: ['client'],
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
      clientName: user.client?.cliCompanyName,
      clientId: user.usrCliId,
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
   * 고객 초대 발송
   */
  async createInvitation(email: string, cliId: string, invitedBy: string, name?: string, role?: string) {
    // 고객사 존재 확인
    const client = await this.clientRepository.findOne({ where: { cliId } });
    if (!client) {
      throw new BadRequestException('Client not found');
    }

    // 이미 존재하는 pending 초대 확인
    const existing = await this.invitationRepository.findOne({
      where: { civEmail: email, cliId, civStatus: 'PENDING' },
    });
    if (existing) {
      throw new BadRequestException('Invitation already sent to this email');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 72); // 72시간 만료

    const invitation = this.invitationRepository.create({
      civEmail: email,
      civName: name || null,
      cliId,
      civRole: role || 'CLIENT_MEMBER',
      civToken: token,
      civTokenExpires: expires,
      civInvitedBy: invitedBy,
    });

    const saved = await this.invitationRepository.save(invitation);

    // TODO: 이메일 발송 (Phase 5에서 구현)

    return {
      id: saved.civId,
      email: saved.civEmail,
      token: saved.civToken,
      expiresAt: saved.civTokenExpires,
      status: saved.civStatus,
    };
  }

  /**
   * 초대 목록 조회
   */
  async getInvitations(cliId?: string) {
    const where: any = {};
    if (cliId) where.cliId = cliId;

    return this.invitationRepository.find({
      where,
      relations: ['client', 'invitedBy'],
      order: { civCreatedAt: 'DESC' },
    });
  }

  /**
   * JWT 토큰 생성
   */
  private generateTokens(user: UserEntity) {
    const payload: JwtPayload = {
      sub: user.usrId,
      email: user.usrEmail,
      level: 'CLIENT_LEVEL',
      role: user.usrRole,
      status: user.usrStatus || 'ACTIVE',
      companyId: null,
      isHq: false,
      mustChangePw: false,
      cliId: user.usrCliId || undefined,
      ...(user.client?.cliEntId && { entityId: user.client.cliEntId }),
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
        userId: user.usrId,
        email: user.usrEmail,
        name: user.usrName,
        role: user.usrRole,
        level: user.usrLevelCode,
        status: user.usrStatus || 'ACTIVE',
        cliId: user.usrCliId,
        clientName: user.client?.cliCompanyName,
        jobTitle: user.usrJobTitle,
        phone: user.usrPhone,
        entityId: user.client?.cliEntId || null,
        entityCode: user.client?.hrEntity?.entCode || null,
        entityName: user.client?.hrEntity?.entName || null,
      },
    };
  }
}
