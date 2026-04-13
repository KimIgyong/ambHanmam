import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { InvitationEntity } from '../entity/invitation.entity';
import { CreateInvitationRequest } from '../dto/request/create-invitation.request';
import { AcceptInvitationRequest } from '../dto/request/accept-invitation.request';
import { InvitationMapper } from '../mapper/invitation.mapper';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { EmailTemplateService } from '../../settings/service/email-template.service';
import { UserEntity } from '../../auth/entity/user.entity';
import { CellEntity } from '../../members/entity/cell.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { createDefaultProfileImage } from '../../auth/util/profile-avatar.util';
import { DriveSettingsEntity } from '../../settings/entity/drive-settings.entity';

@Injectable()
export class InvitationService {
  private readonly logger = new Logger(InvitationService.name);

  constructor(
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(CellEntity)
    private readonly groupRepository: Repository<CellEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepo: Repository<UserUnitRoleEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly hrEntityRepository: Repository<HrEntityEntity>,
    private readonly mailService: MailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly configService: ConfigService,
  ) {}

  async create(dto: CreateInvitationRequest, invitedByUserId: string) {
    // Check for existing pending invitation for the same company
    const existing = await this.invitationRepository.findOne({
      where: {
        invEmail: dto.email,
        invStatus: 'PENDING',
        ...(dto.company_id ? { invCompanyId: dto.company_id } : {}),
        ...(dto.partner_id ? { invPartnerId: dto.partner_id } : {}),
      },
    });
    if (existing) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_ALREADY_SENT.code,
        ERROR_CODE.INVITATION_ALREADY_SENT.message,
        HttpStatus.CONFLICT,
      );
    }

    // Check if user already registered in the SAME company (email+entityId 기준)
    if (dto.company_id) {
      const existingUser = await this.userRepository.findOne({
        where: { usrEmail: dto.email, usrCompanyId: dto.company_id },
      });
      if (existingUser) {
        throw new BusinessException(
          ERROR_CODE.USER_ALREADY_EXISTS.code,
          ERROR_CODE.USER_ALREADY_EXISTS.message,
          HttpStatus.CONFLICT,
        );
      }

      // CLIENT_LEVEL 사용자 중 같은 Entity에 속한 이메일 중복 체크
      const existingClientUser = await this.userRepository
        .createQueryBuilder('u')
        .innerJoin('amb_svc_clients', 'c', 'c.cli_id = u.usr_cli_id')
        .where('u.usr_email = :email', { email: dto.email })
        .andWhere('u.usr_level_code = :level', { level: 'CLIENT_LEVEL' })
        .andWhere('c.cli_ent_id = :entityId', { entityId: dto.company_id })
        .getOne();
      if (existingClientUser) {
        throw new BusinessException(
          ERROR_CODE.USER_ALREADY_EXISTS.code,
          ERROR_CODE.USER_ALREADY_EXISTS.message,
          HttpStatus.CONFLICT,
        );
      }
    }

    // PARTNER_LEVEL: 같은 파트너사에 이미 등록된 사용자 체크
    if (dto.partner_id && dto.level_code === 'PARTNER_LEVEL') {
      const existingPartnerUser = await this.userRepository.findOne({
        where: { usrEmail: dto.email, usrPartnerId: dto.partner_id },
      });
      if (existingPartnerUser) {
        throw new BusinessException(
          ERROR_CODE.USER_ALREADY_EXISTS.code,
          ERROR_CODE.USER_ALREADY_EXISTS.message,
          HttpStatus.CONFLICT,
        );
      }
    }

    const inviter = await this.userRepository.findOne({
      where: { usrId: invitedByUserId },
    });

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.invitationRepository.create({
      invEmail: dto.email,
      invToken: token,
      invRole: dto.role,
      invUnit: dto.department,
      invCellId: dto.group_id || null,
      invLevelCode: dto.level_code || 'USER_LEVEL',
      invCompanyId: dto.company_id || null,
      invPartnerId: dto.partner_id || null,
      invAutoApprove: dto.auto_approve ?? false,
      invStatus: 'PENDING',
      invInvitedBy: invitedByUserId,
      invExpiresAt: expiresAt,
    });

    const saved = await this.invitationRepository.save(invitation);

    // 법인 정보 조회 (이메일에 법인명/브랜드 반영)
    let companyInfo: { name: string; color?: string; logoUrl?: string } | undefined;
    if (dto.company_id) {
      const company = await this.hrEntityRepository.findOne({
        where: { entId: dto.company_id },
      });
      if (company) {
        companyInfo = {
          name: company.entEmailDisplayName || company.entNameEn || company.entName,
          color: company.entEmailBrandColor || undefined,
          logoUrl: company.entEmailLogoUrl || undefined,
        };
      }
    }

    // Send email (non-blocking: invitation is saved regardless of email delivery)
    // 법인별 DB 템플릿 있으면 사용, 없으면 기존 branded 방식 사용
    const dbTemplate = dto.company_id
      ? await this.emailTemplateService.getEntityTemplate('INVITATION', dto.company_id)
      : null;
    let sent: boolean;
    if (dbTemplate) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
      const variables: Record<string, string> = {
        inviterName: inviter?.usrName || 'Admin',
        companyName: companyInfo?.name || 'AMB Management',
        role: dto.role,
        department: dto.department,
        inviteLink,
      };
      const { subject, html } = await this.emailTemplateService.resolve('INVITATION', variables, dto.company_id);
      sent = await this.mailService.sendRawEmail({ to: [dto.email], subject, html });
    } else {
      sent = await this.mailService.sendInvitationEmail(
        dto.email,
        inviter?.usrName || 'Admin',
        dto.role,
        dto.department,
        token,
        companyInfo,
      );
    }

    if (sent) {
      saved.invLastSentAt = new Date();
      saved.invSendCount = 1;
      await this.invitationRepository.save(saved);
    } else {
      this.logger.warn(
        `Invitation created but email delivery failed for ${dto.email}. Token: ${token}`,
      );
    }

    let groupName: string | null = null;
    if (saved.invCellId) {
      const group = await this.groupRepository.findOne({
        where: { celId: saved.invCellId },
      });
      groupName = group?.celName || null;
    }

    return InvitationMapper.toResponse(
      saved,
      inviter?.usrName || 'Unknown',
      groupName,
    );
  }

  async findAll() {
    const invitations = await this.invitationRepository.find({
      order: { invCreatedAt: 'DESC' },
    });

    const userIds = [...new Set(invitations.map((i) => i.invInvitedBy))];
    const users = await this.userRepository.findByIds(userIds);
    const userMap = new Map(users.map((u) => [u.usrId, u.usrName]));

    // Look up accepted users by email to get their userId for profile link
    const acceptedEmails = invitations
      .filter((i) => i.invStatus === 'ACCEPTED')
      .map((i) => i.invEmail);
    const acceptedUserMap = new Map<string, string>();
    if (acceptedEmails.length > 0) {
      const acceptedUsers = await this.userRepository
        .createQueryBuilder('u')
        .select(['u.usrId', 'u.usrEmail'])
        .where('u.usrEmail IN (:...emails)', { emails: acceptedEmails })
        .getMany();
      for (const u of acceptedUsers) {
        acceptedUserMap.set(u.usrEmail, u.usrId);
      }
    }

    const groupIds = [
      ...new Set(invitations.filter((i) => i.invCellId).map((i) => i.invCellId!)),
    ];
    let groupMap = new Map<string, string>();
    if (groupIds.length > 0) {
      const groups = await this.groupRepository.findByIds(groupIds);
      groupMap = new Map(groups.map((g) => [g.celId, g.celName]));
    }

    return invitations.map((inv) =>
      InvitationMapper.toResponse(
        inv,
        userMap.get(inv.invInvitedBy) || 'Unknown',
        inv.invCellId ? groupMap.get(inv.invCellId) || null : null,
        inv.invStatus === 'ACCEPTED' ? acceptedUserMap.get(inv.invEmail) || null : null,
      ),
    );
  }

  async validateToken(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invToken: token },
    });

    if (!invitation) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_NOT_FOUND.code,
        ERROR_CODE.INVITATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.invStatus === 'CANCELLED') {
      throw new BusinessException(
        ERROR_CODE.INVITATION_CANCELLED.code,
        ERROR_CODE.INVITATION_CANCELLED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (invitation.invStatus === 'ACCEPTED') {
      throw new BusinessException(
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.code,
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (new Date() > invitation.invExpiresAt) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_EXPIRED.code,
        ERROR_CODE.INVITATION_EXPIRED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    let entityName: string | null = null;
    if (invitation.invCompanyId) {
      const company = await this.hrEntityRepository.findOne({
        where: { entId: invitation.invCompanyId },
      });
      entityName = company
        ? (company.entEmailDisplayName || company.entNameEn || company.entName)
        : null;
    }

    // 파트너사 정보 조회 (PARTNER_LEVEL 초대 시)
    let partnerName: string | null = null;
    let partnerId: string | null = null;
    if (invitation.invPartnerId) {
      partnerId = invitation.invPartnerId;
      const partner = await this.invitationRepository.manager
        .getRepository('PartnerOrganizationEntity')
        .findOne({ where: { ptnId: invitation.invPartnerId } });
      partnerName = (partner as any)?.ptnCompanyName || null;
    }

    return {
      valid: true,
      email: invitation.invEmail,
      role: invitation.invRole,
      unit: invitation.invUnit,
      groupId: invitation.invCellId,
      levelCode: invitation.invLevelCode,
      companyId: invitation.invCompanyId,
      partnerId,
      partnerName,
      autoApprove: invitation.invAutoApprove,
      entityName,
    };
  }

  async markAccepted(token: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invToken: token },
    });
    if (invitation && invitation.invStatus === 'PENDING') {
      invitation.invStatus = 'ACCEPTED';
      invitation.invAcceptedAt = new Date();
      await this.invitationRepository.save(invitation);
    }
    return invitation;
  }

  /**
   * Accept invitation: validate token, create user, mark invitation as accepted.
   * If autoApprove is set, user status = ACTIVE; otherwise PENDING (needs admin approval).
   */
  async accept(token: string, dto: AcceptInvitationRequest) {
    // Validate the token first
    const invitation = await this.invitationRepository.findOne({
      where: { invToken: token },
    });

    if (!invitation) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_NOT_FOUND.code,
        ERROR_CODE.INVITATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }

    if (invitation.invStatus !== 'PENDING') {
      throw new BusinessException(
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.code,
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (new Date() > invitation.invExpiresAt) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_EXPIRED.code,
        ERROR_CODE.INVITATION_EXPIRED.message,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if user already registered (email + company 또는 email + partner 기준)
    const isPartnerLevel = invitation.invLevelCode === 'PARTNER_LEVEL';
    const existingUserWhere: any = { usrEmail: invitation.invEmail };
    if (isPartnerLevel && invitation.invPartnerId) {
      existingUserWhere.usrPartnerId = invitation.invPartnerId;
    } else if (invitation.invCompanyId) {
      existingUserWhere.usrCompanyId = invitation.invCompanyId;
    }
    const existingUser = await this.userRepository.findOne({
      where: existingUserWhere,
    });
    if (existingUser) {
      throw new BusinessException(
        ERROR_CODE.USER_ALREADY_EXISTS.code,
        ERROR_CODE.USER_ALREADY_EXISTS.message,
        HttpStatus.CONFLICT,
      );
    }

    // Create user from invitation
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const userStatus = invitation.invAutoApprove ? 'ACTIVE' : 'PENDING';

    const user = this.userRepository.create({
      usrEmail: invitation.invEmail,
      usrPassword: hashedPassword,
      usrName: dto.name,
      usrUnit: dto.department || invitation.invUnit,
      usrRole: invitation.invRole,
      usrLevelCode: invitation.invLevelCode || 'USER_LEVEL',
      usrStatus: userStatus,
      usrMustChangePw: false,
      usrJoinMethod: isPartnerLevel ? 'PARTNER_INVITE' : 'INVITE',
      usrCompanyId: invitation.invCompanyId || null,
      usrPartnerId: invitation.invPartnerId || null,
      usrInvitedBy: invitation.invInvitedBy,
      usrProfileImage: createDefaultProfileImage(dto.name, invitation.invEmail),
    });

    await this.userRepository.save(user);

    // PARTNER_LEVEL: entity role/unit 할당 불필요 (파트너 포탈에서 별도 관리)
    // USER_LEVEL: entity role + Holding unit 할당
    if (!isPartnerLevel && invitation.invCompanyId) {
      const entityRole = this.entityUserRoleRepo.create({
        usrId: user.usrId,
        entId: invitation.invCompanyId,
        eurRole: invitation.invRole || 'MEMBER',
        eurStatus: userStatus,
      });
      await this.entityUserRoleRepo.save(entityRole);

      // Assign to Holding unit by default
      const holdingUnit = await this.unitRepository.findOne({
        where: { entId: invitation.invCompanyId, untName: 'Holding' },
      });
      if (holdingUnit) {
        const unitRole = this.userUnitRoleRepo.create({
          usrId: user.usrId,
          untId: holdingUnit.untId,
          uurRole: 'MEMBER',
          uurIsPrimary: true,
          uurStartedAt: new Date(),
        });
        await this.userUnitRoleRepo.save(unitRole);
      }

      // 정책 강제: 신규 사용자 생성 시 법인 Drive Settings는 own source를 보장한다.
      await this.ensureEntityOwnDriveSettings(
        invitation.invCompanyId,
        invitation.invInvitedBy || user.usrId,
      );
    }

    // Mark invitation as accepted
    invitation.invStatus = 'ACCEPTED';
    invitation.invAcceptedAt = new Date();
    await this.invitationRepository.save(invitation);

    return {
      success: true,
      userId: user.usrId,
      status: userStatus,
      message: userStatus === 'ACTIVE'
        ? 'Registration complete. You can now log in.'
        : 'Registration complete. Your account is pending admin approval.',
    };
  }

  private async ensureEntityOwnDriveSettings(entityId: string, updatedBy: string): Promise<void> {
    try {
      const driveSettingsRepo = this.userRepository.manager.getRepository(DriveSettingsEntity);
      let own = await driveSettingsRepo.findOne({ where: { entId: entityId } });

      // 이미 own 설정이 유효하면 유지
      if (own?.drsImpersonateEmail) {
        return;
      }

      const fallback = await this.resolveDriveFallbackSettings(entityId, driveSettingsRepo);
      if (!fallback?.drsImpersonateEmail) {
        this.logger.warn(`Drive own settings bootstrap skipped: no fallback source for entity ${entityId}`);
        return;
      }

      if (!own) {
        own = driveSettingsRepo.create({ entId: entityId });
      }

      // own 설정이 비어있을 때만 부모/전역 값을 복제
      if (!own.drsImpersonateEmail) {
        own.drsImpersonateEmail = fallback.drsImpersonateEmail;
      }
      if (!own.drsBillingRootFolderId && fallback.drsBillingRootFolderId) {
        own.drsBillingRootFolderId = fallback.drsBillingRootFolderId;
      }
      if (!own.drsBillingRootFolderName && fallback.drsBillingRootFolderName) {
        own.drsBillingRootFolderName = fallback.drsBillingRootFolderName;
      }
      own.drsUpdatedBy = updatedBy;

      await driveSettingsRepo.save(own);
      this.logger.log(`Ensured drive own settings for entity ${entityId} during invitation accept`);
    } catch (error) {
      // 가입 플로우를 막지 않기 위해 비차단 처리
      this.logger.warn(
        `Failed to ensure drive own settings for entity ${entityId}: ${(error as Error).message}`,
      );
    }
  }

  private async resolveDriveFallbackSettings(
    entityId: string,
    driveSettingsRepo: Repository<DriveSettingsEntity>,
  ): Promise<DriveSettingsEntity | null> {
    const entity = await this.hrEntityRepository.findOne({ where: { entId: entityId } });

    if (entity?.entParentId) {
      const parent = await driveSettingsRepo.findOne({ where: { entId: entity.entParentId } });
      if (parent?.drsImpersonateEmail) {
        return parent;
      }
    }

    const global = await driveSettingsRepo.findOne({ where: { entId: IsNull() } });
    if (global?.drsImpersonateEmail) {
      return global;
    }

    return null;
  }

  async cancel(id: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invId: id },
    });
    if (!invitation) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_NOT_FOUND.code,
        ERROR_CODE.INVITATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }
    if (invitation.invStatus !== 'PENDING') {
      throw new BusinessException(
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.code,
        'Cannot cancel a non-pending invitation.',
        HttpStatus.BAD_REQUEST,
      );
    }
    invitation.invStatus = 'CANCELLED';
    await this.invitationRepository.save(invitation);
    return { success: true };
  }

  async remove(id: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invId: id },
    });
    if (!invitation) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_NOT_FOUND.code,
        ERROR_CODE.INVITATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }
    if (invitation.invStatus === 'PENDING') {
      throw new BusinessException(
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.code,
        'Cannot delete a pending invitation. Cancel it first.',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.invitationRepository.remove(invitation);
    return { success: true };
  }

  async resend(id: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { invId: id },
    });
    if (!invitation) {
      throw new BusinessException(
        ERROR_CODE.INVITATION_NOT_FOUND.code,
        ERROR_CODE.INVITATION_NOT_FOUND.message,
        HttpStatus.NOT_FOUND,
      );
    }
    if (invitation.invStatus !== 'PENDING') {
      throw new BusinessException(
        ERROR_CODE.INVITATION_ALREADY_ACCEPTED.code,
        'Cannot resend a non-pending invitation.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Extend expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    invitation.invExpiresAt = expiresAt;
    await this.invitationRepository.save(invitation);

    const inviter = await this.userRepository.findOne({
      where: { usrId: invitation.invInvitedBy },
    });

    // 법인 정보 조회 (이메일에 법인명/브랜드 반영)
    let companyInfo: { name: string; color?: string; logoUrl?: string } | undefined;
    if (invitation.invCompanyId) {
      const company = await this.hrEntityRepository.findOne({
        where: { entId: invitation.invCompanyId },
      });
      if (company) {
        companyInfo = {
          name: company.entEmailDisplayName || company.entNameEn || company.entName,
          color: company.entEmailBrandColor || undefined,
          logoUrl: company.entEmailLogoUrl || undefined,
        };
      }
    }

    // 법인별 DB 템플릿 있으면 사용, 없으면 기존 branded 방식 사용 (resend)
    const dbTemplateResend = invitation.invCompanyId
      ? await this.emailTemplateService.getEntityTemplate('INVITATION', invitation.invCompanyId)
      : null;
    let sent: boolean;
    if (dbTemplateResend) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
      const variables: Record<string, string> = {
        inviterName: inviter?.usrName || 'Admin',
        companyName: companyInfo?.name || 'AMB Management',
        role: invitation.invRole,
        department: invitation.invUnit,
        inviteLink,
      };
      const { subject, html } = await this.emailTemplateService.resolve('INVITATION', variables, invitation.invCompanyId);
      sent = await this.mailService.sendRawEmail({ to: [invitation.invEmail], subject, html });
    } else {
      sent = await this.mailService.sendInvitationEmail(
        invitation.invEmail,
        inviter?.usrName || 'Admin',
        invitation.invRole,
        invitation.invUnit,
        invitation.invToken,
        companyInfo,
      );
    }

    if (sent) {
      invitation.invLastSentAt = new Date();
      invitation.invSendCount = (invitation.invSendCount || 0) + 1;
      await this.invitationRepository.save(invitation);
    } else {
      this.logger.warn(
        `Resend failed for invitation ${id} to ${invitation.invEmail}. Expiry was still extended.`,
      );
    }

    return { success: true, emailSent: sent };
  }
}
