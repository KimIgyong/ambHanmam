import { Injectable, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IssueRatingEntity } from '../entity/issue-rating.entity';
import { TodoRatingEntity } from '../entity/todo-rating.entity';
import { CommentRatingEntity } from '../entity/comment-rating.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { IssueCommentEntity } from '../../issues/entity/issue-comment.entity';
import { TodoCommentEntity } from '../../todo/entity/todo-comment.entity';
import { MeetingNoteCommentEntity } from '../../meeting-notes/entity/meeting-note-comment.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import {
  RATING_EVENT,
  NOTIFICATION_RESOURCE_TYPE,
} from '../../notification/constant/notification-type.constant';

@Injectable()
export class ContentRatingService {
  private readonly logger = new Logger(ContentRatingService.name);

  constructor(
    @InjectRepository(IssueRatingEntity)
    private readonly issueRatingRepo: Repository<IssueRatingEntity>,
    @InjectRepository(TodoRatingEntity)
    private readonly todoRatingRepo: Repository<TodoRatingEntity>,
    @InjectRepository(CommentRatingEntity)
    private readonly commentRatingRepo: Repository<CommentRatingEntity>,
    @InjectRepository(IssueEntity)
    private readonly issueRepo: Repository<IssueEntity>,
    @InjectRepository(TodoEntity)
    private readonly todoRepo: Repository<TodoEntity>,
    @InjectRepository(IssueCommentEntity)
    private readonly issueCommentRepo: Repository<IssueCommentEntity>,
    @InjectRepository(TodoCommentEntity)
    private readonly todoCommentRepo: Repository<TodoCommentEntity>,
    @InjectRepository(MeetingNoteCommentEntity)
    private readonly noteCommentRepo: Repository<MeetingNoteCommentEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── Issue Rating ───────────────────────────────────────────

  async upsertIssueRating(issueId: string, userId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const issue = await this.issueRepo.findOne({ where: { issId: issueId } });
    if (!issue) throw new BadRequestException('Issue not found');
    if (issue.issReporterId === userId) {
      throw new ForbiddenException('Cannot rate your own content');
    }

    const existing = await this.issueRatingRepo.findOne({
      where: { issId: issueId, usrId: userId },
    });
    if (existing) {
      existing.isrRating = rating;
      await this.issueRatingRepo.save(existing);
    } else {
      await this.issueRatingRepo.save(
        this.issueRatingRepo.create({ issId: issueId, usrId: userId, isrRating: rating }),
      );
    }

    // 별점 알림 발행 (이슈 작성자에게)
    try {
      const user = await this.userRepo.findOne({ where: { usrId: userId }, select: ['usrId', 'usrName'] });
      if (user && issue.issReporterId) {
        this.eventEmitter.emit(RATING_EVENT, {
          resourceType: NOTIFICATION_RESOURCE_TYPE.ISSUE,
          resourceId: issueId,
          resourceTitle: issue.issTitle,
          rating,
          senderId: userId,
          senderName: user.usrName || '',
          recipientId: issue.issReporterId,
          entityId: issue.entId,
        });
      }
    } catch (err) {
      this.logger.warn(`Failed to emit rating notification: ${err.message}`);
    }
  }

  async deleteIssueRating(issueId: string, userId: string): Promise<void> {
    const existing = await this.issueRatingRepo.findOne({
      where: { issId: issueId, usrId: userId },
    });
    if (existing) await this.issueRatingRepo.remove(existing);
  }

  async getIssueRatingStats(
    issueIds: string[],
  ): Promise<Record<string, { avg: number; count: number }>> {
    if (!issueIds.length) return {};
    const rows = await this.issueRatingRepo
      .createQueryBuilder('r')
      .select('r.iss_id', 'targetId')
      .addSelect('AVG(r.isr_rating)::float', 'avg')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.iss_id IN (:...ids)', { ids: issueIds })
      .groupBy('r.iss_id')
      .getRawMany();
    const map: Record<string, { avg: number; count: number }> = {};
    rows.forEach((r) => {
      map[r.targetId] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
    });
    return map;
  }

  async getMyIssueRatings(
    issueIds: string[],
    userId: string,
  ): Promise<Record<string, number>> {
    if (!issueIds.length) return {};
    const rows = await this.issueRatingRepo
      .createQueryBuilder('r')
      .select('r.iss_id', 'targetId')
      .addSelect('r.isr_rating', 'rating')
      .where('r.iss_id IN (:...ids)', { ids: issueIds })
      .andWhere('r.usr_id = :userId', { userId })
      .getRawMany();
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.targetId] = r.rating; });
    return map;
  }

  // ─── Todo Rating ────────────────────────────────────────────

  async upsertTodoRating(todoId: string, userId: string, rating: number): Promise<void> {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const todo = await this.todoRepo.findOne({ where: { tdoId: todoId } });
    if (!todo) throw new BadRequestException('Todo not found');
    if (todo.usrId === userId) {
      throw new ForbiddenException('Cannot rate your own content');
    }

    const existing = await this.todoRatingRepo.findOne({
      where: { tdoId: todoId, usrId: userId },
    });
    if (existing) {
      existing.tdrRating = rating;
      await this.todoRatingRepo.save(existing);
    } else {
      await this.todoRatingRepo.save(
        this.todoRatingRepo.create({ tdoId: todoId, usrId: userId, tdrRating: rating }),
      );
    }
  }

  async deleteTodoRating(todoId: string, userId: string): Promise<void> {
    const existing = await this.todoRatingRepo.findOne({
      where: { tdoId: todoId, usrId: userId },
    });
    if (existing) await this.todoRatingRepo.remove(existing);
  }

  async getTodoRatingStats(
    todoIds: string[],
  ): Promise<Record<string, { avg: number; count: number }>> {
    if (!todoIds.length) return {};
    const rows = await this.todoRatingRepo
      .createQueryBuilder('r')
      .select('r.tdo_id', 'targetId')
      .addSelect('AVG(r.tdr_rating)::float', 'avg')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.tdo_id IN (:...ids)', { ids: todoIds })
      .groupBy('r.tdo_id')
      .getRawMany();
    const map: Record<string, { avg: number; count: number }> = {};
    rows.forEach((r) => {
      map[r.targetId] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
    });
    return map;
  }

  async getMyTodoRatings(
    todoIds: string[],
    userId: string,
  ): Promise<Record<string, number>> {
    if (!todoIds.length) return {};
    const rows = await this.todoRatingRepo
      .createQueryBuilder('r')
      .select('r.tdo_id', 'targetId')
      .addSelect('r.tdr_rating', 'rating')
      .where('r.tdo_id IN (:...ids)', { ids: todoIds })
      .andWhere('r.usr_id = :userId', { userId })
      .getRawMany();
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.targetId] = r.rating; });
    return map;
  }

  // ─── Comment Rating (통합) ──────────────────────────────────

  async upsertCommentRating(
    targetType: string,
    targetId: string,
    userId: string,
    rating: number,
  ): Promise<void> {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');

    const validTypes = ['ISSUE_COMMENT', 'TODO_COMMENT', 'NOTE_COMMENT'];
    if (!validTypes.includes(targetType)) {
      throw new BadRequestException('Invalid comment type');
    }

    // 자기평가 방지: 코멘트 작성자 확인
    const authorId = await this.getCommentAuthorId(targetType, targetId);
    if (!authorId) throw new BadRequestException('Comment not found');
    if (authorId === userId) {
      throw new ForbiddenException('Cannot rate your own content');
    }

    const existing = await this.commentRatingRepo.findOne({
      where: { cmrTargetType: targetType, cmrTargetId: targetId, usrId: userId },
    });
    if (existing) {
      existing.cmrRating = rating;
      await this.commentRatingRepo.save(existing);
    } else {
      await this.commentRatingRepo.save(
        this.commentRatingRepo.create({
          cmrTargetType: targetType,
          cmrTargetId: targetId,
          usrId: userId,
          cmrRating: rating,
        }),
      );
    }
  }

  async deleteCommentRating(targetType: string, targetId: string, userId: string): Promise<void> {
    const existing = await this.commentRatingRepo.findOne({
      where: { cmrTargetType: targetType, cmrTargetId: targetId, usrId: userId },
    });
    if (existing) await this.commentRatingRepo.remove(existing);
  }

  async getCommentRatingStats(
    targetType: string,
    targetIds: string[],
  ): Promise<Record<string, { avg: number; count: number }>> {
    if (!targetIds.length) return {};
    const rows = await this.commentRatingRepo
      .createQueryBuilder('r')
      .select('r.cmr_target_id', 'targetId')
      .addSelect('AVG(r.cmr_rating)::float', 'avg')
      .addSelect('COUNT(*)::int', 'count')
      .where('r.cmr_target_type = :targetType', { targetType })
      .andWhere('r.cmr_target_id IN (:...ids)', { ids: targetIds })
      .groupBy('r.cmr_target_id')
      .getRawMany();
    const map: Record<string, { avg: number; count: number }> = {};
    rows.forEach((r) => {
      map[r.targetId] = { avg: Math.round(r.avg * 10) / 10, count: r.count };
    });
    return map;
  }

  async getMyCommentRatings(
    targetType: string,
    targetIds: string[],
    userId: string,
  ): Promise<Record<string, number>> {
    if (!targetIds.length) return {};
    const rows = await this.commentRatingRepo
      .createQueryBuilder('r')
      .select('r.cmr_target_id', 'targetId')
      .addSelect('r.cmr_rating', 'rating')
      .where('r.cmr_target_type = :targetType', { targetType })
      .andWhere('r.cmr_target_id IN (:...ids)', { ids: targetIds })
      .andWhere('r.usr_id = :userId', { userId })
      .getRawMany();
    const map: Record<string, number> = {};
    rows.forEach((r) => { map[r.targetId] = r.rating; });
    return map;
  }

  // ─── Helper ─────────────────────────────────────────────────

  private async getCommentAuthorId(targetType: string, targetId: string): Promise<string | null> {
    switch (targetType) {
      case 'ISSUE_COMMENT': {
        const c = await this.issueCommentRepo.findOne({ where: { iscId: targetId } });
        return c?.iscAuthorId ?? null;
      }
      case 'TODO_COMMENT': {
        const c = await this.todoCommentRepo.findOne({ where: { tcmId: targetId } });
        return c?.tcmAuthorId ?? null;
      }
      case 'NOTE_COMMENT': {
        const c = await this.noteCommentRepo.findOne({ where: { mncId: targetId } });
        return c?.mncAuthorId ?? null;
      }
      default:
        return null;
    }
  }
}
