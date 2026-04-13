import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TagCloudScope, TAG_CLOUD_SCOPE, TAG_LEVEL } from '@amb/types';
import { useTagCloud, useTagDetail } from '../hooks/useTagCloud';
import ScopeSelector from '../components/ScopeSelector';
import TagCloud from '../components/TagCloud';
import TagCloudInsights from '../components/TagCloudInsights';
import ScopeComparisonPanel from '../components/ScopeComparisonPanel';

export default function TagCloudPage() {
  const { t } = useTranslation('kms');
  const [scope, setScope] = useState<TagCloudScope>(TAG_CLOUD_SCOPE.MY as TagCloudScope);
  const [level, setLevel] = useState<number | undefined>(undefined);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const { data: cloudData, isLoading } = useTagCloud({ scope, level });
  const { data: tagDetail } = useTagDetail(selectedTagId || '', selectedTagId !== null);

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <ScopeSelector value={scope} onChange={setScope} />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">{t('tag.level')}:</label>
          <select
            value={level ?? ''}
            onChange={(e) => setLevel(e.target.value ? parseInt(e.target.value, 10) : undefined)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">All</option>
            <option value={TAG_LEVEL.DOMAIN}>{t('level.domain')}</option>
            <option value={TAG_LEVEL.TOPIC}>{t('level.topic')}</option>
            <option value={TAG_LEVEL.CONTEXT}>{t('level.context')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Tag Cloud */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            {isLoading ? (
              <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
            ) : cloudData ? (
              <TagCloud
                tags={cloudData.tags}
                onTagClick={(tagId) => setSelectedTagId(tagId === selectedTagId ? null : tagId)}
              />
            ) : null}
          </div>
        </div>

        {/* Insights / Detail Panel */}
        <div>
          {selectedTagId && tagDetail ? (
            <ScopeComparisonPanel tagDetail={tagDetail} />
          ) : cloudData ? (
            <TagCloudInsights data={cloudData} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
