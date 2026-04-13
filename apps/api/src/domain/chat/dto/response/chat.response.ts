export class ConversationResponse {
  conversationId: string;
  userId: string;
  unit: string;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export class MessageResponse {
  messageId: string;
  conversationId: string;
  role: string;
  content: string;
  tokenCount: number;
  order: number;
  createdAt: string;
}

export class ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[];
}

export class AdminConversationResponse extends ConversationResponse {
  userName: string;
  userEmail: string;
  entityId: string | null;
  entityCode: string;
  entityName: string;
}

export class AdminConversationDetailResponse extends ConversationDetailResponse {
  userName: string;
  userEmail: string;
  entityId: string | null;
  entityCode: string;
  entityName: string;
}

export class AdminTimelineMessageResponse extends MessageResponse {
  userName: string;
  userEmail: string;
  unit: string;
  title: string;
  entityId: string | null;
  entityCode: string;
  entityName: string;
}
