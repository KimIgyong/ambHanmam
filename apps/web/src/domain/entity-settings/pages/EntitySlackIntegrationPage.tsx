import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Plus, Trash2, Pause, Play, Unplug, Eye, EyeOff, Save, Settings, Download, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  useSlackWorkspaces,
  useConnectWithBotToken,
  useDisconnectWorkspace,
  useSlackMappings,
  useSlackChannels,
  useCreateMapping,
  useUpdateMapping,
  useDeleteMapping,
  useSlackConfig,
  useSaveSlackConfig,
  useDeleteSlackConfig,
  useImportHistory,
  useSyncMembers,
} from '@/domain/slack-integration/hooks/useSlackIntegration';
import { slackIntegrationService } from '@/domain/slack-integration/service/slack-integration.service';
import type { SyncMembersResult } from '@/domain/slack-integration/service/slack-integration.service';
import { useChannels } from '@/domain/amoeba-talk/hooks/useTalk';

export default function EntitySlackIntegrationPage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  /* ── OAuth callback result ── */
  useEffect(() => {
    const connected = searchParams.get('connected');
    const team = searchParams.get('team');
    const error = searchParams.get('error');

    if (connected === 'true' && team) {
      toast.success(`${t('entitySettings:slack.workspace.connected')}: ${team}`);
      setSearchParams({}, { replace: true });
    } else if (error) {
      toast.error(error);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, t]);

  /* ── workspace ── */
  const { data: workspaces, isLoading: wsLoading } = useSlackWorkspaces();
  const connectTokenMut = useConnectWithBotToken();
  const disconnectMut = useDisconnectWorkspace();
  const workspace = workspaces?.[0];

  /* ── connect modal state ── */
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMethod, setConnectMethod] = useState<'oauth' | 'token'>('token');
  const [botTokenInput, setBotTokenInput] = useState('');
  const [botTokenVisible, setBotTokenVisible] = useState(false);

  /* ── mappings ── */
  const { data: mappings, isLoading: mapLoading } = useSlackMappings();
  const { data: slackChannels } = useSlackChannels(workspace?.id || '');
  const { data: amaChannels } = useChannels();
  const createMut = useCreateMapping();
  const updateMut = useUpdateMapping();
  const deleteMut = useDeleteMapping();
  const importMut = useImportHistory();
  const syncMembersMut = useSyncMembers();

  /* ── modal state ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ slackChannelId: '', amaChannelId: '', direction: 'BIDIRECTIONAL' });

  /* ── import modal state ── */
  const [importTarget, setImportTarget] = useState<{ id: string; slackName: string; amaName: string } | null>(null);
  const [importPeriod, setImportPeriod] = useState<'1w' | '1m' | 'all'>('1w');

  /* ── sync members result modal state ── */
  const [syncResult, setSyncResult] = useState<SyncMembersResult | null>(null);

  /* ── app config ── */
  const { data: configList } = useSlackConfig();
  const saveConfigMut = useSaveSlackConfig();
  const deleteConfigMut = useDeleteSlackConfig();

  const SLACK_CONFIG_FIELDS = [
    { provider: 'SLACK_CLIENT_ID', label: t('entitySettings:slack.appConfig.clientId'), placeholder: t('entitySettings:slack.appConfig.clientIdPlaceholder') },
    { provider: 'SLACK_CLIENT_SECRET', label: t('entitySettings:slack.appConfig.clientSecret'), placeholder: t('entitySettings:slack.appConfig.clientSecretPlaceholder') },
    { provider: 'SLACK_SIGNING_SECRET', label: t('entitySettings:slack.appConfig.signingSecret'), placeholder: t('entitySettings:slack.appConfig.signingSecretPlaceholder') },
  ] as const;

  const [configInputs, setConfigInputs] = useState<Record<string, string>>({});
  const [configVisible, setConfigVisible] = useState<Record<string, boolean>>({});

  const getConfigByProvider = (provider: string) => configList?.find((c) => c.provider === provider);

  const handleSaveConfig = async (provider: string) => {
    const value = configInputs[provider]?.trim();
    if (!value) return;
    try {
      await saveConfigMut.mutateAsync({ provider, value });
      toast.success(t('entitySettings:slack.appConfig.saveSuccess'));
      setConfigInputs((prev) => ({ ...prev, [provider]: '' }));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleDeleteConfig = async (provider: string) => {
    if (!confirm(t('entitySettings:slack.appConfig.deleteConfirm'))) return;
    try {
      await deleteConfigMut.mutateAsync(provider);
      toast.success(t('entitySettings:slack.appConfig.deleteSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleConnect = () => {
    setShowConnectModal(true);
  };

  const handleConnectSubmit = async () => {
    if (connectMethod === 'oauth') {
      window.location.href = slackIntegrationService.getInstallUrl();
      return;
    }
    // Bot Token direct
    if (!botTokenInput.trim()) return;
    try {
      await connectTokenMut.mutateAsync(botTokenInput.trim());
      toast.success(t('entitySettings:slack.workspace.connected'));
      setShowConnectModal(false);
      setBotTokenInput('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!workspace) return;
    if (!confirm(t('entitySettings:slack.workspace.disconnectConfirm'))) return;
    try {
      await disconnectMut.mutateAsync(workspace.id);
      toast.success(t('entitySettings:slack.workspace.disconnectSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleAddMapping = async () => {
    if (!workspace || !addForm.slackChannelId) return;
    const slackCh = slackChannels?.find((c) => c.id === addForm.slackChannelId);
    try {
      await createMut.mutateAsync({
        swc_id: workspace.id,
        slack_channel_id: addForm.slackChannelId,
        slack_channel_name: slackCh?.name,
        ama_channel_id: addForm.amaChannelId || undefined,
        direction: addForm.direction,
      });
      toast.success(t('entitySettings:slack.channelMapping.createSuccess'));
      setShowAddModal(false);
      setAddForm({ slackChannelId: '', amaChannelId: '', direction: 'BIDIRECTIONAL' });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    try {
      await updateMut.mutateAsync({ id, data: { status: newStatus } });
      toast.success(t('entitySettings:slack.channelMapping.updateSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleDeleteMapping = async (id: string) => {
    if (!confirm(t('entitySettings:slack.channelMapping.deleteConfirm'))) return;
    try {
      await deleteMut.mutateAsync(id);
      toast.success(t('entitySettings:slack.channelMapping.deleteSuccess'));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const handleImport = async () => {
    if (!importTarget) return;
    const now = Math.floor(Date.now() / 1000);
    let oldest: string | undefined;
    if (importPeriod === '1w') oldest = String(now - 7 * 24 * 60 * 60);
    else if (importPeriod === '1m') oldest = String(now - 30 * 24 * 60 * 60);

    try {
      const result = await importMut.mutateAsync({
        mappingId: importTarget.id,
        data: { oldest, limit: 1000 },
      });
      toast.success(
        t('entitySettings:slack.channelMapping.importSuccess', {
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

  const handleSyncMembers = async (mappingId: string) => {
    try {
      const result = await syncMembersMut.mutateAsync(mappingId);
      setSyncResult(result);
      if (result.added > 0) {
        toast.success(
          t('entitySettings:slack.syncMembers.syncSuccess', { added: result.added }),
        );
      } else {
        toast.info(t('entitySettings:slack.syncMembers.noNewMembers'));
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err.message);
    }
  };

  const directionLabel = (d: string) => {
    const map: Record<string, string> = {
      BIDIRECTIONAL: t('entitySettings:slack.channelMapping.directionBidirectional'),
      INBOUND_ONLY: t('entitySettings:slack.channelMapping.directionInboundOnly'),
      OUTBOUND_ONLY: t('entitySettings:slack.channelMapping.directionOutboundOnly'),
    };
    return map[d] || d;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      ACTIVE: t('entitySettings:slack.channelMapping.statusActive'),
      PAUSED: t('entitySettings:slack.channelMapping.statusPaused'),
      DISCONNECTED: t('entitySettings:slack.channelMapping.statusDisconnected'),
    };
    return map[s] || s;
  };

  const statusColor = (s: string) => {
    if (s === 'ACTIVE') return 'bg-green-100 text-green-700';
    if (s === 'PAUSED') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-500';
  };

  const isLoading = wsLoading || mapLoading;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/entity-settings')} className="rounded p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <MessageSquare className="h-6 w-6 text-indigo-500" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('entitySettings:slack.title')}</h1>
            <p className="text-sm text-gray-500">{t('entitySettings:slack.description')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-gray-400">Loading...</div>
        ) : (
          <>
            {/* App Config Card */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
              <div className="mb-1 flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <h2 className="text-sm font-semibold text-gray-700">{t('entitySettings:slack.appConfig.title')}</h2>
              </div>
              <p className="mb-4 text-xs text-gray-400">{t('entitySettings:slack.appConfig.description')}</p>

              <div className="space-y-3">
                {SLACK_CONFIG_FIELDS.map(({ provider, label, placeholder }) => {
                  const existing = getConfigByProvider(provider);
                  const inputVal = configInputs[provider] ?? '';
                  const isVisible = configVisible[provider] ?? false;

                  return (
                    <div key={provider} className="flex items-center gap-3">
                      <div className="w-36 shrink-0">
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </div>

                      {existing ? (
                        <div className="flex flex-1 items-center gap-2">
                          <span className="rounded bg-gray-100 px-2.5 py-1.5 font-mono text-sm text-gray-600">
                            ****{existing.keyLast4}
                          </span>
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            {t('entitySettings:slack.appConfig.configured')}
                          </span>
                          <div className="ml-auto flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteConfig(provider)}
                              disabled={deleteConfigMut.isPending}
                              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                              title={t('common:delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type={isVisible ? 'text' : 'password'}
                              value={inputVal}
                              onChange={(e) => setConfigInputs((prev) => ({ ...prev, [provider]: e.target.value }))}
                              placeholder={placeholder}
                              className="w-full rounded-md border border-gray-300 px-3 py-1.5 pr-9 text-sm focus:border-indigo-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setConfigVisible((prev) => ({ ...prev, [provider]: !prev[provider] }))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleSaveConfig(provider)}
                            disabled={!inputVal.trim() || saveConfigMut.isPending}
                            className="flex items-center gap-1 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                          >
                            <Save className="h-3.5 w-3.5" />
                            {t('common:save')}
                          </button>
                          <span className="text-xs text-gray-400">{t('entitySettings:slack.appConfig.notConfigured')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workspace Card */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">{t('entitySettings:slack.workspace.title')}</h2>
              {workspace ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                      <svg className="h-6 w-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{workspace.teamName}</p>
                      <p className="text-xs text-gray-400">
                        {t('entitySettings:slack.workspace.connectedAt')}: {new Date(workspace.connectedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      {t('entitySettings:slack.workspace.connected')}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnectMut.isPending}
                    className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Unplug className="h-4 w-4" />
                    {t('entitySettings:slack.workspace.disconnect')}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                  <p className="text-sm text-gray-400">{t('entitySettings:slack.workspace.notConnected')}</p>
                  <button
                    onClick={handleConnect}
                    className="flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
                  >
                    <Plus className="h-4 w-4" />
                    {t('entitySettings:slack.workspace.connect')}
                  </button>
                </div>
              )}
            </div>

            {/* Channel Mappings */}
            {workspace && (
              <div className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-700">{t('entitySettings:slack.channelMapping.title')}</h2>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
                  >
                    <Plus className="h-4 w-4" />
                    {t('entitySettings:slack.channelMapping.add')}
                  </button>
                </div>

                {!mappings?.length ? (
                  <p className="py-8 text-center text-sm text-gray-400">{t('entitySettings:slack.channelMapping.noMappings')}</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {mappings.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800">#{m.slackChannelName}</p>
                            <p className="text-xs text-gray-400">{directionLabel(m.direction)}</p>
                          </div>
                          <span className="text-xs text-gray-300">&harr;</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{m.amaChannelName || m.amaChannelId}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(m.status)}`}>
                            {statusLabel(m.status)}
                          </span>
                          <button
                            onClick={() => setImportTarget({
                              id: m.id,
                              slackName: m.slackChannelName,
                              amaName: m.amaChannelName || m.amaChannelId,
                            })}
                            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                            title={t('entitySettings:slack.channelMapping.importHistory')}
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSyncMembers(m.id)}
                            disabled={syncMembersMut.isPending}
                            className="rounded p-1 text-gray-400 hover:bg-purple-50 hover:text-purple-600 disabled:opacity-50"
                            title={t('entitySettings:slack.syncMembers.title')}
                          >
                            <Users className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(m.id, m.status)}
                            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                            title={m.status === 'ACTIVE' ? 'Pause' : 'Resume'}
                          >
                            {m.status === 'ACTIVE' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
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
            )}
          </>
        )}

        {/* Add Mapping Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">{t('entitySettings:slack.channelMapping.add')}</h3>

              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:slack.channelMapping.slackChannel')}</label>
                <select
                  value={addForm.slackChannelId}
                  onChange={(e) => setAddForm((p) => ({ ...p, slackChannelId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">{t('entitySettings:slack.channelMapping.selectSlackChannel')}</option>
                  {slackChannels?.map((ch) => (
                    <option key={ch.id} value={ch.id}>#{ch.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:slack.channelMapping.amaChannel')}</label>
                <select
                  value={addForm.amaChannelId}
                  onChange={(e) => setAddForm((p) => ({ ...p, amaChannelId: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">{t('entitySettings:slack.channelMapping.selectAmaChannel')}</option>
                  {amaChannels?.map((ch: any) => (
                    <option key={ch.id} value={ch.id}>{ch.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:slack.channelMapping.direction')}</label>
                <select
                  value={addForm.direction}
                  onChange={(e) => setAddForm((p) => ({ ...p, direction: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="BIDIRECTIONAL">{t('entitySettings:slack.channelMapping.directionBidirectional')}</option>
                  <option value="INBOUND_ONLY">{t('entitySettings:slack.channelMapping.directionInboundOnly')}</option>
                  <option value="OUTBOUND_ONLY">{t('entitySettings:slack.channelMapping.directionOutboundOnly')}</option>
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
                  disabled={!addForm.slackChannelId || createMut.isPending}
                  className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Import History Modal */}
        {importTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                {t('entitySettings:slack.channelMapping.importHistory')}
              </h3>
              <p className="mb-4 text-sm text-gray-500">
                #{importTarget.slackName} &rarr; {importTarget.amaName}
              </p>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:slack.channelMapping.importPeriod')}
                </label>
                <select
                  value={importPeriod}
                  onChange={(e) => setImportPeriod(e.target.value as '1w' | '1m' | 'all')}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="1w">{t('entitySettings:slack.channelMapping.period1w')}</option>
                  <option value="1m">{t('entitySettings:slack.channelMapping.period1m')}</option>
                  <option value="all">{t('entitySettings:slack.channelMapping.periodAll')}</option>
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
                    ? t('entitySettings:slack.channelMapping.importing')
                    : t('entitySettings:slack.channelMapping.importHistory')}
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Sync Members Result Modal */}
        {syncResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('entitySettings:slack.syncMembers.resultTitle')}
              </h3>

              <div className="mb-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('entitySettings:slack.syncMembers.slackMembers')}</span>
                  <span className="font-medium text-gray-900">{syncResult.slackMembers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('entitySettings:slack.syncMembers.matched')}</span>
                  <span className="font-medium text-green-600">{syncResult.matched}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('entitySettings:slack.syncMembers.added')}</span>
                  <span className="font-medium text-blue-600">{syncResult.added}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{t('entitySettings:slack.syncMembers.alreadyMember')}</span>
                  <span className="font-medium text-gray-500">{syncResult.alreadyMember}</span>
                </div>
              </div>

              {syncResult.unmatched.length > 0 && (
                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-amber-600">
                    {t('entitySettings:slack.syncMembers.unmatchedTitle', { count: syncResult.unmatched.length })}
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded border border-amber-100 bg-amber-50 p-2">
                    {syncResult.unmatched.map((u) => (
                      <div key={u.slackUserId} className="flex items-center justify-between py-1 text-xs">
                        <span className="font-medium text-gray-700">{u.displayName}</span>
                        <span className="text-gray-400">{u.email || t('entitySettings:slack.syncMembers.noEmail')}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    {t('entitySettings:slack.syncMembers.unmatchedHint')}
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => setSyncResult(null)}
                  className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
                >
                  {t('common:confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connect Workspace Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">{t('entitySettings:slack.workspace.connect')}</h3>

              {/* Method Tabs */}
              <div className="mb-4 flex rounded-lg border border-gray-200">
                <button
                  onClick={() => setConnectMethod('token')}
                  className={`flex-1 rounded-l-lg px-4 py-2 text-sm font-medium ${connectMethod === 'token' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {t('entitySettings:slack.workspace.botToken')}
                </button>
                <button
                  onClick={() => setConnectMethod('oauth')}
                  className={`flex-1 rounded-r-lg px-4 py-2 text-sm font-medium ${connectMethod === 'oauth' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  OAuth
                </button>
              </div>

              {connectMethod === 'token' ? (
                <div>
                  <p className="mb-3 text-xs text-gray-500">{t('entitySettings:slack.workspace.botTokenDescription')}</p>
                  <div className="relative mb-4">
                    <input
                      type={botTokenVisible ? 'text' : 'password'}
                      value={botTokenInput}
                      onChange={(e) => setBotTokenInput(e.target.value)}
                      placeholder="xoxb-..."
                      className="w-full rounded-md border border-gray-300 px-3 py-2 pr-9 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setBotTokenVisible(!botTokenVisible)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {botTokenVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-3 text-xs text-gray-500">{t('entitySettings:slack.workspace.oauthDescription')}</p>
                  <p className="mb-4 text-xs text-amber-600">{t('entitySettings:slack.workspace.oauthRequirement')}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowConnectModal(false); setBotTokenInput(''); }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleConnectSubmit}
                  disabled={connectMethod === 'token' ? (!botTokenInput.trim() || connectTokenMut.isPending) : false}
                  className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                >
                  {connectTokenMut.isPending ? 'Connecting...' : t('entitySettings:slack.workspace.connect')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
