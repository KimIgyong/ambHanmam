import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Wallet, HardDrive, Mail } from 'lucide-react';
import { useInvoiceDetail, useCreateInvoice, useUpdateInvoice, useVoidAndReissue } from '../hooks/useInvoice';
import { usePartnerList } from '../hooks/usePartner';
import { useContractList } from '../hooks/useContract';
import { useSowList } from '../hooks/useSow';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import InvoiceStatusBadge from '../components/invoice/InvoiceStatusBadge';
import InvoiceItemsEditor, { InvoiceItem } from '../components/invoice/InvoiceItemsEditor';
import InvoiceApprovalActions from '../components/invoice/InvoiceApprovalActions';
import EinvoiceSection from '../components/invoice/EinvoiceSection';
import NtsSection from '../components/invoice/NtsSection';
import DocumentManager from '../components/common/DocumentManager';
import SearchableSelect from '../components/common/SearchableSelect';
import PaymentForm from '../components/invoice/PaymentForm';
import SendEmailModal from '../components/invoice/SendEmailModal';
import { invoiceApiService } from '../service/invoice.service';
import { useQueryClient } from '@tanstack/react-query';

const DIRECTIONS = ['RECEIVABLE', 'PAYABLE'] as const;
const STATUSES = ['DRAFT', 'ISSUED', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED', 'VOID'] as const;

interface InvoiceForm {
  partner_id: string;
  contract_id: string;
  sow_id: string;
  direction: string;
  date: string;
  due_date: string;
  service_period_start: string;
  service_period_end: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  currency: string;
  status: string;
  internal_code: string;
  tax_invoice_type: string;
  note: string;
}

const emptyForm: InvoiceForm = {
  partner_id: '',
  contract_id: '',
  sow_id: '',
  direction: 'RECEIVABLE',
  date: new Date().toISOString().substring(0, 10),
  due_date: '',
  service_period_start: '',
  service_period_end: '',
  subtotal: 0,
  tax_rate: 0,
  tax_amount: 0,
  total: 0,
  currency: 'USD',
  status: 'DRAFT',
  internal_code: '',
  tax_invoice_type: '',
  note: '',
};

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['billing', 'common']);
  const isNew = !id || id === 'new';
  const currentEntity = useEntityStore((s) => s.currentEntity);

  const { data: invoice, isLoading } = useInvoiceDetail(isNew ? '' : id);
  const { data: partners = [] } = usePartnerList({ status: 'ACTIVE' });
  const { data: contracts = [] } = useContractList({ status: 'ACTIVE' });
  const { data: sows = [] } = useSowList();
  const createMutation = useCreateInvoice();
  const updateMutation = useUpdateInvoice();
  const voidReissueMutation = useVoidAndReissue();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [items, setItems] = useState<InvoiceItem[]>([]);

  useEffect(() => {
    if (invoice) {
      setForm({
        partner_id: invoice.partnerId,
        contract_id: invoice.contractId || '',
        sow_id: invoice.sowId || '',
        direction: invoice.direction,
        date: invoice.date,
        due_date: invoice.dueDate || '',
        service_period_start: invoice.servicePeriodStart || '',
        service_period_end: invoice.servicePeriodEnd || '',
        subtotal: invoice.subtotal,
        tax_rate: invoice.taxRate,
        tax_amount: invoice.taxAmount,
        total: invoice.total,
        currency: invoice.currency,
        status: invoice.status,
        internal_code: invoice.internalCode || '',
        tax_invoice_type: invoice.taxInvoiceType || '',
        note: invoice.note || '',
      });
      setItems(
        (invoice.items || []).map((item) => ({
          seq: item.seq,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          amount: item.amount,
        })),
      );
    } else if (isNew && currentEntity) {
      setForm((prev) => ({ ...prev, currency: currentEntity.currency }));
    }
  }, [invoice, isNew, currentEntity]);

  const handleChange = (field: keyof InvoiceForm, value: string | number) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-calc tax amount and total
      if (field === 'subtotal' || field === 'tax_rate') {
        const subtotal = field === 'subtotal' ? Number(value) : Number(next.subtotal);
        const taxRate = field === 'tax_rate' ? Number(value) : Number(next.tax_rate);
        next.tax_amount = Math.round(subtotal * taxRate) / 100;
        next.total = subtotal + next.tax_amount;
      }
      return next;
    });
  };

  // Sync subtotal from items
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.amount), 0);
    setForm((prev) => {
      const taxAmount = Math.round(subtotal * Number(prev.tax_rate)) / 100;
      return { ...prev, subtotal, tax_amount: taxAmount, total: subtotal + taxAmount };
    });
  }, [items]);

  const handleSubmit = async () => {
    const payload: Record<string, unknown> = { ...form };
    if (items.length > 0) payload.items = items;
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null;
    });

    if (isNew) {
      await createMutation.mutateAsync(payload);
    } else {
      await updateMutation.mutateAsync({ id: id!, data: payload });
    }
    navigate('/billing/invoices');
  };

  const handleVoidReissue = async () => {
    if (!window.confirm(t('billing:invoice.voidReissueConfirm'))) return;
    const newInvoice = await voidReissueMutation.mutateAsync(id!);
    navigate(`/billing/invoices/${newInvoice.invoiceId}`);
  };

  const [showPayment, setShowPayment] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async (saveToDrive = false) => {
    if (!id) return;
    setDownloadingPdf(true);
    try {
      await invoiceApiService.downloadPdf(id, saveToDrive);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isImmutable = invoice && ['PAID', 'CANCELLED', 'VOID'].includes(invoice.status);
  const canVoidReissue = invoice && ['ISSUED', 'SENT', 'OVERDUE'].includes(invoice.status);

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
              onClick={() => navigate('/billing/invoices')}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {isNew ? t('billing:invoice.createTitle') : t('billing:invoice.editTitle')}
            </h1>
            {invoice && <InvoiceStatusBadge status={invoice.status} />}
            {invoice && invoice.approvalStatus && invoice.approvalStatus !== 'NONE' && (
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                invoice.approvalStatus === 'APPROVED_ADMIN' ? 'bg-green-100 text-green-700' :
                invoice.approvalStatus === 'REJECTED' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {t(`billing:approval.status.${invoice.approvalStatus}`)}
              </span>
            )}
            {invoice && (
              <span className="text-sm text-gray-500 font-mono">{invoice.number}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isNew && invoice && !['DRAFT', 'CANCELLED', 'VOID'].includes(invoice.status) && (
              <button
                onClick={() => setShowPayment(true)}
                className="flex items-center gap-1.5 rounded-md border border-green-300 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
              >
                <Wallet className="h-4 w-4" />
                {t('billing:payment.register')}
              </button>
            )}
            {!isNew && invoice && ['ISSUED', 'SENT'].includes(invoice.status) && (
              <button
                onClick={() => setShowEmailModal(true)}
                className="flex items-center gap-1.5 rounded-md border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors"
              >
                <Mail className="h-4 w-4" />
                {t('billing:invoice.sendEmail')}
              </button>
            )}
            {!isNew && invoice && (
              <>
                <button
                  onClick={() => handleDownloadPdf(true)}
                  disabled={downloadingPdf}
                  className="flex items-center gap-1.5 rounded-md border border-blue-300 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50 transition-colors"
                  title={t('billing:invoice.saveToDrive')}
                >
                  <HardDrive className="h-4 w-4" />
                  {t('billing:invoice.saveToDrive')}
                </button>
                <button
                  onClick={() => handleDownloadPdf(false)}
                  disabled={downloadingPdf}
                  className="flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  {downloadingPdf ? t('common:processing') : t('billing:invoice.downloadPdf')}
                </button>
              </>
            )}
            {canVoidReissue && (
              <button
                onClick={handleVoidReissue}
                disabled={voidReissueMutation.isPending}
                className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                {t('billing:invoice.voidReissue')}
              </button>
            )}
            <button
              onClick={() => navigate('/billing/invoices')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('common:close')}
            </button>
            {!isImmutable && (
              <button
                onClick={handleSubmit}
                disabled={isSaving || !form.partner_id || !form.date}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? t('common:processing') : t('common:save')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Basic Info */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.partner')} *
                </label>
                <SearchableSelect
                  value={form.partner_id}
                  onChange={(v) => handleChange('partner_id', v)}
                  options={partners.map((p) => ({
                    value: p.partnerId,
                    label: `[${p.code}] ${p.companyName}`,
                    subLabel: p.companyNameLocal || undefined,
                  }))}
                  placeholder={t('billing:invoice.form.partnerSearch', '거래처 검색...')}
                  disabled={!isNew || isImmutable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.direction')} *
                </label>
                <select
                  value={form.direction}
                  onChange={(e) => handleChange('direction', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                >
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d}>{t(`billing:contract.direction.${d}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.contract')}
                </label>
                <select
                  value={form.contract_id}
                  onChange={(e) => handleChange('contract_id', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                >
                  <option value="">{t('common:select')}</option>
                  {contracts.map((c) => (
                    <option key={c.contractId} value={c.contractId}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.sow')}
                </label>
                <select
                  value={form.sow_id}
                  onChange={(e) => handleChange('sow_id', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                >
                  <option value="">{t('common:select')}</option>
                  {sows.map((s) => (
                    <option key={s.sowId} value={s.sowId}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
              {!isNew && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('billing:invoice.form.status')}
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                    disabled={isImmutable}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{t(`billing:invoice.status.${s}`)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.date')} *
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.dueDate')}
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => handleChange('due_date', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.servicePeriodStart')}
                </label>
                <input
                  type="date"
                  value={form.service_period_start}
                  onChange={(e) => handleChange('service_period_start', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.servicePeriodEnd')}
                </label>
                <input
                  type="date"
                  value={form.service_period_end}
                  onChange={(e) => handleChange('service_period_end', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <InvoiceItemsEditor
              items={items}
              currency={form.currency}
              onChange={isImmutable ? () => {} : setItems}
            />
          </div>

          {/* Amount & Tax */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.currency')}
                </label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.taxRate')} (%)
                </label>
                <input
                  type="number"
                  value={form.tax_rate}
                  onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('billing:invoice.form.internalCode')}
                </label>
                <input
                  type="text"
                  value={form.internal_code}
                  onChange={(e) => handleChange('internal_code', e.target.value)}
                  disabled={isImmutable}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end space-y-1 text-sm">
              <div className="w-60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('billing:invoice.subtotal')}:</span>
                  <span className="font-mono">{form.currency} {Number(form.subtotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('billing:invoice.form.taxAmount')}:</span>
                  <span className="font-mono">{form.currency} {Number(form.tax_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 font-semibold">
                  <span>{t('billing:invoice.totalAmount')}:</span>
                  <span className="font-mono">{form.currency} {Number(form.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Note */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:invoice.form.note')}
            </label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              disabled={isImmutable}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50"
            />
          </div>

          {/* Approval Workflow */}
          {!isNew && invoice && (
            <InvoiceApprovalActions
              invoiceId={id!}
              status={invoice.status}
              approvalStatus={invoice.approvalStatus || 'NONE'}
              onAction={() => queryClient.invalidateQueries({ queryKey: ['bil-invoices'] })}
            />
          )}

          {/* E-Invoice (Vietnam) */}
          {!isNew && invoice && currentEntity?.country === 'VN' && (
            <EinvoiceSection
              invoice={invoice}
              onAction={() => queryClient.invalidateQueries({ queryKey: ['bil-invoices'] })}
            />
          )}

          {/* NTS Tax Invoice (Korea) */}
          {!isNew && invoice && currentEntity?.country === 'KR' && invoice.currency === 'KRW' && (
            <NtsSection
              invoice={invoice}
              onAction={() => queryClient.invalidateQueries({ queryKey: ['bil-invoices'] })}
            />
          )}

          {/* Documents */}
          {!isNew && id && (
            <DocumentManager refType="INVOICE" refId={id} />
          )}
        </div>
      </div>

      {showPayment && invoice && (
        <PaymentForm invoice={invoice} onClose={() => setShowPayment(false)} />
      )}

      {showEmailModal && invoice && (
        <SendEmailModal
          invoiceId={id!}
          invoiceNumber={invoice.number}
          defaultTo={invoice.partnerContactEmail || ''}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </div>
  );
}
