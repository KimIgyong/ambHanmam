/** 알림 유형 */
export const NOTIFICATION_TYPE = {
  TODO_ASSIGNED: 'TODO_ASSIGNED',
  ISSUE_ASSIGNED: 'ISSUE_ASSIGNED',
  ISSUE_STATUS_CHANGED: 'ISSUE_STATUS_CHANGED',
  NOTE_ASSIGNED: 'NOTE_ASSIGNED',
  CALENDAR_INVITED: 'CALENDAR_INVITED',
  COMMENT_MENTION: 'COMMENT_MENTION',
  COMMENT_REACTION: 'COMMENT_REACTION',
  CONTENT_RATING: 'CONTENT_RATING',
  TALK_MESSAGE: 'TALK_MESSAGE',
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];

/** 알림 리소스 유형 */
export const NOTIFICATION_RESOURCE_TYPE = {
  TODO: 'TODO',
  ISSUE: 'ISSUE',
  MEETING_NOTE: 'MEETING_NOTE',
  CALENDAR: 'CALENDAR',
} as const;

export type NotificationResourceType =
  (typeof NOTIFICATION_RESOURCE_TYPE)[keyof typeof NOTIFICATION_RESOURCE_TYPE];

/** 담당자 지정 이벤트명 */
export const ASSIGNEE_EVENT = 'assignee.assigned' as const;

/** 담당자 역할 */
export const ASSIGNEE_ROLE = {
  ASSIGNEE: 'ASSIGNEE',
  PARTICIPANT: 'PARTICIPANT',
} as const;

export type AssigneeRole =
  (typeof ASSIGNEE_ROLE)[keyof typeof ASSIGNEE_ROLE];

/** 담당자 지정 이벤트 페이로드 */
export interface AssigneeAssignedEvent {
  type: NotificationType;
  resourceType: NotificationResourceType;
  resourceId: string;
  resourceTitle: string;
  senderId: string;
  senderName: string;
  recipientIds: string[];
  entityId: string;
  role: AssigneeRole;
}

/** 이슈 상태 변경 이벤트명 */
export const ISSUE_STATUS_EVENT = 'issue.status_changed' as const;

/** 이슈 상태 변경 이벤트 페이로드 */
export interface IssueStatusChangedEvent {
  issueId: string;
  issueTitle: string;
  fromStatus: string;
  toStatus: string;
  changerId: string;
  changerName: string;
  reporterId: string;
  assigneeId: string | null;
  participantIds: string[];
  entityId: string;
}

/** 코멘트 멘션 이벤트명 */
export const MENTION_EVENT = 'comment.mention' as const;

/** 코멘트 멘션 이벤트 페이로드 */
export interface CommentMentionEvent {
  resourceType: NotificationResourceType;
  resourceId: string;
  resourceTitle: string;
  commentId: string;
  senderId: string;
  senderName: string;
  recipientIds: string[];
  entityId: string;
}

/** 리액션 이벤트명 */
export const REACTION_EVENT = 'comment.reaction' as const;

/** 리액션 이벤트 페이로드 */
export interface CommentReactionEvent {
  resourceType: NotificationResourceType;
  resourceId: string;
  resourceTitle: string;
  commentId: string;
  reactionType: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  entityId: string;
}

/** 별점 이벤트명 */
export const RATING_EVENT = 'content.rating' as const;

/** 별점 이벤트 페이로드 */
export interface ContentRatingEvent {
  resourceType: NotificationResourceType;
  resourceId: string;
  resourceTitle: string;
  rating: number;
  senderId: string;
  senderName: string;
  recipientId: string;
  entityId: string;
}
