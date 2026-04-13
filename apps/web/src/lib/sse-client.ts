import { useEntityStore } from '@/domain/hr/store/entity.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface SSECallbacks {
  onMessage: (content: string) => void;
  onDone: (fullContent: string, stopReason?: string) => void;
  onError: (error: string, errorCode?: string) => void;
}

export async function sendMessageSSE(
  conversationId: string,
  content: string,
  callbacks: SSECallbacks,
): Promise<void> {
  const entityId = useEntityStore.getState().currentEntity?.entityId;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept-Language': localStorage.getItem('amb-lang') || 'en',
  };
  if (entityId) {
    headers['X-Entity-Id'] = entityId;
  }

  const response = await fetch(
    `${API_BASE_URL}/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json();
    callbacks.onError(errorData.error?.message || 'Request failed', errorData.error?.code);
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError('No response body');
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.error) {
            callbacks.onError(data.error, data.code);
            return;
          }
          if (data.done) {
            callbacks.onDone(data.fullContent || fullContent, data.stopReason);
            return;
          }
          if (data.content) {
            fullContent += data.content;
            callbacks.onMessage(data.content);
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  if (fullContent) {
    callbacks.onDone(fullContent, 'interrupted');
  }
}
