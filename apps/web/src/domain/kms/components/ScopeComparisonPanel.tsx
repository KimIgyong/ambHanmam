import { useTranslation } from 'react-i18next';
import TagBadge from './TagBadge';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface ScopeComparisonPanelProps {
  tagDetail: {
    tag: {
      tagId: string;
      name: string;
      display: string;
      nameLocal: string | null;
      level: number;
      color: string | null;
      usageCount: number;
    };
    scopeStats: {
      my: { count: number; weight: number };
      team: { count: number; weight: number };
      company: { count: number; weight: number };
    };
    relatedTags: { tagId: string; name: string; display: string; coOccurrence: number }[];
    timeline: { date: string; count: number }[];
    recentItems: { witId: string; title: string; date: string }[];
  };
}

export default function ScopeComparisonPanel({ tagDetail }: ScopeComparisonPanelProps) {
  const { t } = useTranslation('kms');
  const { tag, scopeStats, relatedTags, recentItems } = tagDetail;

  const maxCount = Math.max(scopeStats.my.count, scopeStats.team.count, scopeStats.company.count) || 1;

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <TagBadge
          name={tag.name}
          display={tag.display}
          level={tag.level as 1 | 2 | 3}
          color={tag.color}
        />
        {tag.nameLocal && (
          <span className="text-sm text-gray-500">{tag.nameLocal}</span>
        )}
      </div>

      {/* Scope Comparison Bars */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Scope Comparison
        </h4>
        {[
          { label: t('scope.my'), ...scopeStats.my, color: 'bg-blue-500' },
          { label: t('scope.team'), ...scopeStats.team, color: 'bg-green-500' },
          { label: t('scope.company'), ...scopeStats.company, color: 'bg-purple-500' },
        ].map((scope) => (
          <div key={scope.label} className="flex items-center gap-2">
            <span className="w-16 text-xs text-gray-600">{scope.label}</span>
            <div className="flex-1">
              <div className="h-4 rounded-full bg-gray-100">
                <div
                  className={`h-4 rounded-full ${scope.color} transition-all`}
                  style={{ width: `${(scope.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
            <span className="w-8 text-right text-xs text-gray-500">{scope.count}</span>
          </div>
        ))}
      </div>

      {/* Related Tags */}
      {relatedTags.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Related
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {relatedTags.slice(0, 8).map((rt) => (
              <span
                key={rt.tagId}
                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {rt.display}
                <span className="text-gray-400">({rt.coOccurrence})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Items */}
      {recentItems.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Recent Items
          </h4>
          <div className="space-y-1">
            {recentItems.slice(0, 5).map((item) => (
              <div key={item.witId} className="flex items-center justify-between text-xs">
                <span className="truncate text-gray-700">{item.title}</span>
                <span className="ml-2 shrink-0 text-gray-400">
                  {<LocalDateTime value={item.date} format='YYYY-MM-DD HH:mm' />}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
