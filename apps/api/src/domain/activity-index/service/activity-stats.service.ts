import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyActivityStatEntity } from '../entity/daily-activity-stat.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { MeetingNoteEntity } from '../../meeting-notes/entity/meeting-note.entity';
import { IssueCommentEntity } from '../../issues/entity/issue-comment.entity';
import { TodoCommentEntity } from '../../todo/entity/todo-comment.entity';
import { MeetingNoteCommentEntity } from '../../meeting-notes/entity/meeting-note-comment.entity';
import { TalkMessageEntity } from '../../amoeba-talk/entity/talk-message.entity';
import { IssueRatingEntity } from '../entity/issue-rating.entity';
import { TodoRatingEntity } from '../entity/todo-rating.entity';
import { CommentRatingEntity } from '../entity/comment-rating.entity';
import { MeetingNoteRatingEntity } from '../../meeting-notes/entity/meeting-note-rating.entity';
import { TalkReactionEntity } from '../../amoeba-talk/entity/talk-reaction.entity';
import { IssueStatusLogEntity } from '../../issues/entity/issue-status-log.entity';
import { IssueCommentReactionEntity } from '../../issues/entity/issue-comment-reaction.entity';
import { ActivityWeightService } from './activity-weight.service';
import { UserEntity } from '../../auth/entity/user.entity';

@Injectable()
export class ActivityStatsService {
  private readonly logger = new Logger(ActivityStatsService.name);

  constructor(
    @InjectRepository(DailyActivityStatEntity)
    private readonly statsRepo: Repository<DailyActivityStatEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(MeetingNoteEntity)
    private readonly noteRepo: Repository<MeetingNoteEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly issueCommentRepo: Repository<IssueCommentEntity>,
    @InjectRepository(TodoCommentEntity)
    private readonly todoCommentRepo: Repository<TodoCommentEntity>,
    @InjectRepository(MeetingNoteCommentEntity)
    private readonly noteCommentRepo: Repository<MeetingNoteCommentEntity>,
    @InjectRepository(TalkMessageEntity)
    private readonly talkMessageRepo: Repository<TalkMessageEntity>,
    @InjectRepository(IssueRatingEntity)
    private readonly issueRatingRepo: Repository<IssueRatingEntity>,
    @InjectRepository(TodoRatingEntity)
    private readonly todoRatingRepo: Repository<TodoRatingEntity>,
    @InjectRepository(CommentRatingEntity)
    private readonly commentRatingRepo: Repository<CommentRatingEntity>,
    @InjectRepository(MeetingNoteRatingEntity)
    private readonly noteRatingRepo: Repository<MeetingNoteRatingEntity>,
    @InjectRepository(TalkReactionEntity)
    private readonly talkReactionRepo: Repository<TalkReactionEntity>,
    @InjectRepository(IssueStatusLogEntity)
    private readonly issueStatusLogRepo: Repository<IssueStatusLogEntity>,
    @InjectRepository(IssueCommentReactionEntity)
    private readonly issueCommentReactionRepo: Repository<IssueCommentReactionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly weightService: ActivityWeightService,
  ) {}

