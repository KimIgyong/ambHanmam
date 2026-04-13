import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Plus, Trash2, RefreshCw, TrendingUp } from 'lucide-react';
import {
  useForecastReport,
  useForecastPreview,
  useCreateForecastReport,
  useUpdateForecastReport,
  useExportForecastReport,
  useSubmitForecastReport,
  useApproveForecastReport,
  useRejectForecastReport,
} from '../hooks/useExpenseReport';
import type {
  ForecastItemBody,
  ExpenseCategory,
} from '../service/expenseRequest.service';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const CATEGORIES: ExpenseCategory[] = [
  'TRAVEL', 'ENTERTAINMENT', 'SUPPLIES', 'TRAINING',
  'MARKETING', 'IT_INFRASTRUCTURE', 'MAINTENANCE', 'UTILITIES', 'OTHER',
];

export default function ForecastReportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('expenseRequest');

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 2 > 12 ? 1 : now.getMonth() + 2);
  const [memo, setMemo] = useState('');
  const [manualItems, setManualItems] = useState<ForecastItemBody[]>([]);
  const [previewEnabled, setPreviewEnabled] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: report } = useForecastReport(year, month);
  const { data: previewItems } = useForecastPreview(year, month, previewEnabled);
  const createMutation = useCreateForecastReport();
  const updateMutation = useUpdateForecastReport();
  const exportMutation = useExportForecastReport();
  const submitMutation = useSubmitForecastReport();
  const approveMutation = useApproveForecastReport();
  const rejectMutation = useRejectForecastReport();
  const isMaster = useAuthStore((s) => s.isMaster());

  const years = Array.from({ length: 3 }, (_, i) => now.getFullYear() + i - 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const recurringItems: ForecastItemBody[] = (previewItems ?? []).map((item) => ({
    type: item.type,
    category: item.category,
    name: item.name,
    amount: item.amount,
    quantity: item.quantity ?? 1,
    note: item.note ?? undefined,
    exr_id: (item as any).exrId ?? undefined,
    currency: item.currency ?? 'VND',
    prev_amount: item.prevAmount ?? undefined,
  }));
  const allItems: ForecastItemBody[] = [...recurringItems, ...manualItems];

  const totalAmount = allItems.reduce((sum, i) => sum + i.amount * i.quantity, 0);

  const addManualItem = () => {
    setManualItems((prev) => [
      ...prev,
      { type: 'MANUAL', category: 'OTHER', name: '', amount: 0, quantity: 1 },
    ]);
  };

  const removeManualItem = (idx: number) => {
    setManualItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateManualItem = (idx: number, field: keyof ForecastItemBody, value: unknown) => {
    setManualItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    );
  };

  const handleSave = async () => {
    const payload = { year, month, items: allItems, note: memo || undefined };
    if (report?.id) {
      await updateMutation.mutateAsync({ id: report.id, data: { items: allItems, note: memo || undefined } });
    } else {
      await createMutation.mutateAsync(payload);
    }
    setIsEditing(false);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

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
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {t('forecast.title')}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(e) => { setYear(Number(e.target.value)); setIsEditing(false); }}
              className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => { setMonth(Number(e.target.value)); setIsEditing(false); }}
              className="rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m) => (
                <option key={m} value={m}>{m}월</option>
              ))}
            </select>
            {report?.id && (
              <button
                onClick={() => exportMutation.mutate({ id: report.id, year, month })}
                disabled={exportMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {t('forecast.exportExcel')}
              </button>
            )}
            {!isEditing && report?.status === 'DRAFT' && (
              <button
                onClick={() => submitMutation.mutate(report.id)}
                disabled={submitMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {t('forecast.submitForReview')}
              </button>
            )}
            {!isEditing && report?.status === 'SUBMITTED' && isMaster && (
              <>
                <button
                  onClick={() => rejectMutation.mutate(report.id)}
                  disabled={rejectMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {t('forecast.reject')}
                </button>
                <button
                  onClick={() => approveMutation.mutate(report.id)}
                  disabled={approveMutation.isPending}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {t('forecast.approve')}
                </button>
              </>
            )}
            {!isEditing && (
              <button
                onClick={() => { setIsEditing(true); setPreviewEnabled(true); }}
                disabled={report?.status === 'APPROVED'}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                title={report?.status === 'APPROVED' ? t('forecast.approvedCannotEdit') : undefined}
              >
                {report ? t('action.edit') : t('forecast.createReport')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Summary */}
          {(report || isEditing) && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400">{t('forecast.totalAmount')}</div>
                <div className="text-xl font-bold text-purple-600 mt-1">
                  {(isEditing ? totalAmount : report?.totalAmount ?? 0).toLocaleString()}
                </div>
              </div>
              {report && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <div className="text-xs text-gray-500 dark:text-gray-400">상태</div>
                  <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {t(`forecast.status.${report.status}`)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Report */}
          {!report && !isEditing && (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-3">
              <TrendingUp className="h-10 w-10 opacity-20" />
              <p className="text-sm">{t('forecast.noReport')}</p>
              <button
                onClick={() => { setIsEditing(true); setPreviewEnabled(true); }}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                {t('forecast.createReport')}
              </button>
            </div>
          )}

          {/* Edit Mode */}
          {isEditing && (
            <>
              {/* Recurring Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('forecast.recurringItems')}
                  </h3>
                  <button
                    onClick={() => setPreviewEnabled(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {t('forecast.previewFromRecurring')}
                  </button>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          {t('forecast.itemName')}
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          {t('forecast.itemCategory')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          {t('forecast.itemQuantity')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">
                          {t('forecast.itemAmount')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {recurringItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-4 text-center text-gray-400 text-xs">
                            정기 지출 항목 없음
                          </td>
                        </tr>
                      ) : (
                        recurringItems.map((item, idx) => (
                          <tr key={idx} className="bg-gray-50/50 dark:bg-gray-800/30">
                            <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{item.name}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                              {t(`category.${item.category}`)}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-gray-100">
                              {(item.amount * item.quantity).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Manual Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {t('forecast.manualItems')}
                  </h3>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/80">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400 min-w-[140px]">
                          {t('forecast.itemName')}
                        </th>
                        <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-32">
                          {t('forecast.itemCategory')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-20">
                          {t('forecast.itemQuantity')}
                        </th>
                        <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-28">
                          {t('forecast.itemAmount')}
                        </th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {manualItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateManualItem(idx, 'name', e.target.value)}
                              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <select
                              value={item.category}
                              onChange={(e) => updateManualItem(idx, 'category', e.target.value as ExpenseCategory)}
                              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{t(`category.${cat}`)}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={(e) => updateManualItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              min={0}
                              value={item.amount}
                              onChange={(e) => updateManualItem(idx, 'amount', Number(e.target.value))}
                              className="w-full rounded border border-gray-200 dark:border-gray-600 px-2 py-1 text-sm text-right bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <button
                              type="button"
                              onClick={() => removeManualItem(idx)}
                              className="p-1 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {manualItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-3 py-4 text-center text-gray-400 text-xs">
                            수동 입력 항목 없음
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={addManualItem}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 border border-dashed border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {t('forecast.addManualItem')}
                </button>
              </div>

              {/* Memo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('forecast.memo')}
                </label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder={t('forecast.memoPlaceholder')}
                  rows={2}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('form.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {t('forecast.save')}
                </button>
              </div>
            </>
          )}

          {/* View Mode */}
          {report && !isEditing && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/80">
                  <tr>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                      {t('forecast.itemName')}
                    </th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                      {t('forecast.itemCategory')}
                    </th>
                    <th className="text-center px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                      유형
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                      전월 실적
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                      예정 금액
                    </th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600 dark:text-gray-400">
                      증감
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {(report.items ?? []).map((item, idx) => {
                    const planned = item.amount * item.quantity;
                    const prev = item.prevAmount ?? null;
                    const diffPct = prev != null && prev > 0
                      ? Math.round(((planned - prev) / prev) * 100)
                      : null;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {t(`category.${item.category}`)}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              item.type === 'RECURRING'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}
                          >
                            {t(`forecast.itemType.${item.type}`)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400">
                          {prev != null ? prev.toLocaleString() : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-gray-100">
                          {planned.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right text-xs">
                          {diffPct != null ? (
                            <span className={diffPct > 0 ? 'text-red-500 dark:text-red-400' : diffPct < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}>
                              {diffPct > 0 ? '▲' : diffPct < 0 ? '▼' : '—'}
                              {diffPct !== 0 ? ` ${Math.abs(diffPct)}%` : ''}
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
