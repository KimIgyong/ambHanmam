import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { BankAccountResponse } from '@amb/types';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    bank_name: string;
    branch_name?: string;
    account_number: string;
    account_alias?: string;
    currency: string;
    opening_balance?: number;
    opening_date?: string;
  }) => void;
  editingAccount?: BankAccountResponse | null;
}

export default function AccountFormModal({ isOpen, onClose, onSubmit, editingAccount }: AccountFormModalProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountAlias, setAccountAlias] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [openingDate, setOpeningDate] = useState('');

  useEffect(() => {
    if (editingAccount) {
      setBankName(editingAccount.bankName);
      setBranchName(editingAccount.branchName || '');
      setAccountNumber(editingAccount.accountNumber);
      setAccountAlias(editingAccount.accountAlias || '');
      setCurrency(editingAccount.currency);
      setOpeningBalance(String(editingAccount.openingBalance));
      setOpeningDate(editingAccount.openingDate || '');
    } else {
      setBankName('');
      setBranchName('');
      setAccountNumber('');
      setAccountAlias('');
      setCurrency('VND');
      setOpeningBalance('0');
      setOpeningDate('');
    }
  }, [editingAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      bank_name: bankName,
      branch_name: branchName || undefined,
      account_number: accountNumber,
      account_alias: accountAlias || undefined,
      currency,
      opening_balance: parseFloat(openingBalance) || 0,
      opening_date: openingDate || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingAccount ? t('accounting:editAccount') : t('accounting:addAccount')}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:bankName')}</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:branchName')}</label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:accountNumber')}</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:accountAlias')}</label>
            <input
              type="text"
              value={accountAlias}
              onChange={(e) => setAccountAlias(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:currency')}</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:openingBalance')}</label>
              <input
                type="number"
                step="any"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:openingDate')}</label>
            <input
              type="date"
              value={openingDate}
              onChange={(e) => setOpeningDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('common:save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
