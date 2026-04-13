import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, DollarSign, Check } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useFreelancerList } from '../hooks/useFreelancer';
import {
  useBusinessIncomeList,
  useCreateBusinessIncome,
  useUpdateBusinessIncome,
  useDeleteBusinessIncome,
} from '../hooks/useBusinessIncome';

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function BusinessIncomePage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [showForm, setShowForm] = useState(false);

  const { data: payments = [], isLoading } = useBusinessIncomeList(yearMonth);
  const { data: freelancers = [] } = useFreelancerList();
  const createMutation = useCreateBusinessIncome();
  const updateMutation = useUpdateBusinessIncome();
  const deleteMutation = useDeleteBusinessIncome();

  const [form, setForm] = useState({
    freelancer_id: '',
    gross_amount: 0,
    weekly_holiday: 0,
    incentive: 0,
    prepaid: 0,
    employ_ins: 0,
    accident_ins: 0,
    student_loan: 0,
    payment_date: '',
  });

  const activeFreelancers = freelancers.filter((f) => f.status === 'ACTIVE');

  const resetForm = () => {
    setForm({
      freelancer_id: '',
      gross_amount: 0,
      weekly_holiday: 0,
      incentive: 0,
      prepaid: 0,
      employ_ins: 0,
      accident_ins: 0,
      student_loan: 0,
      payment_date: '',
    });
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!form.freelancer_id) return;
    createMutation.mutate(
      { ...form, year_month: yearMonth },
      { onSuccess: resetForm },
    );
  };

  const handleDelete = (id: string) => {
    if (confirm(t('hr:businessIncome.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleFinalize = (id: string) => {
    if (confirm(t('hr:businessIncome.finalizeConfirm'))) {
      updateMutation.mutate({ id, data: { status: 'FINALIZED' } });
    }
  };

  const formatAmount = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  // 월 이동
  const moveMonth = (delta: number) => {
    const [y, m] = yearMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setYearMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  // 합계
  const totals = payments.reduce(
    (acc, p) => ({
      totalAmount: acc.totalAmount + p.totalAmount,
      deductionTotal: acc.deductionTotal + p.deductionTotal,
      netAmount: acc.netAmount + p.netAmount,
    }),
    { totalAmount: 0, deductionTotal: 0, netAmount: 0 },
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-teal-500" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">{t('hr:businessIncome.title')}</h1>
              <p className="text-sm text-gray-500">{t('hr:businessIncome.subtitle')}</p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              <Plus className="h-4 w-4" />
              {t('hr:businessIncome.add')}
            </button>
          )}
        </div>

        {/* Month selector */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => moveMonth(-1)}
            className="rounded border px-2 py-1 text-sm hover:bg-gray-100"
          >
            &larr;
          </button>
          <input
            type="month"
            value={yearMonth}
            onChange={(e) => setYearMonth(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => moveMonth(1)}
            className="rounded border px-2 py-1 text-sm hover:bg-gray-100"
          >
            &rarr;
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">{t('hr:businessIncome.addNew')}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.freelancer')}</label>
                <select
                  value={form.freelancer_id}
                  onChange={(e) => setForm({ ...form, freelancer_id: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">{t('hr:businessIncome.selectFreelancer')}</option>
                  {activeFreelancers.map((f) => (
                    <option key={f.freelancerId} value={f.freelancerId}>
                      {f.code} - {f.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.paymentDate')}</label>
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.grossAmount')}</label>
                <input
                  type="number"
                  value={form.gross_amount}
                  onChange={(e) => setForm({ ...form, gross_amount: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.weeklyHoliday')}</label>
                <input
                  type="number"
                  value={form.weekly_holiday}
                  onChange={(e) => setForm({ ...form, weekly_holiday: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.incentive')}</label>
                <input
                  type="number"
                  value={form.incentive}
                  onChange={(e) => setForm({ ...form, incentive: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.prepaid')}</label>
                <input
                  type="number"
                  value={form.prepaid}
                  onChange={(e) => setForm({ ...form, prepaid: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.employIns')}</label>
                <input
                  type="number"
                  value={form.employ_ins}
                  onChange={(e) => setForm({ ...form, employ_ins: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.accidentIns')}</label>
                <input
                  type="number"
                  value={form.accident_ins}
                  onChange={(e) => setForm({ ...form, accident_ins: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">{t('hr:businessIncome.studentLoan')}</label>
                <input
                  type="number"
                  value={form.student_loan}
                  onChange={(e) => setForm({ ...form, student_loan: Number(e.target.value) })}
                  className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm text-right"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={resetForm} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-100">
                {t('common:close')}
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.freelancer_id || createMutation.isPending}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {createMutation.isPending ? t('common:processing') : t('common:save')}
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">{t('hr:businessIncome.empty')}</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2.5">{t('hr:businessIncome.freelancer')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:businessIncome.grossAmount')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:businessIncome.totalAmount')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:businessIncome.incomeTax')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:businessIncome.localTax')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:businessIncome.deductionTotal')}</th>
                  <th className="px-3 py-2.5 text-right">{t('hr:businessIncome.netAmount')}</th>
                  <th className="px-3 py-2.5">{t('hr:businessIncome.status')}</th>
                  {isAdmin && <th className="px-3 py-2.5 w-24" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.paymentId} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-gray-900">{p.freelancerName}</div>
                      <div className="text-xs text-gray-400">{p.freelancerCode}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatAmount(p.grossAmount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatAmount(p.totalAmount)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatAmount(p.incomeTax)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatAmount(p.localTax)}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{formatAmount(p.deductionTotal)}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium">{formatAmount(p.netAmount)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === 'FINALIZED'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {t(`hr:businessIncome.statusLabel.${p.status.toLowerCase()}`)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1">
                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => handleFinalize(p.paymentId)}
                              className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
                              title={t('hr:businessIncome.finalize')}
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          {p.status === 'DRAFT' && (
                            <button
                              onClick={() => handleDelete(p.paymentId)}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-medium">
                <tr>
                  <td className="px-3 py-2.5 text-xs uppercase text-gray-500">{t('hr:businessIncome.total')}</td>
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 text-right font-mono">{formatAmount(totals.totalAmount)}</td>
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5" />
                  <td className="px-3 py-2.5 text-right font-mono">{formatAmount(totals.deductionTotal)}</td>
                  <td className="px-3 py-2.5 text-right font-mono">{formatAmount(totals.netAmount)}</td>
                  <td className="px-3 py-2.5" />
                  {isAdmin && <td className="px-3 py-2.5" />}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
