import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, Trash2, Edit3, FileText, ToggleLeft, ToggleRight } from 'lucide-react';
import { RecurringExpenseResponse, BankAccountResponse } from '@amb/types';
import { useAccountList, useAccountSummary } from '../hooks/useAccounts';
import { useConsolidatedStats } from '../hooks/useAccountStats';
import {
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  useForecast,
} from '../hooks/useRecurringExpenses';
import BalanceSummaryCard from '../components/BalanceSummaryCard';
import MonthlyChart from '../components/MonthlyChart';
import RecurringExpenseFormModal from '../components/RecurringExpenseFormModal';
import AccountingAiChat from '../components/AccountingAiChat';

const getDefaultMonthRange = () => {
  const now = new Date();
  const end = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startMonth = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
  return { startMonth, endMonth: end };
};

const getNextMonth = () => {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
};

export default function AccountingDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['accounting', 'common']);
  const { data: accounts = [] } = useAccountList();
  const { data: summary } = useAccountSummary();

  // Consolidated stats
  const { startMonth, endMonth } = getDefaultMonthRange();
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const { data: consolidatedStats = [] } = useConsolidatedStats(
    selectedAccountIds,
    { start_month: startMonth, end_month: endMonth },
  );

  // Recurring expenses
  const { data: expenses = [] } = useRecurringExpenses();
  const createExpense = useCreateRecurringExpense();
  const updateExpense = useUpdateRecurringExpense();
  const deleteExpense = useDeleteRecurringExpense();
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<RecurringExpenseResponse | null>(null);

  // Forecast
  const [forecastMonth, setForecastMonth] = useState(getNextMonth());
  const { data: forecast } = useForecast(forecastMonth);

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId],
    );
  };

  const selectAllByCurrency = (currency: string) => {
    const ids = accounts.filter((a) => a.currency === currency && a.isActive).map((a) => a.accountId);
    setSelectedAccountIds(ids);
  };

  // Group accounts by currency
  const accountsByCurrency = useMemo(() => {
    const map: Record<string, BankAccountResponse[]> = {};
    accounts.filter((a) => a.isActive).forEach((a) => {
      (map[a.currency] ||= []).push(a);
    });
    return map;
  }, [accounts]);

  // Determine selected currency for chart label
  const selectedCurrency = useMemo(() => {
    const currencies = new Set(
      accounts.filter((a) => selectedAccountIds.includes(a.accountId)).map((a) => a.currency),
    );
    return currencies.size === 1 ? [...currencies][0] : '';
  }, [accounts, selectedAccountIds]);

  const handleExpenseSubmit = (data: any) => {
    if (editingExpense) {
      updateExpense.mutate(
        { id: editingExpense.id, data },
        { onSuccess: () => { setShowExpenseModal(false); setEditingExpense(null); } },
      );
    } else {
      createExpense.mutate(data, {
        onSuccess: () => setShowExpenseModal(false),
      });
    }
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm(t('accounting:recurring.deleteConfirm', { defaultValue: '이 정기 지출을 삭제하시겠습니까?' }))) {
      deleteExpense.mutate(id);
    }
  };

  const handleToggleActive = (expense: RecurringExpenseResponse) => {
    updateExpense.mutate({ id: expense.id, data: { is_active: !expense.isActive } });
  };

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat(undefined, {
      style: 'decimal',
      minimumFractionDigits: currency === 'VND' || currency === 'KRW' ? 0 : 2,
      maximumFractionDigits: currency === 'VND' || currency === 'KRW' ? 0 : 2,
    }).format(amount) + ` ${currency}`;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/accounting')} className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('accounting:dashboard.title', { defaultValue: '회계 대시보드' })}
            </h1>
            <p className="text-sm text-gray-500">
              {t('accounting:dashboard.subtitle', { defaultValue: '계좌 통합 통계 및 정기 지출 관리' })}
            </p>
          </div>
        </div>

        {/* Balance Summary */}
        {summary && Object.keys(summary.totalsByCurrency).length > 0 && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 font-semibold text-gray-900">{t('accounting:totalByCurrency')}</h2>
            <BalanceSummaryCard totalsByCurrency={summary.totalsByCurrency} />
          </div>
        )}

        {/* Consolidated Stats */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 font-semibold text-gray-900">
            {t('accounting:dashboard.consolidatedStats', { defaultValue: '통합 월별 통계' })}
          </h2>

          {/* Account selection */}
          <div className="mb-4 space-y-2">
            {Object.entries(accountsByCurrency).map(([currency, accs]) => (
              <div key={currency}>
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-500">{currency}</span>
                  <button
                    onClick={() => selectAllByCurrency(currency)}
                    className="text-xs text-indigo-500 hover:underline"
                  >
                    {t('accounting:dashboard.selectAll', { defaultValue: '전체 선택' })}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {accs.map((a) => (
                    <label
                      key={a.accountId}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                        selectedAccountIds.includes(a.accountId)
                          ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedAccountIds.includes(a.accountId)}
                        onChange={() => toggleAccount(a.accountId)}
                        className="sr-only"
                      />
                      {a.accountAlias || a.bankName}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {selectedAccountIds.length > 0 && consolidatedStats.length > 0 ? (
            <MonthlyChart data={consolidatedStats} currency={selectedCurrency} />
          ) : (
            <p className="py-8 text-center text-sm text-gray-400">
              {selectedAccountIds.length === 0
                ? t('accounting:dashboard.selectAccountsHint', { defaultValue: '통계를 볼 계좌를 선택하세요' })
                : t('accounting:dashboard.noData', { defaultValue: '데이터가 없습니다' })}
            </p>
          )}
        </div>

        {/* Recurring Expenses */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              {t('accounting:recurring.title', { defaultValue: '정기 지출 관리' })}
            </h2>
            <button
              onClick={() => { setEditingExpense(null); setShowExpenseModal(true); }}
              className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('accounting:recurring.add', { defaultValue: '정기 지출 추가' })}
            </button>
          </div>

          {expenses.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">
              {t('accounting:recurring.noExpenses', { defaultValue: '등록된 정기 지출이 없습니다' })}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">{t('accounting:recurring.name', { defaultValue: '항목명' })}</th>
                    <th className="pb-2 font-medium">{t('accounting:vendor')}</th>
                    <th className="pb-2 text-right font-medium">{t('accounting:recurring.amount', { defaultValue: '금액' })}</th>
                    <th className="pb-2 text-center font-medium">{t('accounting:recurring.dayOfMonth', { defaultValue: '지출일' })}</th>
                    <th className="pb-2 font-medium">{t('accounting:recurring.account', { defaultValue: '계좌' })}</th>
                    <th className="pb-2 font-medium">{t('accounting:recurring.category', { defaultValue: '분류' })}</th>
                    <th className="pb-2 text-center font-medium">{t('accounting:isActive')}</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2.5 font-medium text-gray-700">{exp.name}</td>
                      <td className="py-2.5 text-gray-500">{exp.vendor || '-'}</td>
                      <td className="py-2.5 text-right text-red-600">{formatAmount(exp.amount, exp.currency)}</td>
                      <td className="py-2.5 text-center text-gray-500">
                        {t('accounting:recurring.everyMonth', { defaultValue: '매월' })} {exp.dayOfMonth}{t('accounting:recurring.day', { defaultValue: '일' })}
                      </td>
                      <td className="py-2.5 text-gray-500">{exp.accountAlias}</td>
                      <td className="py-2.5 text-gray-500">
                        {exp.category ? t(`accounting:category.${exp.category}`, { defaultValue: exp.category }) : '-'}
                      </td>
                      <td className="py-2.5 text-center">
                        <button onClick={() => handleToggleActive(exp)} className="text-gray-400 hover:text-indigo-500">
                          {exp.isActive
                            ? <ToggleRight className="mx-auto h-5 w-5 text-indigo-500" />
                            : <ToggleLeft className="mx-auto h-5 w-5" />}
                        </button>
                      </td>
                      <td className="py-2.5">
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingExpense(exp); setShowExpenseModal(true); }}
                            className="text-gray-400 hover:text-indigo-500"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(exp.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              <FileText className="mr-1.5 inline h-4 w-4" />
              {t('accounting:forecast.title', { defaultValue: '정기 지출 예상 문서' })}
            </h2>
            <input
              type="month"
              value={forecastMonth}
              onChange={(e) => setForecastMonth(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300"
            />
          </div>

          {forecast && forecast.items.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-gray-500">
                      <th className="pb-2 font-medium">{t('accounting:recurring.name', { defaultValue: '항목명' })}</th>
                      <th className="pb-2 font-medium">{t('accounting:vendor')}</th>
                      <th className="pb-2 text-right font-medium">{t('accounting:forecast.expectedAmount', { defaultValue: '예상 금액' })}</th>
                      <th className="pb-2 text-right font-medium">{t('accounting:forecast.actualAmount', { defaultValue: '전월 실제' })}</th>
                      <th className="pb-2 text-right font-medium">{t('accounting:forecast.difference', { defaultValue: '차이' })}</th>
                      <th className="pb-2 font-medium">{t('accounting:recurring.account', { defaultValue: '계좌' })}</th>
                      <th className="pb-2 text-center font-medium">{t('accounting:forecast.expectedDate', { defaultValue: '예정일' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {forecast.items.map((item) => {
                      const diff = item.actualAmount != null ? item.expectedAmount - item.actualAmount : null;
                      return (
                        <tr key={item.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-2.5 font-medium text-gray-700">{item.name}</td>
                          <td className="py-2.5 text-gray-500">{item.vendor || '-'}</td>
                          <td className="py-2.5 text-right text-red-600">{formatAmount(item.expectedAmount, item.currency)}</td>
                          <td className="py-2.5 text-right text-gray-500">
                            {item.actualAmount != null ? formatAmount(item.actualAmount, item.currency) : '-'}
                          </td>
                          <td className={`py-2.5 text-right ${diff != null && diff > 0 ? 'text-red-500' : diff != null && diff < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                            {diff != null ? (diff > 0 ? '+' : '') + formatAmount(diff, item.currency) : '-'}
                          </td>
                          <td className="py-2.5 text-gray-500">{item.accountAlias || '-'}</td>
                          <td className="py-2.5 text-center text-gray-500">
                            {forecastMonth}-{String(item.dayOfMonth).padStart(2, '0')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-3 flex flex-wrap gap-4 border-t pt-3">
                {Object.entries(forecast.totalsByCurrency).map(([cur, total]) => (
                  <div key={cur} className="text-sm">
                    <span className="text-gray-500">{cur}: </span>
                    <span className="font-semibold text-red-600">{formatAmount(total, cur)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-6 text-center text-sm text-gray-400">
              {t('accounting:forecast.noItems', { defaultValue: '해당 월의 예상 지출이 없습니다' })}
            </p>
          )}
        </div>
      </div>

      {/* Modals */}
      <RecurringExpenseFormModal
        isOpen={showExpenseModal}
        onClose={() => { setShowExpenseModal(false); setEditingExpense(null); }}
        onSubmit={handleExpenseSubmit}
        editing={editingExpense}
        accounts={accounts}
      />

      <AccountingAiChat />
    </div>
  );
}
