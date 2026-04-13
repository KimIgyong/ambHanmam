import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, FileSpreadsheet, BarChart3, Receipt, TrendingUp, FileText } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import { BankAccountResponse } from '@amb/types';
import {
  useAccountList,
  useAccountSummary,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
  useImportExcel,
} from '../hooks/useAccounts';
import AccountCard from '../components/AccountCard';
import AccountFormModal from '../components/AccountFormModal';
import ExcelImportModal from '../components/ExcelImportModal';
import BalanceSummaryCard from '../components/BalanceSummaryCard';
import { useExpenseRequestList, useExpenseStats } from '../../expense-request/hooks/useExpenseRequest';
import ExpenseStatusBadge from '../../expense-request/components/ExpenseStatusBadge';

type MainTab = 'accounts' | 'expenses';

export default function AccountingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['accounting', 'expenseRequest', 'common']);
  const [mainTab, setMainTab] = useState<MainTab>('accounts');

  // 계좌 관리
  const { data: accounts = [], isLoading } = useAccountList();
  const { data: summary } = useAccountSummary();
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccountResponse | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<{
    accountsCreated: number;
    transactionsImported: number;
    sheets: string[];
  } | null>(null);
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const importExcel = useImportExcel();

  // 지출 관리
  const { data: expenseData, isLoading: expenseLoading } = useExpenseRequestList(
    mainTab === 'expenses' ? { view: 'all' } : undefined
  );
  const { data: expenseStats } = useExpenseStats();
  const expenseItemsRaw = (expenseData as { data?: unknown } | undefined)?.data;
  const expenseItems = Array.isArray(expenseItemsRaw)
    ? expenseItemsRaw
    : Array.isArray((expenseItemsRaw as { data?: unknown[] } | undefined)?.data)
      ? ((expenseItemsRaw as { data?: unknown[] }).data ?? [])
      : [];

  const handleCreateOrUpdate = (data: {
    bank_name: string;
    branch_name?: string;
    account_number: string;
    account_alias?: string;
    currency: string;
    opening_balance?: number;
    opening_date?: string;
  }) => {
    if (editingAccount) {
      updateAccount.mutate(
        { id: editingAccount.accountId, data },
        { onSuccess: () => { setShowAccountModal(false); setEditingAccount(null); } },
      );
    } else {
      createAccount.mutate(data, {
        onSuccess: () => { setShowAccountModal(false); },
      });
    }
  };

  const handleDelete = (account: BankAccountResponse) => {
    if (window.confirm(t('accounting:deleteConfirm.account'))) {
      deleteAccount.mutate(account.accountId);
    }
  };

  const handleImport = async (formData: FormData) => {
    const result = await importExcel.mutateAsync(formData);
    setImportResult(result);
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <PageTitle>{t('accounting:title')}</PageTitle>
            <p className="text-sm text-gray-500">{t('accounting:subtitle')}</p>
          </div>
          {mainTab === 'accounts' && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/accounting/dashboard')}
                className="flex items-center gap-2 rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                <BarChart3 className="h-4 w-4" />
                {t('accounting:dashboard.title', { defaultValue: '대시보드' })}
              </button>
              <button
                onClick={() => { setImportResult(null); setShowImportModal(true); }}
                className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {t('accounting:importExcel')}
              </button>
              <button
                onClick={() => { setEditingAccount(null); setShowAccountModal(true); }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t('accounting:addAccount')}
              </button>
            </div>
          )}
          {mainTab === 'expenses' && (
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/expense-requests/reports/forecast')}
                className="flex items-center gap-2 rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100"
              >
                <TrendingUp className="h-4 w-4" />
                {t('accounting:expensesTab.forecastItems')}
              </button>
              <button
                onClick={() => navigate('/expense-requests/new')}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                {t('accounting:expensesTab.newRequest')}
              </button>
            </div>
          )}
        </div>

        {/* Main Tab 메뉴 */}
        <div className="mb-6 flex border-b border-gray-200">
          <button
            onClick={() => setMainTab('accounts')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'accounts'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            {t('accounting:expensesTab.accountsTab')}
          </button>
          <button
            onClick={() => setMainTab('expenses')}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              mainTab === 'expenses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Receipt className="h-4 w-4" />
            {t('accounting:expensesTab.tab')}
          </button>
        </div>

        {/* ── 통계 탭 ── */}
        {mainTab === 'accounts' && (
          <>
            {summary && Object.keys(summary.totalsByCurrency).length > 0 && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="mb-3 font-semibold text-gray-900">{t('accounting:totalByCurrency')}</h2>
                <BalanceSummaryCard totalsByCurrency={summary.totalsByCurrency} />
              </div>
            )}
            {isLoading ? (
              <div className="py-12 text-center text-gray-400">{t('common:loading')}</div>
            ) : accounts.length === 0 ? (
              <div className="py-12 text-center text-gray-400">{t('accounting:noAccounts')}</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {accounts.map((account) => (
                  <AccountCard
                    key={account.accountId}
                    account={account}
                    onClick={() => navigate(`/accounting/${account.accountId}`)}
                    onEdit={(e) => { e.stopPropagation(); setEditingAccount(account); setShowAccountModal(true); }}
                    onDelete={(e) => { e.stopPropagation(); handleDelete(account); }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 지출관리 탭 ── */}
        {mainTab === 'expenses' && (
          <>
            {/* 통계 카드 */}
            {expenseStats && (
              <div className="grid grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">{t('expenseRequest:status.PENDING')}</div>
                  <div className="text-2xl font-bold text-yellow-600 mt-1">{expenseStats.pending}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">{t('expenseRequest:status.APPROVED')}</div>
                  <div className="text-2xl font-bold text-green-600 mt-1">{expenseStats.approved}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">{t('expenseRequest:status.EXECUTED')}</div>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">{expenseStats.executed}</div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="text-xs text-gray-500">{t('expenseRequest:report.executedAmount')}</div>
                  <div className="text-xl font-bold text-gray-900 mt-1">{(expenseStats.executedAmount || 0).toLocaleString()}</div>
                </div>
              </div>
            )}

            {/* 목록 테이블 */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-gray-900 text-sm">{t('expenseRequest:title')}</span>
                </div>
                <button
                  onClick={() => navigate('/expense-requests')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  {t('accounting:expensesTab.viewDetail')} →
                </button>
              </div>
              {expenseLoading ? (
                <div className="py-10 text-center text-gray-400 text-sm">{t('common:loading')}</div>
              ) : expenseItems.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">{t('expenseRequest:common.noData')}</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left">{t('expenseRequest:common.requestNumber')}</th>
                      <th className="px-4 py-2.5 text-left">{t('expenseRequest:form.title')}</th>
                      <th className="px-4 py-2.5 text-left">{t('expenseRequest:common.requester')}</th>
                      <th className="px-4 py-2.5 text-right">{t('expenseRequest:common.amount')}</th>
                      <th className="px-4 py-2.5 text-center">{t('expenseRequest:detail.approvals')}</th>
                      <th className="px-4 py-2.5 text-left">{t('expenseRequest:common.createdAt')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseItems.slice(0, 20).map((item) => (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/expense-requests/${item.id}`)}
                        className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono text-xs text-blue-600">{item.requestNumber}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900 max-w-[200px] truncate">{item.title}</td>
                        <td className="px-4 py-2.5 text-gray-600">{item.requesterName}</td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900">{Number(item.totalAmount ?? 0).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-center">
                          <ExpenseStatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {expenseItems.length > 20 && (
                <div className="px-4 py-3 border-t border-gray-100 text-center">
                  <button
                    onClick={() => navigate('/expense-requests')}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {t('accounting:viewAll')} ({expenseItems.length}{t('common:unit.count', { defaultValue: '건' })})
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <AccountFormModal
        isOpen={showAccountModal}
        onClose={() => { setShowAccountModal(false); setEditingAccount(null); }}
        onSubmit={handleCreateOrUpdate}
        editingAccount={editingAccount}
      />

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportResult(null); }}
        onImport={handleImport}
        isLoading={importExcel.isPending}
        result={importResult}
      />
    </div>
  );
}
