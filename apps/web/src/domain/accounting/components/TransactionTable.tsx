import { useTranslation } from 'react-i18next';
import { TransactionResponse } from '@amb/types';
import { formatCurrency } from './BalanceSummaryCard';

interface TransactionTableProps {
  transactions: TransactionResponse[];
  currency: string;
  onRowClick: (txn: TransactionResponse) => void;
}

export default function TransactionTable({ transactions, currency, onRowClick }: TransactionTableProps) {
  const { t } = useTranslation(['accounting']);

  if (transactions.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        {t('accounting:noTransactions')}
      </div>
    );
  }

  const fmt = (val: number) => formatCurrency(val, currency);
  const amountClass = (val: number) =>
    val > 0 ? 'text-green-600' : val < 0 ? 'text-red-600' : 'text-gray-500';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
            <th className="px-3 py-3 text-center w-12">No.</th>
            <th className="px-3 py-3">{t('accounting:transactionDate')}</th>
            <th className="px-3 py-3">{t('accounting:vendor')}</th>
            <th className="px-3 py-3 text-right">{t('accounting:netValue')}</th>
            <th className="px-3 py-3 text-right">{t('accounting:bankCharge')}</th>
            <th className="px-3 py-3 text-right">{t('accounting:balance')}</th>
            <th className="px-3 py-3 text-right">{t('accounting:cumulativeBalance')}</th>
            <th className="px-3 py-3">{t('accounting:description')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {transactions.map((txn) => (
            <tr
              key={txn.transactionId}
              onClick={() => onRowClick(txn)}
              className="cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <td className="whitespace-nowrap px-3 py-2.5 text-center text-gray-400 text-xs">
                {txn.seqNo || '-'}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-gray-700">
                {txn.transactionDate}
              </td>
              <td className="px-3 py-2.5 text-gray-700 max-w-[150px] truncate">
                {txn.vendor || '-'}
              </td>
              <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono ${amountClass(txn.netValue)}`}>
                {txn.netValue !== 0 ? fmt(txn.netValue) : '-'}
              </td>
              <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono ${amountClass(txn.bankCharge)}`}>
                {txn.bankCharge !== 0 ? fmt(txn.bankCharge) : '-'}
              </td>
              <td className={`whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium ${amountClass(txn.balance)}`}>
                {fmt(txn.balance)}
              </td>
              <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono font-medium text-gray-900">
                {fmt(txn.cumulativeBalance)}
              </td>
              <td className="px-3 py-2.5 text-gray-500 max-w-[200px] truncate text-xs">
                {txn.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
