import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { LoginHistoryEntity } from '../entity/login-history.entity';
import { PageViewEntity } from '../entity/page-view.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { MeetingNoteEntity } from '../../meeting-notes/entity/meeting-note.entity';
import { AiTokenUsageEntity } from '../../ai-usage/entity/ai-token-usage.entity';
import { TodoCommentEntity } from '../../todo/entity/todo-comment.entity';
import { IssueCommentEntity } from '../../issues/entity/issue-comment.entity';
import { MeetingNoteCommentEntity } from '../../meeting-notes/entity/meeting-note-comment.entity';
import { EntityUserRoleEntity } from '../../hr/entity/entity-user-role.entity';
import { TalkMessageEntity } from '../../amoeba-talk/entity/talk-message.entity';
import { TalkChannelEntity } from '../../amoeba-talk/entity/talk-channel.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { UserUnitRoleEntity } from '../../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../../unit/entity/unit.entity';

@Injectable()
export class WorkStatisticsService {
  constructor(
    @InjectRepository(LoginHistoryEntity)
    private readonly loginHistoryRepo: Repository<LoginHistoryEntity>,
    @InjectRepository(PageViewEntity)
    private readonly pageViewRepo: Repository<PageViewEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(MeetingNoteEntity)
    private readonly meetingNoteRepo: Repository<MeetingNoteEntity>,
    @InjectRepository(AiTokenUsageEntity)
    private readonly aiTokenRepo: Repository<AiTokenUsageEntity>,
    @InjectRepository(TodoCommentEntity)
    private readonly todoCommentRepo: Repository<TodoCommentEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly issueCommentRepo: Repository<IssueCommentEntity>,
    @InjectRepository(MeetingNoteCommentEntity)
    private readonly meetingNoteCommentRepo: Repository<MeetingNoteCommentEntity>,
    @InjectRepository(EntityUserRoleEntity)
    private readonly entityUserRoleRepo: Repository<EntityUserRoleEntity>,
    @InjectRepository(TalkMessageEntity)
    private readonly talkMessageRepo: Repository<TalkMessageEntity>,
    @InjectRepository(TalkChannelEntity)
    private readonly talkChannelRepo: Repository<TalkChannelEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserUnitRoleEntity)
    private readonly userUnitRoleRepo: Repository<UserUnitRoleEntity>,
    @InjectRepository(UnitEntity)
    private readonly unitRepo: Repository<UnitEntity>,
  ) {}

  async getOverview(entityId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const [
      totalMembers,
      loginCount,
      todosCreated,
      todosCompleted,
      issuesCreated,
      issuesResolved,
      meetingNotesCreated,
      todoComments,
      issueComments,
      meetingNoteComments,
      aiResult,
    ] = await Promise.all([
      this.entityUserRoleRepo.count({
        where: { entId: entityId, eurStatus: 'ACTIVE' },
      }),
      this.loginHistoryRepo.count({
        where: {
          entId: entityId,
          lghCreatedAt: Between(start, end),
        },
      }),
      this.todoRepo
        .createQueryBuilder('t')
        .where('t.entId = :entityId', { entityId })
        .andWhere('t.tdoCreatedAt BETWEEN :start AND :end', { start, end })
        .andWhere('t.tdoDeletedAt IS NULL')
        .getCount(),
      this.todoRepo
        .createQueryBuilder('t')
        .where('t.entId = :entityId', { entityId })
        .andWhere('t.tdoCompletedAt BETWEEN :start AND :end', { start, end })
        .andWhere('t.tdoDeletedAt IS NULL')
        .getCount(),
      this.issueRepo
        .createQueryBuilder('i')
        .where('i.entId = :entityId', { entityId })
        .andWhere('i.issCreatedAt BETWEEN :start AND :end', { start, end })
        .andWhere('i.issDeletedAt IS NULL')
        .getCount(),
      this.issueRepo
        .createQueryBuilder('i')
        .where('i.entId = :entityId', { entityId })
        .andWhere('i.issResolvedAt BETWEEN :start AND :end', { start, end })
        .andWhere('i.issDeletedAt IS NULL')
        .getCount(),
      this.meetingNoteRepo
        .createQueryBuilder('m')
        .where('m.entId = :entityId', { entityId })
        .andWhere('m.mtnCreatedAt BETWEEN :start AND :end', { start, end })
        .andWhere('m.mtnDeletedAt IS NULL')
        .getCount(),
      this.todoCommentRepo
        .createQueryBuilder('tc')
        .innerJoin('tc.todo', 't')
        .where('t.entId = :entityId', { entityId })
        .andWhere('tc.tcmCreatedAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.issueCommentRepo
        .createQueryBuilder('ic')
        .innerJoin('ic.issue', 'i')
        .where('i.entId = :entityId', { entityId })
        .andWhere('ic.iscCreatedAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.meetingNoteCommentRepo
        .createQueryBuilder('mc')
        .innerJoin('mc.meetingNote', 'm')
        .where('m.entId = :entityId', { entityId })
        .andWhere('mc.mncCreatedAt BETWEEN :start AND :end', { start, end })
        .getCount(),
      this.aiTokenRepo
        .createQueryBuilder('a')
        .select('COUNT(*)', 'requests')
        .addSelect('COALESCE(SUM(a.atuTotalTokens), 0)', 'tokens')
        .where('a.entId = :entityId', { entityId })
        .andWhere('a.atuCreatedAt BETWEEN :start AND :end', { start, end })
        .getRawOne(),
    ]);

    return {
      totalMembers,
      loginCount,
      todosCreated,
      todosCompleted,
      issuesCreated,
      issuesResolved,
      meetingNotesCreated,
      commentsCount: todoComments + issueComments + meetingNoteComments,
      aiRequests: Number(aiResult?.requests || 0),
      aiTokens: Number(aiResult?.tokens || 0),
    };
  }

  async getMemberActivities(entityId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    // EntityUserRoleEntity에 user relation이 없으므로 별도 조회
    const eurList = await this.entityUserRoleRepo.find({
      where: { entId: entityId, eurStatus: 'ACTIVE' },
    });
    const userIds = eurList.map((e) => e.usrId);
    if (userIds.length === 0) return [];

    const users = await this.userRepo.find({
      where: { usrId: In(userIds) },
    });
    const userMap = new Map(users.map((u) => [u.usrId, u]));

    // Unit 정보 조회 (Unit → UserUnitRole 경유)
    const entityUnits = await this.unitRepo.find({
      where: { entId: entityId },
      select: ['untId', 'untName'],
    });
    const unitMap = new Map(entityUnits.map((u) => [u.untId, u.untName]));
    const entityUnitIds = entityUnits.map((u) => u.untId);
    const unitRoles = entityUnitIds.length > 0
      ? await this.userUnitRoleRepo.find({
          where: { usrId: In(userIds), untId: In(entityUnitIds) },
        })
      : [];
    const userUnitMap = new Map(unitRoles.map((ur) => [ur.usrId, unitMap.get(ur.untId) || '-']));

    // 해당 법인의 Talk 채널 ID 목록 조회
    const channels = await this.talkChannelRepo.find({
      where: { entId: entityId },
      select: ['chnId'],
    });
    const channelIds = channels.map((c) => c.chnId);

    const memberStats = await Promise.all(
      userIds.map(async (userId) => {
        const [
          loginCount,
          todosCreated,
          todosCompleted,
          issuesCreated,
          issuesResolved,
          meetingNotesCreated,
          todoComments,
          issueComments,
          meetingNoteComments,
          talkMessages,
          aiResult,
        ] = await Promise.all([
          this.loginHistoryRepo.count({
            where: { usrId: userId, entId: entityId, lghCreatedAt: Between(start, end) },
          }),
          this.todoRepo
            .createQueryBuilder('t')
            .where('t.usrId = :userId AND t.entId = :entityId', { userId, entityId })
            .andWhere('t.tdoCreatedAt BETWEEN :start AND :end', { start, end })
            .andWhere('t.tdoDeletedAt IS NULL')
            .getCount(),
          this.todoRepo
            .createQueryBuilder('t')
            .where('t.usrId = :userId AND t.entId = :entityId', { userId, entityId })
            .andWhere('t.tdoCompletedAt BETWEEN :start AND :end', { start, end })
            .andWhere('t.tdoDeletedAt IS NULL')
            .getCount(),
          this.issueRepo
            .createQueryBuilder('i')
            .where('i.issReporterId = :userId AND i.entId = :entityId', { userId, entityId })
            .andWhere('i.issCreatedAt BETWEEN :start AND :end', { start, end })
            .andWhere('i.issDeletedAt IS NULL')
            .getCount(),
          this.issueRepo
            .createQueryBuilder('i')
            .where('i.issAssigneeId = :userId AND i.entId = :entityId', { userId, entityId })
            .andWhere('i.issResolvedAt BETWEEN :start AND :end', { start, end })
            .andWhere('i.issDeletedAt IS NULL')
            .getCount(),
          this.meetingNoteRepo
            .createQueryBuilder('m')
            .where('m.usrId = :userId AND m.entId = :entityId', { userId, entityId })
            .andWhere('m.mtnCreatedAt BETWEEN :start AND :end', { start, end })
            .andWhere('m.mtnDeletedAt IS NULL')
            .getCount(),
          this.todoCommentRepo
            .createQueryBuilder('tc')
            .innerJoin('tc.todo', 't')
            .where('tc.tcmAuthorId = :userId AND t.entId = :entityId', { userId, entityId })
            .andWhere('tc.tcmCreatedAt BETWEEN :start AND :end', { start, end })
            .getCount(),
          this.issueCommentRepo
            .createQueryBuilder('ic')
            .innerJoin('ic.issue', 'i')
            .where('ic.iscAuthorId = :userId AND i.entId = :entityId', { userId, entityId })
            .andWhere('ic.iscCreatedAt BETWEEN :start AND :end', { start, end })
            .getCount(),
          this.meetingNoteCommentRepo
            .createQueryBuilder('mc')
            .innerJoin('mc.meetingNote', 'm')
            .where('mc.mncAuthorId = :userId AND m.entId = :entityId', { userId, entityId })
            .andWhere('mc.mncCreatedAt BETWEEN :start AND :end', { start, end })
            .getCount(),
          channelIds.length > 0
            ? this.talkMessageRepo
                .createQueryBuilder('msg')
                .where('msg.usrId = :userId', { userId })
                .andWhere('msg.chnId IN (:...channelIds)', { channelIds })
                .andWhere('msg.msgCreatedAt BETWEEN :start AND :end', { start, end })
                .andWhere('msg.msgDeletedAt IS NULL')
                .getCount()
            : Promise.resolve(0),
          this.aiTokenRepo
            .createQueryBuilder('a')
            .select('COUNT(*)', 'requests')
            .addSelect('COALESCE(SUM(a.atuTotalTokens), 0)', 'tokens')
            .where('a.usrId = :userId AND a.entId = :entityId', { userId, entityId })
            .andWhere('a.atuCreatedAt BETWEEN :start AND :end', { start, end })
            .getRawOne(),
        ]);

        const user = userMap.get(userId);
        if (!user) return null;

        return {
          userId,
          name: user.usrName,
          email: user.usrEmail,
          unit: userUnitMap.get(userId) || '-',
          lastLoginAt: user.usrLastLoginAt?.toISOString() || null,
          loginCount,
          todosCreated,
          todosCompleted,
          issuesCreated,
          issuesResolved,
          meetingNotesCreated,
          commentsCount: todoComments + issueComments + meetingNoteComments,
          talkMessages,
          aiRequests: Number(aiResult?.requests || 0),
          aiTokens: Number(aiResult?.tokens || 0),
        };
      }),
    );

    return memberStats.filter(Boolean);
  }

  async getLoginHistory(entityId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const histories = await this.loginHistoryRepo
      .createQueryBuilder('lh')
      .innerJoin('lh.user', 'u')
      .addSelect(['u.usrName', 'u.usrEmail'])
      .where('lh.entId = :entityId', { entityId })
      .andWhere('lh.lghCreatedAt BETWEEN :start AND :end', { start, end })
      .orderBy('lh.lghCreatedAt', 'DESC')
      .limit(500)
      .getMany();

    return histories.map((h) => ({
      id: h.lghId,
      userId: h.usrId,
      name: h.user?.usrName || '-',
      email: h.user?.usrEmail || '-',
      ip: h.lghIp,
      userAgent: h.lghUserAgent,
      createdAt: h.lghCreatedAt.toISOString(),
    }));
  }

  async getApiUsageByMember(entityId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const results = await this.aiTokenRepo
      .createQueryBuilder('a')
      .innerJoin('a.user', 'u')
      .select('a.usrId', 'userId')
      .addSelect('u.usrName', 'name')
      .addSelect('u.usrEmail', 'email')
      .addSelect('COUNT(*)', 'requests')
      .addSelect('COALESCE(SUM(a.atuInputTokens), 0)', 'inputTokens')
      .addSelect('COALESCE(SUM(a.atuOutputTokens), 0)', 'outputTokens')
      .addSelect('COALESCE(SUM(a.atuTotalTokens), 0)', 'totalTokens')
      .where('a.entId = :entityId', { entityId })
      .andWhere('a.atuCreatedAt BETWEEN :start AND :end', { start, end })
      .groupBy('a.usrId')
      .addGroupBy('u.usrName')
      .addGroupBy('u.usrEmail')
      .orderBy('"totalTokens"', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      userId: r.userId,
      name: r.name,
      email: r.email,
      requests: Number(r.requests),
      inputTokens: Number(r.inputTokens),
      outputTokens: Number(r.outputTokens),
      totalTokens: Number(r.totalTokens),
    }));
  }

  async getMenuUsage(entityId: string, startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate + 'T23:59:59.999Z');

    const results = await this.pageViewRepo
      .createQueryBuilder('pv')
      .select('pv.pvwMenuCode', 'menuCode')
      .addSelect('COUNT(*)', 'visits')
      .addSelect('COUNT(DISTINCT pv.usrId)', 'uniqueUsers')
      .where('pv.entId = :entityId', { entityId })
      .andWhere('pv.pvwCreatedAt BETWEEN :start AND :end', { start, end })
      .andWhere('pv.pvwMenuCode IS NOT NULL')
      .groupBy('pv.pvwMenuCode')
      .orderBy('"visits"', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      menuCode: r.menuCode,
      visits: Number(r.visits),
      uniqueUsers: Number(r.uniqueUsers),
    }));
  }

  async recordPageView(userId: string, entityId: string, path: string, menuCode?: string) {
    await this.pageViewRepo.save({
      usrId: userId,
      entId: entityId,
      pvwPath: path.substring(0, 200),
      pvwMenuCode: menuCode?.substring(0, 50) || null,
    } as any);
  }
}
