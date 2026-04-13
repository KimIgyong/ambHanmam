import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useSowDetail, useCreateSow, useUpdateSow } from '../hooks/useSow';
import { useContractList } from '../hooks/useContract';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import DocumentManager from '../components/common/DocumentManager';

const SOW_STATUSES = ['DRAFT', 'SIGNED', 'IN_PROGRESS', 'COMPLETED', 'ACCEPTED'] as const;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SIGNED: 'bg-blue-50 text-blue-700',
  IN_PROGRESS: 'bg-yellow-50 text-yellow-700',
  COMPLETED: 'bg-green-50 text-green-700',
  ACCEPTED: 'bg-purple-50 text-purple-700',
};

interface SowForm {
  contract_id: string;
  title: string;
  description: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: string;
  status: string;
  note: string;
}

const emptyForm: SowForm = {
  contract_id: '',
  title: '',
  description: '',
  period_start: '',
  period_end: '',
  amount: 0,
  currency: 'USD',
  status: 'DRAFT',
  note: '',
};

export default function SowDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['billing', 'common']);
  const isNew = !id || id === 'new';
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const { data: sow, isLoading } = useSowDetail(isNew ? '' : id);
  const { data: contracts = [] } = useContractList({ status: 'ACTIVE' });
  const createMutation = useCreateSow();
  const updateMutation = useUpdateSow();

  const [form, setForm] = useState<SowForm>(emptyForm);

  useEffect(() => {
    if (sow) {
      setForm({
        contract_id: sow.contractId,
        title: sow.title,
        description: sow.description || '',
        period_start: sow.periodStart,
        period_end: sow.periodEnd,
        amount: sow.amount,
        currency: sow.currency,
        status: sow.status,
        note: sow.note || '',
      });
    } else if (isNew && currentEntity) {
      setForm((prev) => ({ ...prev, currency: currentEntity.currency }));
    }
  }, [sow, isNew, currentEntity]);

  const handleChange = (field: keyof SowForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = { ...form };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null;
    });

    if (isNew) {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync({ id: id!, data: payload });
    }
    navigate('/billing/sow');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (!isNew && isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-gray-500">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/billing/sow')}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isNew ? t('billing:sow.createTitle') : t('billing:sow.editTitle')}
            </h1>
            {sow && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[sow.status] || 'bg-gray-100 text-gray-600'}`}>
                {t(`billing:sow.status.${sow.status}`)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/billing/sow')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common:close')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !form.contract_id || !form.title || !form.period_start || !form.period_end}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? t('common:processing') : t('common:save')}
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:sow.form.contract')} *
                </label>
                <select
                  value={form.contract_id}
                  onChange={(e) => handleChange('contract_id', e.target.value)}
                  disabled={!isNew}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                >
                  <option value="">{t('common:select')}</option>
                  {contracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      [{c.partnerCode}] {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:sow.form.title')} *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              {!isNew && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('billing:sow.form.status')}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {SOW_STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`billing:sow.status.${s}`)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Period & Amount */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:sow.form.periodStart')} *
                </label>
                <input
                  type="date"
                  value={form.period_start}
                  onChange={(e) => handleChange('period_start', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:sow.form.periodEnd')} *
                </label>
                <input
                  type="date"
                  value={form.period_end}
                  onChange={(e) => handleChange('period_end', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:sow.form.amount')}
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:sow.form.currency')}
                </label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Description & Note */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billing:sow.form.description')}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billing:sow.form.note')}
              </label>
              <textarea
                value={form.note}
                onChange={(e) => handleChange('note', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Documents */}
          {!isNew && id && (
            <DocumentManager refType="SOW" refId={id} />
          )}
        </div>
      </div>
    </div>
  );
}
