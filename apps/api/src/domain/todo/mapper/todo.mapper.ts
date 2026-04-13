import { TodoResponse, TodoStatusLogResponse, TodoCommentResponse, TodoParticipantResponse } from '@amb/types';
import { TodoEntity } from '../entity/todo.entity';
import { TodoStatusLogEntity } from '../entity/todo-status-log.entity';
import { TodoCommentEntity } from '../entity/todo-comment.entity';
import { TodoParticipantEntity } from '../entity/todo-participant.entity';
import { computeTodoStatus, computeDaysFromToday } from '../utils/compute-todo-status.util';

export class TodoMapper {
  static toResponse(
    entity: TodoEntity,
    commentCount = 0,
    ratingExtra?: { avgRating?: number | null; ratingCount?: number; myRating?: number | null },
  ): TodoResponse {
    const computed = computeTodoStatus({
      completedAt: entity.tdoCompletedAt,
      startDate: entity.tdoStartDate,
      dueDate: entity.tdoDueDate,
    });

    return {
      todoId: entity.tdoId,
      userId: entity.usrId,
      userName: entity.user?.usrName || undefined,
      title: entity.tdoTitle,
      description: entity.tdoDescription || null,
      status: entity.tdoStatus as TodoResponse['status'],
      dueDate: entity.tdoDueDate
        ? (entity.tdoDueDate instanceof Date
          ? entity.tdoDueDate.toISOString().split('T')[0]
          : String(entity.tdoDueDate))
        : null,
      startDate: entity.tdoStartDate
        ? (entity.tdoStartDate instanceof Date
          ? entity.tdoStartDate.toISOString().split('T')[0]
          : String(entity.tdoStartDate))
        : null,
      computedStatus: computed,
      daysUntilDue: computeDaysFromToday(entity.tdoDueDate),
      daysUntilStart: computeDaysFromToday(entity.tdoStartDate),
      tags: entity.tdoTags || null,
      completedAt: entity.tdoCompletedAt ? entity.tdoCompletedAt.toISOString() : null,
      startedAt: entity.tdoStartedAt ? entity.tdoStartedAt.toISOString() : null,
      commentCount,
      issueId: entity.issId || null,
      issueTitle: entity.issue?.issTitle || null,
      projectId: entity.pjtId || null,
      projectName: entity.project?.pjtName || null,
      originalLang: entity.tdoOriginalLang || 'ko',
      participants: entity.participants?.map(TodoMapper.toParticipantResponse) || [],
      recurrenceType: entity.tdoRecurrenceType || null,
      recurrenceDay: entity.tdoRecurrenceDay ?? null,
      parentId: entity.tdoParentId || null,
      avgRating: ratingExtra?.avgRating ?? null,
      ratingCount: ratingExtra?.ratingCount ?? 0,
      myRating: ratingExtra?.myRating ?? null,
      createdAt: entity.tdoCreatedAt.toISOString(),
      updatedAt: entity.tdoUpdatedAt.toISOString(),
    };
  }

  static toCommentResponse(entity: TodoCommentEntity): TodoCommentResponse {
    return {
      commentId: entity.tcmId,
      todoId: entity.tdoId,
      authorId: entity.tcmAuthorId,
      authorName: entity.author?.usrName || '',
      content: entity.tcmContent,
      createdAt: entity.tcmCreatedAt.toISOString(),
      updatedAt: entity.tcmUpdatedAt.toISOString(),
    };
  }

  static toStatusLogResponse(entity: TodoStatusLogEntity): TodoStatusLogResponse {
    return {
      logId: entity.tslId,
      todoId: entity.tdoId,
      fromStatus: entity.tslFromStatus,
      toStatus: entity.tslToStatus,
      changedBy: entity.tslChangedBy,
      changedAt: entity.tslChangedAt.toISOString(),
      note: entity.tslNote || null,
    };
  }

  static toParticipantResponse(entity: TodoParticipantEntity): TodoParticipantResponse {
    return {
      participantId: entity.tptId,
      userId: entity.usrId,
      userName: entity.user?.usrName || '',
      createdAt: entity.tptCreatedAt.toISOString(),
    };
  }
}
