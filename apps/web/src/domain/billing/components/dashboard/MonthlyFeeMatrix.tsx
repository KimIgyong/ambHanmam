import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Grid3X3 } from 'lucide-react';
import { useMonthlyMatrix } from '../../hooks/useBillingReport';
import { billingReportApiService } from '../../service/billing-report.service';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function MonthlyFeeMatrix() {
  const { t } = useTranslation(['billing', 'common']);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [exporting, setExporting] = useState(false);

  const { data: matrix } = useMonthlyMatrix(year);

  const fmt = (n: number) => Number(n).toLocaleString();

  const handleExport = async () => {
    setExporting(true);
    try {
      await billingReportApiService.exportMonthlyMatrixExcel(year);
    } finally {
      setExporting(false);
    }
  };

  // Compute totals per month across all partners
  const monthTotals = Array.from({ length: 12 }, () => ({ receivable: 0, payable: 0 }));
  const partnerTotals = new Map<string, { receivable: number; payable: number }>();

  if (matrix) {
    for (const entry of matrix.data) {
      let pRec = 0;
      let pPay = 0;
      for (const v of entry.values) {
        monthTotals[v.month - 1].receivable += v.receivable;
        monthTotals[v.month - 1].payable += v.payable;
        pRec += v.receivable;
        pPay += v.payable;
      }
      partnerTotals.set(entry.partnerId, { receivable: pRec, payable: pPay });
    }
  }

  const grandReceivable = monthTotals.reduce((s, m) => s + m.receivable, 0);
  const grandPayable = monthTotals.reduce((s, m) => s + m.payable, 0);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
          <Grid3X3 className="h-4 w-4 text-indigo-500" />
          {t('billing:dashboard.monthlyMatrix')}
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
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1 rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
            {t('billing:dashboard.exportMatrix')}
          </button>
        </div>
      </div>

      {!matrix || matrix.partners.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.matrixNoData')}</p>
      ) : (
        <div className="overflow-auto max-h-80">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-2 py-1.5 text-left font-medium text-gray-600 sticky left-0 bg-gray-50 z-10">{t('billing:dashboard.colPartner')}</th>
                {MONTH_LABELS.map((m) => (
                  <th key={m} className="px-2 py-1.5 text-right font-medium text-gray-600 whitespace-nowrap">{m}</th>
                ))}
                <th className="px-2 py-1.5 text-right font-medium text-gray-600">{t('billing:invoice.totalAmount')}</th>
              </tr>
            </thead>
            <tbody>
              {matrix.partners.map((partner) => {
                const pData = matrix.data.find((d) => d.partnerId === partner.partnerId);
                const pTotal = partnerTotals.get(partner.partnerId);
                return (
                  <tr key={partner.partnerId} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-2 py-1 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-white">{partner.name}</td>
                    {(pData?.values || []).map((v) => (
                      <td key={v.month} className="px-2 py-1 text-right font-mono">
                        {v.receivable > 0 && <span className="text-blue-600">{fmt(v.receivable)}</span>}
                        {v.receivable > 0 && v.payable > 0 && <br />}
                        {v.payable > 0 && <span className="text-red-500">-{fmt(v.payable)}</span>}
                        {v.receivable === 0 && v.payable === 0 && <span className="text-gray-300">-</span>}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-right font-mono font-medium">
                      {pTotal && pTotal.receivable > 0 && <span className="text-blue-600">{fmt(pTotal.receivable)}</span>}
                      {pTotal && pTotal.receivable > 0 && pTotal.payable > 0 && <br />}
                      {pTotal && pTotal.payable > 0 && <span className="text-red-500">-{fmt(pTotal.payable)}</span>}
                    </td>
                  </tr>
                );
              })}
              {/* Total row */}
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                <td className="px-2 py-1.5 sticky left-0 bg-gray-50">{t('billing:invoice.totalAmount')}</td>
                {monthTotals.map((m, i) => (
                  <td key={i} className="px-2 py-1.5 text-right font-mono">
                    {m.receivable > 0 && <span className="text-blue-600">{fmt(m.receivable)}</span>}
                    {m.receivable > 0 && m.payable > 0 && <br />}
                    {m.payable > 0 && <span className="text-red-500">-{fmt(m.payable)}</span>}
                    {m.receivable === 0 && m.payable === 0 && <span className="text-gray-300">-</span>}
                  </td>
                ))}
                <td className="px-2 py-1.5 text-right font-mono">
                  {grandReceivable > 0 && <span className="text-blue-600">{fmt(grandReceivable)}</span>}
                  {grandReceivable > 0 && grandPayable > 0 && <br />}
                  {grandPayable > 0 && <span className="text-red-500">-{fmt(grandPayable)}</span>}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
