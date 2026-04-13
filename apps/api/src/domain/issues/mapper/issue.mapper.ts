import { IssueResponse, IssueCommentResponse, IssueStatusLogResponse, IssueParticipantResponse } from '@amb/types';
import { IssueEntity } from '../entity/issue.entity';
import { IssueCommentEntity } from '../entity/issue-comment.entity';
import { IssueStatusLogEntity } from '../entity/issue-status-log.entity';
import { IssueParticipantEntity } from '../entity/issue-participant.entity';

export class IssueMapper {
  static toResponse(
    entity: IssueEntity,
    commentCount = 0,
    participants?: IssueParticipantEntity[],
    ratingExtra?: { avgRating?: number | null; ratingCount?: number; myRating?: number | null },
  ): IssueResponse {
    return {
      issueId: entity.issId,
      entityId: entity.entId || null,
      type: entity.issType as IssueResponse['type'],
      title: entity.issTitle,
      description: entity.issDescription,
      severity: entity.issSeverity as IssueResponse['severity'],
      status: entity.issStatus as IssueResponse['status'],
      priority: entity.issPriority,
      reporterId: entity.issReporterId,
      reporterName: entity.reporter?.usrName || '',
      assignee: entity.assignee?.usrName || entity.issAssignee || null,
      assigneeId: entity.assignee?.usrId || entity.issAssigneeId || null,
      assigneeName: entity.assignee?.usrName || entity.issAssignee || null,
      visibility: (entity.issVisibility || 'ENTITY') as IssueResponse['visibility'],
      cellId: entity.issCellId || null,
      originalLang: entity.issOriginalLang || 'ko',
      githubId: entity.issGithubId != null ? String(entity.issGithubId) : null,
      affectedModules: entity.issAffectedModules || [],
      resolution: entity.issResolution || null,
      aiAnalysis: entity.issAiAnalysis || null,
      commentCount,
      projectId: entity.pjtId || null,
      projectName: entity.project?.pjtName || null,
      projectCode: entity.project?.pjtCode || null,
      projectManagerId: entity.project?.pjtManagerId || null,
      epicId: entity.epcId || null,
      epicTitle: entity.epic?.epcTitle || null,
      epicColor: entity.epic?.epcColor || null,
      componentId: entity.cmpId || null,
      componentTitle: entity.component?.cmpTitle || null,
      componentColor: entity.component?.cmpColor || null,
      parentIssueId: entity.issParentId || null,
      parentIssueTitle: entity.parentIssue?.issTitle || null,
      googleDriveLink: entity.issGoogleDriveLink || null,
      refNumber: entity.issRefNumber || null,
      redmineId: entity.issRedmineId || null,
      startDate: entity.issStartDate || null,
      dueDate: entity.issDueDate || null,
      doneRatio: entity.issDoneRatio ?? 0,
      resolvedAt: entity.issResolvedAt ? entity.issResolvedAt.toISOString() : null,
      avgRating: ratingExtra?.avgRating ?? null,
      ratingCount: ratingExtra?.ratingCount ?? 0,
      myRating: ratingExtra?.myRating ?? null,
      createdAt: entity.issCreatedAt.toISOString(),
      updatedAt: entity.issUpdatedAt.toISOString(),
      participants: participants ? participants.map(IssueMapper.toParticipantResponse) : undefined,
    };
  }

  static toCommentResponse(entity: IssueCommentEntity): IssueCommentResponse {
    return {
      commentId: entity.iscId,
      issueId: entity.issId,
      authorId: entity.iscAuthorId,
      authorName: entity.author?.usrName || '',
      authorType: entity.iscAuthorType as IssueCommentResponse['authorType'],
      content: entity.iscContent,
      issueStatus: entity.iscIssueStatus || undefined,
      parentId: entity.iscParentId || null,
      clientVisible: entity.iscClientVisible ?? false,
      createdAt: entity.iscCreatedAt.toISOString(),
      replies: entity.replies?.map((r) => IssueMapper.toCommentResponse(r)) || [],
    };
  }

  static toParticipantResponse(entity: IssueParticipantEntity): IssueParticipantResponse {
    return {
      participantId: entity.ispId,
      userId: entity.usrId,
      userName: entity.user?.usrName || '',
      role: entity.ispRole as 'PARTICIPANT' | 'FORMER_ASSIGNEE',
      createdAt: entity.ispCreatedAt.toISOString(),
    };
  }

  static toStatusLogResponse(entity: IssueStatusLogEntity): IssueStatusLogResponse {
    return {
      logId: entity.islId,
      issueId: entity.issId,
      changeType: entity.islChangeType || 'STATUS',
      fromStatus: entity.islFromStatus,
      toStatus: entity.islToStatus,
      changedBy: entity.islChangedBy,
      changedByName: entity.changedByUser?.usrName || '',
      note: entity.islNote || null,
      createdAt: entity.islCreatedAt.toISOString(),
    };
  }
}
