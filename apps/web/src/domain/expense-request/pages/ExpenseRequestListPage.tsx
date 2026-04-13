import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, Plus, List, Clock, BarChart3, TrendingUp } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import {
  useExpenseRequestList,
  useExpenseStats,
} from '../hooks/useExpenseRequest';
import ExpenseStatusBadge from '../components/ExpenseStatusBadge';
import type { ExpenseRequestStatus } from '../service/expenseRequest.service';

type TabKey = 'all' | 'my' | 'pending';

const TABS: { key: TabKey; icon: React.ReactNode }[] = [
  { key: 'all', icon: <List className="h-4 w-4" /> },
  { key: 'my', icon: <FileText className="h-4 w-4" /> },
  { key: 'pending', icon: <Clock className="h-4 w-4" /> },
];

const STATUS_FILTER_OPTIONS: Array<{ value: ExpenseRequestStatus | ''; label: string }> = [
  { value: '', label: 'common.all' },
  { value: 'DRAFT', label: 'status.DRAFT' },
  { value: 'PENDING', label: 'status.PENDING' },
  { value: 'APPROVED_L1', label: 'status.APPROVED_L1' },
  { value: 'APPROVED', label: 'status.APPROVED' },
  { value: 'EXECUTED', label: 'status.EXECUTED' },
  { value: 'REJECTED', label: 'status.REJECTED' },
  { value: 'CANCELLED', label: 'status.CANCELLED' },
];

export default function ExpenseRequestListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('expenseRequest');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [statusFilter, setStatusFilter] = useState<ExpenseRequestStatus | ''>('');
  const [search, setSearch] = useState('');

  const viewMap: Record<TabKey, 'all' | 'my'> = {
    all: 'all',
    my: 'my',
    pending: 'all',
  };

  const effectiveStatusFilter: ExpenseRequestStatus | undefined =
    activeTab === 'pending' ? 'PENDING' : (statusFilter || undefined);

  const { data, isLoading } = useExpenseRequestList({
    view: viewMap[activeTab],
    status: effectiveStatusFilter,
    search: search || undefined,
  });

  const { data: stats } = useExpenseStats();

  const itemsRaw = (data as { data?: unknown } | undefined)?.data;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
    : Array.isArray((itemsRaw as { data?: unknown[] } | undefined)?.data)
      ? ((itemsRaw as { data?: unknown[] }).data ?? [])
      : [];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-0.5">
            <PageTitle>{t('title')}</PageTitle>
            <p className="text-xs text-gray-500">{t('subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/expense-requests/reports/monthly')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <BarChart3 className="h-4 w-4" />
              {t('tab.report')}
            </button>
            <button
              onClick={() => navigate('/expense-requests/reports/forecast')}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <TrendingUp className="h-4 w-4" />
              {t('tab.forecast')}
            </button>
            <button
              onClick={() => navigate('/expense-requests/new')}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('action.create')}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('status.PENDING')}</div>
              <div className="text-xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('status.APPROVED')}</div>
              <div className="text-xl font-bold text-green-600">{stats.approved}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('status.EXECUTED')}</div>
              <div className="text-xl font-bold text-emerald-600">{stats.executed}</div>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <div className="text-xs text-gray-500 dark:text-gray-400">{t('report.executedAmount')}</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {(stats.executedAmount || 0).toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {t(`tab.${tab.key === 'pending' ? 'pendingApproval' : tab.key === 'my' ? 'myRequests' : 'list'}`)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ExpenseRequestStatus | '')}
              className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('common.searchPlaceholder')}
              className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm w-52 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            {t('common.loading')}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
            <FileText className="h-8 w-8 opacity-30" />
            <p className="text-sm">{t('common.noData')}</p>
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-36">
                  {t('common.requestNumber')}
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400">
                  {t('form.title')}
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-24">
                  {t('common.requester')}
                </th>
                <th className="text-right py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-32">
                  {t('common.amount')}
                </th>
                <th className="text-center py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-24">
                  상태
                </th>
                <th className="text-left py-2 px-3 font-medium text-gray-600 dark:text-gray-400 w-28">
                  {t('common.createdAt')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => navigate(`/expense-requests/${item.id}`)}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-3 text-blue-600 dark:text-blue-400 font-mono text-xs">
                    {item.requestNumber}
                    {item.isRecurring && (
                      <span className="ml-1 px-1 py-0.5 text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                        {t(`recurringType.${item.recurringType}`)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-gray-900 dark:text-gray-100 font-medium">
                    {item.title}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">
                    {item.requesterName}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-900 dark:text-gray-100">
                    {Number(item.totalAmount ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <ExpenseStatusBadge status={item.status} />
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 dark:text-gray-400 text-xs">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
