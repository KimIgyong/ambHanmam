import { useTranslation } from 'react-i18next';
import { KmsWorkItemTagResponse } from '@amb/types';
import TagBadge from './TagBadge';

interface AiTagSuggestionsProps {
  suggestions: KmsWorkItemTagResponse[];
  onConfirm: (tagId: string) => void;
  onReject: (tagId: string) => void;
}

export default function AiTagSuggestions({ suggestions, onConfirm, onReject }: AiTagSuggestionsProps) {
  const { t } = useTranslation('kms');

  const aiTags = suggestions.filter((s) => s.source === 'AI_EXTRACTED');

  if (aiTags.length === 0) return null;

  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-sm font-medium text-blue-700">
          {t('source.aiExtracted')}
        </span>
        <span className="text-xs text-blue-500">
          {aiTags.length} {t('tags')}
        </span>
      </div>
      <div className="space-y-2">
        {aiTags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between rounded-md bg-white px-3 py-2 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <TagBadge
                name={tag.tagName}
                display={tag.tagDisplay}
                level={tag.tagLevel}
                color={tag.tagColor}
                size="sm"
              />
              {tag.confidence !== null && (
                <span className="text-xs text-gray-400">
                  {Math.round(tag.confidence * 100)}%
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => onConfirm(tag.tagId)}
                className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
                title={t('source.userConfirmed')}
              >
                ✓
              </button>
              <button
                onClick={() => onReject(tag.tagId)}
                className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                title={t('source.userRejected')}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
