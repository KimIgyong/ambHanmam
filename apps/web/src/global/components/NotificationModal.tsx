import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  X,
  CheckSquare,
  AlertCircle,
  FileText,
  Calendar,
  MessageCircle,
  Bell,
  ExternalLink,
} from 'lucide-react';
import { useNotificationStore, NotificationItem } from '../store/notification.store';

const AUTO_DISMISS_MS = 5000;

/**
 * 화면 상단 중앙에 슬라이드 다운하는 알림 모달.
 * SSE 수신 시 알림 큐를 통해 순차 표시.
 */
export function NotificationModal() {
  const { currentModal, modalQueue, dismissModal } = useNotificationStore();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('notifications');

  const handleDismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dismissModal();
  }, [dismissModal]);

  // 자동 닫힘 타이머
  useEffect(() => {
    if (!currentModal) return;
    timerRef.current = setTimeout(handleDismiss, AUTO_DISMISS_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentModal, handleDismiss]);

  const handleGoTo = useCallback(
    (notification: NotificationItem) => {
      handleDismiss();
      const path = getResourcePath(notification);
      if (path) navigate(path);
    },
    [handleDismiss, navigate],
  );

  if (!currentModal) return null;

  // 현재 해당 리소스 페이지에 있으면 모달 미표시
  const targetPath = getResourcePath(currentModal);
  if (targetPath && location.pathname.startsWith(targetPath.split('?')[0])) {
    // 자동 dismiss하고 다음 모달로
    setTimeout(handleDismiss, 0);
    return null;
  }

  const icon = getTypeIcon(currentModal.ntfType);
  const displayMessage = getDisplayMessage(currentModal);
  const remaining = modalQueue.length;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-center px-4"
      style={{ paddingTop: 'max(calc(env(safe-area-inset-top, 0px) + 8px), 16px)' }}
    >
      <div className="pointer-events-auto w-full max-w-md animate-slide-down rounded-lg border border-gray-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {getDisplayTitle(currentModal, t)}
            </p>
          </div>
          {remaining > 0 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              +{remaining}
            </span>
          )}
          <button
            onClick={handleDismiss}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        {displayMessage && (
          <p className="px-4 pb-2 text-sm text-gray-600 line-clamp-2">
            {displayMessage}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2">
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            {t('dismiss', { defaultValue: 'Dismiss' })}
          </button>
          {targetPath && (
            <button
              onClick={() => handleGoTo(currentModal)}
              className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <ExternalLink className="h-3 w-3" />
              {t('goTo')}
            </button>
          )}
        </div>

        {/* 프로그레스 바 */}
        <div className="h-1 w-full overflow-hidden rounded-b-lg bg-gray-100">
          <div
            className="h-full bg-indigo-500 animate-shrink-bar"
            style={{ animationDuration: `${AUTO_DISMISS_MS}ms` }}
          />
        </div>
      </div>
    </div>
  );
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'TODO_ASSIGNED':
      return <CheckSquare className="h-4 w-4" />;
    case 'ISSUE_ASSIGNED':
    case 'ISSUE_STATUS_CHANGED':
      return <AlertCircle className="h-4 w-4" />;
    case 'NOTE_ASSIGNED':
      return <FileText className="h-4 w-4" />;
    case 'CALENDAR_INVITED':
      return <Calendar className="h-4 w-4" />;
    case 'COMMENT_MENTION':
    case 'TALK_MESSAGE':
    case 'TALK_MENTION':
      return <MessageCircle className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function getDisplayTitle(notification: NotificationItem, _t: (key: string, options?: Record<string, unknown>) => string): string {
  return notification.ntfTitle;
}

function getDisplayMessage(notification: NotificationItem): string | null {
  if (!notification.ntfMessage) return null;
  if (notification.ntfType === 'COMMENT_MENTION') {
    try {
      return JSON.parse(notification.ntfMessage).text;
    } catch {
      return notification.ntfMessage;
    }
  }
  return notification.ntfMessage;
}

function getResourcePath(notification: NotificationItem): string | null {
  const { ntfResourceType, ntfResourceId, ntfType, ntfMessage } = notification;

  let commentId: string | null = null;
  if (ntfType === 'COMMENT_MENTION' && ntfMessage) {
    try {
      commentId = JSON.parse(ntfMessage).commentId || null;
    } catch {
      /* ignore */
    }
  }

  const commentSuffix = commentId ? `&commentId=${commentId}` : '';

  switch (ntfResourceType) {
    case 'TODO':
      return `/todos?id=${ntfResourceId}${commentSuffix}`;
    case 'ISSUE':
      return `/issues?id=${ntfResourceId}${commentSuffix}`;
    case 'MEETING_NOTE':
      return `/meeting-notes/${ntfResourceId}${commentId ? `?commentId=${commentId}` : ''}`;
    case 'CALENDAR':
      return `/calendar?event=${ntfResourceId}`;
    case 'TALK':
      return `/amoeba-talk?channel=${ntfResourceId}`;
    default:
      return null;
  }
}
