import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, XCircle, Send } from 'lucide-react';
import { useMyRequests, useCancelRequest, useSubmitRequest } from '../hooks/useAsset';
import type { AssetRequestListQuery } from '../service/asset.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const REQUEST_TYPES = ['NEW_RENTAL', 'MEETING_ROOM_RESERVATION', 'EXTENSION', 'RETURN', 'REPLACEMENT'] as const;
const REQUEST_STATUSES = ['DRAFT', 'SUBMITTED', 'L1_APPROVED', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_USE', 'COMPLETED', 'RETURN_DELAYED'] as const;

interface Props {
  onCreateNew: () => void;
}

export default function AssetRequestTab({ onCreateNew }: Props) {
  const { t } = useTranslation('asset');
  const [query, setQuery] = useState<AssetRequestListQuery>({});
  const { data: requests, isLoading } = useMyRequests(query);
  const cancelMutation = useCancelRequest();
  const submitMutation = useSubmitRequest();

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      SUBMITTED: 'bg-yellow-100 text-yellow-700',
      L1_APPROVED: 'bg-blue-100 text-blue-700',
      APPROVED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
      IN_USE: 'bg-blue-100 text-blue-700',
      COMPLETED: 'bg-green-100 text-green-600',
      RETURN_DELAYED: 'bg-orange-100 text-orange-700',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  const canCancel = (s: string) => ['DRAFT', 'SUBMITTED'].includes(s);
  const canSubmit = (s: string) => s === 'DRAFT';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={query.request_type || ''}
          onChange={(e) => setQuery({ ...query, request_type: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('common.all')} {t('request.type')}</option>
          {REQUEST_TYPES.map((rt) => (
            <option key={rt} value={rt}>{t(`requestType.${rt}`)}</option>
          ))}
        </select>
        <select
          value={query.status || ''}
          onChange={(e) => setQuery({ ...query, status: e.target.value || undefined })}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('common.all')} {t('form.status')}</option>
          {REQUEST_STATUSES.map((rs) => (
            <option key={rs} value={rs}>{t(`requestStatus.${rs}`)}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={onCreateNew}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('request.create')}
        </button>
      </div>

      {/* Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">{t('common.requestNo')}</th>
              <th className="px-4 py-3 text-left">{t('request.type')}</th>
              <th className="px-4 py-3 text-left">{t('common.asset')}</th>
              <th className="px-4 py-3 text-left">{t('common.period')}</th>
              <th className="px-4 py-3 text-left">{t('form.status')}</th>
              <th className="px-4 py-3 text-center w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">{t('common.loading')}</td></tr>
            )}
            {!isLoading && (!requests || requests.length === 0) && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">{t('common.noData')}</td></tr>
            )}
            {requests?.map((req) => (
              <tr key={req.requestId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs">{req.requestNo}</td>
                <td className="px-4 py-3">{t(`requestType.${req.requestType}`)}</td>
                <td className="px-4 py-3">
                  {req.assetName || (req.assetCategory ? t(`category.${req.assetCategory}`) : '-')}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {<LocalDateTime value={req.startAt} format='YYYY-MM-DD HH:mm' />} ~ {<LocalDateTime value={req.endAt} format='YYYY-MM-DD HH:mm' />}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(req.status)}`}>
                    {t(`requestStatus.${req.status}`)}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {canSubmit(req.status) && (
                      <button
                        onClick={() => submitMutation.mutate(req.requestId)}
                        className="p-1.5 rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                        title={t('request.submit')}
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {canCancel(req.status) && (
                      <button
                        onClick={() => {
                          if (confirm(t('request.cancelRequest') + '?')) {
                            cancelMutation.mutate(req.requestId);
                          }
                        }}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title={t('request.cancelRequest')}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
