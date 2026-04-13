import { useMemo } from 'react';
import { TagCloudItemResponse } from '@amb/types';

interface TagCloudProps {
  tags: TagCloudItemResponse[];
  onTagClick?: (tagId: string) => void;
}

export default function TagCloud({ tags, onTagClick }: TagCloudProps) {
  const normalizedTags = useMemo(() => {
    if (tags.length === 0) return [];

    const maxWeight = Math.max(...tags.map((t) => t.weight));
    const minWeight = Math.min(...tags.map((t) => t.weight));
    const range = maxWeight - minWeight || 1;

    return tags.map((tag) => {
      const normalized = (tag.weight - minWeight) / range;
      const fontSize = 0.75 + normalized * 1.5; // 0.75rem to 2.25rem
      const opacity = 0.5 + normalized * 0.5;

      return { ...tag, fontSize, opacity };
    });
  }, [tags]);

  if (normalizedTags.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        No tags to display
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 py-4">
      {normalizedTags.map((tag) => (
        <button
          key={tag.tagId}
          onClick={() => onTagClick?.(tag.tagId)}
          className="inline-flex items-center gap-1 rounded-full px-3 py-1 transition-transform hover:scale-110"
          style={{
            fontSize: `${tag.fontSize}rem`,
            opacity: tag.opacity,
            color: tag.color || '#3B82F6',
            backgroundColor: tag.color ? `${tag.color}15` : '#EFF6FF',
          }}
          title={`${tag.display}: ${tag.count} items`}
        >
          {tag.display}
          {tag.trend === 'up' && <span className="text-[0.6em] text-green-500">↑</span>}
          {tag.trend === 'down' && <span className="text-[0.6em] text-red-400">↓</span>}
        </button>
      ))}
    </div>
  );
}
