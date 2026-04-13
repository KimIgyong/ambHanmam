import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserEntity } from '../../auth/entity/user.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';
import { CellEntity } from '../../members/entity/cell.entity';
import { UserCellEntity } from '../../members/entity/user-cell.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { SvcSubscriptionEntity } from '../../service-management/entity/subscription.entity';
import { AiUsageService } from '../../ai-usage/service/ai-usage.service';
import { AiTokenUsageEntity } from '../../ai-usage/entity/ai-token-usage.entity';
import { EntityAiConfigEntity } from '../../entity-settings/entity/entity-ai-config.entity';
import { DriveSettingsService } from '../../settings/service/drive-settings.service';
import { InvitationEntity } from '../../invitation/entity/invitation.entity';
import { InvitationService } from '../../invitation/service/invitation.service';
import { BusinessException } from '../../../global/filter/business.exception';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { UpdateEntityRequest } from '../../hr/dto/request/update-entity.request';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { UpdatePartnerUserDto } from '../dto/update-partner-user.dto';
import { UserPayload } from '../../../global/decorator/current-user.decorator';
import { createDefaultProfileImage } from '../../auth/util/profile-avatar.util';
import { ConversationEntity } from '../../chat/entity/conversation.entity';
import { TalkChannelMemberEntity } from '../../amoeba-talk/entity/talk-channel-member.entity';
import { TalkMessageEntity } from '../../amoeba-talk/entity/talk-message.entity';
import { TalkReadStatusEntity } from '../../amoeba-talk/entity/talk-read-status.entity';
import { TalkMessageHideEntity } from '../../amoeba-talk/entity/talk-message-hide.entity';
import { TalkReactionEntity } from '../../amoeba-talk/entity/talk-reaction.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { TodoParticipantEntity } from '../../todo/entity/todo-participant.entity';
import { TodoCommentEntity } from '../../todo/entity/todo-comment.entity';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';
import { WorkItemCommentEntity } from '../../acl/entity/work-item-comment.entity';
import { CalendarEntity } from '../../calendar/entity/calendar.entity';
import { CalendarParticipantEntity } from '../../calendar/entity/calendar-participant.entity';
import { AttendanceEntity } from '../../attendance/entity/attendance.entity';
import { AttendanceAmendmentEntity } from '../../attendance/entity/attendance-amendment.entity';
import { NotificationEntity } from '../../notification/entity/notification.entity';
import { PushSubscriptionEntity } from '../../notification/entity/push-subscription.entity';
import { NoticeEntity } from '../../notices/entity/notice.entity';
import { NoticeReadEntity } from '../../notices/entity/notice-read.entity';
import { MeetingNoteEntity } from '../../meeting-notes/entity/meeting-note.entity';
import { MeetingNoteFolderEntity } from '../../meeting-notes/entity/meeting-note-folder.entity';
import { MeetingNoteParticipantEntity } from '../../meeting-notes/entity/meeting-note-participant.entity';
import { MeetingNoteCommentEntity } from '../../meeting-notes/entity/meeting-note-comment.entity';
import { WorkReportEntity } from '../../report/entity/work-report.entity';
import { DailyMissionEntity } from '../../today/entity/daily-mission.entity';
import { LoginHistoryEntity } from '../../entity-settings/entity/login-history.entity';
import { PageViewEntity } from '../../entity-settings/entity/page-view.entity';
import { OAuthTokenEntity } from '../../oauth/entity/oauth-token.entity';
import { OAuthAuthorizationCodeEntity } from '../../oauth/entity/oauth-authorization-code.entity';
import { OpenApiLogEntity } from '../../oauth/entity/open-api-log.entity';
import { PasswordResetEntity } from '../../auth/entity/password-reset.entity';
import { DailyActivityStatEntity } from '../../activity-index/entity/daily-activity-stat.entity';
import { IssueRatingEntity } from '../../activity-index/entity/issue-rating.entity';
import { TodoRatingEntity } from '../../activity-index/entity/todo-rating.entity';
import { CommentRatingEntity } from '../../activity-index/entity/comment-rating.entity';
import { PgTransactionEntity } from '../../payment-gateway/entity/pg-transaction.entity';
import { AiQuotaTopupEntity } from '../../payment-gateway/entity/ai-quota-topup.entity';
import { SiteErrorLogEntity } from '../entity/site-error-log.entity';

interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

interface UserQueryParams extends PaginationParams {
  entity_id?: string;
  status?: string;
  role?: string;
}

interface EntityRoleQueryParams extends PaginationParams {
  entity_id?: string;
}

interface UnitRoleQueryParams extends PaginationParams {
  unit_id?: string;
}

