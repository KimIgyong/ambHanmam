import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { MonthlyStatsResponse } from '@amb/types';

interface MonthlyChartProps {
  data: MonthlyStatsResponse[];
  currency?: string;
}

export default function MonthlyChart({ data, currency = '' }: MonthlyChartProps) {
  const { t } = useTranslation(['accounting']);

  const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat().format(Number(value)) + (currency ? ` ${currency}` : '')
            }
          />
          <Legend />
          <Bar
            dataKey="deposit"
            name={t('accounting:deposit')}
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="withdrawal"
            name={t('accounting:withdrawal')}
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
