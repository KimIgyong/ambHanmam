import { useTranslation } from 'react-i18next';
import { Pencil, Trash2 } from 'lucide-react';
import { BankAccountResponse } from '@amb/types';
import { formatCurrency } from './BalanceSummaryCard';

interface AccountCardProps {
  account: BankAccountResponse;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

export default function AccountCard({ account, onClick, onEdit, onDelete }: AccountCardProps) {
  const { t } = useTranslation(['accounting']);

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-all hover:border-emerald-200 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{account.bankName}</h3>
          {account.branchName && (
            <p className="text-xs text-gray-500">{account.branchName}</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            title={t('accounting:editAccount')}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title={t('accounting:deleteAccount')}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mb-3 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-mono">{account.accountNumber}</span>
          {account.accountAlias && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
              {account.accountAlias}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-end justify-between border-t border-gray-100 pt-3">
        <div>
          <p className="text-xs text-gray-400">{t('accounting:currentBalance')}</p>
          <p className={`text-lg font-bold ${account.currentBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {formatCurrency(account.currentBalance, account.currency)}
          </p>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
          {account.currency}
        </span>
      </div>

      {account.lastTransactionDate && (
        <p className="mt-2 text-xs text-gray-400">
          {t('accounting:lastTransactionDate')}: {account.lastTransactionDate}
        </p>
      )}
    </div>
  );
}
