import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText } from 'lucide-react';
import { useTaxInvoiceHistory } from '../../hooks/useBillingReport';
import { billingReportApiService } from '../../service/billing-report.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

export default function TaxInvoiceHistory() {
  const { t } = useTranslation(['billing', 'common']);
  const currentEntity = useEntityStore((s) => s.currentEntity);

  // Only show for KR entities
  if (currentEntity?.country !== 'KR') return null;

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const { data: items = [] } = useTaxInvoiceHistory({ year, month });

  const fmt = (n: number) => Number(n).toLocaleString();

  const handleExport = async () => {
    setExporting(true);
    try {
      await billingReportApiService.exportTaxInvoicesExcel({ year, month });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-green-600" />
          {t('billing:dashboard.taxInvoiceHistory')}
        </h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear(year - 1)}
              className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
            >
              &larr;
            </button>
            <span className="text-sm font-medium text-gray-700">{year}</span>
            <button
              onClick={() => setYear(year + 1)}
              disabled={year >= currentYear}
              className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30"
            >
              &rarr;
            </button>
          </div>
          <select
            value={month || ''}
            onChange={(e) => setMonth(e.target.value ? parseInt(e.target.value) : undefined)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600"
          >
            <option value="">{t('common:all')}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            {t('billing:dashboard.exportTaxInvoices')}
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.taxNoData')}</p>
      ) : (
        <div className="overflow-auto max-h-72">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left">{t('billing:dashboard.taxDate')}</th>
                <th className="px-2 py-1.5 text-left">{t('billing:dashboard.taxInvoiceNumber')}</th>
                <th className="px-2 py-1.5 text-left">{t('billing:dashboard.taxPartner')}</th>
                <th className="px-2 py-1.5 text-left">{t('billing:dashboard.taxRegNo')}</th>
                <th className="px-2 py-1.5 text-right">{t('billing:dashboard.taxSupplyAmount')}</th>
                <th className="px-2 py-1.5 text-right">{t('billing:dashboard.taxVat')}</th>
                <th className="px-2 py-1.5 text-right">{t('billing:dashboard.taxTotal')}</th>
                <th className="px-2 py-1.5 text-center">{t('billing:dashboard.taxType')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.invoiceId} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-1">{item.date}</td>
                  <td className="px-2 py-1 font-mono">{item.number}</td>
                  <td className="px-2 py-1">{item.partnerName}</td>
                  <td className="px-2 py-1 font-mono text-gray-500">{item.taxId || '-'}</td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(item.subtotal)}</td>
                  <td className="px-2 py-1 text-right font-mono">{fmt(item.taxAmount)}</td>
                  <td className="px-2 py-1 text-right font-mono font-medium">{fmt(item.total)}</td>
                  <td className="px-2 py-1 text-center">
                    {item.taxInvoiceType ? (
                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                        item.taxInvoiceType === 'HOMETAX'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.taxInvoiceType === 'HOMETAX' ? t('billing:dashboard.taxHometax') : t('billing:dashboard.taxSystem')}
                      </span>
                    ) : '-'}
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
