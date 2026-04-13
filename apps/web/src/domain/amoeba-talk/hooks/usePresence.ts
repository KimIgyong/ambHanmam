import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { talkService } from '../service/talk.service';
import { useTalkStore } from '../store/talk.store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const HEARTBEAT_INTERVAL = 30_000; // 30초
const IDLE_TIMEOUT = 5 * 60_000; // 5분

/**
 * 30초마다 하트비트를 서버에 전송.
 * 탭 비활성 또는 5분 유휴 시 하트비트 중단.
 */
export function usePresenceHeartbeat() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);

  const startHeartbeat = useCallback(() => {
    if (intervalRef.current) return;
    isIdleRef.current = false;
    talkService.sendHeartbeat().catch(() => {});
    intervalRef.current = setInterval(() => {
      talkService.sendHeartbeat().catch(() => {});
    }, HEARTBEAT_INTERVAL);
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (isIdleRef.current) {
      isIdleRef.current = false;
      startHeartbeat();
    }
    idleTimerRef.current = setTimeout(() => {
      isIdleRef.current = true;
      stopHeartbeat();
    }, IDLE_TIMEOUT);
  }, [startHeartbeat, stopHeartbeat]);

  useEffect(() => {
    if (!isAuthenticated) return;

    startHeartbeat();
    resetIdleTimer();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopHeartbeat();
      } else {
        startHeartbeat();
        resetIdleTimer();
      }
    };

    const handleActivity = () => resetIdleTimer();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keydown', handleActivity);

    return () => {
      stopHeartbeat();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keydown', handleActivity);
    };
  }, [isAuthenticated, startHeartbeat, stopHeartbeat, resetIdleTimer]);
}

/**
 * 사용자 목록의 온라인 상태를 조회 (React Query).
 * 결과를 presenceMap store에 동기화.
 */
export function usePresenceStatus(userIds: string[]) {
  const setPresenceMap = useTalkStore((s) => s.setPresenceMap);

  const query = useQuery({
    queryKey: ['presence', 'status', userIds.sort().join(',')],
    queryFn: () => talkService.getPresenceStatus(userIds),
    enabled: userIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (query.data) {
      setPresenceMap(query.data);
    }
  }, [query.data, setPresenceMap]);

  return query;
}

/**
 * 전역 Presence SSE 연결.
 * presence:update 이벤트 수신 시 Zustand store 업데이트.
 */
export function usePresenceSSE() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setPresence = useTalkStore((s) => s.setPresence);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    const url = `${API_BASE_URL}/talk/presence/events`;
    const es = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = es;

    es.onopen = () => {
      retryCountRef.current = 0;
    };

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'presence:update' && parsed.data) {
          setPresence(parsed.data.userId, parsed.data.status);
        }
      } catch {
        // skip malformed data
      }
    };

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      if (retryCountRef.current < 5) {
        const delay = 2000 * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        retryTimerRef.current = setTimeout(() => connect(), delay);
      }
    };
  }, [setPresence]);

  useEffect(() => {
    if (!isAuthenticated) return;

    retryCountRef.current = 0;
    connect();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [isAuthenticated, connect]);
}
