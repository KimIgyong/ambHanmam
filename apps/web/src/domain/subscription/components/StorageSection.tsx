import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStorageQuota, usePurchaseStorage } from '../hooks/useSubscription';
import { HardDrive, Plus, AlertTriangle } from 'lucide-react';

export default function StorageSection() {
  const { t } = useTranslation(['subscription']);
  const { data: storage, isLoading } = useStorageQuota();
  const purchaseMutation = usePurchaseStorage();
  const [purchaseGb, setPurchaseGb] = useState(5);

  const handlePurchase = async () => {
    try {
      const result = await purchaseMutation.mutateAsync({ storage_gb: purchaseGb });
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch {
      // handled by mutation error state
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!storage) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
        {t('subscription:errors.loadFailed')}
      </div>
    );
  }

  const usedPct = storage.usedPct;
  const barColor =
    usedPct >= 120
      ? 'bg-red-500'
      : usedPct >= 100
        ? 'bg-amber-500'
        : usedPct >= 80
          ? 'bg-yellow-500'
          : 'bg-indigo-500';

  return (
    <div className="space-y-6">
      {/* Warning/Blocked Banners */}
      {storage.isUploadBlocked && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {t('subscription:storage.blocked')}
        </div>
      )}
      {!storage.isUploadBlocked && usedPct >= 100 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          {t('subscription:storage.warning')}
        </div>
      )}

      {/* Usage Overview */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <HardDrive className="h-8 w-8 text-indigo-500" />
          <div className="flex-1">
            <div className="flex items-baseline justify-between">
              <p className="text-sm text-gray-500">
                {t('subscription:storage.usage')}
              </p>
              <p className="text-sm font-medium text-gray-700">
                {storage.usedGb.toFixed(2)} / {storage.totalGb} GB ({usedPct.toFixed(1)}%)
              </p>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all ${barColor}`}
                style={{ width: `${Math.min(usedPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500">
              {t('subscription:storage.baseStorage')}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {storage.baseGb} GB
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t('subscription:storage.addonStorage')}
            </p>
            <p className="text-lg font-semibold text-gray-900">
              {storage.addonGb} GB
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {t('subscription:storage.totalQuota')}
            </p>
            <p className="text-lg font-semibold text-indigo-600">
              {storage.totalGb} GB
            </p>
          </div>
        </div>
      </div>

      {/* Purchase */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          {t('subscription:storage.purchase')}
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">
              {t('subscription:storage.purchaseGb')}
            </label>
            <select
              value={purchaseGb}
              onChange={(e) => setPurchaseGb(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5 GB</option>
              <option value={10}>10 GB</option>
              <option value={20}>20 GB</option>
              <option value={50}>50 GB</option>
              <option value={100}>100 GB</option>
            </select>
          </div>
          <button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('subscription:storage.purchase')}
          </button>
        </div>
        {purchaseMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            {t('subscription:errors.checkoutFailed')}
          </p>
        )}
      </div>
    </div>
  );
}
