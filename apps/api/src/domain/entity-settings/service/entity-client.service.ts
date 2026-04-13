import {
  Injectable, Logger, BadRequestException, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull } from 'typeorm';
import * as crypto from 'crypto';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { PartnerEntity } from '../../billing/entity/partner.entity';
import { ClientInvitationEntity } from '../../client-portal/entity/client-invitation.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { MailService } from '../../../infrastructure/external/mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { UserPayload } from '../../../global/decorator/current-user.decorator';

@Injectable()
export class EntityClientService {
  private readonly logger = new Logger(EntityClientService.name);

  constructor(
    @InjectRepository(SvcClientEntity)
    private readonly clientRepo: Repository<SvcClientEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    @InjectRepository(ClientInvitationEntity)
    private readonly invitationRepo: Repository<ClientInvitationEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly entityRepo: Repository<HrEntityEntity>,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Entity 소속 고객사 목록
   * Billing Partners (type=CLIENT) 기반으로 조회.
   * 매칭 SvcClient가 없으면 자동 생성하여 Partner code를 공유.
   */
  async findClients(entityId: string) {
    // 1) Entity의 CLIENT 타입 Partners 조회
    const partners = await this.partnerRepo.find({
      where: { entId: entityId, ptnType: 'CLIENT' },
      order: { ptnCode: 'ASC' },
    });

    if (partners.length === 0) return [];

    // 2) Partners에 매칭되는 SvcClient 조회 (cli_bil_partner_id로 연결)
    const partnerIds = partners.map((p) => p.ptnId);
    const existingClients = await this.clientRepo
      .createQueryBuilder('cli')
      .where('cli.cliBilPartnerId IN (:...partnerIds)', { partnerIds })
      .andWhere('cli.cliDeletedAt IS NULL')
      .getMany();

    const clientByPartnerId = new Map(
      existingClients.map((cli) => [cli.cliBilPartnerId, cli]),
    );

    // 3) 매칭되지 않는 Partners는 SvcClient 자동 생성
    const newClients: SvcClientEntity[] = [];
    for (const partner of partners) {
      if (!clientByPartnerId.has(partner.ptnId)) {
        const code = await this.generateClientCode();
        const created = this.clientRepo.create({
          cliCode: code,
          cliCompanyName: partner.ptnCompanyName,
          cliCompanyNameLocal: partner.ptnCompanyNameLocal || undefined,
          cliType: 'COMPANY',
          cliCountry: partner.ptnCountry || undefined,
          cliStatus: partner.ptnStatus || 'ACTIVE',
          cliBilPartnerId: partner.ptnId,
          cliEntId: entityId,
          cliTaxId: partner.ptnTaxId || undefined,
          cliAddress: partner.ptnAddress || undefined,
          cliPortalSource: 'BILLING_PARTNER',
        } as DeepPartial<SvcClientEntity>);
        const saved: SvcClientEntity = await this.clientRepo.save(created as SvcClientEntity);
        clientByPartnerId.set(partner.ptnId, saved);
        newClients.push(saved);
      }
    }

    if (newClients.length > 0) {
      this.logger.log(`Auto-created ${newClients.length} SvcClients from Billing Partners for entity ${entityId}`);
    }

    // 4) 결과 조합
    const result = await Promise.all(
      partners.map(async (partner) => {
        const cli = clientByPartnerId.get(partner.ptnId);
        if (!cli) return null;

        const userCount = await this.userRepo.count({
          where: { usrCliId: cli.cliId, usrLevelCode: 'CLIENT_LEVEL' },
        });
        const invitationCount = await this.invitationRepo.count({
          where: { cliId: cli.cliId, civStatus: 'PENDING' },
        });
        return {
          id: cli.cliId,
          code: cli.cliCode,
          partnerCode: partner.ptnCode,
          companyName: cli.cliCompanyName,
          companyNameLocal: cli.cliCompanyNameLocal,
          type: partner.ptnType,
          country: cli.cliCountry,
          industry: cli.cliIndustry,
          status: cli.cliStatus,
          userCount,
          invitationCount,
          createdAt: cli.cliCreatedAt,
        };
      }),
    );

    return result.filter(Boolean);
  }

  /**
   * 클라이언트 코드 자동 생성 (C-YYYYMM-NNN)
   */
  private async generateClientCode(): Promise<string> {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prefix = `C-${ym}-`;

    const latest = await this.clientRepo
      .createQueryBuilder('cli')
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

  /**
   * 고객사 상세 (사용자 + 초대 목록 포함)
   * Partner를 통해 entity 소속 확인
   */
  async findClientDetail(entityId: string, cliId: string) {
    const client = await this.clientRepo.findOne({
      where: { cliId },
    });
    if (!client) throw new NotFoundException('Client not found');

    // Partner를 통한 entity 소속 검증
    if (client.cliBilPartnerId) {
      const partner = await this.partnerRepo.findOne({
        where: { ptnId: client.cliBilPartnerId, entId: entityId },
      });
      if (!partner) throw new NotFoundException('Client not found');
    } else if (client.cliEntId !== entityId) {
      throw new NotFoundException('Client not found');
    }

    const users = await this.userRepo.find({
      where: { usrCliId: cliId, usrLevelCode: 'CLIENT_LEVEL' },
      order: { usrCreatedAt: 'DESC' },
    });

    const invitations = await this.invitationRepo.find({
      where: { cliId },
      relations: ['invitedBy'],
      order: { civCreatedAt: 'DESC' },
    });

    return {
      id: client.cliId,
      code: client.cliCode,
      companyName: client.cliCompanyName,
      companyNameLocal: client.cliCompanyNameLocal,
      type: client.cliType,
      country: client.cliCountry,
      industry: client.cliIndustry,
      status: client.cliStatus,
      note: client.cliNote,
      website: client.cliWebsite,
      taxId: client.cliTaxId,
      address: client.cliAddress,
      users: users.map((u) => ({
        id: u.usrId,
        email: u.usrEmail,
        name: u.usrName,
        role: u.usrRole,
        status: u.usrStatus,
        lastLoginAt: u.usrLastLoginAt,
      })),
      invitations: invitations.map((inv) => ({
        id: inv.civId,
        email: inv.civEmail,
        name: inv.civName,
        role: inv.civRole,
        status: inv.civStatus,
        invitedBy: inv.invitedBy?.usrName || null,
        expiresAt: inv.civTokenExpires,
        createdAt: inv.civCreatedAt,
      })),
    };
  }

  /**
   * 고객사 생성 — Billing Partner도 함께 생성
   */
  async createClient(entityId: string, dto: {
    company_name: string;
    code: string;
    type?: string;
    country?: string;
    industry?: string;
    note?: string;
  }) {
    // 1) Billing Partner 생성
    const existingPartner = await this.partnerRepo.findOne({
      where: { entId: entityId, ptnCode: dto.code },
    });
    if (existingPartner) {
      throw new BadRequestException('Partner code already exists');
    }

    const partner = this.partnerRepo.create({
      entId: entityId,
      ptnCode: dto.code,
      ptnType: 'CLIENT',
      ptnCompanyName: dto.company_name,
      ptnCountry: dto.country || undefined,
      ptnNote: dto.note || undefined,
      ptnStatus: 'ACTIVE',
    } as DeepPartial<PartnerEntity>);
    const savedPartner: PartnerEntity = await this.partnerRepo.save(partner as PartnerEntity);

    // 2) SvcClient 생성 (Partner와 연결)
    const clientCode = await this.generateClientCode();
    const client = this.clientRepo.create({
      cliCode: clientCode,
      cliCompanyName: dto.company_name,
      cliType: 'COMPANY',
      cliCountry: dto.country || undefined,
      cliIndustry: dto.industry || undefined,
      cliNote: dto.note || undefined,
      cliEntId: entityId,
      cliBilPartnerId: savedPartner.ptnId,
      cliStatus: 'ACTIVE',
      cliPortalSource: 'ENTITY_SETTINGS',
    } as DeepPartial<SvcClientEntity>);
    const savedClient: SvcClientEntity = await this.clientRepo.save(client as SvcClientEntity);

    return { id: savedClient.cliId, code: savedClient.cliCode, partnerCode: savedPartner.ptnCode, companyName: savedClient.cliCompanyName };
  }

  /**
   * 고객사 수정
   */
  async updateClient(entityId: string, cliId: string, dto: {
    company_name?: string;
    type?: string;
    country?: string;
    industry?: string;
    status?: string;
    note?: string;
  }) {
    const client = await this.findOwnedClient(entityId, cliId);

    if (dto.company_name) client.cliCompanyName = dto.company_name;
    if (dto.type) client.cliType = dto.type;
    if (dto.country !== undefined) client.cliCountry = dto.country;
    if (dto.industry !== undefined) client.cliIndustry = dto.industry;
    if (dto.status) client.cliStatus = dto.status;
    if (dto.note !== undefined) client.cliNote = dto.note;

    await this.clientRepo.save(client);
    return { id: client.cliId, companyName: client.cliCompanyName, status: client.cliStatus };
  }

  /**
   * 고객사 소프트 삭제
   */
  async deleteClient(entityId: string, cliId: string) {
    const client = await this.findOwnedClient(entityId, cliId);

    await this.clientRepo.softRemove(client);
    return { id: cliId, deleted: true };
  }

  /**
   * Entity 소속 클라이언트인지 확인 (Partner 관계 또는 cli_ent_id)
   */
  private async findOwnedClient(entityId: string, cliId: string): Promise<SvcClientEntity> {
    const client = await this.clientRepo.findOne({ where: { cliId } });
    if (!client) throw new NotFoundException('Client not found');

    if (client.cliBilPartnerId) {
      const partner = await this.partnerRepo.findOne({
        where: { ptnId: client.cliBilPartnerId, entId: entityId },
      });
      if (!partner) throw new NotFoundException('Client not found');
    } else if (client.cliEntId !== entityId) {
      throw new NotFoundException('Client not found');
    }

    return client;
  }

  /**
   * 고객 담당자 초대 + 이메일 발송
   */
  async inviteClient(
    entityId: string,
    cliId: string,
    dto: { email: string; name?: string; role?: string },
    invitedBy: string,
  ) {
    const client = await this.findOwnedClient(entityId, cliId);

    // 이미 pending 초대 확인
    const existing = await this.invitationRepo.findOne({
      where: { civEmail: dto.email, cliId, civStatus: 'PENDING' },
    });
    if (existing) throw new BadRequestException('Invitation already sent to this email');

    // 이미 계정 존재 확인 (CLIENT_LEVEL)
    const existingUser = await this.userRepo.findOne({
      where: { usrEmail: dto.email, usrCliId: cliId, usrLevelCode: 'CLIENT_LEVEL' },
    });
    if (existingUser) throw new BadRequestException('User already exists for this client');

    // 같은 Entity 내 USER_LEVEL 이메일 중복 체크
    const existingEntityUser = await this.userRepo.findOne({
      where: { usrEmail: dto.email, usrCompanyId: entityId, usrLevelCode: 'USER_LEVEL' },
    });
    if (existingEntityUser) throw new BadRequestException('이 이메일은 이미 해당 법인의 구성원으로 등록되어 있습니다. 다른 이메일을 입력하세요.');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 72);

    const invitation = this.invitationRepo.create({
      civEmail: dto.email,
      civName: dto.name || null,
      cliId,
      civRole: dto.role || 'CLIENT_MEMBER',
      civToken: token,
      civTokenExpires: expires,
      civInvitedBy: invitedBy,
    });

    const saved = await this.invitationRepo.save(invitation);

    // Entity 정보 조회 후 이메일 발송
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    const inviter = await this.userRepo.findOne({ where: { usrId: invitedBy } });

    if (entity) {
      await this.sendClientInvitationEmail(
        dto.email,
        client.cliCompanyName,
        entity.entName,
        entity.entCode,
        inviter?.usrName || 'Team',
        token,
      );
    }

    return {
      id: saved.civId,
      email: saved.civEmail,
      status: saved.civStatus,
      expiresAt: saved.civTokenExpires,
    };
  }

  /**
   * 초대 재발송
   */
  async resendInvitation(entityId: string, cliId: string, civId: string) {
    await this.findOwnedClient(entityId, cliId);

    const invitation = await this.invitationRepo.findOne({
      where: { civId, cliId },
      relations: ['client'],
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    // 새 토큰 + 만료시간 갱신
    invitation.civToken = crypto.randomBytes(32).toString('hex');
    invitation.civTokenExpires = new Date();
    invitation.civTokenExpires.setHours(invitation.civTokenExpires.getHours() + 72);
    invitation.civStatus = 'PENDING';
    await this.invitationRepo.save(invitation);

    // 이메일 재발송
    const entity = await this.entityRepo.findOne({ where: { entId: entityId } });
    if (entity) {
      await this.sendClientInvitationEmail(
        invitation.civEmail,
        invitation.client?.cliCompanyName || '',
        entity.entName,
        entity.entCode,
        'Team',
        invitation.civToken,
      );
    }

    return { id: civId, status: 'PENDING', expiresAt: invitation.civTokenExpires };
  }

  /**
   * 초대 취소
   */
  async cancelInvitation(entityId: string, cliId: string, civId: string) {
    await this.findOwnedClient(entityId, cliId);

    const invitation = await this.invitationRepo.findOne({
      where: { civId, cliId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');

    invitation.civStatus = 'CANCELLED';
    await this.invitationRepo.save(invitation);
    return { id: civId, status: 'CANCELLED' };
  }

  /**
   * 클라이언트 초대 이메일 발송
   */
  private async sendClientInvitationEmail(
    to: string,
    clientName: string,
    entityName: string,
    entityCode: string,
    inviterName: string,
    token: string,
  ): Promise<boolean> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5189');
    const registerLink = `${frontendUrl}/client/register?token=${token}&entityCode=${encodeURIComponent(entityCode)}&entityName=${encodeURIComponent(entityName)}`;

    try {
      return await this.mailService.sendRawEmail({
        to: [to],
        subject: `[${entityName}] Client Portal Invitation`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
            <h2 style="color: #4F46E5; font-size: 22px; margin: 0 0 16px 0;">${entityName}</h2>
            <p style="font-size: 15px; color: #111827;">
              You have been invited by <strong>${inviterName}</strong> to join the client portal
              for <strong>${clientName}</strong>.
            </p>
            <table style="border-left: 3px solid #4F46E5; padding-left: 12px; margin: 16px 0; border-spacing: 0;">
              <tr>
                <td style="color: #6B7280; padding: 2px 8px 2px 0;"><strong>Organization:</strong></td>
                <td style="color: #111827;">${entityName}</td>
              </tr>
              <tr>
                <td style="color: #6B7280; padding: 2px 8px 2px 0;"><strong>Entity Code:</strong></td>
                <td style="color: #111827; font-weight: 600;">${entityCode}</td>
              </tr>
              <tr>
                <td style="color: #6B7280; padding: 2px 8px 2px 0;"><strong>Company:</strong></td>
                <td style="color: #111827;">${clientName}</td>
              </tr>
            </table>
            <p style="color: #374151; font-size: 14px;">
              Please use the Entity Code <strong>${entityCode}</strong> when logging in to the client portal.
            </p>
            <a href="${registerLink}" style="display: inline-block; background: #4F46E5; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600; margin: 8px 0 24px 0;">
              Accept Invitation & Register
            </a>
            <p style="color: #6B7280; font-size: 13px;">This invitation expires in 72 hours.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
            <p style="color: #9CA3AF; font-size: 12px;">
              This email was sent by AMB Management on behalf of ${entityName}.<br/>
              If the button doesn't work, copy and paste this link: ${registerLink}
            </p>
          </div>
        `,
      });
    } catch (error) {
      this.logger.error(`Failed to send client invitation email to ${to}`, error);
      return false;
    }
  }
}
