import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { useCreateProject, useSubmitProposal } from '../hooks/useProject';
import AiDraftPanel from '../components/AiDraftPanel';

export default function ProposalFormPage() {
  const { t } = useTranslation('project');
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const submitProposal = useSubmitProposal();

  const [form, setForm] = useState({
    name: '',
    title: '',
    purpose: '',
    goal: '',
    summary: '',
    category: '',
    priority: 'MEDIUM',
    start_date: '',
    end_date: '',
    budget: '',
    currency: 'USD',
    note: '',
  });

  const [aiDraftJson, setAiDraftJson] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // 시작일 변경 시 종료일이 시작일 이전이면 리셋
      if (field === 'start_date' && next.end_date && value && next.end_date < value) {
        next.end_date = value;
      }
      return next;
    });
  };

  const handleDraftGenerated = (draft: Record<string, unknown>) => {
    setForm((prev) => ({
      ...prev,
      purpose: (draft.purpose as string) || prev.purpose,
      goal: (draft.goal as string) || prev.goal,
      summary: (draft.summary as string) || prev.summary,
      category: (draft.category as string) || prev.category,
      priority: (draft.priority as string) || prev.priority,
    }));
    setAiDraftJson(JSON.stringify(draft));
  };

  const handleSave = async (andSubmit = false) => {
    const data: Record<string, unknown> = {
      name: form.name,
      title: form.title || undefined,
      purpose: form.purpose || undefined,
      goal: form.goal || undefined,
      summary: form.summary || undefined,
      category: form.category || undefined,
      priority: form.priority,
      start_date: form.start_date || undefined,
      end_date: form.end_date || undefined,
      budget: form.budget ? Number(form.budget) : undefined,
      currency: form.currency,
      note: form.note || undefined,
      ai_draft_json: aiDraftJson || undefined,
    };

    createProject.mutate(data, {
      onSuccess: (project) => {
        if (andSubmit) {
          submitProposal.mutate({ id: project.projectId }, {
            onSuccess: () => navigate('/project/proposals'),
          });
        } else {
          navigate(`/project/proposals/${project.projectId}`);
        }
      },
    });
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/project/proposals')} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900">{t('proposal.create')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Draft Panel */}
        <div className="lg:col-span-1">
          <AiDraftPanel onDraftGenerated={handleDraftGenerated} />
        </div>

        {/* Form */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('proposal.name')} *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('proposal.title')}</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.category')}</label>
              <select
                value={form.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">-</option>
                {['TECH_BPO', 'SI_DEV', 'INTERNAL', 'R_AND_D', 'MARKETING', 'OTHER'].map((c) => (
                  <option key={c} value={c}>{t(`category.${c}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.priority')}</label>
              <select
                value={form.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map((p) => (
                  <option key={p} value={p}>{t(`priority.${p}`)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('proposal.purpose')}</label>
            <textarea
              value={form.purpose}
              onChange={(e) => handleChange('purpose', e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('proposal.goal')}</label>
            <textarea
              value={form.goal}
              onChange={(e) => handleChange('goal', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('proposal.summary')}</label>
            <textarea
              value={form.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.startDate')}</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.endDate')}</label>
              <input
                type="date"
                value={form.end_date}
                min={form.start_date || undefined}
                onChange={(e) => handleChange('end_date', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.budget')}</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => handleChange('budget', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.currency')}</label>
              <select
                value={form.currency}
                onChange={(e) => handleChange('currency', e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="USD">USD</option>
                <option value="KRW">KRW</option>
                <option value="VND">VND</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project.note')}</label>
            <textarea
              value={form.note}
              onChange={(e) => handleChange('note', e.target.value)}
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => handleSave(false)}
              disabled={!form.name.trim() || createProject.isPending}
              className="flex items-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {t('actions.save')}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={!form.name.trim() || createProject.isPending}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {t('proposal.submit')}
            </button>
            <button
              onClick={() => navigate('/project/proposals')}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('actions.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
