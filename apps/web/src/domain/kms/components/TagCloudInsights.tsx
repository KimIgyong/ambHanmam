import { useTranslation } from 'react-i18next';
import { TagCloudResponse } from '@amb/types';
import TagBadge from './TagBadge';

interface TagCloudInsightsProps {
  data: TagCloudResponse;
}

export default function TagCloudInsights({ data }: TagCloudInsightsProps) {
  const { t } = useTranslation('kms');

  const trendingTags = data.tags.filter((t) => t.trend === 'up').slice(0, 5);
  const topTags = [...data.tags].sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      {/* Trending Tags */}
      {trendingTags.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {t('cloud.trending')}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {trendingTags.map((tag) => (
              <TagBadge
                key={tag.tagId}
                name={tag.name}
                display={tag.display}
                level={tag.level}
                color={tag.color}
                size="sm"
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Tags */}
      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Top {t('tags')}
        </h4>
        <div className="space-y-1.5">
          {topTags.map((tag) => (
            <div key={tag.tagId} className="flex items-center justify-between">
              <TagBadge
                name={tag.name}
                display={tag.display}
                level={tag.level}
                color={tag.color}
                size="sm"
              />
              <span className="text-xs text-gray-400">{tag.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="border-t border-gray-100 pt-3">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div>
            <div className="text-lg font-semibold text-gray-900">{data.tags.length}</div>
            <div className="text-xs text-gray-500">{t('tags')}</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900">{data.totalItems}</div>
            <div className="text-xs text-gray-500">Items</div>
          </div>
        </div>
      </div>
    </div>
  );
}
