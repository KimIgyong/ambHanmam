import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Plus, Trash2, Download, Eye, EyeOff, Save, Plug, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import {
  useAsanaConfig,
  useSaveAsanaConfig,
  useDeleteAsanaConfig,
  useTestAsanaConnection,
  useAsanaMappings,
  useCreateAsanaMapping,
  useDeleteAsanaMapping,
  useImportAsanaTasks,
} from '@/domain/asana-integration/hooks/useAsanaIntegration';
import { useProjectList } from '@/domain/project/hooks/useProject';

export default function EntityAsanaIntegrationPage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const navigate = useNavigate();

  /* ── PAT config ── */
  const { data: configList } = useAsanaConfig();
  const saveConfigMut = useSaveAsanaConfig();
  const deleteConfigMut = useDeleteAsanaConfig();
  const testMut = useTestAsanaConnection();

  const patConfig = configList?.[0];
  const [patInput, setPatInput] = useState('');
  const [patVisible, setPatVisible] = useState(false);

  /* ── mappings ── */
  const { data: mappings, isLoading: mapLoading } = useAsanaMappings();
  const createMut = useCreateAsanaMapping();
  const deleteMut = useDeleteAsanaMapping();
  const importMut = useImportAsanaTasks();

  /* ── AMA projects ── */
  const { data: projectsData } = useProjectList({ status: 'ACTIVE' });
  const projects = (projectsData as any)?.data || projectsData || [];

  /* ── add mapping modal ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ asanaUrl: '', projectId: '' });

  /* ── import modal ── */
  const [importTarget, setImportTarget] = useState<{ id: string; name: string } | null>(null);
  const [importFilter, setImportFilter] = useState<'all' | 'active' | 'completed'>('all');

  const extractProjectGid = (input: string): string => {
    // V1: /1/{workspace}/project/{gid}/...
    const v1 = input.match(/app\.asana\.com\/1\/\d+\/project\/(\d+)/);
    if (v1) return v1[1];
    // V0: /0/{gid}/...
    const v0 = input.match(/app\.asana\.com\/0\/(\d+)/);
    if (v0) return v0[1];
    // raw GID
    if (/^\d+$/.test(input.trim())) return input.trim();
    return input.trim();
  };

  const handleSavePat = async () => {
    if (!patInput.trim()) return;
    try {
      await saveConfigMut.mutateAsync(patInput.trim());
      toast.success(t('entitySettings:asana.config.saveSuccess'));
      setPatInput('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleDeletePat = async () => {
    if (!confirm(t('entitySettings:asana.config.deleteConfirm'))) return;
    try {
      await deleteConfigMut.mutateAsync();
      toast.success(t('entitySettings:asana.config.deleteSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await testMut.mutateAsync();
      if (result.ok) {
        toast.success(`${t('entitySettings:asana.config.testSuccess')}: ${result.name} (${result.email})`);
      } else {
        toast.error(result.error || 'Connection failed');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleAddMapping = async () => {
    const gid = extractProjectGid(addForm.asanaUrl);
    if (!gid) return;
    try {
      await createMut.mutateAsync({
        asana_project_gid: gid,
        project_id: addForm.projectId || undefined,
      });
      toast.success(t('entitySettings:asana.mapping.createSuccess'));
      setShowAddModal(false);
      setAddForm({ asanaUrl: '', projectId: '' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm(t('entitySettings:asana.mapping.deleteConfirm'))) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success(t('entitySettings:asana.mapping.deleteSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleImport = async () => {
    if (!importTarget) return;
    try {
      const result = await importMut.mutateAsync({
        mappingId: importTarget.id,
        data: { completed_filter: importFilter },
      });
      toast.success(
        t('entitySettings:asana.mapping.importSuccess', {
          imported: result.imported,
          skipped: result.skipped,
          failed: result.failed,
          total: result.total,
        }),
      );
      setImportTarget(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/entity-settings')} className="rounded p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <ListChecks className="h-6 w-6 text-orange-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('entitySettings:asana.title')}</h1>
            <p className="text-sm text-gray-500">{t('entitySettings:asana.description')}</p>
          </div>
        </div>

        {/* PAT Config Card */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-1 flex items-center gap-2">
            <Plug className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-700">{t('entitySettings:asana.config.title')}</h2>
          </div>
          <p className="mb-4 text-xs text-gray-400">{t('entitySettings:asana.config.description')}</p>

          {patConfig ? (
            <div className="flex items-center gap-3">
              <span className="rounded bg-gray-100 px-2.5 py-1.5 font-mono text-sm text-gray-600">
                ****{patConfig.keyLast4}
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                {t('entitySettings:asana.config.configured')}
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testMut.isPending}
                  className="flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {testMut.isPending ? 'Testing...' : t('entitySettings:asana.config.testConnection')}
                </button>
                <button
                  onClick={handleDeletePat}
                  disabled={deleteConfigMut.isPending}
                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={patVisible ? 'text' : 'password'}
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder={t('entitySettings:asana.config.placeholder')}
                  className="w-full rounded-md border border-gray-300 px-3 py-1.5 pr-9 font-mono text-sm focus:border-orange-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setPatVisible(!patVisible)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {patVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                onClick={handleSavePat}
                disabled={!patInput.trim() || saveConfigMut.isPending}
                className="flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
              >
                <Save className="h-3.5 w-3.5" />
                {t('common:save')}
              </button>
            </div>
          )}
        </div>

        {/* Project Mappings */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">{t('entitySettings:asana.mapping.title')}</h2>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!patConfig}
              className="flex items-center gap-1.5 rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              {t('entitySettings:asana.mapping.add')}
            </button>
          </div>

          {mapLoading ? (
            <p className="py-8 text-center text-sm text-gray-400">Loading...</p>
          ) : !mappings?.length ? (
            <p className="py-8 text-center text-sm text-gray-400">{t('entitySettings:asana.mapping.noMappings')}</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {mappings.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {m.asanaProjectName || m.asanaProjectGid}
                    </p>
                    <p className="text-xs text-gray-400">
                      GID: {m.asanaProjectGid}
                      {m.lastSyncedAt && ` · ${t('entitySettings:asana.mapping.lastSynced')}: ${new Date(m.lastSyncedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setImportTarget({ id: m.id, name: m.asanaProjectName || m.asanaProjectGid })}
                      className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      title={t('entitySettings:asana.mapping.import')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMapping(m.id)}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Mapping Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">{t('entitySettings:asana.mapping.add')}</h3>

              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:asana.mapping.asanaUrlOrGid')}
                </label>
                <input
                  type="text"
                  value={addForm.asanaUrl}
                  onChange={(e) => setAddForm((p) => ({ ...p, asanaUrl: e.target.value }))}
                  placeholder="https://app.asana.com/... or Project GID"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:asana.mapping.amaProject')}
                </label>
                <select
                  value={addForm.projectId}
                  onChange={(e) => setAddForm((p) => ({ ...p, projectId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="">{t('entitySettings:asana.mapping.selectProject')}</option>
                  {(Array.isArray(projects) ? projects : []).map((p: any) => (
                    <option key={p.pjtId || p.id} value={p.pjtId || p.id}>
                      {p.pjtName || p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleAddMapping}
                  disabled={!addForm.asanaUrl.trim() || createMut.isPending}
                  className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {importTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {t('entitySettings:asana.mapping.import')}
              </h3>
              <p className="mb-4 text-sm text-gray-500">{importTarget.name}</p>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:asana.mapping.importFilter')}
                </label>
                <select
                  value={importFilter}
                  onChange={(e) => setImportFilter(e.target.value as 'all' | 'active' | 'completed')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none"
                >
                  <option value="all">{t('entitySettings:asana.mapping.filterAll')}</option>
                  <option value="active">{t('entitySettings:asana.mapping.filterActive')}</option>
                  <option value="completed">{t('entitySettings:asana.mapping.filterCompleted')}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setImportTarget(null)}
                  disabled={importMut.isPending}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleImport}
                  disabled={importMut.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {importMut.isPending
                    ? t('entitySettings:asana.mapping.importing')
                    : t('entitySettings:asana.mapping.import')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
