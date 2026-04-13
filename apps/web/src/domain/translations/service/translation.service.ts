import { apiClient } from '@/lib/api-client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const translationService = {
  getTranslations: (sourceType: string, sourceId: string) =>
    apiClient.get(`/translations/${sourceType}/${sourceId}`),

  getTranslation: (sourceType: string, sourceId: string, targetLang: string) =>
    apiClient.get(`/translations/${sourceType}/${sourceId}/${targetLang}`),

  saveTranslation: (dto: {
    source_type: string;
    source_id: string;
    target_lang: string;
    translated_content: Record<string, string>;
    method?: string;
  }) => apiClient.post('/translations/save', dto),

  updateTranslation: (trnId: string, dto: { content: string; change_reason?: string }) =>
    apiClient.patch(`/translations/${trnId}`, dto),

  lockTranslation: (trnId: string) =>
    apiClient.patch(`/translations/${trnId}/lock`),

  unlockTranslation: (trnId: string) =>
    apiClient.patch(`/translations/${trnId}/unlock`),

  getHistory: (trnId: string) =>
    apiClient.get(`/translations/${trnId}/history`),

  /** SSE 스트리밍 번역 요청 */
  translateSSE: (_dto: {
    source_type: string;
    source_id: string;
    source_fields: string[];
    target_lang: string;
  }): EventSource => {
    // EventSource는 GET만 지원하므로 fetch + ReadableStream 사용
    // 대신 커스텀 SSE를 반환
    const url = `${API_BASE_URL}/translations/translate`;
    const eventSource = new EventSource(url, { withCredentials: true });
    return eventSource;
  },

  /** fetch 기반 SSE 스트리밍 번역 (POST 지원) */
  translateStreamFetch: async (
    dto: {
      source_type: string;
      source_id: string;
      source_fields: string[];
      target_lang: string;
    },
    onData: (data: any) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): Promise<AbortController> => {
    const controller = new AbortController();
    try {
      const response = await fetch(`${API_BASE_URL}/translations/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('amb-lang') || 'en',
        },
        credentials: 'include',
        body: JSON.stringify(dto),
        signal: controller.signal,
      });

      if (!response.ok) {
        onError(`HTTP ${response.status}`);
        return controller;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No readable stream');
        return controller;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          onDone();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              onData(parsed);
              if (parsed.done) {
                onDone();
                return;
              }
            } catch {
              // partial JSON, skip
            }
          }
        }

        await read();
      };

      read().catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message || 'Stream error');
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Network error');
      }
    }

    return controller;
  },

  /** fetch 기반 SSE 스트리밍 - DB 저장 없이 순수 텍스트 번역 */
  translateTextStreamFetch: async (
    dto: {
      text: string;
      source_lang?: string;
      target_lang: string;
    },
    onData: (data: any) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): Promise<AbortController> => {
    const controller = new AbortController();
    try {
      const response = await fetch(`${API_BASE_URL}/translations/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': localStorage.getItem('amb-lang') || 'en',
        },
        credentials: 'include',
        body: JSON.stringify(dto),
        signal: controller.signal,
      });

      if (!response.ok) {
        onError(`HTTP ${response.status}`);
        return controller;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No readable stream');
        return controller;
      }

      const decoder = new TextDecoder();
      let buffer = '';

      const read = async () => {
        const { done, value } = await reader.read();
        if (done) {
          onDone();
          return;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              onData(parsed);
              if (parsed.done) {
                onDone();
                return;
              }
            } catch {
              // partial JSON, skip
            }
          }
        }

        await read();
      };

      read().catch((err) => {
        if (err.name !== 'AbortError') {
          onError(err.message || 'Stream error');
        }
      });
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        onError(err.message || 'Network error');
      }
    }

    return controller;
  },

  // Glossary
  getGlossary: () => apiClient.get('/glossary'),
  createTerm: (dto: { term_en: string; term_ko?: string; term_vi?: string; category?: string; context?: string }) =>
    apiClient.post('/glossary', dto),
  updateTerm: (glsId: string, dto: { term_en?: string; term_ko?: string; term_vi?: string; category?: string; context?: string }) =>
    apiClient.patch(`/glossary/${glsId}`, dto),
  deleteTerm: (glsId: string) =>
    apiClient.delete(`/glossary/${glsId}`),

  // Original language
  updateOriginalLang: (sourceType: string, sourceId: string, originalLang: string) =>
    apiClient.patch(`/translations/source/${sourceType}/${sourceId}/original-lang`, { original_lang: originalLang }),
};
