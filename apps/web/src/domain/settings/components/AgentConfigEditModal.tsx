import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, RotateCcw } from 'lucide-react';
import { useAgentConfig, useUpdateAgentConfig, useResetAgentConfig } from '../hooks/useAgentConfigs';
import { useCellList } from '@/domain/members/hooks/useCells';

interface AgentConfigEditModalProps {
  deptCode: string;
  onClose: () => void;
}

export default function AgentConfigEditModal({ deptCode, onClose }: AgentConfigEditModalProps) {
  const { t } = useTranslation(['common', 'units']);
  const { data: config, isLoading } = useAgentConfig(deptCode);
  const updateMutation = useUpdateAgentConfig();
  const resetMutation = useResetAgentConfig();
  const { data: groups = [] } = useCellList();

  const [systemPrompt, setSystemPrompt] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  // null = 전체공개, [] = 비공개, [id,...] = 특정그룹
  const [visibilityMode, setVisibilityMode] = useState<'all' | 'none' | 'custom'>('all');
  const [selectedCellIds, setSelectedCellIds] = useState<string[]>([]);

  useEffect(() => {
    if (config) {
      setSystemPrompt(config.systemPrompt || '');
      setDescription(config.description || '');
      setIsActive(config.isActive ?? true);
      const vg = config.visibleCellIds as string[] | null | undefined;
      if (vg === null || vg === undefined) {
        setVisibilityMode('all');
        setSelectedCellIds([]);
      } else if (vg.length === 0) {
        setVisibilityMode('none');
        setSelectedCellIds([]);
      } else {
        setVisibilityMode('custom');
        setSelectedCellIds(vg);
      }
    }
  }, [config]);

  const toggleCell = (id: string) => {
    setSelectedCellIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  };

  const buildVisibleCellIds = (): string[] | null => {
    if (visibilityMode === 'all') return null;
    if (visibilityMode === 'none') return [];
    return selectedCellIds;
  };

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      deptCode,
      dto: {
        system_prompt: systemPrompt,
        description,
        is_active: isActive,
        visible_cell_ids: buildVisibleCellIds(),
      },
    });
    onClose();
  };

  const handleReset = async () => {
    await resetMutation.mutateAsync(deptCode);
    onClose();
  };

  if (isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {config?.unitName} Agent - {t('common:edit')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={20}
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deptCode === 'TRANSLATION' ? true : isActive}
              onChange={(e) => deptCode !== 'TRANSLATION' && setIsActive(e.target.checked)}
              disabled={deptCode === 'TRANSLATION'}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            />
            <span className="text-sm text-gray-700">Active</span>
          </label>

          {/* TRANSLATION 안내 */}
          {deptCode === 'TRANSLATION' && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-700">
              번역 에이전트는 권한 설정과 관계없이 <strong>모든 사용자에게 항상 공개</strong>됩니다. 활성화 상태 및 그룹 노출 설정을 변경할 수 없습니다.
            </div>
          )}

          {/* 그룹 노출 설정 */}
          {deptCode !== 'TRANSLATION' && (
            <div className="rounded-lg border border-gray-200 p-4">
              <p className="mb-3 text-sm font-medium text-gray-700">그룹 노출 설정</p>
              <div className="mb-3 flex gap-4">
                {(['all', 'none', 'custom'] as const).map((mode) => (
                  <label key={mode} className="flex items-center gap-1.5 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="visibilityMode"
                      value={mode}
                      checked={visibilityMode === mode}
                      onChange={() => setVisibilityMode(mode)}
                      className="h-4 w-4 text-indigo-600"
                    />
                    {mode === 'all' ? '전체 공개' : mode === 'none' ? '비공개' : '그룹 선택'}
                  </label>
                ))}
              </div>
              {visibilityMode === 'custom' && (
                <div className="flex flex-wrap gap-2">
                  {(groups as any[]).map((g: any) => (
                    <label
                      key={g.cellId}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1 text-sm transition-colors has-[:checked]:border-indigo-400 has-[:checked]:bg-indigo-50 has-[:checked]:text-indigo-700"
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={selectedCellIds.includes(g.cellId)}
                        onChange={() => toggleCell(g.cellId)}
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-gray-200 px-6 py-4">
          <button
            onClick={handleReset}
            disabled={resetMutation.isPending}
            className="flex items-center gap-1 rounded-md border border-orange-300 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
          >
            <RotateCcw className="h-4 w-4" /> Reset to default
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {t('common:cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {t('common:save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
