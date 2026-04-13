import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { MonthlyStatsResponse } from '@amb/types';

interface BalanceTrendChartProps {
  data: MonthlyStatsResponse[];
  currency?: string;
}

export default function BalanceTrendChart({ data, currency = '' }: BalanceTrendChartProps) {
  const { t } = useTranslation(['accounting']);

  const formatValue = (value: number) => {
    if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
    return value.toFixed(0);
  };

  // Calculate running cumulative net
  let cumulative = 0;
  const trendData = data.map((d) => {
    cumulative += d.net;
    return { month: d.month, balance: cumulative };
  });

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatValue} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat().format(Number(value)) + (currency ? ` ${currency}` : '')
            }
          />
          <Line
            type="monotone"
            dataKey="balance"
            name={t('accounting:stats.balanceTrend', { defaultValue: '잔액 추이' })}
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
