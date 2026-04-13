import { useTranslation } from 'react-i18next';
import { useTodoStatusLogs } from '../hooks/useTodos';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface TodoStatusHistoryProps {
  todoId: string;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export default function TodoStatusHistory({ todoId, onClose }: TodoStatusHistoryProps) {
  const { t } = useTranslation(['todos']);
  const { data: logs = [], isLoading } = useTodoStatusLogs(todoId);

  const isDueDateChange = (log: { fromStatus: string; toStatus: string }) =>
    log.fromStatus.startsWith('DUE:') && log.toStatus.startsWith('DUE:');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-base font-semibold text-gray-900">
          {t('todos:statusHistory')}
        </h3>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400">
            {t('todos:noStatusLogs')}
          </div>
        ) : (
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {logs.map((log) => (
              <div key={log.logId} className="rounded-lg bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-3">
                  {isDueDateChange(log) ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                        {log.fromStatus.replace('DUE:', '')}
                      </span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                        {log.toStatus.replace('DUE:', '')}
                      </span>
                      <span className="text-xs text-amber-600">📅 {t('todos:changeHistory.dueDate')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={`rounded-full px-2 py-0.5 font-medium ${statusColors[log.fromStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`todos:status.${log.fromStatus}`)}
                      </span>
                      <span className="text-gray-400">&rarr;</span>
                      <span className={`rounded-full px-2 py-0.5 font-medium ${statusColors[log.toStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {t(`todos:status.${log.toStatus}`)}
                      </span>
                    </div>
                  )}
                  <span className="ml-auto text-xs text-gray-400">
                    {<LocalDateTime value={log.changedAt} format='YYYY-MM-DD HH:mm' />}
                  </span>
                </div>
                {log.note && (
                  <div className="mt-1 text-xs text-gray-500 italic">
                    {log.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            {t('common:close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
