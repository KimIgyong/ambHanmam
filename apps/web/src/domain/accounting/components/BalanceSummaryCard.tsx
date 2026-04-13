import { Landmark } from 'lucide-react';

interface BalanceSummaryCardProps {
  totalsByCurrency: Record<string, number>;
}

function formatCurrency(amount: number, currency: string): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN').format(Math.round(amount));
  }
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  }
  if (currency === 'KRW') {
    return new Intl.NumberFormat('ko-KR').format(Math.round(amount));
  }
  return new Intl.NumberFormat().format(amount);
}

export default function BalanceSummaryCard({ totalsByCurrency }: BalanceSummaryCardProps) {
  const currencies = Object.entries(totalsByCurrency);

  if (currencies.length === 0) return null;

  return (
    <div className="space-y-3">
      {currencies.map(([currency, total]) => (
        <div
          key={currency}
          className="flex items-center justify-between rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3"
        >
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">{currency}</span>
          </div>
          <span className={`text-lg font-bold ${total >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {formatCurrency(total, currency)} {currency}
          </span>
        </div>
      ))}
    </div>
  );
}

export { formatCurrency };
