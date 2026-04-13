import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Upload, Trash2 } from 'lucide-react';
import { useContractDetail, useCreateContract, useUpdateContract, useRenewContract } from '../hooks/useContract';
import { usePartnerList } from '../hooks/usePartner';
import { useProjectList } from '@/domain/project/hooks/useProject';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import SearchableSelect from '../components/common/SearchableSelect';
import AutosuggestInput from '../components/common/AutosuggestInput';
import MilestoneEditor, { MilestoneItem } from '../components/contract/MilestoneEditor';
import PaymentScheduleEditor, { PaymentScheduleItem } from '../components/contract/PaymentScheduleEditor';
import ContractStatusBadge from '../components/contract/ContractStatusBadge';
import ContractHistoryLog from '../components/contract/ContractHistoryLog';
import DocumentManager from '../components/common/DocumentManager';
import CurrencyInput from '../components/common/CurrencyInput';
import { useUploadDocument } from '../hooks/useDocument';

const DIRECTIONS = ['RECEIVABLE', 'PAYABLE'] as const;
const CATEGORIES = ['TECH_BPO', 'SI_DEV', 'MAINTENANCE', 'MARKETING', 'GENERAL_AFFAIRS', 'OTHER'] as const;
const TYPES = ['FIXED', 'USAGE_BASED', 'MILESTONE', 'AD_HOC'] as const;

const STATUS_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['ACTIVE', 'TERMINATED'],
  ACTIVE: ['EXPIRING', 'ENDED', 'RENEWED', 'TERMINATED', 'LIQUIDATED'],
  EXPIRING: ['RENEWED', 'EXPIRED', 'ENDED', 'TERMINATED', 'LIQUIDATED'],
  EXPIRED: ['RENEWED', 'ENDED'],
  ENDED: ['LIQUIDATED'],
  RENEWED: [],
  TERMINATED: [],
  LIQUIDATED: [],
};

interface ContractForm {
  partner_id: string;
  direction: string;
  category: string;
  type: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  amount: number;
  currency: string;
  auto_renew: boolean;
  billing_day: number | null;
  billing_period: string;
  auto_generate: boolean;
  unit_price: number | null;
  unit_desc: string;
  note: string;
  gsheet_url: string;
  gsheet_tab_pattern: string;
  assigned_user_id: string;
  payment_type: string;
  billing_amount: number | null;
}

const emptyForm: ContractForm = {
  partner_id: '',
  direction: 'RECEIVABLE',
  category: 'TECH_BPO',
  type: 'FIXED',
  title: '',
  description: '',
  start_date: '',
  end_date: '',
  amount: 0,
  currency: 'USD',
  auto_renew: false,
  billing_day: null,
  billing_period: '',
  auto_generate: false,
  unit_price: null,
  unit_desc: '',
  note: '',
  gsheet_url: '',
  gsheet_tab_pattern: '',
  assigned_user_id: '',
  payment_type: '',
  billing_amount: null,
};

