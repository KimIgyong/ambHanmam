import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, Loader2, Settings, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ExternalProviderMeta } from '@amb/types';
import {
  useExternalProviders,
  useExternalProjects,
  useExternalGroups,
  useExternalTasks,
  useImportTasks,
} from '../hooks/useExternalTaskImport';

export default function ExternalTaskImportPage() {
  const { t } = useTranslation(['externalTask', 'common', 'issues']);

  // Step state
  const [selectedProvider, setSelectedProvider] = useState<ExternalProviderMeta | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [onlyIncomplete, setOnlyIncomplete] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Defaults
  const [defaults, setDefaults] = useState({
    type: 'TASK',
    severity: 'MAJOR',
    priority: 3,
    visibility: 'ENTITY',
    project_id: '',
  });

  // Queries
  const { data: providers, isLoading: loadingProviders } = useExternalProviders();
  const { data: projects, isLoading: loadingProjects } = useExternalProjects(
    selectedProvider?.type || '',
    selectedProvider?.appId || '',
  );
  const { data: groups, isLoading: loadingGroups } = useExternalGroups(
    selectedProvider?.type || '',
    selectedProvider?.appId || '',
    selectedProjectId,
  );
  const { data: tasksResult, isLoading: loadingTasks } = useExternalTasks(
    selectedProvider?.type || '',
    selectedProvider?.appId || '',
    selectedGroupId,
    { onlyIncomplete },
  );
  const importMutation = useImportTasks();

  const tasks = tasksResult?.data || [];
  const connectedProviders = (providers || []).filter((p) => p.isConnected);

  const handleProviderSelect = (provider: ExternalProviderMeta) => {
    setSelectedProvider(provider);
    setSelectedProjectId('');
    setSelectedGroupId('');
    setSelectedTaskIds(new Set());
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
    setSelectedGroupId('');
    setSelectedTaskIds(new Set());
  };

  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedTaskIds(new Set());
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const toggleAll = () => {
    const importable = tasks.filter((t) => !t.alreadyImported);
    if (selectedTaskIds.size === importable.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(importable.map((t) => t.id)));
    }
  };

  const handleImport = async () => {
    if (!selectedProvider || selectedTaskIds.size === 0) return;

    try {
      const result = await importMutation.mutateAsync({
        provider: selectedProvider.type,
        data: {
          app_id: selectedProvider.appId!,
          task_ids: Array.from(selectedTaskIds),
          project_name: (projects || []).find((p) => p.id === selectedProjectId)?.name,
          group_name: (groups || []).find((g) => g.id === selectedGroupId)?.name,
          defaults,
        },
      });
      setImportResult(result);
      setShowResult(true);
      setSelectedTaskIds(new Set());
      toast.success(`${result.imported}${t('externalTask:import.resultImported')}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to="/issues" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t('externalTask:title')}</h1>
        </div>

        {/* No providers message */}
        {!loadingProviders && connectedProviders.length === 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center">
            <p className="text-amber-800">{t('externalTask:import.noProviders')}</p>
            <Link to="/entity-settings/external-task-tools" className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline">
              <Settings className="h-4 w-4" />
              {t('externalTask:import.goToSettings')}
            </Link>
          </div>
        )}

        {connectedProviders.length > 0 && (
          <div className="space-y-6">
            {/* Step 1: Provider Select */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t('externalTask:import.selectProvider')}</label>
              <div className="flex gap-3">
                {connectedProviders.map((p) => (
                  <button
                    key={p.type}
                    onClick={() => handleProviderSelect(p)}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      selectedProvider?.type === p.type
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {p.displayName}
                    {p.appName && <span className="text-xs text-gray-400">({p.appName})</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Project Select */}
            {selectedProvider && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('externalTask:import.selectProject')}</label>
                {loadingProjects ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => handleProjectChange(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">{t('externalTask:import.selectProject')}</option>
                    {(projects || []).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 3: Group Select */}
            {selectedProjectId && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">{t('externalTask:import.selectGroup')}</label>
                {loadingGroups ? (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                ) : (groups || []).length === 0 ? (
                  <div className="text-sm text-gray-500">
                    {/* No groups — use project:id as groupId for Redmine */}
                    <button
                      onClick={() => handleGroupChange(`project:${selectedProjectId}`)}
                      className="rounded bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                    >
                      {t('externalTask:import.loadAllTasks')}
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleGroupChange(e.target.value)}
                    className="w-full max-w-md rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">{t('externalTask:import.selectGroup')}</option>
                    {(groups || []).map((g) => (
                      <option key={g.id} value={g.id}>{g.name}{g.taskCount != null ? ` (${g.taskCount})` : ''}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Step 4: Tasks Table */}
            {selectedGroupId && (
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">{t('externalTask:import.selectTasks')}</label>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={onlyIncomplete}
                      onChange={() => setOnlyIncomplete(!onlyIncomplete)}
                      className="rounded border-gray-300"
                    />
                    {t('externalTask:import.incompleteOnly')}
                  </label>
                </div>

                {loadingTasks ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
                ) : tasks.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
                    {t('common:noData')}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="w-10 px-3 py-2">
                            <input type="checkbox" onChange={toggleAll} checked={selectedTaskIds.size === tasks.filter((t) => !t.alreadyImported).length && selectedTaskIds.size > 0} className="rounded border-gray-300" />
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">ID</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">{t('common:title')}</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">{t('common:status')}</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">{t('common:assignee')}</th>
                          <th className="px-3 py-2 text-left font-medium text-gray-600">{t('common:dueDate')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {tasks.map((task) => (
                          <tr
                            key={task.id}
                            className={`${task.alreadyImported ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}`}
                          >
                            <td className="px-3 py-2">
                              {task.alreadyImported ? (
                                <span className="text-xs text-green-600">{t('externalTask:import.alreadyImported')}</span>
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={selectedTaskIds.has(task.id)}
                                  onChange={() => toggleTask(task.id)}
                                  className="rounded border-gray-300"
                                />
                              )}
                            </td>
                            <td className="px-3 py-2 text-gray-500">{task.id}</td>
                            <td className="px-3 py-2 font-medium text-gray-900">
                              {task.url ? (
                                <a href={task.url} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 hover:underline">{task.title}</a>
                              ) : task.title}
                            </td>
                            <td className="px-3 py-2 text-gray-600">{task.status || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{task.assignee || '-'}</td>
                            <td className="px-3 py-2 text-gray-600">{task.dueDate || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Defaults + Import */}
            {selectedTaskIds.size > 0 && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <h3 className="mb-3 text-sm font-medium text-gray-900">{t('externalTask:defaults.title')}</h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">{t('externalTask:defaults.type')}</label>
                    <select value={defaults.type} onChange={(e) => setDefaults({ ...defaults, type: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
                      <option value="TASK">{t('issues:type.TASK')}</option>
                      <option value="BUG">{t('issues:type.BUG')}</option>
                      <option value="FEATURE_REQUEST">{t('issues:type.FEATURE_REQUEST')}</option>
                      <option value="OPINION">{t('issues:type.OPINION')}</option>
                      <option value="OTHER">{t('issues:type.OTHER')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">{t('externalTask:defaults.severity')}</label>
                    <select value={defaults.severity} onChange={(e) => setDefaults({ ...defaults, severity: e.target.value })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
                      <option value="CRITICAL">{t('issues:severity.CRITICAL')}</option>
                      <option value="MAJOR">{t('issues:severity.MAJOR')}</option>
                      <option value="MINOR">{t('issues:severity.MINOR')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-600">{t('externalTask:defaults.priority')}</label>
                    <select value={defaults.priority} onChange={(e) => setDefaults({ ...defaults, priority: Number(e.target.value) })} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm">
                      {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {t('externalTask:import.importSelected', { count: selectedTaskIds.size })}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Result Modal */}
        {showResult && importResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowResult(false)}>
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h2 className="mb-4 text-lg font-bold text-gray-900">{t('externalTask:import.result')}</h2>
              <div className="mb-4 grid grid-cols-3 gap-4 text-center">
                <div className="rounded-lg bg-green-50 p-3">
                  <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-600" />
                  <div className="text-lg font-bold text-green-700">{importResult.imported}</div>
                  <div className="text-xs text-green-600">{t('externalTask:import.resultImported')}</div>
                </div>
                <div className="rounded-lg bg-yellow-50 p-3">
                  <MinusCircle className="mx-auto mb-1 h-5 w-5 text-yellow-600" />
                  <div className="text-lg font-bold text-yellow-700">{importResult.skipped}</div>
                  <div className="text-xs text-yellow-600">{t('externalTask:import.resultSkipped')}</div>
                </div>
                <div className="rounded-lg bg-red-50 p-3">
                  <XCircle className="mx-auto mb-1 h-5 w-5 text-red-600" />
                  <div className="text-lg font-bold text-red-700">{importResult.failed}</div>
                  <div className="text-xs text-red-600">{t('externalTask:import.resultFailed')}</div>
                </div>
              </div>
              <button onClick={() => setShowResult(false)} className="w-full rounded-lg bg-gray-100 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">
                {t('common:close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
