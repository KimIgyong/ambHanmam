import { useTranslation } from 'react-i18next';
import { useWorkItemTags, useAssignTag, useRemoveTag } from '../hooks/useTags';
import AiTagSuggestions from './AiTagSuggestions';
import ManualTagInput from './ManualTagInput';
import { kmsService } from '../service/kms.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface WorkItemTagPanelProps {
  workItemId: string;
}

export default function WorkItemTagPanel({ workItemId }: WorkItemTagPanelProps) {
  const { t } = useTranslation('kms');
  const { data: tags = [], isLoading } = useWorkItemTags(workItemId);
  const assignTag = useAssignTag();
  const removeTag = useRemoveTag();
  const qc = useQueryClient();

  const confirmMutation = useMutation({
    mutationFn: (tagId: string) =>
      kmsService.assignTag(workItemId, { tag_id: tagId, source: 'USER_CONFIRMED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kms', 'items', workItemId, 'tags'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (tagId: string) =>
      kmsService.assignTag(workItemId, { tag_id: tagId, source: 'USER_REJECTED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kms', 'items', workItemId, 'tags'] });
    },
  });

  const handleAssign = (data: { tag_id?: string; tag_name?: string }) => {
    assignTag.mutate({ witId: workItemId, data });
  };

  const handleRemove = (tagId: string) => {
    removeTag.mutate({ witId: workItemId, tagId });
  };

  if (isLoading) {
    return <div className="py-4 text-center text-sm text-gray-400">Loading tags...</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700">{t('tags')}</h3>

      <AiTagSuggestions
        suggestions={tags}
        onConfirm={(tagId) => confirmMutation.mutate(tagId)}
        onReject={(tagId) => rejectMutation.mutate(tagId)}
      />

      <ManualTagInput
        workItemId={workItemId}
        existingTags={tags}
        onAssign={handleAssign}
        onRemove={handleRemove}
      />
    </div>
  );
}