  /** 기간 내 멤버별 통계 (스냅샷 기반 또는 실시간 조합) */
  async getMemberStats(
    entityId: string,
    startDate: string,
    endDate: string,
    cellId?: string,
    sortBy = 'total_score',
    sortOrder = 'desc',
  ) {
    const qb = this.statsRepo
      .createQueryBuilder('s')
      .select('s.usr_id', 'userId')
      .addSelect('SUM(s.das_issue_count)::int', 'issueCount')
      .addSelect('SUM(s.das_note_count)::int', 'noteCount')
      .addSelect('SUM(s.das_comment_count)::int', 'commentCount')
      .addSelect('SUM(s.das_todo_count)::int', 'todoCount')
      .addSelect('SUM(s.das_chat_count)::int', 'chatCount')
      .addSelect('SUM(s.das_activity_score)::float', 'activityScore')
      .addSelect('SUM(s.das_rating_sum)::float', 'ratingSum')
      .addSelect('SUM(s.das_rating_count)::int', 'ratingCount')
      .addSelect('SUM(s.das_reaction_count)::int', 'reactionCount')
      .addSelect('SUM(s.das_engagement_score)::float', 'engagementScore')
      .addSelect('SUM(s.das_total_score)::float', 'totalScore')
      .where('s.ent_id = :entityId', { entityId })
      .andWhere('s.das_date >= :startDate', { startDate })
      .andWhere('s.das_date <= :endDate', { endDate })
      .groupBy('s.usr_id');

    const sortColumn = sortBy === 'activity_score'
      ? 'SUM(s.das_activity_score)'
      : sortBy === 'engagement_score'
        ? 'SUM(s.das_engagement_score)'
        : 'SUM(s.das_total_score)';
    qb.orderBy(sortColumn, sortOrder.toUpperCase() as 'ASC' | 'DESC');

    const rows = await qb.getRawMany();

    // 유저 정보 매핑
    const userIds = rows.map((r) => r.userId);
    if (!userIds.length) return [];

    const users = await this.userRepo
      .createQueryBuilder('u')
      .select(['u.usr_id', 'u.usr_name', 'u.usr_email', 'u.usr_avatar_url', 'u.usr_unit'])
      .where('u.usr_id IN (:...ids)', { ids: userIds })
      .getMany();
    const userMap = new Map(users.map((u) => [u.usrId, u]));

    return rows.map((r) => {
      const u = userMap.get(r.userId);
      return {
        userId: r.userId,
        userName: u?.usrName ?? '',
        userEmail: u?.usrEmail ?? '',
        userAvatar: null,
        unit: u?.usrUnit ?? '',
        issueCount: r.issueCount || 0,
        noteCount: r.noteCount || 0,
        commentCount: r.commentCount || 0,
        todoCount: r.todoCount || 0,
        chatCount: r.chatCount || 0,
        activityScore: Math.round((r.activityScore || 0) * 100) / 100,
        ratingSum: r.ratingSum || 0,
        ratingCount: r.ratingCount || 0,
        reactionCount: r.reactionCount || 0,
        engagementScore: Math.round((r.engagementScore || 0) * 100) / 100,
        totalScore: Math.round((r.totalScore || 0) * 100) / 100,
      };
    });
  }

  /** 개인 일별 통계 */
  async getUserDailyStats(entityId: string, userId: string, startDate: string, endDate: string) {
    const rows = await this.statsRepo.find({
      where: {
        entId: entityId,
        usrId: userId,
        dasDate: Between(startDate, endDate) as any,
      },
      order: { dasDate: 'ASC' },
    });
    return rows.map((r) => ({
      date: r.dasDate,
      issueCount: r.dasIssueCount,
      noteCount: r.dasNoteCount,
      commentCount: r.dasCommentCount,
      todoCount: r.dasTodoCount,
      chatCount: r.dasChatCount,
      activityScore: Number(r.dasActivityScore),
      engagementScore: Number(r.dasEngagementScore),
      totalScore: Number(r.dasTotalScore),
    }));
  }

