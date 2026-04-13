import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Loader2 } from 'lucide-react';
import { useGenerateAiDraft } from '../hooks/useProjectAi';

interface AiDraftPanelProps {
  onDraftGenerated: (draft: Record<string, unknown>) => void;
}

export default function AiDraftPanel({ onDraftGenerated }: AiDraftPanelProps) {
  const { t } = useTranslation('project');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const generateDraft = useGenerateAiDraft();

  const handleGenerate = () => {
    if (!title.trim() || !description.trim()) return;
    generateDraft.mutate(
      { title, brief_description: description, category: category || undefined },
      {
        onSuccess: (data) => {
          onDraftGenerated(data);
        },
      },
    );
  };

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-blue-600" />
        <h3 className="text-sm font-semibold text-blue-900">{t('proposal.aiDraft')}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('proposal.title')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder={t('proposal.title')}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('proposal.briefDescription')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder={t('proposal.briefDescription')}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">{t('project.category')}</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('filter.all')}</option>
            {['TECH_BPO', 'SI_DEV', 'INTERNAL', 'R_AND_D', 'MARKETING', 'OTHER'].map((c) => (
              <option key={c} value={c}>{t(`category.${c}`)}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!title.trim() || !description.trim() || generateDraft.isPending}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {generateDraft.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('proposal.generating')}
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {t('proposal.generateDraft')}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
