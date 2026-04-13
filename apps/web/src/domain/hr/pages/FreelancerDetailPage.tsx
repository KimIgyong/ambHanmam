import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useFreelancerDetail, useCreateFreelancer, useUpdateFreelancer } from '../hooks/useFreelancer';

const PAYMENT_TYPES = ['BUSINESS_INCOME', 'SERVICE_FEE'];
const STATUSES = ['ACTIVE', 'COMPLETED', 'TERMINATED'];

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const isNew = id === 'new';

  const { data: freelancer, isLoading } = useFreelancerDetail(isNew ? '' : (id || ''));
  const createMutation = useCreateFreelancer();
  const updateMutation = useUpdateFreelancer();

  const [form, setForm] = useState({
    code: '',
    full_name: '',
    nationality: '',
    address: '',
    phone: '',
    contract_start: '',
    contract_end: '',
    contract_amount: 0,
    monthly_amount: 0,
    payment_type: 'BUSINESS_INCOME',
    tax_rate: 3.0,
    status: 'ACTIVE',
  });

  useEffect(() => {
    if (freelancer) {
      setForm({
        code: freelancer.code,
        full_name: freelancer.fullName,
        nationality: freelancer.nationality || '',
        address: '',
        phone: '',
        contract_start: freelancer.contractStart || '',
        contract_end: freelancer.contractEnd || '',
        contract_amount: freelancer.contractAmount,
        monthly_amount: freelancer.monthlyAmount,
        payment_type: freelancer.paymentType,
        tax_rate: freelancer.taxRate,
        status: freelancer.status,
      });
    }
  }, [freelancer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(form)) {
      payload[key] = value === '' ? undefined : value;
    }

    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: (result) => {
          navigate(`/hr/freelancers/${result.freelancerId}`, { replace: true });
        },
      });
    } else if (id) {
      const { code, ...updateData } = payload;
      updateMutation.mutate({ id, data: updateData });
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/hr/freelancers')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Users className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {isNew ? t('hr:kr.freelancer.add') : `${freelancer?.code} ${freelancer?.fullName}`}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white px-6 py-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.code')} *
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={!isNew}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="F01"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.name')} *
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => handleChange('full_name', e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.contractStart')}
              </label>
              <input
                type="date"
                value={form.contract_start}
                onChange={(e) => handleChange('contract_start', e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.contractEnd')}
              </label>
              <input
                type="date"
                value={form.contract_end}
                onChange={(e) => handleChange('contract_end', e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.contractAmount')}
              </label>
              <input
                type="number"
                value={form.contract_amount}
                onChange={(e) => handleChange('contract_amount', Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.monthlyAmount')}
              </label>
              <input
                type="number"
                value={form.monthly_amount}
                onChange={(e) => handleChange('monthly_amount', Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.paymentType')}
              </label>
              <select
                value={form.payment_type}
                onChange={(e) => handleChange('payment_type', e.target.value)}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
              >
                {PAYMENT_TYPES.map((pt) => (
                  <option key={pt} value={pt}>{t(`hr:kr.freelancer.paymentTypes.${pt.toLowerCase()}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:kr.freelancer.taxRate')} (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={form.tax_rate}
                onChange={(e) => handleChange('tax_rate', Number(e.target.value))}
                disabled={!isAdmin}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
              />
            </div>
            {!isNew && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('hr:employee.form.status')}
                </label>
                <select
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  disabled={!isAdmin}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{t(`hr:kr.freelancer.status.${s.toLowerCase()}`)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex justify-end gap-2 pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? t('common:processing') : t('common:save')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
