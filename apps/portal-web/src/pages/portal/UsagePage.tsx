import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface UsageSummaryItem {
  metric: string;
  totalQuantity: number;
  totalAmount: number;
  currency: string;
  records: {
    periodStart: string;
    periodEnd: string;
    quantity: number;
    amount: number | null;
  }[];
}

const METRIC_LABELS: Record<string, { en: string; ko: string; vi: string }> = {
  api_calls: { en: 'API Calls', ko: 'API 호출', vi: 'Lượt gọi API' },
  messages: { en: 'Messages', ko: '메시지', vi: 'Tin nhắn' },
  orders: { en: 'Orders', ko: '주문', vi: 'Đơn hàng' },
  storage_gb: { en: 'Storage (GB)', ko: '저장용량 (GB)', vi: 'Lưu trữ (GB)' },
  users: { en: 'Users', ko: '사용자', vi: 'Người dùng' },
  campaigns: { en: 'Campaigns', ko: '캠페인', vi: 'Chiến dịch' },
};

export function UsagePage() {
  const { t, i18n } = useTranslation();

  const { data: usage, isLoading } = useQuery<UsageSummaryItem[]>({
    queryKey: ['portal-usage'],
    queryFn: async () => {
      const { data } = await api.get('/portal/usage/summary');
      return data.data || data;
    },
  });

  const getMetricLabel = (metric: string) => {
    const labels = METRIC_LABELS[metric];
    if (!labels) return metric;
    return labels[i18n.language as keyof typeof labels] || labels.en;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat(i18n.language).format(num);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('portal.usage.title')}</h1>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      ) : usage && usage.length > 0 ? (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {usage.map((item) => (
              <div key={item.metric} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">{getMetricLabel(item.metric)}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(item.totalQuantity)}
                      </p>
                    </div>
                  </div>
                  {item.totalAmount > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{t('portal.usage.cost')}</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {formatCurrency(item.totalAmount, item.currency)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mini chart (bar representation) */}
                {item.records.length > 1 && (
                  <div className="mt-4 flex items-end gap-1 h-12">
                    {item.records.slice(-7).map((r, i) => {
                      const maxQty = Math.max(...item.records.map((rr) => rr.quantity));
                      const height = maxQty > 0 ? (r.quantity / maxQty) * 100 : 0;
                      return (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-indigo-200"
                          style={{ height: `${Math.max(height, 4)}%` }}
                          title={`${formatNumber(r.quantity)}`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <TrendingUp className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">{t('portal.usage.empty_title')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('portal.usage.empty_desc')}</p>
        </div>
      )}
    </div>
  );
}
