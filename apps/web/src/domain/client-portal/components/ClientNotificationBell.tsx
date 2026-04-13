import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';

interface ClientNotificationItem {
  ntfId: string;
  ntfType: string;
  ntfTitle: string;
  ntfMessage: string | null;
  ntfResourceType: string;
  ntfResourceId: string;
  ntfIsRead: boolean;
  ntfCreatedAt: string;
  senderName?: string;
}

export default function ClientNotificationBell() {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<ClientNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sseRef = useRef<EventSource | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/client/notifications/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch {
      // silent
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/client/notifications?limit=10');
      if (res.data.success) {
        setNotifications(res.data.data.data);
      }
    } catch {
      // silent
    }
  }, []);

  // 초기 로딩 + SSE 연결
  useEffect(() => {
    fetchUnreadCount();

    // SSE 실시간 스트림 연결
    const baseUrl = apiClient.defaults.baseURL || '';
    const sse = new EventSource(`${baseUrl}/client/notifications/stream`, {
      withCredentials: true,
    });
    sseRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setNotifications((prev) => [notification, ...prev].slice(0, 10));
        setUnreadCount((prev) => prev + 1);
      } catch {
        // ignore
      }
    };

    sse.onerror = () => {
      // SSE 재연결은 브라우저가 자동 처리
    };

    return () => {
      sse.close();
      sseRef.current = null;
    };
  }, [fetchUnreadCount]);

  // 드롭다운 열 때 목록 갱신
  useEffect(() => {
    if (isOpen) fetchNotifications();
  }, [isOpen, fetchNotifications]);

  // 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAsRead = async (ntfId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.ntfId === ntfId ? { ...n, ntfIsRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await apiClient.patch(`/client/notifications/${ntfId}/read`);
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, ntfIsRead: true })));
    setUnreadCount(0);
    try {
      await apiClient.patch('/client/notifications/read-all');
    } catch {
      // silent
    }
  };

  const handleClick = (n: ClientNotificationItem) => {
    if (!n.ntfIsRead) handleMarkAsRead(n.ntfId);
    setIsOpen(false);

    // 클라이언트 포탈 내 라우팅
    if (n.ntfResourceType === 'ISSUE') {
      navigate(`/client/issues/${n.ntfResourceId}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ISSUE_ASSIGNED': return '🐛';
      case 'ISSUE_STATUS_CHANGED': return '🔄';
      case 'COMMENT_MENTION': return '💬';
      case 'TALK_MESSAGE': return '💬';
      default: return '🔔';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('notification.justNow');
    if (mins < 60) return t('notification.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('notification.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('notification.daysAgo', { count: days });
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 transition-colors"
        aria-label={t('notification.title')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              {t('notification.title')}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                {t('notification.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                {t('notification.empty')}
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.ntfId}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                    !n.ntfIsRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="mt-0.5 text-base">{getTypeIcon(n.ntfType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{n.ntfTitle}</p>
                    {n.ntfMessage && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">
                        {n.ntfType === 'COMMENT_MENTION'
                          ? (() => { try { return JSON.parse(n.ntfMessage!).text; } catch { return n.ntfMessage; } })()
                          : n.ntfMessage}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400">{timeAgo(n.ntfCreatedAt)}</p>
                  </div>
                  {!n.ntfIsRead && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
