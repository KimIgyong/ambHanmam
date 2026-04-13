import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, ArrowDownCircle, ArrowUpCircle, AlertTriangle,
  Clock, FileSpreadsheet, Download, Building2, BarChart3,
} from 'lucide-react';
import {
  useDashboardSummary,
  useRevenueSummary,
  useOutstandingReport,
  useContractTimeline,
  usePartnerDistribution,
  useCategoryBreakdown,
  useConsolidatedSummary,
} from '../hooks/useBillingReport';
import { billingReportApiService } from '../service/billing-report.service';
import BillingCalendar from '../components/dashboard/BillingCalendar';
import OverdueBillingAlert from '../components/dashboard/OverdueBillingAlert';
import MonthlyFeeMatrix from '../components/dashboard/MonthlyFeeMatrix';
import TaxInvoiceHistory from '../components/dashboard/TaxInvoiceHistory';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function BillingDashboardPage() {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [exporting, setExporting] = useState(false);

  const { data: summary } = useDashboardSummary();
  const { data: revenue = [] } = useRevenueSummary(year);
  const { data: outstanding = [] } = useOutstandingReport();
  const { data: timeline = [] } = useContractTimeline();
  const { data: partnerDist = [] } = usePartnerDistribution();
  const { data: categoryBreakdown = [] } = useCategoryBreakdown();
  const { data: consolidated = [] } = useConsolidatedSummary();

  const fmt = (n: number) => Number(n).toLocaleString();

  const handleExport = async () => {
    setExporting(true);
    try {
      await billingReportApiService.exportInvoicesExcel({ year });
    } finally {
      setExporting(false);
    }
  };

  // Chart: find max value for scaling
  const maxRevenue = Math.max(...revenue.map((r) => Math.max(r.receivable, r.payable)), 1);

  const receivableItems = outstanding.filter((o) => o.direction === 'RECEIVABLE');
  const payableItems = outstanding.filter((o) => o.direction === 'PAYABLE');

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900">{t('billing:dashboard.title')}</h1>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <Download className="h-4 w-4" />
            {exporting ? t('common:processing') : t('billing:dashboard.exportExcel')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Overdue Billing Alert */}
          <OverdueBillingAlert />

          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <span className="text-xs font-medium text-gray-500">{t('billing:dashboard.monthlyRevenue')}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-gray-900">{fmt(summary.monthlyRevenue)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                  <span className="text-xs font-medium text-gray-500">{t('billing:dashboard.receivable')}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-blue-700">{fmt(summary.receivableOutstanding)}</p>
                <p className="text-xs text-gray-400">{summary.receivableCount} {t('billing:dashboard.invoices')}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-5 w-5 text-red-500" />
                  <span className="text-xs font-medium text-gray-500">{t('billing:dashboard.payable')}</span>
                </div>
                <p className="mt-2 text-xl font-bold text-red-700">{fmt(summary.payableOutstanding)}</p>
                <p className="text-xs text-gray-400">{summary.payableCount} {t('billing:dashboard.invoices')}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <span className="text-xs font-medium text-gray-500">{t('billing:dashboard.alerts')}</span>
                </div>
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-semibold text-red-600">{summary.overdueCount}</span> {t('billing:dashboard.overdue')}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-amber-600">{summary.expiringContracts}</span> {t('billing:dashboard.expiring')}
                </p>
              </div>
            </div>
          )}

          {/* Monthly Revenue/Cost Chart */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">{t('billing:dashboard.revenueChart')}</h2>
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
            </div>
            <div className="flex items-end gap-1 h-40">
              {revenue.map((r, i) => {
                const recH = maxRevenue > 0 ? (r.receivable / maxRevenue) * 100 : 0;
                const payH = maxRevenue > 0 ? (r.payable / maxRevenue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '120px' }}>
                      <div
                        className="w-3 bg-blue-400 rounded-t transition-all"
                        style={{ height: `${recH}%`, minHeight: recH > 0 ? '2px' : '0' }}
                        title={`${t('billing:dashboard.receivable')}: ${fmt(r.receivable)}`}
                      />
                      <div
                        className="w-3 bg-red-400 rounded-t transition-all"
                        style={{ height: `${payH}%`, minHeight: payH > 0 ? '2px' : '0' }}
                        title={`${t('billing:dashboard.payable')}: ${fmt(r.payable)}`}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400">{MONTH_LABELS[i]}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-blue-400 rounded" /> {t('billing:dashboard.receivable')}</span>
              <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-red-400 rounded" /> {t('billing:dashboard.payable')}</span>
            </div>
          </div>

          {/* Billing Calendar */}
          <BillingCalendar />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Outstanding Receivable */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <ArrowDownCircle className="h-4 w-4 text-blue-500" />
                {t('billing:dashboard.outstandingReceivable')}
              </h2>
              {receivableItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.noOutstanding')}</p>
              ) : (
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left">{t('billing:dashboard.colInvoice')}</th>
                        <th className="px-2 py-1.5 text-left">{t('billing:dashboard.colPartner')}</th>
                        <th className="px-2 py-1.5 text-left">{t('billing:dashboard.colDue')}</th>
                        <th className="px-2 py-1.5 text-right">{t('billing:dashboard.colOutstanding')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivableItems.map((item) => (
                        <tr
                          key={item.invoiceId}
                          className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${item.isOverdue ? 'text-red-600' : ''}`}
                          onClick={() => navigate(`/billing/invoices/${item.invoiceId}`)}
                        >
                          <td className="px-2 py-1 font-mono">{item.number}</td>
                          <td className="px-2 py-1">{item.partnerName}</td>
                          <td className="px-2 py-1">{item.dueDate || '-'}</td>
                          <td className="px-2 py-1 text-right font-mono font-medium">{item.currency} {fmt(item.outstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Outstanding Payable */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <ArrowUpCircle className="h-4 w-4 text-red-500" />
                {t('billing:dashboard.outstandingPayable')}
              </h2>
              {payableItems.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.noOutstanding')}</p>
              ) : (
                <div className="max-h-48 overflow-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left">{t('billing:dashboard.colInvoice')}</th>
                        <th className="px-2 py-1.5 text-left">{t('billing:dashboard.colPartner')}</th>
                        <th className="px-2 py-1.5 text-left">{t('billing:dashboard.colDue')}</th>
                        <th className="px-2 py-1.5 text-right">{t('billing:dashboard.colOutstanding')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payableItems.map((item) => (
                        <tr
                          key={item.invoiceId}
                          className={`border-t border-gray-100 cursor-pointer hover:bg-gray-50 ${item.isOverdue ? 'text-red-600' : ''}`}
                          onClick={() => navigate(`/billing/invoices/${item.invoiceId}`)}
                        >
                          <td className="px-2 py-1 font-mono">{item.number}</td>
                          <td className="px-2 py-1">{item.partnerName}</td>
                          <td className="px-2 py-1">{item.dueDate || '-'}</td>
                          <td className="px-2 py-1 text-right font-mono font-medium">{item.currency} {fmt(item.outstanding)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Contract Timeline */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-amber-500" />
                {t('billing:dashboard.contractTimeline')}
              </h2>
              {timeline.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.noExpiring')}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-auto">
                  {timeline.map((ctr) => {
                    const urgencyClass = ctr.daysRemaining <= 7
                      ? 'border-l-red-500 bg-red-50/50'
                      : ctr.daysRemaining <= 14
                        ? 'border-l-amber-500 bg-amber-50/50'
                        : ctr.daysRemaining <= 30
                          ? 'border-l-yellow-400'
                          : '';
                    const badgeClass = ctr.daysRemaining <= 7
                      ? 'bg-red-100 text-red-700'
                      : ctr.daysRemaining <= 14
                        ? 'bg-amber-100 text-amber-700'
                        : ctr.daysRemaining <= 30
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600';
                    return (
                      <div
                        key={ctr.contractId}
                        className={`flex items-center justify-between rounded-md border border-gray-100 border-l-4 px-3 py-2 cursor-pointer hover:bg-gray-50 transition-colors ${urgencyClass}`}
                        onClick={() => navigate(`/billing/contracts/${ctr.contractId}`)}
                      >
                        <div>
                          <p className="text-xs font-medium text-gray-800">{ctr.title}</p>
                          <p className="text-[10px] text-gray-400">{ctr.partnerName}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-0.5">
                          <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                            {ctr.daysRemaining}d
                          </span>
                          <p className="text-[10px] text-gray-400">{ctr.endDate}</p>
                          {ctr.autoRenew && <span className="text-[9px] text-green-500">auto-renew</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Partner Distribution */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-purple-500" />
                {t('billing:dashboard.partnerDistribution')}
              </h2>
              {partnerDist.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.noPartners')}</p>
              ) : (
                <div className="space-y-2">
                  {partnerDist.map((pd) => {
                    const total = partnerDist.reduce((s, p) => s + p.count, 0);
                    const pct = total > 0 ? Math.round((pd.count / total) * 100) : 0;
                    return (
                      <div key={pd.type}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-gray-600">{t(`billing:partner.type.${pd.type}`)}</span>
                          <span className="text-gray-500">{pd.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-orange-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-teal-500" />
                {t('billing:dashboard.categoryBreakdown')}
              </h2>
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.categoryNoData')}</p>
              ) : (
                <div className="space-y-2">
                  {categoryBreakdown.map((cb) => {
                    const maxCount = Math.max(...categoryBreakdown.map((c) => c.count), 1);
                    const pct = Math.round((cb.count / maxCount) * 100);
                    return (
                      <div key={cb.category}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-gray-600">{t(`billing:contract.category.${cb.category}`)}</span>
                          <span className="text-gray-500">
                            {cb.count} {t('billing:dashboard.categoryContracts')} · {fmt(cb.totalAmount)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-teal-400 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex gap-3 mt-0.5 text-[10px] text-gray-400">
                          <span>{t('billing:dashboard.receivable')}: {cb.receivableCount}</span>
                          <span>{t('billing:dashboard.payable')}: {cb.payableCount}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Monthly Fee Matrix */}
          <MonthlyFeeMatrix />

          {/* Tax Invoice History (KR entities only) */}
          <TaxInvoiceHistory />

          {/* Consolidated Entity View */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-violet-500" />
              {t('billing:dashboard.consolidatedView')}
            </h2>
            {consolidated.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">{t('billing:dashboard.consolidatedNoData')}</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {consolidated.map((ent) => (
                  <div key={ent.entityId} className="rounded-lg border border-gray-100 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{ent.name}</p>
                        <p className="text-[10px] text-gray-400">{ent.code} · {ent.country}</p>
                      </div>
                      <span className="text-[10px] font-medium text-gray-400">{ent.currency}</span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('billing:dashboard.monthlyRevenue')}</span>
                        <span className="font-mono font-medium text-gray-700">{fmt(ent.monthlyRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('billing:dashboard.receivable')}</span>
                        <span className="font-mono text-blue-600">{fmt(ent.receivableOutstanding)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('billing:dashboard.payable')}</span>
                        <span className="font-mono text-red-500">{fmt(ent.payableOutstanding)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">{t('billing:dashboard.activeContracts')}</span>
                        <span className="font-mono font-medium text-gray-700">{ent.activeContracts}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
