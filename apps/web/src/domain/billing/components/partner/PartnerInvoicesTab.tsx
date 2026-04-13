import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useInvoiceList } from '../../hooks/useInvoice';

interface Props {
  partnerId: string;
}

export default function PartnerInvoicesTab({ partnerId }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const { data: invoices, isLoading } = useInvoiceList({ partner_id: partnerId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      {!invoices || invoices.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">{t('billing:partner.noInvoices')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.number')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.form.direction')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.date')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.dueDate')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.total')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:invoice.columns.status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr
                  key={inv.invoiceId}
                  onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {inv.number}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {t(`billing:contract.direction.${inv.direction}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {inv.date}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {inv.dueDate || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-gray-600">
                    {inv.total.toLocaleString()} {inv.currency}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      {t(`billing:invoice.status.${inv.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