export default function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['billing', 'common']);
  const isNew = !id || id === 'new';
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const { data: contract, isLoading } = useContractDetail(isNew ? '' : id);
  const { data: partners = [] } = usePartnerList({ status: 'ACTIVE' });
  const { data: projects = [] } = useProjectList();
  const createMutation = useCreateContract();
  const updateMutation = useUpdateContract();
  const renewMutation = useRenewContract();
  const uploadMutation = useUploadDocument();

  const [form, setForm] = useState<ContractForm>(emptyForm);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [paymentSchedules, setPaymentSchedules] = useState<PaymentScheduleItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<{ file: File; docType: string }[]>([]);

  useEffect(() => {
    if (contract) {
      setForm({
        partner_id: contract.partnerId,
        direction: contract.direction,
        category: contract.category,
        type: contract.type,
        title: contract.title,
        description: contract.description || '',
        start_date: contract.startDate,
        end_date: contract.endDate || '',
        amount: contract.amount,
        currency: contract.currency,
        auto_renew: contract.autoRenew,
        billing_day: contract.billingDay,
        billing_period: contract.billingPeriod || '',
        auto_generate: contract.autoGenerate,
        unit_price: contract.unitPrice,
        unit_desc: contract.unitDesc || '',
        note: contract.note || '',
        gsheet_url: contract.gsheetUrl || '',
        gsheet_tab_pattern: contract.gsheetTabPattern || '',
        assigned_user_id: contract.assignedUserId || '',
        payment_type: contract.paymentType || '',
        billing_amount: contract.billingAmount ?? null,
      });
      setMilestones(
        (contract.milestones || []).map((m) => ({
          seq: m.seq,
          label: m.label,
          percentage: m.percentage,
          amount: m.amount,
          due_date: m.dueDate || '',
          status: m.status,
        })),
      );
      setPaymentSchedules(
        (contract.paymentSchedules || []).map((s) => ({
          seq: s.seq,
          billing_date: s.billingDate || '',
          billing_period: s.billingPeriod || 'CURRENT_MONTH',
          amount: s.amount,
          status: s.status,
        })),
      );
    } else if (isNew && currentEntity) {
      setForm((prev) => ({
        ...prev,
        currency: currentEntity.currency,
      }));
    }
  }, [contract, isNew, currentEntity]);

  const handleChange = (field: keyof ContractForm, value: string | number | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = { ...form };
    if (milestones.length > 0) payload.milestones = milestones;
    if (form.payment_type === 'IRREGULAR' && paymentSchedules.length > 0) {
      payload.payment_schedules = paymentSchedules;
    }
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null;
    });

    if (isNew) {
      const result = await createMutation.mutateAsync(payload);
      // 신규 등록 후 첨부파일 업로드
      if (pendingFiles.length > 0 && result?.contractId) {
        for (const pf of pendingFiles) {
          await uploadMutation.mutateAsync({
            refType: 'CONTRACT',
            refId: result.contractId,
            docType: pf.docType,
            file: pf.file,
          });
        }
      }
    } else {
      await updateMutation.mutateAsync({ id: id!, data: payload });
    }
    navigate('/billing/contracts');
  };

  const handleRenew = async () => {
    if (!window.confirm(t('billing:contract.renewConfirm'))) return;
    await renewMutation.mutateAsync(id!);
    navigate('/billing/contracts');
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const canRenew = contract && ['ACTIVE', 'EXPIRING', 'EXPIRED'].includes(contract.status);
  const availableTransitions = contract ? (STATUS_TRANSITIONS[contract.status] || []) : [];

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
              onClick={() => navigate('/billing/contracts')}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isNew ? t('billing:contract.createTitle') : t('billing:contract.editTitle')}
            </h1>
            {contract && <ContractStatusBadge status={contract.status} />}
            {contract && availableTransitions.length > 0 && (
              <select
                value=""
                onChange={async (e) => {
                  const newStatus = e.target.value;
                  if (!newStatus) return;
                  const label = t(`billing:contract.status.${newStatus}`);
                  if (!window.confirm(`${t(`billing:contract.status.${contract.status}`)} → ${label}`)) return;
                  await updateMutation.mutateAsync({ id: id!, data: { status: newStatus } });
                }}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 focus:border-orange-500 focus:outline-none"
              >
                <option value="">{t('billing:contract.changeStatus', '상태 변경')}</option>
                {availableTransitions.map((s) => (
                  <option key={s} value={s}>{t(`billing:contract.status.${s}`)}</option>
                ))}
              </select>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canRenew && (
              <button
                onClick={handleRenew}
                disabled={renewMutation.isPending}
                className="rounded-md border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
              >
                {t('billing:contract.renew')}
              </button>
            )}
            <button
              onClick={() => navigate('/billing/contracts')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common:close')}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving || !form.partner_id || !form.title || !form.start_date}
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
                  {t('billing:contract.form.title')} *
                </label>
                <AutosuggestInput
                  value={form.title}
                  onChange={(v) => handleChange('title', v)}
                  suggestions={projects.map((p) => p.name)}
                  placeholder={t('billing:contract.form.titlePlaceholder', '프로젝트명 또는 계약 제목을 입력하세요')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.partner')} *
                </label>
                <SearchableSelect
                  value={form.partner_id}
                  onChange={(v) => handleChange('partner_id', v)}
                  options={partners.map((p) => ({
                    value: p.partnerId,
                    label: `[${p.code}] ${p.companyName}`,
                    subLabel: p.companyNameLocal || undefined,
                  }))}
                  placeholder={t('billing:contract.form.partnerSearch', '거래처 검색...')}
                  disabled={!isNew}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.direction')} *
                </label>
                <select
                  value={form.direction}
                  onChange={(e) => handleChange('direction', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>{t(`billing:contract.direction.${d}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.category')}
                </label>
                <select
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{t(`billing:contract.category.${c}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.type')}
                </label>
                <select
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {TYPES.map((t2) => (
                    <option key={t2} value={t2}>{t(`billing:contract.type.${t2}`)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Period & Amount */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.startDate')} *
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => handleChange('start_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.endDate')}
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => handleChange('end_date', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.amount')}
                </label>
                <CurrencyInput
                  value={form.amount}
                  onChange={(v) => handleChange('amount', v)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.currency')}
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

          {/* Billing Options */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Payment Type */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('billing:contract.form.paymentType', '결제 유형')}
                </label>
                <div className="flex gap-4">
                  {['', 'REGULAR', 'IRREGULAR'].map((pt) => (
                    <label key={pt || 'none'} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="payment_type"
                        value={pt}
                        checked={form.payment_type === pt}
                        onChange={() => handleChange('payment_type', pt)}
                        className="h-4 w-4 border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      {pt === '' ? t('billing:contract.paymentTypeOpt.NONE', '미설정')
                        : t(`billing:contract.paymentTypeOpt.${pt}`)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Regular payment options */}
              {form.payment_type === 'REGULAR' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('billing:contract.form.billingAmount', '회차 청구 금액')}
                    </label>
                    <CurrencyInput
                      value={form.billing_amount ?? 0}
                      onChange={(v) => handleChange('billing_amount', v)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.auto_renew}
                  onChange={(e) => handleChange('auto_renew', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label className="text-sm text-gray-700">{t('billing:contract.form.autoRenew')}</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.billingDay')}
                </label>
                <input
                  type="number"
                  value={form.billing_day ?? ''}
                  onChange={(e) => handleChange('billing_day', e.target.value ? parseInt(e.target.value) : null)}
                  min={1}
                  max={31}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:contract.form.billingPeriod')}
                </label>
                <select
                  value={form.billing_period}
                  onChange={(e) => handleChange('billing_period', e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">{t('common:select')}</option>
                  <option value="CURRENT_MONTH">{t('billing:contract.billingPeriodOpt.CURRENT_MONTH')}</option>
                  <option value="PREVIOUS_MONTH">{t('billing:contract.billingPeriodOpt.PREVIOUS_MONTH')}</option>
                </select>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.auto_generate}
                  onChange={(e) => handleChange('auto_generate', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <label className="text-sm text-gray-700">{t('billing:contract.form.autoGenerate')}</label>
              </div>
              {form.type === 'USAGE_BASED' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('billing:contract.form.unitPrice')}
                    </label>
                    <input
                      type="number"
                      value={form.unit_price ?? ''}
                      onChange={(e) => handleChange('unit_price', e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('billing:contract.form.unitDesc')}
                    </label>
                    <input
                      type="text"
                      value={form.unit_desc}
                      onChange={(e) => handleChange('unit_desc', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}
              {form.auto_generate && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('billing:contract.form.gsheetUrl')}
                    </label>
                    <input
                      type="url"
                      value={form.gsheet_url}
                      onChange={(e) => handleChange('gsheet_url', e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('billing:contract.form.gsheetTabPattern')}
                    </label>
                    <select
                      value={form.gsheet_tab_pattern}
                      onChange={(e) => handleChange('gsheet_tab_pattern', e.target.value)}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    >
                      <option value="">{t('common:select')}</option>
                      <option value="YYYY-MM">YYYY-MM (2026-02)</option>
                      <option value="YYYY.MM">YYYY.MM (2026.02)</option>
                      <option value="MM/YYYY">MM/YYYY (02/2026)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('billing:contract.form.assignedUser')}
                    </label>
                    <input
                      type="text"
                      value={form.assigned_user_id}
                      onChange={(e) => handleChange('assigned_user_id', e.target.value)}
                      placeholder="User ID"
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Milestones (only for MILESTONE type) */}
          {form.type === 'MILESTONE' && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <MilestoneEditor
                milestones={milestones}
                contractAmount={form.amount}
                onChange={setMilestones}
              />
            </div>
          )}

          {/* Payment Schedules (only for IRREGULAR payment type) */}
          {form.payment_type === 'IRREGULAR' && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <PaymentScheduleEditor
                schedules={paymentSchedules}
                contractAmount={form.amount}
                onChange={setPaymentSchedules}
              />
            </div>
          )}

          {/* Description & Note */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('billing:contract.form.description')}
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
                {t('billing:contract.form.note')}
              </label>
              <textarea
                value={form.note}
                onChange={(e) => handleChange('note', e.target.value)}
                rows={2}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Documents - New contract: pending files */}
          {isNew && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  {t('billing:document.title', '관련 문서')}
                </h3>
                <label className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  {t('billing:document.upload', '업로드')}
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setPendingFiles((prev) => [
                        ...prev,
                        ...files.map((f) => ({ file: f, docType: 'OTHER' })),
                      ]);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
              {pendingFiles.length === 0 ? (
                <p className="text-xs text-gray-400">{t('billing:document.noDocuments', '등록된 문서가 없습니다.')}</p>
              ) : (
                <ul className="space-y-1">
                  {pendingFiles.map((pf, i) => (
                    <li key={i} className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                      <span className="truncate">{pf.file.name}</span>
                      <button
                        type="button"
                        onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="ml-2 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Documents - Existing contract */}
          {!isNew && id && (
            <DocumentManager refType="CONTRACT" refId={id} />
          )}

          {/* Change History */}
          {!isNew && id && (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {t('billing:contract.history')}
              </h3>
              <ContractHistoryLog contractId={id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
