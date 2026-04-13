import { useEffect, useRef } from 'react';
import { useNotificationStore, NotificationItem } from '../store/notification.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/**
 * 알림 SSE 스트림 연결 훅
 * - 로그인 상태에서 SSE 연결을 유지
 * - 새 알림 수신 시 화면 중앙 모달 팝업 표시
 * - Zustand 스토어 업데이트 (미읽음 카운트)
 */
export function useNotificationSSE() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const { addNotification, addToModalQueue } = useNotificationStore();
  const isAuthenticated = useAuthStore((s: { isAuthenticated: boolean }) => s.isAuthenticated);
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const entityId = currentEntity?.entityId;

  useEffect(() => {
    if (!isAuthenticated || !entityId) return;

    const url = `${API_BASE_URL}/notifications/stream?entityId=${entityId}`;
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const notification: NotificationItem = JSON.parse(event.data);

        // TALK_MESSAGE는 DB 저장 안 하므로 알림벨 목록에는 추가하지 않음
        if (notification.ntfType !== 'TALK_MESSAGE') {
          addNotification(notification);
        }

        // 모달 큐에 추가 → 화면 중앙 모달로 표시
        addToModalQueue(notification);
      } catch (err) {
        console.error('[NotificationSSE] Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      console.warn('[NotificationSSE] Connection error, will auto-reconnect');
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, entityId, addNotification, addToModalQueue]);
}
