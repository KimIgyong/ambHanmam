import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2 } from 'lucide-react';
import { useCreatePayment, useDeletePayment, usePaymentsByInvoice } from '../../hooks/usePayment';
import { BilInvoiceResponse } from '@amb/types';

const PAYMENT_METHODS = ['BANK_TRANSFER', 'CASH', 'CHECK', 'CARD', 'OTHER'] as const;

interface PaymentFormProps {
  invoice: BilInvoiceResponse;
  onClose: () => void;
}

export default function PaymentForm({ invoice, onClose }: PaymentFormProps) {
  const { t } = useTranslation(['billing', 'common']);
  const { data: payments = [] } = usePaymentsByInvoice(invoice.invoiceId);
  const createMutation = useCreatePayment();
  const deleteMutation = useDeletePayment();

  const outstanding = Number(invoice.total) - Number(invoice.paidAmount);

  const [form, setForm] = useState({
    amount: outstanding > 0 ? outstanding : 0,
    date: new Date().toISOString().substring(0, 10),
    method: 'BANK_TRANSFER',
    reference: '',
    note: '',
  });

  const handleSubmit = async () => {
    await createMutation.mutateAsync({
      invoice_id: invoice.invoiceId,
      amount: form.amount,
      currency: invoice.currency,
      date: form.date,
      method: form.method,
      reference: form.reference || null,
      note: form.note || null,
    });
    setForm({ amount: 0, date: new Date().toISOString().substring(0, 10), method: 'BANK_TRANSFER', reference: '', note: '' });
  };

  const handleDelete = async (paymentId: string) => {
    if (!window.confirm(t('billing:payment.deleteConfirm'))) return;
    await deleteMutation.mutateAsync(paymentId);
  };

  const fmt = (n: number) => Number(n).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('billing:payment.title')}</h3>
            <p className="text-xs text-gray-500">
              {invoice.number} &middot; {invoice.partnerName}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-md bg-gray-50 p-2">
              <p className="text-xs text-gray-500">{t('billing:payment.totalAmount')}</p>
              <p className="font-semibold">{invoice.currency} {fmt(invoice.total)}</p>
            </div>
            <div className="rounded-md bg-green-50 p-2">
              <p className="text-xs text-gray-500">{t('billing:payment.paidAmount')}</p>
              <p className="font-semibold text-green-700">{invoice.currency} {fmt(invoice.paidAmount)}</p>
            </div>
            <div className="rounded-md bg-orange-50 p-2">
              <p className="text-xs text-gray-500">{t('billing:payment.outstanding')}</p>
              <p className="font-semibold text-orange-700">{invoice.currency} {fmt(outstanding)}</p>
            </div>
          </div>

          {/* Payment History */}
          {payments.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-1">{t('billing:payment.history')}</h4>
              <div className="max-h-32 overflow-auto rounded-md border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">{t('billing:payment.form.date')}</th>
                      <th className="px-2 py-1 text-right">{t('billing:payment.form.amount')}</th>
                      <th className="px-2 py-1 text-left">{t('billing:payment.form.method')}</th>
                      <th className="px-2 py-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.paymentId} className="border-t border-gray-100">
                        <td className="px-2 py-1">{p.date}</td>
                        <td className="px-2 py-1 text-right font-mono">{fmt(p.amount)}</td>
                        <td className="px-2 py-1">{t(`billing:payment.method.${p.method}`)}</td>
                        <td className="px-2 py-1">
                          <button
                            onClick={() => handleDelete(p.paymentId)}
                            className="text-red-400 hover:text-red-600"
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* New Payment Form */}
          {outstanding > 0 && (
            <div className="space-y-3 border-t border-gray-200 pt-3">
              <h4 className="text-xs font-medium text-gray-500">{t('billing:payment.addNew')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">{t('billing:payment.form.amount')}</label>
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">{t('billing:payment.form.date')}</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">{t('billing:payment.form.method')}</label>
                  <select
                    value={form.method}
                    onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{t(`billing:payment.method.${m}`)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-0.5">{t('billing:payment.form.reference')}</label>
                  <input
                    type="text"
                    value={form.reference}
                    onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))}
                    placeholder={t('billing:payment.form.referencePlaceholder')}
                    className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-0.5">{t('billing:payment.form.note')}</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
              <button
                onClick={handleSubmit}
                disabled={createMutation.isPending || form.amount <= 0}
                className="w-full rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? t('common:processing') : t('billing:payment.register')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
