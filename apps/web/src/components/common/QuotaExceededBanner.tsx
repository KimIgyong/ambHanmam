import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useEntityUsageSummary } from '../../domain/entity-settings/hooks/useEntitySettings';
import QuotaPurchaseModal from '../../domain/payment/components/QuotaPurchaseModal';

export function QuotaExceededBanner() {
  const { t } = useTranslation('common');
  const { data: usage } = useEntityUsageSummary();
  const [showPurchase, setShowPurchase] = useState(false);

  if (!usage?.warnings || usage.warnings.quotaStage !== 'SUSPENDED') {
    return null;
  }

  return (
    <>
      <div className="mx-4 mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <span>{t('quotaExceededBanner')}</span>
          </div>
          <button
            onClick={() => setShowPurchase(true)}
            className="whitespace-nowrap rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
          >
            {t('quotaPurchaseButton')}
          </button>
        </div>
      </div>
      <QuotaPurchaseModal open={showPurchase} onClose={() => setShowPurchase(false)} />
    </>
  );
}
