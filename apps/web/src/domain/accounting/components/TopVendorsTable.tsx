import { useTranslation } from 'react-i18next';
import { TopVendorResponse } from '@amb/types';

interface TopVendorsTableProps {
  data: TopVendorResponse[];
  currency?: string;
}

export default function TopVendorsTable({ data, currency = '' }: TopVendorsTableProps) {
  const { t } = useTranslation(['accounting']);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat().format(amount) + (currency ? ` ${currency}` : '');

  if (data.length === 0) {
    return <p className="text-sm text-gray-400">{t('accounting:noTransactions')}</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left text-xs text-gray-500">
          <th className="pb-2 font-medium">#</th>
          <th className="pb-2 font-medium">{t('accounting:vendor')}</th>
          <th className="pb-2 text-right font-medium">{t('accounting:stats.totalAmount', { defaultValue: '총 출금액' })}</th>
          <th className="pb-2 text-right font-medium">{t('accounting:stats.txnCount', { defaultValue: '건수' })}</th>
        </tr>
      </thead>
      <tbody>
        {data.map((v, idx) => (
          <tr key={v.vendor} className="border-b border-gray-100 last:border-0">
            <td className="py-2 text-gray-400">{idx + 1}</td>
            <td className="py-2 font-medium text-gray-700">{v.vendor}</td>
            <td className="py-2 text-right text-red-600">{formatAmount(v.totalAmount)}</td>
            <td className="py-2 text-right text-gray-500">{v.count}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
