import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useTalkStore } from '../store/talk.store';
import { talkKeys } from './useTalk';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const MAX_RETRIES = 5;
const BASE_DELAY = 2000;
const BC_CHANNEL_NAME = 'talk-sse';

export function useTalkSSE(channelId: string | null) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setTypingUser = useTalkStore((s) => s.setTypingUser);
  const clearTypingUser = useTalkStore((s) => s.clearTypingUser);
  const setCurrentChannelId = useTalkStore((s) => s.setCurrentChannelId);
  const currentUserId = useAuthStore((s) => s.user?.userId);

  const handleEvent = useCallback(
    (chnId: string, parsed: { type?: string; data?: Record<string, unknown> }) => {
      if (parsed.type?.startsWith('message:')) {
        queryClient.invalidateQueries({ queryKey: talkKeys.messages(chnId) });
        queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
        if (parsed.type === 'message:pin') {
          queryClient.invalidateQueries({ queryKey: talkKeys.pinnedMessages(chnId) });
        }
      }
      if (parsed.type === 'channel:read') {
        queryClient.invalidateQueries({ queryKey: talkKeys.messages(chnId) });
      }
      if (parsed.type?.startsWith('member:')) {
        queryClient.invalidateQueries({ queryKey: talkKeys.channelDetail(chnId) });
        queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
        // 본인이 채널에서 제거된 경우 채널 선택 해제
        if (parsed.type === 'member:leave' && parsed.data?.userId === currentUserId) {
          setCurrentChannelId(null);
        }
      }
      if (parsed.type === 'channel:archive' || parsed.type === 'channel:unarchive') {
        queryClient.invalidateQueries({ queryKey: talkKeys.channels() });
        queryClient.invalidateQueries({ queryKey: talkKeys.channelDetail(chnId) });
      }
      if (parsed.type === 'typing' && parsed.data?.userId && parsed.data.userId !== currentUserId) {
        const typingUserId = parsed.data.userId as string;
        setTypingUser(typingUserId, (parsed.data.userName as string) || 'Unknown');
        setTimeout(() => clearTypingUser(typingUserId), 3000);
      }
    },
    [queryClient, currentUserId, setTypingUser, clearTypingUser],
  );

  const connect = useCallback(
    (chnId: string) => {
      const url = `${API_BASE_URL}/talk/channels/${chnId}/events`;
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.onopen = () => {
        retryCountRef.current = 0;
      };

      es.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          handleEvent(chnId, parsed);
          // Broadcast to other tabs
          bcRef.current?.postMessage({ channelId: chnId, event: parsed });
        } catch {
          // skip malformed data
        }
      };

      es.onerror = () => {
        es.close();
        eventSourceRef.current = null;

        if (retryCountRef.current < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, retryCountRef.current);
          retryCountRef.current += 1;
          retryTimerRef.current = setTimeout(() => connect(chnId), delay);
        }
      };
    },
    [queryClient, handleEvent],
  );

  useEffect(() => {
    if (!channelId || !isAuthenticated) return;

    // Set up BroadcastChannel for cross-tab event sharing
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BC_CHANNEL_NAME);
      bcRef.current = bc;
      bc.onmessage = (e) => {
        const { channelId: chnId, event } = e.data || {};
        if (chnId === channelId && event) {
          handleEvent(chnId, event);
        }
      };
    } catch {
      // BroadcastChannel not supported, proceed without it
    }

    retryCountRef.current = 0;
    connect(channelId);

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      bc?.close();
      bcRef.current = null;
    };
  }, [channelId, isAuthenticated, connect, handleEvent]);
}
