import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { useOverdueBillings } from '../../hooks/usePayment';

export default function OverdueBillingAlert() {
  const { t } = useTranslation(['billing']);
  const navigate = useNavigate();
  const { data: overdueItems = [] } = useOverdueBillings();

  if (overdueItems.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-amber-800">{t('billing:dashboard.overdueBillingTitle')}</h3>
          <div className="mt-2 space-y-1.5">
            {overdueItems.map((item) => (
              <div
                key={item.contractId}
                onClick={() => navigate(`/billing/contracts/${item.contractId}`)}
                className="flex items-center justify-between rounded-md bg-white/70 px-3 py-2 text-xs cursor-pointer hover:bg-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${item.direction === 'RECEIVABLE' ? 'bg-blue-500' : 'bg-red-500'}`} />
                  <span className="font-medium text-gray-800">{item.title}</span>
                  <span className="text-gray-400">{item.partnerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-gray-600">{item.currency} {Number(item.amount).toLocaleString()}</span>
                  <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                    {t('billing:dashboard.overdueDays', { days: item.daysOverdue })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