  /** 특정 날짜의 통계를 집계 (Cron 또는 수동) */
  async aggregateDate(entityId: string, date: string): Promise<number> {
    const dayStart = `${date} 00:00:00`;
    const dayEnd = `${date} 23:59:59`;

    const weights = await this.weightService.getWeightMap(entityId);

    // 법인 소속 전체 사용자
    const members = await this.userRepo
      .createQueryBuilder('u')
      .select('u.usr_id')
      .innerJoin('amb_entity_user_roles', 'eur', 'eur.usr_id = u.usr_id AND eur.ent_id = :entityId', { entityId })
      .where('u.usr_deleted_at IS NULL')
      .getRawMany();

    let aggregated = 0;

    for (const member of members) {
      const userId = member.usr_id;

      // 1. 활동 카운트
      const issueCount = await this.issueRepo
        .createQueryBuilder('i')
        .where('i.iss_reporter_id = :userId', { userId })
        .andWhere('i.ent_id = :entityId', { entityId })
        .andWhere('i.iss_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('i.iss_deleted_at IS NULL')
        .getCount();

      const noteCount = await this.noteRepo
        .createQueryBuilder('n')
        .where('n.usr_id = :userId', { userId })
        .andWhere('n.ent_id = :entityId', { entityId })
        .andWhere('n.mtn_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('n.mtn_deleted_at IS NULL')
        .getCount();

      const issueCommentCount = await this.issueCommentRepo
        .createQueryBuilder('c')
        .innerJoin('amb_issues', 'i', 'i.iss_id = c.iss_id AND i.ent_id = :entityId', { entityId })
        .where('c.isc_author_id = :userId', { userId })
        .andWhere('c.isc_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .getCount();

      const todoCommentCount = await this.todoCommentRepo
        .createQueryBuilder('c')
        .innerJoin('amb_todos', 't', 't.tdo_id = c.tdo_id AND t.ent_id = :entityId', { entityId })
        .where('c.tcm_author_id = :userId', { userId })
        .andWhere('c.tcm_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('c.tcm_deleted_at IS NULL')
        .getCount();

      const noteCommentCount = await this.noteCommentRepo
        .createQueryBuilder('c')
        .innerJoin('amb_meeting_notes', 'n', 'n.mtn_id = c.mtn_id AND n.ent_id = :entityId', { entityId })
        .where('c.mnc_author_id = :userId', { userId })
        .andWhere('c.mnc_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('c.mnc_deleted_at IS NULL')
        .getCount();

      const commentCount = issueCommentCount + todoCommentCount + noteCommentCount;

      const todoCount = await this.todoRepo
        .createQueryBuilder('t')
        .where('t.usr_id = :userId', { userId })
        .andWhere('t.ent_id = :entityId', { entityId })
        .andWhere('t.tdo_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('t.tdo_deleted_at IS NULL')
        .getCount();

      let chatCount = await this.talkMessageRepo
        .createQueryBuilder('m')
        .innerJoin('amb_talk_channels', 'ch', 'ch.chn_id = m.chn_id AND ch.ent_id = :entityId', { entityId })
        .where('m.usr_id = :userId', { userId })
        .andWhere('m.msg_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere('m.msg_deleted_at IS NULL')
        .getCount();

      // 채팅 상한 적용
      const chatCap = weights.CHAT_MESSAGE?.dailyCap;
      if (chatCap && chatCount > chatCap) chatCount = chatCap;

      // 2. 활동 점수 계산
      const activityScore =
        issueCount * (weights.ISSUE?.weight ?? 5) +
        noteCount * (weights.MEETING_NOTE?.weight ?? 4) +
        commentCount * (weights.COMMENT?.weight ?? 4) +
        todoCount * (weights.TODO?.weight ?? 2) +
        chatCount * (weights.CHAT_MESSAGE?.weight ?? 1);

      // 3. 호응도 — 해당 사용자가 작성한 콘텐츠에 대해 받은 별점/반응
      // 이슈 별점
      const issueRatingResult = await this.issueRatingRepo
        .createQueryBuilder('r')
        .select('COALESCE(SUM(r.isr_rating), 0)::float', 'sum')
        .addSelect('COUNT(*)::int', 'cnt')
        .innerJoin('amb_issues', 'i', 'i.iss_id = r.iss_id')
        .where('i.iss_reporter_id = :userId', { userId })
        .andWhere('i.ent_id = :entityId', { entityId })
        .andWhere('r.isr_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .getRawOne();

      // 태스크 별점
      const todoRatingResult = await this.todoRatingRepo
        .createQueryBuilder('r')
        .select('COALESCE(SUM(r.tdr_rating), 0)::float', 'sum')
        .addSelect('COUNT(*)::int', 'cnt')
        .innerJoin('amb_todos', 't', 't.tdo_id = r.tdo_id')
        .where('t.usr_id = :userId', { userId })
        .andWhere('t.ent_id = :entityId', { entityId })
        .andWhere('r.tdr_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .getRawOne();

      // 미팅노트 별점
      const noteRatingResult = await this.noteRatingRepo
        .createQueryBuilder('r')
        .select('COALESCE(SUM(r.mnr_rating), 0)::float', 'sum')
        .addSelect('COUNT(*)::int', 'cnt')
        .innerJoin('amb_meeting_notes', 'n', 'n.mtn_id = r.mtn_id')
        .where('n.usr_id = :userId', { userId })
        .andWhere('n.ent_id = :entityId', { entityId })
        .andWhere('r.mnr_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .getRawOne();

      // 코멘트 별점 (3종 합산)
      const commentRatingResult = await this.commentRatingRepo
        .createQueryBuilder('r')
        .select('COALESCE(SUM(r.cmr_rating), 0)::float', 'sum')
        .addSelect('COUNT(*)::int', 'cnt')
        .where('r.cmr_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .andWhere(`(
          (r.cmr_target_type = 'ISSUE_COMMENT' AND r.cmr_target_id IN (
            SELECT isc_id FROM amb_issue_comments ic
            JOIN amb_issues ii ON ii.iss_id = ic.iss_id AND ii.ent_id = :entityId
            WHERE ic.isc_author_id = :userId
          ))
          OR
          (r.cmr_target_type = 'TODO_COMMENT' AND r.cmr_target_id IN (
            SELECT tcm_id FROM amb_todo_comments tc
            JOIN amb_todos tt ON tt.tdo_id = tc.tdo_id AND tt.ent_id = :entityId
            WHERE tc.tcm_author_id = :userId
          ))
          OR
          (r.cmr_target_type = 'NOTE_COMMENT' AND r.cmr_target_id IN (
            SELECT mnc_id FROM amb_meeting_note_comments mc
            JOIN amb_meeting_notes mn ON mn.mtn_id = mc.mtn_id AND mn.ent_id = :entityId
            WHERE mc.mnc_author_id = :userId
          ))
        )`)
        .setParameter('entityId', entityId)
        .setParameter('userId', userId)
        .getRawOne();

      // 채팅 이모지 반응
      const chatReactionResult = await this.talkReactionRepo
        .createQueryBuilder('r')
        .select('COUNT(*)::int', 'cnt')
        .innerJoin('amb_talk_messages', 'm', 'm.msg_id = r.msg_id')
        .innerJoin('amb_talk_channels', 'ch', 'ch.chn_id = m.chn_id AND ch.ent_id = :entityId', { entityId })
        .where('m.usr_id = :userId', { userId })
        .andWhere('r.rea_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
        .getRawOne();

      const ratingSum =
        (issueRatingResult?.sum || 0) +
        (todoRatingResult?.sum || 0) +
        (noteRatingResult?.sum || 0) +
        (commentRatingResult?.sum || 0);

      const ratingCount =
        (issueRatingResult?.cnt || 0) +
        (todoRatingResult?.cnt || 0) +
        (noteRatingResult?.cnt || 0) +
        (commentRatingResult?.cnt || 0);

      const reactionCount = chatReactionResult?.cnt || 0;

      // 4. 호응도 점수 계산
      const engagementScore =
        (issueRatingResult?.sum || 0) * (weights.ISSUE?.engagementWeight ?? 5) +
        (noteRatingResult?.sum || 0) * (weights.MEETING_NOTE?.engagementWeight ?? 4) +
        (commentRatingResult?.sum || 0) * (weights.COMMENT?.engagementWeight ?? 4) +
        (todoRatingResult?.sum || 0) * (weights.TODO?.engagementWeight ?? 2) +
        reactionCount * (weights.CHAT_MESSAGE?.engagementWeight ?? 1);

      const totalScore = activityScore + engagementScore;

      // 5. UPSERT
      const existing = await this.statsRepo.findOne({
        where: { entId: entityId, usrId: userId, dasDate: date },
      });

      if (existing) {
        existing.dasIssueCount = issueCount;
        existing.dasNoteCount = noteCount;
        existing.dasCommentCount = commentCount;
        existing.dasTodoCount = todoCount;
        existing.dasChatCount = chatCount;
        existing.dasActivityScore = activityScore;
        existing.dasRatingSum = ratingSum;
        existing.dasRatingCount = ratingCount;
        existing.dasReactionCount = reactionCount;
        existing.dasEngagementScore = engagementScore;
        existing.dasTotalScore = totalScore;
        await this.statsRepo.save(existing);
      } else {
        await this.statsRepo.save(
          this.statsRepo.create({
            entId: entityId,
            usrId: userId,
            dasDate: date,
            dasIssueCount: issueCount,
            dasNoteCount: noteCount,
            dasCommentCount: commentCount,
            dasTodoCount: todoCount,
            dasChatCount: chatCount,
            dasActivityScore: activityScore,
            dasRatingSum: ratingSum,
            dasRatingCount: ratingCount,
            dasReactionCount: reactionCount,
            dasEngagementScore: engagementScore,
            dasTotalScore: totalScore,
          }),
        );
      }
      aggregated++;
    }

    return aggregated;
  }

  /** 내가 받은 호응 + 내가 준 호응 */
  async getMyEngagement(entityId: string, userId: string) {
    // --- 내가 받은 호응 ---
    // 이슈 별점 (내가 작성한 이슈에 받은 별점)
    const receivedIssueRating = await this.issueRatingRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.isr_rating), 0)::int', 'sum')
      .addSelect('COUNT(*)::int', 'cnt')
      .innerJoin('amb_issues', 'i', 'i.iss_id = r.iss_id')
      .where('i.iss_reporter_id = :userId', { userId })
      .andWhere('i.ent_id = :entityId', { entityId })
      .getRawOne();

    // 할일 별점
    const receivedTodoRating = await this.todoRatingRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.tdr_rating), 0)::int', 'sum')
      .addSelect('COUNT(*)::int', 'cnt')
      .innerJoin('amb_todos', 't', 't.tdo_id = r.tdo_id')
      .where('t.usr_id = :userId', { userId })
      .andWhere('t.ent_id = :entityId', { entityId })
      .getRawOne();

    // 미팅노트 별점
    const receivedNoteRating = await this.noteRatingRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.mnr_rating), 0)::int', 'sum')
      .addSelect('COUNT(*)::int', 'cnt')
      .innerJoin('amb_meeting_notes', 'n', 'n.mtn_id = r.mtn_id')
      .where('n.usr_id = :userId', { userId })
      .andWhere('n.ent_id = :entityId', { entityId })
      .getRawOne();

    // 댓글 별점 (내 댓글에 받은)
    const receivedCommentRating = await this.commentRatingRepo
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.cmr_rating), 0)::int', 'sum')
      .addSelect('COUNT(*)::int', 'cnt')
      .where(`(
        (r.cmr_target_type = 'ISSUE_COMMENT' AND r.cmr_target_id IN (
          SELECT isc_id FROM amb_issue_comments ic
          JOIN amb_issues ii ON ii.iss_id = ic.iss_id AND ii.ent_id = :entityId
          WHERE ic.isc_author_id = :userId
        ))
        OR
        (r.cmr_target_type = 'TODO_COMMENT' AND r.cmr_target_id IN (
          SELECT tcm_id FROM amb_todo_comments tc
          JOIN amb_todos tt ON tt.tdo_id = tc.tdo_id AND tt.ent_id = :entityId
          WHERE tc.tcm_author_id = :userId
        ))
        OR
        (r.cmr_target_type = 'NOTE_COMMENT' AND r.cmr_target_id IN (
          SELECT mnc_id FROM amb_meeting_note_comments mc
          JOIN amb_meeting_notes mn ON mn.mtn_id = mc.mtn_id AND mn.ent_id = :entityId
          WHERE mc.mnc_author_id = :userId
        ))
      )`)
      .setParameter('entityId', entityId)
      .setParameter('userId', userId)
      .getRawOne();

    // 채팅 이모지 반응 (내 메시지에 받은)
    const receivedChatReaction = await this.talkReactionRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_talk_messages', 'm', 'm.msg_id = r.msg_id')
      .innerJoin('amb_talk_channels', 'ch', 'ch.chn_id = m.chn_id AND ch.ent_id = :entityId', { entityId })
      .where('m.usr_id = :userId', { userId })
      .andWhere('r.usr_id != :userId', { userId })
      .getRawOne();

    // 이슈 댓글 이모지 반응 (내 댓글에 받은)
    const receivedIssueCommentReaction = await this.issueCommentReactionRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_issue_comments', 'c', 'c.isc_id = r.isc_id')
      .innerJoin('amb_issues', 'i', 'i.iss_id = c.iss_id AND i.ent_id = :entityId', { entityId })
      .where('c.isc_author_id = :userId', { userId })
      .andWhere('r.usr_id != :userId', { userId })
      .getRawOne();

    const receivedRatingTotal =
      (receivedIssueRating?.sum || 0) +
      (receivedTodoRating?.sum || 0) +
      (receivedNoteRating?.sum || 0) +
      (receivedCommentRating?.sum || 0);
    const receivedRatingCount =
      (receivedIssueRating?.cnt || 0) +
      (receivedTodoRating?.cnt || 0) +
      (receivedNoteRating?.cnt || 0) +
      (receivedCommentRating?.cnt || 0);
    const receivedReactionCount =
      (receivedChatReaction?.cnt || 0) +
      (receivedIssueCommentReaction?.cnt || 0);

    // --- 내가 준 호응 ---
    const givenIssueRating = await this.issueRatingRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_issues', 'i', 'i.iss_id = r.iss_id AND i.ent_id = :entityId', { entityId })
      .where('r.usr_id = :userId', { userId })
      .getRawOne();

    const givenTodoRating = await this.todoRatingRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_todos', 't', 't.tdo_id = r.tdo_id AND t.ent_id = :entityId', { entityId })
      .where('r.usr_id = :userId', { userId })
      .getRawOne();

    const givenNoteRating = await this.noteRatingRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_meeting_notes', 'n', 'n.mtn_id = r.mtn_id AND n.ent_id = :entityId', { entityId })
      .where('r.usr_id = :userId', { userId })
      .getRawOne();

    const givenCommentRating = await this.commentRatingRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .where(`(
        (r.cmr_target_type = 'ISSUE_COMMENT' AND r.cmr_target_id IN (
          SELECT isc_id FROM amb_issue_comments ic
          JOIN amb_issues ii ON ii.iss_id = ic.iss_id AND ii.ent_id = :entityId
        ))
        OR
        (r.cmr_target_type = 'TODO_COMMENT' AND r.cmr_target_id IN (
          SELECT tcm_id FROM amb_todo_comments tc
          JOIN amb_todos tt ON tt.tdo_id = tc.tdo_id AND tt.ent_id = :entityId
        ))
        OR
        (r.cmr_target_type = 'NOTE_COMMENT' AND r.cmr_target_id IN (
          SELECT mnc_id FROM amb_meeting_note_comments mc
          JOIN amb_meeting_notes mn ON mn.mtn_id = mc.mtn_id AND mn.ent_id = :entityId
        ))
      )`)
      .setParameter('entityId', entityId)
      .andWhere('r.usr_id = :userId', { userId })
      .getRawOne();

    const givenChatReaction = await this.talkReactionRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_talk_messages', 'm', 'm.msg_id = r.msg_id')
      .innerJoin('amb_talk_channels', 'ch', 'ch.chn_id = m.chn_id AND ch.ent_id = :entityId', { entityId })
      .where('r.usr_id = :userId', { userId })
      .getRawOne();

    const givenIssueCommentReaction = await this.issueCommentReactionRepo
      .createQueryBuilder('r')
      .select('COUNT(*)::int', 'cnt')
      .innerJoin('amb_issue_comments', 'c', 'c.isc_id = r.isc_id')
      .innerJoin('amb_issues', 'i', 'i.iss_id = c.iss_id AND i.ent_id = :entityId', { entityId })
      .where('r.usr_id = :userId', { userId })
      .getRawOne();

    const givenRatingCount =
      (givenIssueRating?.cnt || 0) +
      (givenTodoRating?.cnt || 0) +
      (givenNoteRating?.cnt || 0) +
      (givenCommentRating?.cnt || 0);
    const givenReactionCount =
      (givenChatReaction?.cnt || 0) +
      (givenIssueCommentReaction?.cnt || 0);

    return {
      received: {
        ratingTotal: receivedRatingTotal,
        ratingCount: receivedRatingCount,
        ratingAvg: receivedRatingCount > 0
          ? Math.round((receivedRatingTotal / receivedRatingCount) * 100) / 100
          : 0,
        reactionCount: receivedReactionCount,
      },
      given: {
        ratingCount: givenRatingCount,
        reactionCount: givenReactionCount,
      },
    };
  }

  /** 어제 내 활동 내역 */
  async getMyYesterdayActivity(entityId: string, userId: string) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);
    const dayStart = `${dateStr} 00:00:00`;
    const dayEnd = `${dateStr} 23:59:59`;

    // 이슈 생성
    const issues = await this.issueRepo
      .createQueryBuilder('i')
      .select(['i.iss_id', 'i.iss_title'])
      .where('i.iss_reporter_id = :userId', { userId })
      .andWhere('i.ent_id = :entityId', { entityId })
      .andWhere('i.iss_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .andWhere('i.iss_deleted_at IS NULL')
      .getMany();

    // 이슈 상태 변경 (내가 변경한 것, 이슈 단위 중복 제거)
    const statusChanges = await this.issueStatusLogRepo
      .createQueryBuilder('sl')
      .select(['sl.iss_id', 'sl.isl_to_status'])
      .addSelect('i.iss_title', 'issTitle')
      .innerJoin('amb_issues', 'i', 'i.iss_id = sl.iss_id AND i.ent_id = :entityId', { entityId })
      .where('sl.isl_changed_by = :userId', { userId })
      .andWhere('sl.isl_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .distinctOn(['sl.iss_id'])
      .orderBy('sl.iss_id')
      .addOrderBy('sl.isl_created_at', 'DESC')
      .getRawMany();

    // 할일 생성
    const todos = await this.todoRepo
      .createQueryBuilder('t')
      .select(['t.tdo_id', 't.tdo_title'])
      .where('t.usr_id = :userId', { userId })
      .andWhere('t.ent_id = :entityId', { entityId })
      .andWhere('t.tdo_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .andWhere('t.tdo_deleted_at IS NULL')
      .getMany();

    // 미팅노트 생성
    const notes = await this.noteRepo
      .createQueryBuilder('n')
      .select(['n.mtn_id', 'n.mtn_title'])
      .where('n.usr_id = :userId', { userId })
      .andWhere('n.ent_id = :entityId', { entityId })
      .andWhere('n.mtn_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .andWhere('n.mtn_deleted_at IS NULL')
      .getMany();

    // 댓글 수 (이슈 + 할일 + 미팅노트)
    const issueCommentCount = await this.issueCommentRepo
      .createQueryBuilder('c')
      .innerJoin('amb_issues', 'i', 'i.iss_id = c.iss_id AND i.ent_id = :entityId', { entityId })
      .where('c.isc_author_id = :userId', { userId })
      .andWhere('c.isc_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .getCount();

    const todoCommentCount = await this.todoCommentRepo
      .createQueryBuilder('c')
      .innerJoin('amb_todos', 't', 't.tdo_id = c.tdo_id AND t.ent_id = :entityId', { entityId })
      .where('c.tcm_author_id = :userId', { userId })
      .andWhere('c.tcm_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .andWhere('c.tcm_deleted_at IS NULL')
      .getCount();

    const noteCommentCount = await this.noteCommentRepo
      .createQueryBuilder('c')
      .innerJoin('amb_meeting_notes', 'n', 'n.mtn_id = c.mtn_id AND n.ent_id = :entityId', { entityId })
      .where('c.mnc_author_id = :userId', { userId })
      .andWhere('c.mnc_created_at BETWEEN :dayStart AND :dayEnd', { dayStart, dayEnd })
      .andWhere('c.mnc_deleted_at IS NULL')
      .getCount();

    return {
      date: dateStr,
      issues: issues.map((i) => ({ id: i.issId, title: i.issTitle })),
      statusChanges: statusChanges.map((s) => ({
        issueId: s.iss_id,
        issueTitle: s.issTitle || s.iss_title,
        toStatus: s.isl_to_status,
      })),
      todos: todos.map((t) => ({ id: t.tdoId, title: t.tdoTitle })),
      notes: notes.map((n) => ({ id: n.mtnId, title: n.mtnTitle })),
      commentCount: issueCommentCount + todoCommentCount + noteCommentCount,
    };
  }
}
