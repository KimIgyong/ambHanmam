export interface SSEMessage {
  event: 'message' | 'done' | 'error';
  data: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}
