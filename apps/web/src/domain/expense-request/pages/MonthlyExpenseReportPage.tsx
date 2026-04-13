import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, BarChart3 } from 'lucide-react';
import { useMonthlyReport, useExportMonthlyReport } from '../hooks/useExpenseReport';

export default function MonthlyExpenseReportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('expenseRequest');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: report, isLoading } = useMonthlyReport(year, month);
  const exportMutation = useExportMonthlyReport();

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/expense-requests')}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('report.title')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}월
                </option>
              ))}
            </select>
            {report && (
              <button
                onClick={() => exportMutation.mutate({ year, month })}
                disabled={exportMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {t('report.exportExcel')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            {t('common.loading')}
          </div>
        ) : !report ? (
          <div className="flex items-center justify-center h-40 text-gray-400">
            {t('report.noData')}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('report.totalCount')}</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {report.totalCount}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('report.totalAmount')}</div>
                <div className="text-xl font-bold text-blue-600 mt-1">
                  {report.totalAmount.toLocaleString()}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('report.executedCount')}</div>
                <div className="text-2xl font-bold text-emerald-600 mt-1">
                  {report.executedCount}
                </div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('report.executedAmount')}</div>
                <div className="text-xl font-bold text-emerald-600 mt-1">
                  {report.executedAmount.toLocaleString()}
                </div>
              </div>
            </div>

            {/* By Category */}
            {report.byCategory.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t('report.byCategory')}
                </h3>
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                      <tr>
                        <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                          {t('form.itemCategory')}
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                          {t('report.totalCount')}
                        </th>
                        <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                          {t('report.totalAmount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {report.byCategory.map((cat) => (
                        <tr key={cat.category} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                            {t(`category.${cat.category}`)}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-700 dark:text-gray-300">
                            {cat.count}
                          </td>
                          <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                            {cat.totalAmount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {t('report.items')}
              </h3>
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/80">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                        {t('form.title')}
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                        {t('common.requester')}
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                        {t('form.itemCategory')}
                      </th>
                      <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                        {t('common.amount')}
                      </th>
                      <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                        {t('execution.executionDate')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {report.items.map((item) => (
                      <tr key={item.requestId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                          {item.title}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {item.requesterName}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {t(`category.${item.category}`)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                          {item.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400 text-xs">
                          {new Date(item.executionDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
