import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNotificationStore, NotificationItem } from '../store/notification.store';
import { apiClient } from '@/lib/api-client';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export function NotificationBell() {
  const { t } = useTranslation(['notifications', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  const { notifications, unreadCount, setNotifications, setUnreadCount, markAsRead, markAllAsRead } =
    useNotificationStore();

  // 미읽음 카운트 조회
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.data.count);
      }
    } catch {
      // silent
    }
  }, [setUnreadCount]);

  // 알림 목록 조회
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications?limit=10');
      if (res.data.success) {
        setNotifications(res.data.data.data);
      }
    } catch {
      // silent
    }
  }, [setNotifications]);

  // 컴포넌트 마운트 시 초기 데이터 로드 (entityId 준비 후)
  useEffect(() => {
    if (entityId) fetchUnreadCount();
  }, [entityId, fetchUnreadCount]);

  // 드롭다운 열 때 목록 조회
  useEffect(() => {
    if (isOpen && entityId) {
      fetchNotifications();
    }
  }, [isOpen, entityId, fetchNotifications]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 단일 읽음 처리
  const handleMarkAsRead = async (ntfId: string) => {
    markAsRead(ntfId);
    try {
      await apiClient.patch(`/notifications/${ntfId}/read`);
    } catch {
      // silent
    }
  };

  // 전체 읽음 처리
  const handleMarkAllAsRead = async () => {
    markAllAsRead();
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      // silent
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.ntfIsRead) {
      handleMarkAsRead(notification.ntfId);
    }
    setIsOpen(false);

    // COMMENT_MENTION인 경우 commentId 추출
    let commentId: string | null = null;
    if (notification.ntfType === 'COMMENT_MENTION' && notification.ntfMessage) {
      try {
        const parsed = JSON.parse(notification.ntfMessage);
        commentId = parsed.commentId || null;
      } catch {
        // ignore parse error
      }
    }

    // 리소스 페이지로 이동
    const { ntfResourceType, ntfResourceId } = notification;
    const commentSuffix = commentId ? `&commentId=${commentId}` : '';
    switch (ntfResourceType) {
      case 'TODO':
        window.location.href = `/todos?id=${ntfResourceId}${commentSuffix}`;
        break;
      case 'ISSUE':
        window.location.href = `/issues?id=${ntfResourceId}${commentSuffix}`;
        break;
      case 'MEETING_NOTE':
        window.location.href = `/meeting-notes/${ntfResourceId}${commentId ? `?commentId=${commentId}` : ''}`;
        break;
      case 'CALENDAR':
        window.location.href = `/calendar?event=${ntfResourceId}`;
        break;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'TODO_ASSIGNED':
        return '✅';
      case 'ISSUE_ASSIGNED':
        return '🐛';
      case 'NOTE_ASSIGNED':
        return '📝';
      case 'CALENDAR_INVITED':
        return '📅';
      case 'COMMENT_MENTION':
      case 'TALK_MESSAGE':
        return '💬';
      case 'ISSUE_STATUS_CHANGED':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('justNow');
    if (mins < 60) return t('minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('daysAgo', { count: days });
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        aria-label={t('notifications')}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-sm sm:absolute sm:top-full sm:mt-2 sm:left-auto sm:right-0 sm:translate-x-0 sm:w-80 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t('notifications')}
            </h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400"
                >
                  {t('markAllRead')}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                aria-label={t('common:close')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {t('noNotifications')}
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.ntfId}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !n.ntfIsRead
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <span className="mt-0.5 text-base">{getTypeIcon(n.ntfType)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">
                      {n.ntfTitle}
                    </p>
                    {n.ntfMessage && (
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {n.ntfType === 'COMMENT_MENTION'
                          ? (() => { try { return JSON.parse(n.ntfMessage).text; } catch { return n.ntfMessage; } })()
                          : n.ntfMessage}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(n.ntfCreatedAt)}
                    </p>
                  </div>
                  {!n.ntfIsRead && (
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer — 전체 알림보기 */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/amoeba-talk?channel=__NOTIFICATION_CENTER__';
              }}
              className="flex w-full items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-blue-600 hover:bg-gray-50 dark:text-blue-400 dark:hover:bg-gray-700 transition-colors"
            >
              {t('viewAll')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
