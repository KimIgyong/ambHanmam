import { useTranslation } from 'react-i18next';
import { History } from 'lucide-react';
import { useContractHistory } from '../../hooks/useContract';

interface Props {
  contractId: string;
}

const FIELD_LABEL_MAP: Record<string, string> = {
  status: 'contract.form.status' as const,
  title: 'contract.form.title',
  description: 'contract.form.description',
  end_date: 'contract.form.endDate',
  amount: 'contract.form.amount',
  currency: 'contract.form.currency',
  auto_renew: 'contract.form.autoRenew',
  billing_day: 'contract.form.billingDay',
  billing_period: 'contract.form.billingPeriod',
  auto_generate: 'contract.form.autoGenerate',
  unit_price: 'contract.form.unitPrice',
  unit_desc: 'contract.form.unitDesc',
  note: 'contract.form.note',
};

export default function ContractHistoryLog({ contractId }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const { data: history, isLoading } = useContractHistory(contractId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
        <History className="mx-auto h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">{t('billing:contract.noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-200" />

        {history.map((item, idx) => {
          const fieldLabel = FIELD_LABEL_MAP[item.field]
            ? t(`billing:${FIELD_LABEL_MAP[item.field]}`)
            : item.field;
          const date = new Date(item.changedAt);
          const dateStr = date.toLocaleDateString();
          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div key={item.id} className="relative flex gap-4 pb-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white border-2 border-gray-300">
                <div className={`h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-orange-500' : 'bg-gray-400'}`} />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{fieldLabel}</span>
                  <span className="text-xs text-gray-400">{dateStr} {timeStr}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600 line-through">
                    {item.oldValue || '-'}
                  </span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-700 font-medium">
                    {item.newValue || '-'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
