import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star, Heart, MessageSquare, Loader2, FileText, CheckSquare, AlertCircle, ArrowRightLeft } from 'lucide-react';
import { useMyEngagement, useMyYesterday } from '@/domain/entity-settings/hooks/useActivityIndex';

interface UserActivityModalProps {
  onClose: () => void;
  onDismissToday: () => void;
}

export default function UserActivityModal({ onClose, onDismissToday }: UserActivityModalProps) {
  const { t } = useTranslation(['entitySettings', 'issues']);
  const { data: engagement, isLoading: engagementLoading } = useMyEngagement();
  const { data: yesterday, isLoading: yesterdayLoading } = useMyYesterday();

  const isLoading = engagementLoading || yesterdayLoading;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const hasYesterdayActivity =
    yesterday &&
    (yesterday.issues.length > 0 ||
      yesterday.statusChanges.length > 0 ||
      yesterday.todos.length > 0 ||
      yesterday.notes.length > 0 ||
      yesterday.commentCount > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 rounded-t-2xl">
          <h2 className="text-lg font-bold text-gray-900">{t('entitySettings:activityModal.title')}</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-500">{t('entitySettings:activityModal.loading')}</span>
            </div>
          ) : (
            <>
              {/* 받은 호응 */}
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <h3 className="text-sm font-semibold text-gray-700">{t('entitySettings:activityModal.receivedEngagement')}</h3>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('entitySettings:activityModal.avgRating')}</p>
                    <p className="text-xl font-bold text-amber-600">
                      {engagement?.received.ratingAvg.toFixed(1) ?? '0.0'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t('entitySettings:activityModal.ratingCount', { count: engagement?.received.ratingCount ?? 0 })}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('entitySettings:activityModal.ratingTotal')}</p>
                    <p className="text-xl font-bold text-amber-600">
                      {engagement?.received.ratingTotal ?? 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('entitySettings:activityModal.reactions')}</p>
                    <p className="text-xl font-bold text-pink-500">
                      {engagement?.received.reactionCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* 준 호응 */}
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-500" />
                  <h3 className="text-sm font-semibold text-gray-700">{t('entitySettings:activityModal.givenEngagement')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('entitySettings:activityModal.givenRatings')}</p>
                    <p className="text-xl font-bold text-blue-600">
                      {engagement?.given.ratingCount ?? 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-500">{t('entitySettings:activityModal.givenReactions')}</p>
                    <p className="text-xl font-bold text-blue-600">
                      {engagement?.given.reactionCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* 어제 작업 내역 */}
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-sm font-semibold text-gray-700">
                    {t('entitySettings:activityModal.yesterdayActivity', { date: yesterday?.date ?? '' })}
                  </h3>
                </div>

                {!hasYesterdayActivity ? (
                  <p className="text-sm text-gray-400 py-2">{t('entitySettings:activityModal.noActivity')}</p>
                ) : (
                  <div className="space-y-2.5">
                    {/* 이슈 생성 */}
                    {yesterday!.issues.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                          <span className="text-xs font-medium text-gray-600">
                            {t('entitySettings:activityModal.issuesCreated', { count: yesterday!.issues.length })}
                          </span>
                        </div>
                        <ul className="ml-5 space-y-0.5">
                          {yesterday!.issues.map((i) => (
                            <li key={i.id} className="text-xs text-gray-500 truncate">{i.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 이슈 상태 변경 */}
                    {yesterday!.statusChanges.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <ArrowRightLeft className="h-3.5 w-3.5 text-orange-500" />
                          <span className="text-xs font-medium text-gray-600">
                            {t('entitySettings:activityModal.statusChanged', { count: yesterday!.statusChanges.length })}
                          </span>
                        </div>
                        <ul className="ml-5 space-y-0.5">
                          {yesterday!.statusChanges.map((s) => (
                            <li key={s.issueId} className="text-xs text-gray-500 truncate">
                              {s.issueTitle} → {t(`issues:status.${s.toStatus}`, { defaultValue: s.toStatus })}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 할일 */}
                    {yesterday!.todos.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckSquare className="h-3.5 w-3.5 text-green-500" />
                          <span className="text-xs font-medium text-gray-600">
                            {t('entitySettings:activityModal.todosCreated', { count: yesterday!.todos.length })}
                          </span>
                        </div>
                        <ul className="ml-5 space-y-0.5">
                          {yesterday!.todos.map((td) => (
                            <li key={td.id} className="text-xs text-gray-500 truncate">{td.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 미팅노트 */}
                    {yesterday!.notes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <FileText className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-xs font-medium text-gray-600">
                            {t('entitySettings:activityModal.notesCreated', { count: yesterday!.notes.length })}
                          </span>
                        </div>
                        <ul className="ml-5 space-y-0.5">
                          {yesterday!.notes.map((n) => (
                            <li key={n.id} className="text-xs text-gray-500 truncate">{n.title}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 댓글 */}
                    {yesterday!.commentCount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                        <span className="text-xs font-medium text-gray-600">
                          {t('entitySettings:activityModal.commentsWritten', { count: yesterday!.commentCount })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 rounded-b-2xl">
          <div className="flex items-center gap-3">
            <button
              onClick={onDismissToday}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {t('entitySettings:activityModal.dismissToday')}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('entitySettings:activityModal.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
