import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { History, RotateCcw } from 'lucide-react';
import { CmsVersionResponse } from '@amb/types';
import { usePageVersions, useRollbackVersion } from '../hooks/usePages';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface VersionHistoryProps {
  pageId: string;
}

export default function VersionHistory({ pageId }: VersionHistoryProps) {
  const { t } = useTranslation(['site', 'common']);
  const { data: versions = [], isLoading } = usePageVersions(pageId);
  const rollbackMutation = useRollbackVersion();
  const [confirmVersionId, setConfirmVersionId] = useState<string | null>(null);

  const handleRollback = async (versionId: string) => {
    try {
      await rollbackMutation.mutateAsync({ pageId, versionId });
      setConfirmVersionId(null);
    } catch {
      // Error handled by React Query
    }
  };

  const typedVersions = versions as CmsVersionResponse[];
  const latestVersion = typedVersions.length > 0 ? typedVersions[0] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        <span className="text-sm">{t('common:loading')}</span>
      </div>
    );
  }

  if (typedVersions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <History className="mb-2 h-8 w-8" />
        <p className="text-sm">{t('site:page.noVersions')}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-gray-900">
        {t('site:page.versionHistory')}
      </h3>

      <div className="space-y-3">
        {typedVersions.map((version) => {
          const isCurrent = latestVersion?.id === version.id;
          const isConfirming = confirmVersionId === version.id;

          return (
            <div
              key={version.id}
              className="rounded-lg border border-gray-200 bg-white px-4 py-3"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      v{version.version}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                        {t('site:page.versionCurrent')}
                      </span>
                    )}
                  </div>
                  {version.note && (
                    <p className="mt-1 text-sm text-gray-600">{version.note}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span>{version.publishedBy}</span>
                    <span>{<LocalDateTime value={version.publishedAt} format='YYYY-MM-DD HH:mm' />}</span>
                  </div>
                </div>

                {!isCurrent && (
                  <div className="ml-3 flex-shrink-0">
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {t('site:page.rollbackConfirm', { version: version.version })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRollback(version.id)}
                          disabled={rollbackMutation.isPending}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {rollbackMutation.isPending ? '...' : t('common:confirm')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmVersionId(null)}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          {t('common:cancel')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmVersionId(version.id)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('site:page.rollback')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
