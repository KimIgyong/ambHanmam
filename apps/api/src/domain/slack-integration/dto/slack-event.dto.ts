export interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  type: 'url_verification' | 'event_callback';
  challenge?: string;
  event?: SlackMessageEvent;
  event_id?: string;
  event_time?: number;
}

export interface SlackMessageEvent {
  type: string;
  subtype?: string;
  channel: string;
  user?: string;
  text?: string;
  ts: string;
  thread_ts?: string;
  bot_id?: string;
  message?: {
    text: string;
    ts: string;
    user?: string;
  };
  previous_message?: {
    ts: string;
  };
}
