import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { GapReportResponse } from '../service/doc-builder.service';

interface GapAnalysisPanelProps {
  gaps: GapReportResponse;
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
};

export default function GapAnalysisPanel({ gaps }: GapAnalysisPanelProps) {
  const { t } = useTranslation('kms');

  if (gaps.totalGaps === 0) {
    return (
      <div className="rounded-lg border border-dashed border-green-200 bg-green-50/50 py-6 text-center">
        <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
        <p className="text-sm text-green-600">{t('docBuilder.wizard.noGaps')}</p>
      </div>
    );
  }

  // Group by category
  const grouped = gaps.items.reduce<Record<string, typeof gaps.items>>((acc, item) => {
    if (!acc[item.categoryCode]) acc[item.categoryCode] = [];
    acc[item.categoryCode].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          {gaps.totalGaps} {t('docBuilder.wizard.missingFields')}
        </h3>
        {gaps.criticalGaps > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            {gaps.criticalGaps} {t('docBuilder.wizard.critical')}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {Object.entries(grouped).map(([catCode, items]) => (
          <div key={catCode} className="rounded-lg border border-gray-200 bg-white">
            <div className="border-b border-gray-100 px-3 py-2">
              <span className="text-xs font-semibold text-gray-700">
                {items[0].categoryName}
              </span>
              <span className="ml-1.5 text-xs text-gray-400">({catCode})</span>
            </div>
            <div className="divide-y divide-gray-50">
              {items.map((item) => {
                const config = SEVERITY_CONFIG[item.severity];
                const Icon = config.icon;
                return (
                  <div key={`${item.categoryCode}-${item.fieldKey}`} className="flex items-center gap-3 px-3 py-2">
                    <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
                    <span className="text-sm text-gray-700">{item.fieldLabel}</span>
                    <span className={`ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium ${config.bg} ${config.color}`}>
                      {item.fieldType}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
