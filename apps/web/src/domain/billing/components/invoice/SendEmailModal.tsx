import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send } from 'lucide-react';
import { useSendInvoiceEmail } from '../../hooks/useInvoice';

interface SendEmailModalProps {
  invoiceId: string;
  defaultTo?: string;
  invoiceNumber: string;
  onClose: () => void;
}

export default function SendEmailModal({ invoiceId, defaultTo, invoiceNumber, onClose }: SendEmailModalProps) {
  const { t } = useTranslation(['billing', 'common']);
  const mutation = useSendInvoiceEmail();

  const [to, setTo] = useState(defaultTo || '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(t('billing:invoice.emailDefaultSubject', { number: invoiceNumber }));
  const [body, setBody] = useState('');

  const handleSend = async () => {
    const toList = to.split(',').map((s) => s.trim()).filter(Boolean);
    if (toList.length === 0) return;

    const ccList = cc ? cc.split(',').map((s) => s.trim()).filter(Boolean) : undefined;

    await mutation.mutateAsync({
      id: invoiceId,
      data: {
        to: toList,
        cc: ccList,
        subject: subject || undefined,
        body: body || undefined,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <h3 className="text-sm font-semibold text-gray-900">{t('billing:invoice.sendEmailTitle')}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('billing:invoice.emailTo')} *</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder={t('billing:invoice.emailToPlaceholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('billing:invoice.emailCc')}</label>
            <input
              type="text"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              placeholder={t('billing:invoice.emailToPlaceholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('billing:invoice.emailSubject')}</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('billing:invoice.emailBody')}</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleSend}
            disabled={mutation.isPending || !to.trim()}
            className="flex items-center gap-1.5 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
            {mutation.isPending ? t('billing:invoice.emailSending') : t('billing:invoice.sendEmail')}
          </button>
        </div>
      </div>
    </div>
  );
}
