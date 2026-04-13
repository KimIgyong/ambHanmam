import { useTranslation } from 'react-i18next';
import { CreditCard } from 'lucide-react';

export function BillingPage() {
  const { t } = useTranslation();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('portal.billing.title')}</h1>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
          <CreditCard className="h-7 w-7 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">{t('portal.billing.empty_title')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('portal.billing.empty_desc')}</p>
      </div>
    </div>
  );
}
