import { useTranslation } from 'react-i18next';
import { useIssueStatusLogs } from '../hooks/useIssues';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface IssueStatusHistoryProps {
  issueId: string;
}

export default function IssueStatusHistory({ issueId }: IssueStatusHistoryProps) {
  const { t } = useTranslation(['issues']);
  const { data: logs = [], isLoading } = useIssueStatusLogs(issueId);

  if (isLoading) {
    return <div className="py-2 text-center text-xs text-gray-400">{t('common:loading')}</div>;
  }

  if (logs.length === 0) {
    return <div className="py-2 text-center text-xs text-gray-400">{t('issues:noStatusLogs')}</div>;
  }

  return (
    <div className="mt-2 space-y-2">
      {logs.map((log) => (
        <div key={log.logId} className="text-xs">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <span className="font-medium text-gray-700">{log.changedByName}</span>
              <span className="text-gray-500">
                {' '}
                {log.changeType === 'ASSIGNEE'
                  ? t('issues:assigneeChangedTo', {
                      assignee: log.toStatus || t('issues:unassigned'),
                    })
                  : t('issues:statusChangedFromTo', {
                      fromStatus: t(`issues:status.${log.fromStatus}`, { defaultValue: log.fromStatus }),
                      toStatus: t(`issues:status.${log.toStatus}`, { defaultValue: log.toStatus }),
                    })
                }
              </span>
            </div>
            <span className="shrink-0 text-gray-400">
              {<LocalDateTime value={log.createdAt} format='YYYY-MM-DD HH:mm' />}
            </span>
          </div>
          {log.note && (
            <div className="ml-4 mt-0.5 text-gray-500 italic">
              - {log.note}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
