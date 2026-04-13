import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { TransactionResponse } from '@amb/types';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    transaction_date: string;
    project_name?: string;
    net_value: number;
    vat?: number;
    bank_charge?: number;
    vendor?: string;
    description?: string;
  }) => void;
  editingTransaction?: TransactionResponse | null;
}

export default function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
}: TransactionFormModalProps) {
  const { t } = useTranslation(['accounting', 'common']);
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isDeposit, setIsDeposit] = useState(true);
  const [amount, setAmount] = useState('');
  const [projectName, setProjectName] = useState('');
  const [vat, setVat] = useState('0');
  const [bankCharge, setBankCharge] = useState('0');
  const [vendor, setVendor] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setTransactionDate(editingTransaction.transactionDate);
      const nv = editingTransaction.netValue;
      setIsDeposit(nv >= 0);
      setAmount(String(Math.abs(nv)));
      setProjectName(editingTransaction.projectName || '');
      setVat(String(Math.abs(editingTransaction.vat)));
      setBankCharge(String(Math.abs(editingTransaction.bankCharge)));
      setVendor(editingTransaction.vendor || '');
      setDescription(editingTransaction.description || '');
    } else {
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setIsDeposit(true);
      setAmount('');
      setProjectName('');
      setVat('0');
      setBankCharge('0');
      setVendor('');
      setDescription('');
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sign = isDeposit ? 1 : -1;
    const netValue = sign * (parseFloat(amount) || 0);
    const vatVal = parseFloat(vat) || 0;
    const bankChargeVal = -(Math.abs(parseFloat(bankCharge) || 0));

    onSubmit({
      transaction_date: transactionDate,
      project_name: projectName || undefined,
      net_value: netValue,
      vat: vatVal,
      bank_charge: bankChargeVal,
      vendor: vendor || undefined,
      description: description || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingTransaction ? t('accounting:editTransaction') : t('accounting:addTransaction')}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:transactionDate')}
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:deposit')}/{t('accounting:withdrawal')}
              </label>
              <div className="flex rounded-lg border border-gray-300">
                <button
                  type="button"
                  onClick={() => setIsDeposit(true)}
                  className={`flex-1 rounded-l-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isDeposit
                      ? 'bg-green-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t('accounting:deposit')}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeposit(false)}
                  className={`flex-1 rounded-r-lg px-3 py-2 text-sm font-medium transition-colors ${
                    !isDeposit
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {t('accounting:withdrawal')}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:netValue')}</label>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:vat')}</label>
              <input
                type="number"
                step="any"
                value={vat}
                onChange={(e) => setVat(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:bankCharge')}</label>
              <input
                type="number"
                step="any"
                value={bankCharge}
                onChange={(e) => setBankCharge(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:projectName')}</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:vendor')}</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
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
