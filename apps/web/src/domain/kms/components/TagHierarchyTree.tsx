import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KmsTagResponse } from '@amb/types';
import TagBadge from './TagBadge';

interface TagHierarchyTreeProps {
  tags: KmsTagResponse[];
  onSelect?: (tag: KmsTagResponse) => void;
  onEdit?: (tag: KmsTagResponse) => void;
  onDelete?: (tagId: string) => void;
}

function TagTreeNode({
  tag,
  depth,
  onSelect,
  onEdit,
  onDelete,
}: {
  tag: KmsTagResponse;
  depth: number;
  onSelect?: (tag: KmsTagResponse) => void;
  onEdit?: (tag: KmsTagResponse) => void;
  onDelete?: (tagId: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = tag.children && tag.children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-5 w-5 items-center justify-center text-gray-400 hover:text-gray-600"
          >
            {expanded ? '▾' : '▸'}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <TagBadge
          name={tag.name}
          display={tag.display}
          level={tag.level}
          color={tag.color}
          onClick={() => onSelect?.(tag)}
          size="sm"
        />

        {tag.nameLocal && (
          <span className="text-xs text-gray-400">{tag.nameLocal}</span>
        )}

        <span className="ml-auto text-xs text-gray-400">
          {tag.usageCount}
        </span>

        <div className="hidden gap-1 group-hover:flex">
          {onEdit && (
            <button
              onClick={() => onEdit(tag)}
              className="rounded p-1 text-xs text-gray-400 hover:bg-gray-200 hover:text-gray-600"
            >
              ✎
            </button>
          )}
          {onDelete && !tag.isSystem && (
            <button
              onClick={() => onDelete(tag.tagId)}
              className="rounded p-1 text-xs text-gray-400 hover:bg-red-100 hover:text-red-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div>
          {tag.children!.map((child) => (
            <TagTreeNode
              key={child.tagId}
              tag={child}
              depth={depth + 1}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TagHierarchyTree({ tags, onSelect, onEdit, onDelete }: TagHierarchyTreeProps) {
  const { t } = useTranslation('kms');
  const [allExpanded, setAllExpanded] = useState(false);

  if (tags.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-400">
        {t('tag.noTags')}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-2">
        <h3 className="text-sm font-medium text-gray-700">{t('tree.title')}</h3>
        <button
          onClick={() => setAllExpanded(!allExpanded)}
          className="text-xs text-blue-600 hover:underline"
        >
          {allExpanded ? t('tree.collapseAll') : t('tree.expandAll')}
        </button>
      </div>
      <div className="rounded-md border border-gray-200">
        {tags.map((tag) => (
          <TagTreeNode
            key={tag.tagId}
            tag={tag}
            depth={0}
            onSelect={onSelect}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
