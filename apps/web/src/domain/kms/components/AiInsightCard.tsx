import { useTranslation } from 'react-i18next';
import { TrendingUp, AlertTriangle, Lightbulb, Target, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { DddAiInsightResponse } from '../service/ddd.service';

interface Props {
  insight: DddAiInsightResponse;
  onAction?: (aisId: string) => void;
}

const TYPE_CONFIG: Record<string, { icon: typeof TrendingUp; label: string; color: string }> = {
  TREND: { icon: TrendingUp, label: 'Trend', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  ANOMALY: { icon: AlertTriangle, label: 'Anomaly', color: 'text-orange-600 bg-orange-50 border-orange-200' },
  RECOMMENDATION: { icon: Lightbulb, label: 'Recommendation', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  FORECAST: { icon: Target, label: 'Forecast', color: 'text-green-600 bg-green-50 border-green-200' },
};

const SEVERITY_COLORS: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700',
  WARNING: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export default function AiInsightCard({ insight, onAction }: Props) {
  const { t } = useTranslation('kms');
  const [expanded, setExpanded] = useState(false);

  const config = TYPE_CONFIG[insight.aisType] || TYPE_CONFIG.TREND;
  const Icon = config.icon;
  const severityColor = SEVERITY_COLORS[insight.aisSeverity] || SEVERITY_COLORS.INFO;

  return (
    <div className={`rounded-lg border p-4 ${config.color} ${insight.aisIsRead ? 'opacity-80' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/80">
            <Icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase">{config.label}</span>
              <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${severityColor}`}>
                {insight.aisSeverity}
              </span>
              {insight.aisStage && (
                <span className="rounded bg-white/60 px-1.5 py-0.5 text-xs capitalize">
                  {insight.aisStage}
                </span>
              )}
            </div>
            <h4 className="mt-1 text-sm font-medium text-gray-900">{insight.aisTitle}</h4>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="rounded p-1 hover:bg-white/50"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-white/40 pt-3">
          {/* Content */}
          <div className="prose prose-sm max-w-none text-xs text-gray-700">
            {insight.aisContent.split('\n').map((line, i) => (
              <p key={i} className="mb-1">{line}</p>
            ))}
          </div>

          {/* Action Items */}
          {insight.aisActionItems && insight.aisActionItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-700">{t('ddd.actionItems')}</p>
              {insight.aisActionItems.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-md bg-white/60 px-2.5 py-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full ${
                    item.priority === 'HIGH' ? 'bg-red-500' : item.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <span className="flex-1 text-xs text-gray-700">{item.action}</span>
                  <span className="text-xs text-gray-400">{item.priority}</span>
                </div>
              ))}
            </div>
          )}

          {/* Mark Actioned */}
          {onAction && !insight.aisIsActioned && (
            <button
              onClick={() => onAction(insight.aisId)}
              className="flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Check className="h-3.5 w-3.5" />
              {t('ddd.markActioned')}
            </button>
          )}
          {insight.aisIsActioned && (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3.5 w-3.5" />
              {t('ddd.actioned')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
