import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { RecurringExpenseResponse, BankAccountResponse } from '@amb/types';

interface RecurringExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  editing: RecurringExpenseResponse | null;
  accounts: BankAccountResponse[];
}

const CATEGORIES = ['rent', 'salary', 'insurance', 'utilities', 'communication', 'subscription', 'tax', 'other'];

export default function RecurringExpenseFormModal({
  isOpen, onClose, onSubmit, editing, accounts,
}: RecurringExpenseFormModalProps) {
  const { t } = useTranslation(['accounting', 'common']);

  const [name, setName] = useState('');
  const [bacId, setBacId] = useState('');
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setBacId(editing.accountId);
      setVendor(editing.vendor || '');
      setAmount(String(editing.amount));
      setCurrency(editing.currency);
      setDayOfMonth(String(editing.dayOfMonth));
      setCategory(editing.category || '');
      setDescription(editing.description || '');
      setStartDate(editing.startDate || '');
      setEndDate(editing.endDate || '');
    } else {
      setName('');
      setBacId(accounts[0]?.accountId || '');
      setVendor('');
      setAmount('');
      setCurrency('VND');
      setDayOfMonth('1');
      setCategory('');
      setDescription('');
      setStartDate('');
      setEndDate('');
    }
  }, [editing, isOpen, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = {
      name,
      bac_id: bacId,
      amount: Number(amount),
      currency,
      day_of_month: Number(dayOfMonth),
    };
    if (vendor) data.vendor = vendor;
    if (category) data.category = category;
    if (description) data.description = description;
    if (startDate) data.start_date = startDate;
    if (endDate) data.end_date = endDate;
    onSubmit(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing
              ? t('accounting:recurring.edit', { defaultValue: '정기 지출 수정' })
              : t('accounting:recurring.add', { defaultValue: '정기 지출 추가' })}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('accounting:recurring.name', { defaultValue: '항목명' })} *
            </label>
            <input
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:recurring.account', { defaultValue: '출금 계좌' })} *
              </label>
              <select
                required value={bacId} onChange={(e) => { setBacId(e.target.value); const acc = accounts.find(a => a.accountId === e.target.value); if (acc) setCurrency(acc.currency); }}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              >
                {accounts.map((a) => (
                  <option key={a.accountId} value={a.accountId}>
                    {a.accountAlias || a.bankName} ({a.currency})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:recurring.dayOfMonth', { defaultValue: '매월 지출일' })} *
              </label>
              <input
                type="number" required min={1} max={31} value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:recurring.amount', { defaultValue: '예상 금액' })} *
              </label>
              <input
                type="number" required step="0.01" value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:vendor')}
              </label>
              <input
                type="text" value={vendor} onChange={(e) => setVendor(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('accounting:recurring.category', { defaultValue: '분류' })}
            </label>
            <select
              value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
            >
              <option value="">-</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t(`accounting:category.${c}`, { defaultValue: c })}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:recurring.startDate', { defaultValue: '시작일' })}
              </label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('accounting:recurring.endDate', { defaultValue: '종료일' })}
              </label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('accounting:description')}</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              {t('common:cancel')}
            </button>
            <button type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
              {editing ? t('common:save') : t('common:create', { defaultValue: '등록' })}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
