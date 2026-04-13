import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, ArrowLeft, ExternalLink } from 'lucide-react';
import { NotificationItem } from '@/global/store/notification.store';
import { useTalkStore } from '../store/talk.store';
import {
  useNotificationList,
  useNotificationUnreadCount,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
} from '../hooks/useNotifications';

const TYPE_ICON: Record<string, string> = {
  TODO_ASSIGNED: '✅',
  ISSUE_ASSIGNED: '🐛',
  NOTE_ASSIGNED: '📝',
  CALENDAR_INVITED: '📅',
  COMMENT_MENTION: '💬',
  TALK_MESSAGE: '💬',
  ISSUE_STATUS_CHANGED: '🔄',
};

function getTypeIcon(type: string) {
  return TYPE_ICON[type] || '🔔';
}

function navigateToResource(n: NotificationItem) {
  let commentId: string | null = null;
  if (n.ntfType === 'COMMENT_MENTION' && n.ntfMessage) {
    try {
      const parsed = JSON.parse(n.ntfMessage);
      commentId = parsed.commentId || null;
    } catch {
      // ignore
    }
  }
  const commentSuffix = commentId ? `&commentId=${commentId}` : '';
  switch (n.ntfResourceType) {
    case 'TODO':
      window.location.href = `/todos?id=${n.ntfResourceId}${commentSuffix}`;
      break;
    case 'ISSUE':
      window.location.href = `/issues?id=${n.ntfResourceId}${commentSuffix}`;
      break;
    case 'MEETING_NOTE':
      window.location.href = `/meeting-notes/${n.ntfResourceId}${commentId ? `?commentId=${commentId}` : ''}`;
      break;
    case 'CALENDAR':
      window.location.href = `/calendar?event=${n.ntfResourceId}`;
      break;
  }
}

function timeAgo(dateStr: string, t: (key: string, opts?: Record<string, unknown>) => string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('notifications:justNow');
  if (mins < 60) return t('notifications:minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('notifications:hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('notifications:daysAgo', { count: days });
}

export default function NotificationChatView() {
  const { t } = useTranslation(['talk', 'notifications']);
  const { setCurrentChannelId, setNotificationPreview, notificationPreview } = useTalkStore();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useNotificationList();
  const { data: unreadCount } = useNotificationUnreadCount();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const scrollRef = useRef<HTMLDivElement>(null);

  // 무한 스크롤 감지
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const notifications = data?.pages.flatMap((p) => p.data) ?? [];

  const handleClick = (n: NotificationItem) => {
    if (!n.ntfIsRead) {
      markReadMutation.mutate(n.ntfId);
    }
    // 리소스 타입이 있으면 미리보기 패널 표시, 없으면 기존 네비게이션
    if (n.ntfResourceType && n.ntfResourceId) {
      setNotificationPreview({ resourceType: n.ntfResourceType, resourceId: n.ntfResourceId });
    } else {
      navigateToResource(n);
    }
  };

  const getMessagePreview = (n: NotificationItem): string | null => {
    if (!n.ntfMessage) return null;
    if (n.ntfType === 'COMMENT_MENTION') {
      try {
        return JSON.parse(n.ntfMessage).text;
      } catch {
        return n.ntfMessage;
      }
    }
    return n.ntfMessage;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentChannelId(null)}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100">
            <Bell className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-700">
              {t('talk:notificationCenter')}
            </h2>
            {(unreadCount ?? 0) > 0 && (
              <p className="text-xs text-gray-400">
                {unreadCount}{t('talk:notificationUnreadSuffix')}
              </p>
            )}
          </div>
        </div>
        {(unreadCount ?? 0) > 0 && (
          <button
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            {t('notifications:markAllRead')}
          </button>
        )}
      </div>

      {/* Notification List */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
              <Bell className="h-8 w-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">{t('notifications:noNotifications')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((n) => (
              <button
                key={n.ntfId}
                onClick={() => handleClick(n)}
                className={`group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 ${
                  notificationPreview?.resourceId === n.ntfResourceId
                    ? 'bg-indigo-50 border-l-2 border-l-indigo-500'
                    : !n.ntfIsRead ? 'bg-indigo-50/50' : ''
                }`}
              >
                {/* Type icon */}
                <span className="mt-0.5 text-lg leading-none">
                  {getTypeIcon(n.ntfType)}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !n.ntfIsRead ? 'font-semibold text-gray-900' : 'text-gray-700'
                      }`}
                    >
                      {n.ntfTitle}
                    </p>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 group-hover:opacity-100" />
                  </div>
                  {getMessagePreview(n) && (
                    <p className="mt-0.5 truncate text-xs text-gray-500">
                      {getMessagePreview(n)}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {timeAgo(n.ntfCreatedAt, t)}
                  </p>
                </div>

                {/* Unread dot */}
                {!n.ntfIsRead && (
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                )}
              </button>
            ))}
            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
