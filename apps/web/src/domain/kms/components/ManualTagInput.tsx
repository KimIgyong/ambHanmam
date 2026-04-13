import { useTranslation } from 'react-i18next';
import TagInput from './TagInput';
import { KmsTagResponse, KmsWorkItemTagResponse } from '@amb/types';

interface ManualTagInputProps {
  workItemId: string;
  existingTags: KmsWorkItemTagResponse[];
  onAssign: (data: { tag_id?: string; tag_name?: string }) => void;
  onRemove: (tagId: string) => void;
  onCreateNew?: (name: string) => void;
}

export default function ManualTagInput({
  existingTags,
  onAssign,
  onRemove,
  onCreateNew,
}: ManualTagInputProps) {
  const { t } = useTranslation('kms');

  const manualTags = existingTags.filter(
    (tag) => tag.source !== 'AI_EXTRACTED' && tag.source !== 'USER_REJECTED',
  );

  const selectedTags = manualTags.map((tag) => ({
    tagId: tag.tagId,
    name: tag.tagName,
    display: tag.tagDisplay,
    level: tag.tagLevel,
    color: tag.tagColor,
  }));

  const handleAdd = (tag: KmsTagResponse) => {
    onAssign({ tag_id: tag.tagId });
  };

  const handleCreateNew = (name: string) => {
    if (onCreateNew) {
      onCreateNew(name);
    } else {
      onAssign({ tag_name: name });
    }
  };

  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {t('tags')}
      </label>
      <TagInput
        selectedTags={selectedTags}
        onAdd={handleAdd}
        onRemove={onRemove}
        onCreateNew={handleCreateNew}
        placeholder={t('tag.autocomplete')}
      />
    </div>
  );
}
