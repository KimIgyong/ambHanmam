import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, CheckCircle } from 'lucide-react';
import { useDueContracts, useGenerateInvoices } from '../../hooks/usePayment';

interface BulkGenerateModalProps {
  onClose: () => void;
}

export default function BulkGenerateModal({ onClose }: BulkGenerateModalProps) {
  const { t } = useTranslation(['billing', 'common']);
  const now = new Date();
  const [yearMonth, setYearMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
  );
  const { data: contracts = [], isLoading } = useDueContracts(yearMonth);
  const generateMutation = useGenerateInvoices();
  const [result, setResult] = useState<{ generated: number; skipped: number } | null>(null);

  const fixedEligible = contracts.filter((c) => c.type === 'FIXED' && !c.alreadyGenerated);
  const usageBased = contracts.filter((c) => c.type === 'USAGE_BASED' && !c.alreadyGenerated);
  const alreadyDone = contracts.filter((c) => c.alreadyGenerated);

  const handleGenerate = async () => {
    const res = await generateMutation.mutateAsync(yearMonth);
    setResult({ generated: res.generated, skipped: res.skipped });
  };

  const fmt = (n: number) => Number(n).toLocaleString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-2xl rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-semibold text-gray-900">{t('billing:automation.title')}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Month Selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">{t('billing:automation.targetMonth')}:</label>
            <input
              type="month"
              value={yearMonth}
              onChange={(e) => { setYearMonth(e.target.value); setResult(null); }}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-500">{t('common:loading')}</div>
          ) : (
            <>
              {/* FIXED Contracts (auto-generatable) */}
              {fixedEligible.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {t('billing:automation.fixedContracts')} ({fixedEligible.length})
                  </h4>
                  <div className="max-h-40 overflow-auto rounded-md border border-gray-200">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left">{t('billing:contract.columns.title')}</th>
                          <th className="px-2 py-1.5 text-left">{t('billing:contract.columns.partner')}</th>
                          <th className="px-2 py-1.5 text-left">{t('billing:contract.columns.direction')}</th>
                          <th className="px-2 py-1.5 text-right">{t('billing:contract.columns.amount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fixedEligible.map((c) => (
                          <tr key={c.contractId} className="border-t border-gray-100">
                            <td className="px-2 py-1">{c.title}</td>
                            <td className="px-2 py-1">{c.partnerName}</td>
                            <td className="px-2 py-1">{t(`billing:contract.direction.${c.direction}`)}</td>
                            <td className="px-2 py-1 text-right font-mono">{c.currency} {fmt(c.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* USAGE_BASED Contracts */}
              {usageBased.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    {t('billing:automation.usageContracts')} ({usageBased.length})
                  </h4>
                  <p className="text-xs text-gray-400 mb-1">{t('billing:automation.usageHint')}</p>
                  <div className="max-h-28 overflow-auto rounded-md border border-gray-200">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-1.5 text-left">{t('billing:contract.columns.title')}</th>
                          <th className="px-2 py-1.5 text-left">{t('billing:contract.columns.partner')}</th>
                          <th className="px-2 py-1.5 text-right">{t('billing:contract.form.unitPrice')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageBased.map((c) => (
                          <tr key={c.contractId} className="border-t border-gray-100">
                            <td className="px-2 py-1">{c.title}</td>
                            <td className="px-2 py-1">{c.partnerName}</td>
                            <td className="px-2 py-1 text-right font-mono">
                              {c.unitPrice ? `${c.currency} ${fmt(c.unitPrice)}` : '-'} {c.unitDesc ? `/ ${c.unitDesc}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Already generated */}
              {alreadyDone.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    {t('billing:automation.alreadyGenerated')} ({alreadyDone.length})
                  </h4>
                  <div className="max-h-24 overflow-auto rounded-md border border-gray-100 bg-gray-50">
                    <table className="w-full text-xs text-gray-400">
                      <tbody>
                        {alreadyDone.map((c) => (
                          <tr key={c.contractId} className="border-t border-gray-100">
                            <td className="px-2 py-1">{c.title}</td>
                            <td className="px-2 py-1">{c.partnerName}</td>
                            <td className="px-2 py-1 text-right">{c.currency} {fmt(c.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {contracts.length === 0 && (
                <div className="py-6 text-center text-sm text-gray-400">{t('billing:automation.noContracts')}</div>
              )}

              {/* Result */}
              {result && (
                <div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  {t('billing:automation.result', { generated: result.generated, skipped: result.skipped })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('common:close')}
          </button>
          {fixedEligible.length > 0 && !result && (
            <button
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 transition-colors"
            >
              {generateMutation.isPending
                ? t('common:processing')
                : t('billing:automation.generate', { count: fixedEligible.length })}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
