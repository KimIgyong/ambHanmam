import {
  MeetingNoteResponse, NoteType, MeetingNoteCommentResponse,
} from '@amb/types';
import { MeetingNoteEntity } from '../entity/meeting-note.entity';
import { MeetingNoteCommentEntity } from '../entity/meeting-note-comment.entity';

export class MeetingNoteMapper {
  static toResponse(
    entity: MeetingNoteEntity,
    extra?: { commentCount?: number; avgRating?: number | null; ratingCount?: number; myRating?: number | null },
  ): MeetingNoteResponse {
    return {
      meetingNoteId: entity.mtnId,
      userId: entity.usrId,
      authorName: entity.user?.usrName || '',
      title: entity.mtnTitle,
      content: entity.mtnContent,
      type: (entity.mtnType || 'MEMO') as NoteType,
      meetingDate: entity.mtnMeetingDate instanceof Date
        ? entity.mtnMeetingDate.toISOString().split('T')[0]
        : String(entity.mtnMeetingDate),
      visibility: entity.mtnVisibility as MeetingNoteResponse['visibility'],
      unit: entity.mtnUnit || null,
      cellId: entity.mtnCellId || null,
      originalLang: entity.mtnOriginalLang || 'ko',
      assigneeId: entity.mtnAssigneeId || null,
      assigneeName: entity.assignee?.usrName || null,
      folderId: entity.mtnFolderId || null,
      folderName: entity.folder?.mnfName || null,
      participants: (entity.participants || []).map((p) => ({
        userId: p.usrId,
        name: p.user?.usrName || '',
      })),
      projects: (entity.projects || []).map((p) => ({
        projectId: p.pjtId,
        name: p.project?.pjtName || '',
        code: p.project?.pjtCode || '',
      })),
      issues: (entity.issues || []).map((i) => ({
        issueId: i.issId,
        title: i.issue?.issTitle || '',
        status: i.issue?.issStatus || '',
      })),
      commentCount: extra?.commentCount ?? 0,
      avgRating: extra?.avgRating ?? null,
      ratingCount: extra?.ratingCount ?? 0,
      myRating: extra?.myRating ?? null,
      createdAt: entity.mtnCreatedAt.toISOString(),
      updatedAt: entity.mtnUpdatedAt.toISOString(),
    };
  }

  static toCommentResponse(entity: MeetingNoteCommentEntity): MeetingNoteCommentResponse {
    return {
      commentId: entity.mncId,
      meetingNoteId: entity.mtnId,
      authorId: entity.mncAuthorId,
      authorName: entity.author?.usrName || '',
      content: entity.mncContent,
      parentId: entity.mncParentId || null,
      createdAt: entity.mncCreatedAt.toISOString(),
      replies: entity.replies?.map(MeetingNoteMapper.toCommentResponse) || [],
    };
  }
}