interface EntityQueryParams extends PaginationParams {
  status?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepository: Repository<EntityUserRoleEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly hrEntityRepository: Repository<HrEntityEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly unitRoleRepository: Repository<UserUnitRoleEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepository: Repository<UnitEntity>,
    @InjectRepository(CellEntity)
    private readonly cellRepository: Repository<CellEntity>,
    @InjectRepository(UserCellEntity)
    private readonly userCellRepository: Repository<UserCellEntity>,
    @InjectRepository(SvcClientEntity)
    private readonly clientRepository: Repository<SvcClientEntity>,
    @InjectRepository(SvcSubscriptionEntity)
    private readonly subscriptionRepository: Repository<SvcSubscriptionEntity>,
    @InjectRepository(AiTokenUsageEntity)
    private readonly aiTokenUsageRepository: Repository<AiTokenUsageEntity>,
    @InjectRepository(EntityAiConfigEntity)
    private readonly entityAiConfigRepository: Repository<EntityAiConfigEntity>,
    @InjectRepository(InvitationEntity)
    private readonly invitationRepository: Repository<InvitationEntity>,
    @InjectRepository(ConversationEntity)
    private readonly conversationRepository: Repository<ConversationEntity>,
    @InjectRepository(TalkChannelMemberEntity)
    private readonly talkChannelMemberRepository: Repository<TalkChannelMemberEntity>,
    @InjectRepository(TalkMessageEntity)
    private readonly talkMessageRepository: Repository<TalkMessageEntity>,
    @InjectRepository(TalkReadStatusEntity)
    private readonly talkReadStatusRepository: Repository<TalkReadStatusEntity>,
    @InjectRepository(TalkMessageHideEntity)
    private readonly talkMessageHideRepository: Repository<TalkMessageHideEntity>,
    @InjectRepository(TalkReactionEntity)
    private readonly talkReactionRepository: Repository<TalkReactionEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepository: Repository<TodoEntity>,
    @InjectRepository(TodoParticipantEntity)
    private readonly todoParticipantRepository: Repository<TodoParticipantEntity>,
    @InjectRepository(TodoCommentEntity)
    private readonly todoCommentRepository: Repository<TodoCommentEntity>,
    @InjectRepository(WorkItemEntity)
    private readonly workItemRepository: Repository<WorkItemEntity>,
    @InjectRepository(WorkItemCommentEntity)
    private readonly workItemCommentRepository: Repository<WorkItemCommentEntity>,
    @InjectRepository(CalendarEntity)
    private readonly calendarRepository: Repository<CalendarEntity>,
    @InjectRepository(CalendarParticipantEntity)
    private readonly calendarParticipantRepository: Repository<CalendarParticipantEntity>,
    @InjectRepository(AttendanceEntity)
    private readonly attendanceRepository: Repository<AttendanceEntity>,
    @InjectRepository(AttendanceAmendmentEntity)
    private readonly attendanceAmendmentRepository: Repository<AttendanceAmendmentEntity>,
    @InjectRepository(NotificationEntity)
    private readonly notificationRepository: Repository<NotificationEntity>,
    @InjectRepository(PushSubscriptionEntity)
    private readonly pushSubscriptionRepository: Repository<PushSubscriptionEntity>,
    @InjectRepository(NoticeEntity)
    private readonly noticeRepository: Repository<NoticeEntity>,
    @InjectRepository(NoticeReadEntity)
    private readonly noticeReadRepository: Repository<NoticeReadEntity>,
    @InjectRepository(MeetingNoteEntity)
    private readonly meetingNoteRepository: Repository<MeetingNoteEntity>,
    @InjectRepository(MeetingNoteFolderEntity)
    private readonly meetingNoteFolderRepository: Repository<MeetingNoteFolderEntity>,
    @InjectRepository(MeetingNoteParticipantEntity)
    private readonly meetingNoteParticipantRepository: Repository<MeetingNoteParticipantEntity>,
    @InjectRepository(MeetingNoteCommentEntity)
    private readonly meetingNoteCommentRepository: Repository<MeetingNoteCommentEntity>,
    @InjectRepository(WorkReportEntity)
    private readonly workReportRepository: Repository<WorkReportEntity>,
    @InjectRepository(DailyMissionEntity)
    private readonly dailyMissionRepository: Repository<DailyMissionEntity>,
    @InjectRepository(LoginHistoryEntity)
    private readonly loginHistoryRepository: Repository<LoginHistoryEntity>,
    @InjectRepository(PageViewEntity)
    private readonly pageViewRepository: Repository<PageViewEntity>,
    @InjectRepository(OAuthTokenEntity)
    private readonly oauthTokenRepository: Repository<OAuthTokenEntity>,
    @InjectRepository(OAuthAuthorizationCodeEntity)
    private readonly oauthAuthCodeRepository: Repository<OAuthAuthorizationCodeEntity>,
    @InjectRepository(OpenApiLogEntity)
    private readonly openApiLogRepository: Repository<OpenApiLogEntity>,
    @InjectRepository(PasswordResetEntity)
    private readonly passwordResetRepository: Repository<PasswordResetEntity>,
    @InjectRepository(DailyActivityStatEntity)
    private readonly dailyActivityStatRepository: Repository<DailyActivityStatEntity>,
    @InjectRepository(IssueRatingEntity)
    private readonly issueRatingRepository: Repository<IssueRatingEntity>,
    @InjectRepository(TodoRatingEntity)
    private readonly todoRatingRepository: Repository<TodoRatingEntity>,
    @InjectRepository(CommentRatingEntity)
    private readonly commentRatingRepository: Repository<CommentRatingEntity>,
    @InjectRepository(PgTransactionEntity)
    private readonly pgTransactionRepository: Repository<PgTransactionEntity>,
    @InjectRepository(AiQuotaTopupEntity)
    private readonly aiQuotaTopupRepository: Repository<AiQuotaTopupEntity>,
    @InjectRepository(SiteErrorLogEntity)
    private readonly siteErrorLogRepository: Repository<SiteErrorLogEntity>,
    private readonly aiUsageService: AiUsageService,
    private readonly driveSettingsService: DriveSettingsService,
    private readonly invitationService: InvitationService,
  ) {}

  async findAllUsers(params: UserQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.usrId',
        'u.usrEmail',
        'u.usrName',
        'u.usrRole',
        'u.usrLevelCode',
        'u.usrStatus',
        'u.usrUnit',
        'u.usrCompanyId',
        'u.usrJoinMethod',
        'u.usrCreatedAt',
      ])
      .leftJoinAndSelect('u.company', 'company');

    if (params.search) {
      qb.andWhere(
        '(LOWER(u.usrName) LIKE :search OR LOWER(u.usrEmail) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }

    if (params.status) {
      qb.andWhere('u.usrStatus = :status', { status: params.status });
    }

    if (params.role) {
      qb.andWhere('u.usrRole = :role', { role: params.role });
    }

    if (params.entity_id) {
      qb.innerJoin(
        EntityUserRoleEntity,
        'eur',
        'eur.usrId = u.usrId AND eur.entId = :entityId AND eur.eurStatus = :eurStatus',
        { entityId: params.entity_id, eurStatus: 'ACTIVE' },
      );
    }

    qb.orderBy('u.usrCreatedAt', 'DESC');

    const [users, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = users.map((u) => ({
      userId: u.usrId,
      email: u.usrEmail,
      name: u.usrName,
      role: u.usrRole,
      levelCode: u.usrLevelCode,
      status: u.usrStatus,
      unit: u.usrUnit,
      companyId: u.usrCompanyId,
      companyName: u.company?.entName || null,
      joinMethod: u.usrJoinMethod,
      createdAt: u.usrCreatedAt.toISOString(),
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllEntityUserRoles(params: EntityRoleQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.entityUserRoleRepository
      .createQueryBuilder('eur')
      .leftJoinAndSelect('eur.hrEntity', 'entity')
      .leftJoin(UserEntity, 'u', 'u.usrId = eur.usrId')
      .addSelect(['u.usrId', 'u.usrEmail', 'u.usrName', 'u.usrRole']);

    if (params.entity_id) {
      qb.andWhere('eur.entId = :entityId', { entityId: params.entity_id });
    }

    if (params.search) {
      qb.andWhere(
        '(LOWER(u.usrName) LIKE :search OR LOWER(u.usrEmail) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('eur.eurCreatedAt', 'DESC');

    const [roles, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const userIds = roles.map((r) => r.usrId);
    const usersMap = new Map<string, UserEntity>();
    if (userIds.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('u')
        .where('u.usrId IN (:...userIds)', { userIds })
        .getMany();
      users.forEach((u) => usersMap.set(u.usrId, u));
    }

    const items = roles.map((eur) => {
      const user = usersMap.get(eur.usrId);
      return {
        eurId: eur.eurId,
        entityId: eur.entId,
        entityCode: eur.hrEntity?.entCode || '',
        entityName: eur.hrEntity?.entName || '',
        userId: eur.usrId,
        userName: user?.usrName || '',
        userEmail: user?.usrEmail || '',
        userRole: user?.usrRole || '',
        role: eur.eurRole,
        status: eur.eurStatus,
        createdAt: eur.eurCreatedAt.toISOString(),
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findAllUnitUserRoles(params: UnitRoleQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.unitRoleRepository
      .createQueryBuilder('uur')
      .leftJoinAndSelect('uur.unit', 'unit')
      .leftJoinAndSelect('unit.hrEntity', 'entity')
      .leftJoin(UserEntity, 'u', 'u.usrId = uur.usrId')
      .addSelect(['u.usrId', 'u.usrEmail', 'u.usrName', 'u.usrRole']);

    if (params.unit_id) {
      qb.andWhere('uur.untId = :unitId', { unitId: params.unit_id });
    }

    if (params.search) {
      qb.andWhere(
        '(LOWER(u.usrName) LIKE :search OR LOWER(u.usrEmail) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }

    qb.orderBy('uur.uurCreatedAt', 'DESC');

    const [roles, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const userIds = roles.map((r) => r.usrId);
    const usersMap = new Map<string, UserEntity>();
    if (userIds.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('u')
        .where('u.usrId IN (:...userIds)', { userIds })
        .getMany();
      users.forEach((u) => usersMap.set(u.usrId, u));
    }

    const items = roles.map((uur) => {
      const user = usersMap.get(uur.usrId);
      return {
        uurId: uur.uurId,
        unitId: uur.untId,
        unitName: uur.unit?.untName || '',
        userId: uur.usrId,
        userName: user?.usrName || '',
        userEmail: user?.usrEmail || '',
        role: uur.uurRole,
        isPrimary: uur.uurIsPrimary,
        entityCode: uur.unit?.hrEntity?.entCode || '',
        entityName: uur.unit?.hrEntity?.entName || '',
        createdAt: uur.uurCreatedAt.toISOString(),
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteUnitUserRole(uurId: string) {
    const role = await this.unitRoleRepository.findOne({ where: { uurId } });
    if (!role) {
      throw new BusinessException(
        'E2015',
        'Unit user role not found',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.unitRoleRepository.remove(role);
    return { success: true, message: 'Unit user role deleted.' };
  }

  /* ──────────────── Entity Management ──────────────── */

  async findAllEntities(params: EntityQueryParams) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const qb = this.hrEntityRepository
      .createQueryBuilder('e')
      .leftJoin(UserEntity, 'm', 'm.usrCompanyId = e.entId AND m.usrRole = :masterRole', { masterRole: 'MASTER' })
      .addSelect(['m.usrId', 'm.usrName', 'm.usrEmail']);

    if (params.search) {
      const s = `%${params.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(e.entName) LIKE :s OR LOWER(e.entNameEn) LIKE :s OR LOWER(e.entCode) LIKE :s OR LOWER(m.usrName) LIKE :s OR LOWER(m.usrEmail) LIKE :s)',
        { s },
      );
    }

    if (params.status) {
      qb.andWhere('e.entStatus = :status', { status: params.status });
    }

    qb.orderBy('e.entSortOrder', 'ASC');

    const entities = await qb.getMany();
    const total = entities.length;

    const paged = entities.slice(skip, skip + limit);
    const entityIds = paged.map((e) => e.entId);

    // MASTER users
    const masters = entityIds.length > 0
      ? await this.userRepository
          .createQueryBuilder('u')
          .where('u.usrCompanyId IN (:...entityIds) AND u.usrRole = :role', { entityIds, role: 'MASTER' })
          .getMany()
      : [];
    const masterMap = new Map<string, UserEntity>();
    masters.forEach((u) => { if (u.usrCompanyId) masterMap.set(u.usrCompanyId, u); });

    // Member counts
    const memberCounts = entityIds.length > 0
      ? await this.entityUserRoleRepository
          .createQueryBuilder('r')
          .select('r.entId', 'entId')
          .addSelect('COUNT(*)', 'cnt')
          .where('r.entId IN (:...entityIds) AND r.eurStatus = :s', { entityIds, s: 'ACTIVE' })
          .groupBy('r.entId')
          .getRawMany()
      : [];
    const countMap = new Map<string, number>();
    memberCounts.forEach((r) => countMap.set(r.entId, Number(r.cnt)));

    const items = paged.map((e) => {
      const master = masterMap.get(e.entId);
      return {
        entityId: e.entId,
        entityCode: e.entCode,
        entityName: e.entName,
        entityNameEn: e.entNameEn || '',
        level: e.entLevel,
        status: e.entStatus,
        masterUser: master ? { userId: master.usrId, name: master.usrName, email: master.usrEmail } : null,
        memberCount: countMap.get(e.entId) || 0,
        createdAt: e.entCreatedAt.toISOString(),
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getEntityDetail(entityId: string) {
    const entity = await this.hrEntityRepository.findOne({
      where: { entId: entityId },
      relations: ['parent'],
    });
    if (!entity) {
      throw new BusinessException('E2001', 'Entity not found', HttpStatus.NOT_FOUND);
    }

    // MASTER user
    const master = await this.userRepository.findOne({
      where: { usrCompanyId: entityId, usrRole: 'MASTER' },
    });

    // Member role distribution
    const roleCounts = await this.entityUserRoleRepository
      .createQueryBuilder('r')
      .select('r.eurRole', 'role')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.entId = :entityId AND r.eurStatus = :s', { entityId, s: 'ACTIVE' })
      .groupBy('r.eurRole')
      .getRawMany();
    const byRole: Record<string, number> = {};
    let totalMembers = 0;
    roleCounts.forEach((r) => { byRole[r.role] = Number(r.cnt); totalMembers += Number(r.cnt); });

    // Org counts
    const unitCount = await this.unitRepository.count({ where: { entId: entityId } });
    const cellCount = await this.cellRepository.count({ where: { entId: entityId } });

    return {
      entityId: entity.entId,
      entityCode: entity.entCode,
      entityName: entity.entName,
      entityNameEn: entity.entNameEn || '',
      country: entity.entCountry || '',
      currency: entity.entCurrency || '',
      regNo: entity.entRegNo || '',
      representative: entity.entRepresentative || '',
      phone: entity.entPhone || '',
      email: entity.entEmail || '',
      address: entity.entAddress || '',
      status: entity.entStatus,
      level: entity.entLevel,
      parentEntityName: entity.parent?.entName || null,
      isHq: entity.entIsHq,
      createdAt: entity.entCreatedAt.toISOString(),
      updatedAt: entity.entUpdatedAt.toISOString(),
      members: {
        total: totalMembers,
        byRole,
        masterUser: master ? { userId: master.usrId, name: master.usrName, email: master.usrEmail } : null,
      },
      organization: { unitCount, cellCount },
    };
  }

  async getEntityServiceUsage(entityId: string) {
    const client = await this.clientRepository.findOne({
      where: { cliEntId: entityId },
    });

    if (!client) {
      return { client: null, subscriptions: [] };
    }

    const subs = await this.subscriptionRepository.find({
      where: { cliId: client.cliId },
      relations: ['service', 'plan'],
      order: { subCreatedAt: 'DESC' },
    });

    return {
      client: {
        clientId: client.cliId,
        clientCode: client.cliCode,
        companyName: client.cliCompanyName,
        status: client.cliStatus,
      },
      subscriptions: subs.map((s) => ({
        subscriptionId: s.subId,
        serviceName: s.service?.svcName || '',
        serviceCode: s.service?.svcCode || '',
        planName: s.plan?.splName || '',
        status: s.subStatus,
        startDate: s.subStartDate,
        endDate: s.subEndDate,
        price: s.subPrice ? Number(s.subPrice) : null,
        currency: s.subCurrency,
        maxUsers: s.subMaxUsers,
        actualUsers: s.subActualUsers,
      })),
    };
  }

  async getEntityAiUsage(entityId: string) {
    const summary = await this.aiUsageService.getEntityUsageSummary(entityId);

    // Top users this month
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const startDate = `${ym}-01`;
    const endDate = `${ym}-31`;

    const topUsers = await this.aiTokenUsageRepository
      .createQueryBuilder('t')
      .select('t.usr_id', 'userId')
      .addSelect('SUM(t.atu_total_tokens)', 'totalTokens')
      .addSelect('COUNT(*)', 'requestCount')
      .where('t.ent_id = :entityId AND t.atu_created_at BETWEEN :start AND :end', { entityId, start: startDate, end: endDate })
      .groupBy('t.usr_id')
      .orderBy('SUM(t.atu_total_tokens)', 'DESC')
      .limit(10)
      .getRawMany();

    const userIds = topUsers.map((u) => u.userId).filter(Boolean);
    const usersMap = new Map<string, UserEntity>();
    if (userIds.length > 0) {
      const users = await this.userRepository
        .createQueryBuilder('u')
        .where('u.usrId IN (:...userIds)', { userIds })
        .getMany();
      users.forEach((u) => usersMap.set(u.usrId, u));
    }

    return {
      summary,
      topUsers: topUsers.map((t) => {
        const user = usersMap.get(t.userId);
        return {
          userId: t.userId,
          userName: user?.usrName || '',
          userEmail: user?.usrEmail || '',
          totalTokens: Number(t.totalTokens || 0),
          requestCount: Number(t.requestCount || 0),
        };
      }),
    };
  }

  /* ──────────────── Entity Update ──────────────── */

  async updateEntity(entityId: string, dto: UpdateEntityRequest) {
    const entity = await this.hrEntityRepository.findOne({ where: { entId: entityId } });
    if (!entity) {
      throw new BusinessException('E2001', 'Entity not found', HttpStatus.NOT_FOUND);
    }

    if (dto.name !== undefined) entity.entName = dto.name;
    if (dto.name_en !== undefined) entity.entNameEn = dto.name_en;
    if (dto.country !== undefined) entity.entCountry = dto.country;
    if (dto.currency !== undefined) entity.entCurrency = dto.currency;
    if (dto.registration_no !== undefined) entity.entRegNo = dto.registration_no;
    if (dto.address !== undefined) entity.entAddress = dto.address;
    if (dto.representative !== undefined) entity.entRepresentative = dto.representative;
    if (dto.phone !== undefined) entity.entPhone = dto.phone;
    if (dto.email !== undefined) entity.entEmail = dto.email;
    if (dto.status !== undefined) entity.entStatus = dto.status;

    await this.hrEntityRepository.save(entity);
    return this.getEntityDetail(entityId);
  }

  /* ──────────────── Entity Members ──────────────── */

  async getEntityMembers(entityId: string) {
    const roles = await this.entityUserRoleRepository.find({
      where: { entId: entityId, eurStatus: 'ACTIVE' },
      order: { eurCreatedAt: 'ASC' },
    });

    if (roles.length === 0) return [];

    const userIds = roles.map((r) => r.usrId);
    const users = await this.userRepository
      .createQueryBuilder('u')
      .where('u.usrId IN (:...userIds)', { userIds })
      .getMany();
    const usersMap = new Map<string, UserEntity>();
    users.forEach((u) => usersMap.set(u.usrId, u));

    return roles.map((r) => {
      const user = usersMap.get(r.usrId);
      return {
        eurId: r.eurId,
        userId: r.usrId,
        userName: user?.usrName || '',
        userEmail: user?.usrEmail || '',
        userStatus: user?.usrStatus || '',
        role: r.eurRole,
        createdAt: r.eurCreatedAt.toISOString(),
      };
    });
  }

  /* ──────────────── Admin: All Entities Drive Settings ──────────────── */

  async getAllEntitiesDriveSettings() {
    const entities = await this.hrEntityRepository.find({
      order: { entSortOrder: 'ASC' },
    });

    const results = await Promise.all(
      entities.map(async (ent) => {
        const settings = await this.driveSettingsService.getSettings(ent.entId);
        return {
          entityId: ent.entId,
          entityCode: ent.entCode,
          entityName: ent.entName,
          entityNameEn: ent.entNameEn || '',
          level: ent.entLevel,
          status: ent.entStatus,
          drive: settings,
        };
      }),
    );

    return results;
  }

  /* ──────────────── Admin: All Entities AI Configs ──────────────── */

  async getAllEntitiesAiConfigs() {
    const entities = await this.hrEntityRepository.find({
      order: { entSortOrder: 'ASC' },
    });

    const configs = await this.entityAiConfigRepository.find({
      where: { eacDeletedAt: null as any },
    });
    const configMap = new Map<string, EntityAiConfigEntity>();
    configs.forEach((c) => configMap.set(c.entId, c));

    return entities.map((ent) => {
      const config = configMap.get(ent.entId);
      return {
        entityId: ent.entId,
        entityCode: ent.entCode,
        entityName: ent.entName,
        entityNameEn: ent.entNameEn || '',
        level: ent.entLevel,
        status: ent.entStatus,
        aiConfig: config
          ? {
              configId: config.eacId,
              provider: config.eacProvider,
              useSharedKey: config.eacUseSharedKey,
              hasApiKey: !!config.eacApiKey,
              dailyTokenLimit: Number(config.eacDailyTokenLimit),
              monthlyTokenLimit: Number(config.eacMonthlyTokenLimit),
              isActive: config.eacIsActive,
              updatedAt: config.eacUpdatedAt?.toISOString() ?? null,
            }
          : null,
      };
    });
  }

  async updateEntityAiConfig(
    entityId: string,
    data: {
      provider?: string;
      use_shared_key?: boolean;
      daily_token_limit?: number;
      monthly_token_limit?: number;
      is_active?: boolean;
    },
  ) {
    let config = await this.entityAiConfigRepository.findOne({
      where: { entId: entityId, eacDeletedAt: null as any },
    });

    if (!config) {
      config = this.entityAiConfigRepository.create({ entId: entityId });
    }

    if (data.provider !== undefined) config.eacProvider = data.provider;
    if (data.use_shared_key !== undefined) config.eacUseSharedKey = data.use_shared_key;
    if (data.daily_token_limit !== undefined) config.eacDailyTokenLimit = data.daily_token_limit;
    if (data.monthly_token_limit !== undefined) config.eacMonthlyTokenLimit = data.monthly_token_limit;
    if (data.is_active !== undefined) config.eacIsActive = data.is_active;

    const saved = await this.entityAiConfigRepository.save(config);
    return {
      configId: saved.eacId,
      entityId: saved.entId,
      provider: saved.eacProvider,
      useSharedKey: saved.eacUseSharedKey,
      hasApiKey: !!saved.eacApiKey,
      dailyTokenLimit: Number(saved.eacDailyTokenLimit),
      monthlyTokenLimit: Number(saved.eacMonthlyTokenLimit),
      isActive: saved.eacIsActive,
      updatedAt: saved.eacUpdatedAt?.toISOString() ?? null,
    };
  }

  /* ══════════════════════════════════════════════════════
     Admin Users (ADMIN_LEVEL)
     ══════════════════════════════════════════════════════ */

  async findAdminUsers(params: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .where('u.usrLevelCode = :level', { level: 'ADMIN_LEVEL' })
      .andWhere('u.usrDeletedAt IS NULL');

    if (params.search) {
      qb.andWhere(
        '(LOWER(u.usrName) LIKE :search OR LOWER(u.usrEmail) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }
    if (params.status) {
      qb.andWhere('u.usrStatus = :status', { status: params.status });
    }

    qb.orderBy('u.usrCreatedAt', 'DESC');
    const [users, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = users.map((u) => ({
      userId: u.usrId,
      email: u.usrEmail,
      name: u.usrName,
      role: u.usrRole,
      status: u.usrStatus,
      lastLoginAt: u.usrLastLoginAt?.toISOString() ?? null,
      createdAt: u.usrCreatedAt.toISOString(),
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAdminUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'ADMIN_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Admin user not found', HttpStatus.NOT_FOUND);
    }
    return {
      userId: user.usrId,
      email: user.usrEmail,
      name: user.usrName,
      role: user.usrRole,
      status: user.usrStatus,
      lastLoginAt: user.usrLastLoginAt?.toISOString() ?? null,
      createdAt: user.usrCreatedAt.toISOString(),
    };
  }

  async createAdminUser(dto: CreateAdminUserDto) {
    const existing = await this.userRepository.findOne({
      where: { usrEmail: dto.email, usrLevelCode: 'ADMIN_LEVEL' },
    });
    if (existing) {
      throw new BusinessException(
        ERROR_CODE.USER_ALREADY_EXISTS.code,
        ERROR_CODE.USER_ALREADY_EXISTS.message,
        HttpStatus.CONFLICT,
      );
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      usrEmail: dto.email,
      usrName: dto.name,
      usrPassword: hashed,
      usrRole: dto.role,
      usrLevelCode: 'ADMIN_LEVEL',
      usrStatus: 'ACTIVE',
      usrUnit: 'Admin',
      usrMustChangePw: true,
      usrJoinMethod: 'INVITE',
      usrProfileImage: createDefaultProfileImage(dto.name, dto.email),
    });

    const saved = await this.userRepository.save(user);
    return {
      userId: saved.usrId,
      email: saved.usrEmail,
      name: saved.usrName,
      role: saved.usrRole,
      status: saved.usrStatus,
    };
  }

  async updateAdminUser(id: string, dto: UpdateAdminUserDto, currentUser: UserPayload) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'ADMIN_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Admin user not found', HttpStatus.NOT_FOUND);
    }

    // 자기 자신 비활성화 차단
    if (id === currentUser.userId && dto.status === 'INACTIVE') {
      throw new BusinessException('E1006', 'Cannot deactivate yourself', HttpStatus.BAD_REQUEST);
    }

    // SUPER_ADMIN → ADMIN 변경 시 마지막 SUPER_ADMIN 체크
    if (dto.role === 'ADMIN' && user.usrRole === 'SUPER_ADMIN') {
      const superAdminCount = await this.userRepository.count({
        where: { usrLevelCode: 'ADMIN_LEVEL', usrRole: 'SUPER_ADMIN', usrDeletedAt: null as any },
      });
      if (superAdminCount <= 1) {
        throw new BusinessException('E1006', 'Cannot change role of last SUPER_ADMIN', HttpStatus.BAD_REQUEST);
      }
    }

    if (dto.role !== undefined) user.usrRole = dto.role;
    if (dto.status !== undefined) user.usrStatus = dto.status;
    if (dto.name !== undefined) user.usrName = dto.name;

    await this.userRepository.save(user);
    return this.getAdminUser(id);
  }

  async resetAdminPassword(id: string, currentUser: UserPayload) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'ADMIN_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Admin user not found', HttpStatus.NOT_FOUND);
    }

    // ADMIN은 본인만, SUPER_ADMIN은 모두 가능
    if (currentUser.role !== 'SUPER_ADMIN' && id !== currentUser.userId) {
      throw new BusinessException('E1006', 'Only SUPER_ADMIN can reset other passwords', HttpStatus.FORBIDDEN);
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    user.usrPassword = await bcrypt.hash(tempPassword, 10);
    user.usrMustChangePw = true;
    await this.userRepository.save(user);

    return { tempPassword };
  }

  async deleteAdminUser(id: string, currentUser: UserPayload) {
    if (id === currentUser.userId) {
      throw new BusinessException('E1006', 'Cannot delete yourself', HttpStatus.BAD_REQUEST);
    }

    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'ADMIN_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Admin user not found', HttpStatus.NOT_FOUND);
    }

    if (user.usrRole === 'SUPER_ADMIN') {
      const superAdminCount = await this.userRepository.count({
        where: { usrLevelCode: 'ADMIN_LEVEL', usrRole: 'SUPER_ADMIN', usrDeletedAt: null as any },
      });
      if (superAdminCount <= 1) {
        throw new BusinessException('E1006', 'Cannot delete last SUPER_ADMIN', HttpStatus.BAD_REQUEST);
      }
    }

    await this.userRepository.softRemove(user);
    return { success: true };
  }

  /* ══════════════════════════════════════════════════════
     Partner Users (PARTNER_LEVEL)
     ══════════════════════════════════════════════════════ */

  async findPartnerUsers(params: { search?: string; status?: string; partner_id?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.partner', 'partner')
      .where('u.usrLevelCode = :level', { level: 'PARTNER_LEVEL' })
      .andWhere('u.usrDeletedAt IS NULL');

    if (params.search) {
      qb.andWhere(
        '(LOWER(u.usrName) LIKE :search OR LOWER(u.usrEmail) LIKE :search OR LOWER(partner.ptoCompanyName) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }
    if (params.status) {
      qb.andWhere('u.usrStatus = :status', { status: params.status });
    }
    if (params.partner_id) {
      qb.andWhere('u.usrPartnerId = :partnerId', { partnerId: params.partner_id });
    }

    qb.orderBy('u.usrCreatedAt', 'DESC');
    const [users, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = users.map((u) => ({
      userId: u.usrId,
      email: u.usrEmail,
      name: u.usrName,
      role: u.usrRole,
      status: u.usrStatus,
      partnerId: u.usrPartnerId,
      partnerName: u.partner?.ptnCompanyName ?? null,
      partnerCode: u.partner?.ptnCode ?? null,
      lastLoginAt: u.usrLastLoginAt?.toISOString() ?? null,
      createdAt: u.usrCreatedAt.toISOString(),
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getPartnerUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'PARTNER_LEVEL' },
      relations: ['partner'],
    });
    if (!user) {
      throw new BusinessException('E2001', 'Partner user not found', HttpStatus.NOT_FOUND);
    }
    return {
      userId: user.usrId,
      email: user.usrEmail,
      name: user.usrName,
      role: user.usrRole,
      status: user.usrStatus,
      partnerId: user.usrPartnerId,
      partnerName: user.partner?.ptnCompanyName ?? null,
      partnerCode: user.partner?.ptnCode ?? null,
      lastLoginAt: user.usrLastLoginAt?.toISOString() ?? null,
      createdAt: user.usrCreatedAt.toISOString(),
    };
  }

  async updatePartnerUser(id: string, dto: UpdatePartnerUserDto) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'PARTNER_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Partner user not found', HttpStatus.NOT_FOUND);
    }

    if (dto.role !== undefined) user.usrRole = dto.role;
    if (dto.status !== undefined) user.usrStatus = dto.status;
    if (dto.partner_id !== undefined) user.usrPartnerId = dto.partner_id;
    if (dto.name !== undefined) user.usrName = dto.name;

    await this.userRepository.save(user);
    return this.getPartnerUser(id);
  }

  async resetPartnerPassword(id: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'PARTNER_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Partner user not found', HttpStatus.NOT_FOUND);
    }

    const tempPassword = crypto.randomBytes(4).toString('hex');
    user.usrPassword = await bcrypt.hash(tempPassword, 10);
    user.usrMustChangePw = true;
    await this.userRepository.save(user);

    return { tempPassword };
  }

  async deletePartnerUser(id: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: id, usrLevelCode: 'PARTNER_LEVEL' },
    });
    if (!user) {
      throw new BusinessException('E2001', 'Partner user not found', HttpStatus.NOT_FOUND);
    }

    await this.userRepository.softRemove(user);
    return { success: true };
  }

  /* ══════════════════════════════════════════════════════
     Partner Invitations
     ══════════════════════════════════════════════════════ */

  async findPartnerInvitations(params: {
    search?: string;
    status?: string;
    partner_id?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const qb = this.invitationRepository
      .createQueryBuilder('inv')
      .leftJoinAndSelect('inv.partnerOrg', 'partner')
      .where('inv.invLevelCode = :level', { level: 'PARTNER_LEVEL' });

    if (params.search) {
      qb.andWhere(
        '(LOWER(inv.invEmail) LIKE :search OR LOWER(partner.ptoCompanyName) LIKE :search)',
        { search: `%${params.search.toLowerCase()}%` },
      );
    }
    if (params.status) {
      qb.andWhere('inv.invStatus = :status', { status: params.status });
    }
    if (params.partner_id) {
      qb.andWhere('inv.invPartnerId = :partnerId', { partnerId: params.partner_id });
    }

    qb.orderBy('inv.invCreatedAt', 'DESC');
    const [invitations, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const items = invitations.map((inv) => ({
      invitationId: inv.invId,
      email: inv.invEmail,
      role: inv.invRole,
      status: inv.invStatus,
      partnerId: inv.invPartnerId,
      partnerName: inv.partnerOrg?.ptnCompanyName ?? null,
      expiresAt: inv.invExpiresAt?.toISOString() ?? null,
      acceptedAt: inv.invAcceptedAt?.toISOString() ?? null,
      sendCount: inv.invSendCount,
      lastSentAt: inv.invLastSentAt?.toISOString() ?? null,
      createdAt: inv.invCreatedAt.toISOString(),
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async resendPartnerInvitation(invitationId: string, currentUserId: string) {
    const inv = await this.invitationRepository.findOne({ where: { invId: invitationId } });
    if (!inv) {
      throw new BusinessException('E6001', 'Invitation not found', HttpStatus.NOT_FOUND);
    }
    if (inv.invStatus !== 'PENDING' && inv.invStatus !== 'EXPIRED') {
      throw new BusinessException('E6003', 'Cannot resend this invitation', HttpStatus.BAD_REQUEST);
    }

    // 만료된 경우 상태를 PENDING으로 되돌리고 만료일 연장
    if (inv.invStatus === 'EXPIRED') {
      inv.invStatus = 'PENDING';
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      inv.invExpiresAt = expiresAt;
    }

    inv.invSendCount = (inv.invSendCount || 0) + 1;
    inv.invLastSentAt = new Date();
    await this.invitationRepository.save(inv);

    return { success: true };
  }

  async cancelPartnerInvitation(invitationId: string) {
    const inv = await this.invitationRepository.findOne({ where: { invId: invitationId } });
    if (!inv) {
      throw new BusinessException('E6001', 'Invitation not found', HttpStatus.NOT_FOUND);
    }
    if (inv.invStatus !== 'PENDING') {
      throw new BusinessException('E6007', 'Only pending invitations can be cancelled', HttpStatus.BAD_REQUEST);
    }

    inv.invStatus = 'CANCELLED';
    await this.invitationRepository.save(inv);

    return { success: true };
  }

  /* ──── User Deletion Preview ──── */

  async getUserDeletionPreview(userId: string) {
    const user = await this.userRepository.findOne({
      where: { usrId: userId },
      withDeleted: true,
      relations: ['company'],
    });
    if (!user) {
      throw new BusinessException('E2001', 'User not found', HttpStatus.NOT_FOUND);
    }

    const [
      entityRoles,
      unitRoles,
      conversations,
      talkChannels,
      talkMessages,
      todos,
      todoParticipants,
      workItems,
      calendars,
      calendarParticipants,
      meetingNotes,
      meetingNoteFolders,
      workReports,
      dailyMissions,
      attendances,
      notifications,
      notices,
      noticeReads,
      pushSubscriptions,
      loginHistories,
      pageViews,
      aiTokenUsages,
      pgTransactions,
      aiQuotaTopups,
    ] = await Promise.all([
      this.entityUserRoleRepository.count({ where: { usrId: userId } }),
      this.unitRoleRepository.count({ where: { usrId: userId } }),
      this.conversationRepository.count({ where: { usrId: userId }, withDeleted: true }),
      this.talkChannelMemberRepository.count({ where: { usrId: userId } }),
      this.talkMessageRepository.count({ where: { usrId: userId } }),
      this.todoRepository.count({ where: { usrId: userId } }),
      this.todoParticipantRepository.count({ where: { usrId: userId } }),
      this.workItemRepository.count({ where: { witOwnerId: userId } }),
      this.calendarRepository.count({ where: { usrId: userId } }),
      this.calendarParticipantRepository.count({ where: { usrId: userId } }),
      this.meetingNoteRepository.count({ where: { usrId: userId } }),
      this.meetingNoteFolderRepository.count({ where: { usrId: userId } }),
      this.workReportRepository.count({ where: { usrId: userId } }),
      this.dailyMissionRepository.count({ where: { usrId: userId } }),
      this.attendanceRepository.count({ where: { usrId: userId } }),
      this.notificationRepository.count({ where: [{ ntfRecipientId: userId }, { ntfSenderId: userId }] }),
      this.noticeRepository.count({ where: { usrId: userId } }),
      this.noticeReadRepository.count({ where: { usrId: userId } }),
      this.pushSubscriptionRepository.count({ where: { usrId: userId } }),
      this.loginHistoryRepository.count({ where: { usrId: userId } }),
      this.pageViewRepository.count({ where: { usrId: userId } }),
      this.aiTokenUsageRepository.count({ where: { usrId: userId } }),
      this.pgTransactionRepository.count({ where: { usrId: userId } }),
      this.aiQuotaTopupRepository.count({ where: { usrId: userId } }),
    ]);

    return {
      success: true,
      data: {
        user: {
          usrId: user.usrId,
          usrEmail: user.usrEmail,
          usrName: user.usrName,
          usrRole: user.usrRole,
          usrLevelCode: user.usrLevelCode,
          usrStatus: user.usrStatus,
          companyName: user.company?.entName ?? null,
          isSoftDeleted: !!user.usrDeletedAt,
        },
        counts: {
          entityRoles,
          unitRoles,
          conversations,
          talkChannels,
          talkMessages,
          todos,
          todoParticipants,
          workItems,
          calendars,
          calendarParticipants,
          meetingNotes,
          meetingNoteFolders,
          workReports,
          dailyMissions,
          attendances,
          notifications,
          notices,
          noticeReads,
          pushSubscriptions,
          loginHistories,
          pageViews,
          aiTokenUsages,
          pgTransactions,
          aiQuotaTopups,
        },
        warnings: {
          isSuperAdmin: user.usrRole === 'SUPER_ADMIN',
          hasActiveSubscriptions: false,
        },
      },
    };
  }

  /* ──── Permanent Delete User ──── */

  async deleteUserPermanent(
    userId: string,
    level: 1 | 2,
    confirmEmail: string,
    adminUserId: string,
  ) {
    const user = await this.userRepository.findOne({
      where: { usrId: userId },
      withDeleted: true,
    });
    if (!user) {
      throw new BusinessException('E2001', 'User not found', HttpStatus.NOT_FOUND);
    }
    if (user.usrRole === 'SUPER_ADMIN') {
      throw new BusinessException('E2010', 'Cannot delete SUPER_ADMIN user', HttpStatus.BAD_REQUEST);
    }
    if (userId === adminUserId) {
      throw new BusinessException('E2011', 'Cannot delete yourself', HttpStatus.BAD_REQUEST);
    }
    if (user.usrEmail !== confirmEmail) {
      throw new BusinessException('E2012', 'Email confirmation does not match', HttpStatus.BAD_REQUEST);
    }

    return this.userRepository.manager.transaction(async (manager) => {
      // Step 1: 참여/멤버십 데이터 삭제
      await manager.delete(EntityUserRoleEntity, { usrId: userId });
      await manager.delete(UserUnitRoleEntity, { usrId: userId });
      await manager.delete(UserCellEntity, { usrId: userId });
      await manager.delete(TalkChannelMemberEntity, { usrId: userId });
      await manager.delete(TalkReadStatusEntity, { usrId: userId });
      await manager.delete(TalkMessageHideEntity, { usrId: userId });
      await manager.delete(TalkReactionEntity, { usrId: userId });
      await manager.delete(CalendarParticipantEntity, { usrId: userId });
      await manager.delete(TodoParticipantEntity, { usrId: userId });
      await manager.delete(MeetingNoteParticipantEntity, { usrId: userId });

      // Step 2: 알림/구독
      await manager.delete(NotificationEntity, { ntfRecipientId: userId });
      await manager.delete(NotificationEntity, { ntfSenderId: userId });
      await manager.delete(PushSubscriptionEntity, { usrId: userId });
      await manager.delete(NoticeReadEntity, { usrId: userId });

      // Step 3: 인증/토큰
      await manager.delete(OAuthTokenEntity, { usrId: userId });
      await manager.delete(OAuthAuthorizationCodeEntity, { usrId: userId });
      await manager.delete(PasswordResetEntity, { usrId: userId });

      // Step 4: 통계/추적
      await manager.delete(DailyActivityStatEntity, { usrId: userId });
      await manager.delete(IssueRatingEntity, { usrId: userId });
      await manager.delete(TodoRatingEntity, { usrId: userId });
      await manager.delete(CommentRatingEntity, { usrId: userId });
      await manager.delete(LoginHistoryEntity, { usrId: userId });
      await manager.delete(PageViewEntity, { usrId: userId });

      // Step 5: 결제/AI 사용량
      await manager.delete(PgTransactionEntity, { usrId: userId });
      await manager.delete(AiQuotaTopupEntity, { usrId: userId });
      await manager.delete(AiTokenUsageEntity, { usrId: userId });

      if (level === 2) {
        // Level 2: 소유 데이터 CASCADE 삭제

        // 토크 메시지의 하위 데이터 삭제 → 메시지 삭제
        const userMessages = await manager.find(TalkMessageEntity, {
          where: { usrId: userId },
          select: ['tmsId'],
        });
        if (userMessages.length > 0) {
          const messageIds = userMessages.map((m) => m.tmsId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(TalkReactionEntity)
            .where('tmsId IN (:...ids)', { ids: messageIds })
            .execute();
          await manager
            .createQueryBuilder()
            .delete()
            .from(TalkMessageHideEntity)
            .where('tmsId IN (:...ids)', { ids: messageIds })
            .execute();
          await manager.delete(TalkMessageEntity, { usrId: userId });
        }

        // 대화 삭제
        await manager.delete(ConversationEntity, { usrId: userId });

        // 투두의 하위 데이터 삭제 → 투두 삭제
        const userTodos = await manager.find(TodoEntity, {
          where: { usrId: userId },
          select: ['todId'],
        });
        if (userTodos.length > 0) {
          const todoIds = userTodos.map((t) => t.todId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(TodoCommentEntity)
            .where('todId IN (:...ids)', { ids: todoIds })
            .execute();
          await manager
            .createQueryBuilder()
            .delete()
            .from(TodoParticipantEntity)
            .where('todId IN (:...ids)', { ids: todoIds })
            .execute();
          await manager
            .createQueryBuilder()
            .delete()
            .from(TodoRatingEntity)
            .where('todId IN (:...ids)', { ids: todoIds })
            .execute();
          await manager.delete(TodoEntity, { usrId: userId });
        }

        // 워크아이템의 댓글 삭제 → 워크아이템 삭제
        const userWorkItems = await manager.find(WorkItemEntity, {
          where: { witOwnerId: userId },
          select: ['witId'],
        });
        if (userWorkItems.length > 0) {
          const witIds = userWorkItems.map((w) => w.witId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(WorkItemCommentEntity)
            .where('witId IN (:...ids)', { ids: witIds })
            .execute();
          await manager.delete(WorkItemEntity, { witOwnerId: userId });
        }

        // 캘린더의 참여자 삭제 → 캘린더 삭제
        const userCalendars = await manager.find(CalendarEntity, {
          where: { usrId: userId },
          select: ['calId'],
        });
        if (userCalendars.length > 0) {
          const calIds = userCalendars.map((c) => c.calId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(CalendarParticipantEntity)
            .where('calId IN (:...ids)', { ids: calIds })
            .execute();
          await manager.delete(CalendarEntity, { usrId: userId });
        }

        // 회의록의 하위 데이터 삭제 → 회의록 삭제
        const userMeetingNotes = await manager.find(MeetingNoteEntity, {
          where: { usrId: userId },
          select: ['mtnId'],
        });
        if (userMeetingNotes.length > 0) {
          const mtnIds = userMeetingNotes.map((m) => m.mtnId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(MeetingNoteCommentEntity)
            .where('mtnId IN (:...ids)', { ids: mtnIds })
            .execute();
          await manager
            .createQueryBuilder()
            .delete()
            .from(MeetingNoteParticipantEntity)
            .where('mtnId IN (:...ids)', { ids: mtnIds })
            .execute();
          await manager.delete(MeetingNoteEntity, { usrId: userId });
        }
        await manager.delete(MeetingNoteFolderEntity, { usrId: userId });

        // 업무 보고서, 데일리 미션 삭제
        await manager.delete(WorkReportEntity, { usrId: userId });
        await manager.delete(DailyMissionEntity, { usrId: userId });

        // 출퇴근 수정이력 삭제 → 출퇴근 삭제
        const userAttendances = await manager.find(AttendanceEntity, {
          where: { usrId: userId },
          select: ['attId'],
        });
        if (userAttendances.length > 0) {
          const attIds = userAttendances.map((a) => a.attId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(AttendanceAmendmentEntity)
            .where('attId IN (:...ids)', { ids: attIds })
            .execute();
          await manager.delete(AttendanceEntity, { usrId: userId });
        }

        // 공지사항의 읽음기록 삭제 → 공지사항 삭제
        const userNotices = await manager.find(NoticeEntity, {
          where: { usrId: userId },
          select: ['ntcId'],
        });
        if (userNotices.length > 0) {
          const ntcIds = userNotices.map((n) => n.ntcId);
          await manager
            .createQueryBuilder()
            .delete()
            .from(NoticeReadEntity)
            .where('ntcId IN (:...ids)', { ids: ntcIds })
            .execute();
          await manager.delete(NoticeEntity, { usrId: userId });
        }

        // Step 7: 타인 데이터의 참조 NULL 처리
        await manager
          .createQueryBuilder()
          .update(AttendanceEntity)
          .set({ attApprovedBy: null })
          .where('attApprovedBy = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(SiteErrorLogEntity)
          .set({ selUsrId: null })
          .where('selUsrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(OpenApiLogEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
      } else {
        // Level 1: 작성자 참조 NULL 처리
        await manager
          .createQueryBuilder()
          .update(TalkMessageEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(ConversationEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(TodoEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(TodoCommentEntity)
          .set({ tcmAuthorId: null })
          .where('tcmAuthorId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(WorkItemEntity)
          .set({ witOwnerId: null })
          .where('witOwnerId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(WorkItemCommentEntity)
          .set({ wicAuthorId: null })
          .where('wicAuthorId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(WorkReportEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(DailyMissionEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(CalendarEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(AttendanceEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(AttendanceEntity)
          .set({ attApprovedBy: null })
          .where('attApprovedBy = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(NoticeEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(MeetingNoteEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(MeetingNoteFolderEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(MeetingNoteCommentEntity)
          .set({ mncAuthorId: null })
          .where('mncAuthorId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(SiteErrorLogEntity)
          .set({ selUsrId: null })
          .where('selUsrId = :userId', { userId })
          .execute();
        await manager
          .createQueryBuilder()
          .update(OpenApiLogEntity)
          .set({ usrId: null })
          .where('usrId = :userId', { userId })
          .execute();
      }

      // 최종: 사용자 레코드 물리 삭제
      await manager
        .createQueryBuilder()
        .delete()
        .from(UserEntity)
        .where('usrId = :userId', { userId })
        .execute();

      this.logger.warn(
        `[PERMANENT-DELETE] Admin ${adminUserId} permanently deleted user ${userId} (${user.usrEmail}) at Level ${level}`,
      );

      return {
        success: true,
        data: {
          deletedUserId: userId,
          deletedEmail: user.usrEmail,
          level,
        },
      };
    });
  }
}
