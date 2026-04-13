export const SLACK_OUTBOUND_EVENTS = {
  MESSAGE_CREATED: 'slack.outbound.message.created',
};

export interface SlackOutboundMessageEvent {
  channelId: string;
  messageId: string;
  content: string;
  senderName: string;
  parentId?: string;
}
