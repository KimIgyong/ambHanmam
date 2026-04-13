import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Save, Plus, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig, useUpdateSiteConfig, useMenuTips, useUpsertMenuTip } from '../hooks/useSiteConfig';

interface MenuTip {
  id: string;
  menuCode: string;
  title: string | null;
  content: string | null;
  isActive: boolean;
  sortOrder: number;
}

/** 모든 설정 가능한 메뉴 목록 */
const ALL_MENU_CODES = [
  'DASHBOARD', 'CHAT', 'TODOS', 'ISSUES', 'MEETING_NOTES',
  'PROJECTS', 'TODAY_ANALYSIS', 'KMS', 'HR', 'ACCOUNTING', 'BILLING',
  'ENTITY_ORGANIZATION', 'ENTITY_MEMBERS', 'ENTITY_PERMISSIONS',
  'ENTITY_USAGE', 'ENTITY_CUSTOM_APPS',
];

export default function EntitySiteConfigPage() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const navigate = useNavigate();

  /* ── Site Config ── */
  const { data: config, isLoading: configLoading } = useSiteConfig();
  const updateConfig = useUpdateSiteConfig();

  const [modalEnabled, setModalEnabled] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (config) {
      setModalEnabled(config.loginModalEnabled ?? false);
      setModalTitle(config.loginModalTitle ?? '');
      setModalContent(config.loginModalContent ?? '');
    }
  }, [config]);

  const handleSaveConfig = () => {
    updateConfig.mutate({
      login_modal_enabled: modalEnabled,
      login_modal_title: modalTitle,
      login_modal_content: modalContent,
    });
  };

  /* ── Menu Tips ── */
  const { data: tips = [], isLoading: tipsLoading } = useMenuTips();
  const upsertTip = useUpsertMenuTip();

  const [editingTip, setEditingTip] = useState<{ menuCode: string; title: string; content: string; isActive: boolean } | null>(null);

  const getTipForMenu = (code: string): MenuTip | undefined =>
    (tips as MenuTip[]).find((t) => t.menuCode === code);

  const handleSaveTip = () => {
    if (!editingTip) return;
    upsertTip.mutate(
      { menuCode: editingTip.menuCode, title: editingTip.title, content: editingTip.content, is_active: editingTip.isActive },
      { onSuccess: () => setEditingTip(null) },
    );
  };

  const isLoading = configLoading || tipsLoading;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <button onClick={() => navigate('/entity-settings')} className="rounded-lg p-1.5 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('entitySettings:siteConfig.title')}</h1>
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-sm text-gray-400">{t('common:loading')}</div>
        ) : (
          <div className="space-y-8">
            {/* ── Section 1: Login Modal ── */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('entitySettings:siteConfig.loginModal.title')}</h2>

              {/* Toggle */}
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-700">{t('entitySettings:siteConfig.loginModal.enabled')}</span>
                <button
                  onClick={() => setModalEnabled(!modalEnabled)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${modalEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${modalEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {modalEnabled && (
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:siteConfig.loginModal.modalTitle')}</label>
                    <input
                      value={modalTitle}
                      onChange={(e) => setModalTitle(e.target.value)}
                      maxLength={200}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={t('entitySettings:siteConfig.loginModal.modalTitlePlaceholder')}
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:siteConfig.loginModal.content')}</label>
                    <textarea
                      value={modalContent}
                      onChange={(e) => setModalContent(e.target.value)}
                      rows={6}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder={t('entitySettings:siteConfig.loginModal.contentPlaceholder')}
                    />
                  </div>

                  {/* Preview button */}
                  <button
                    onClick={() => setShowPreview(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" />
                    {t('entitySettings:siteConfig.loginModal.preview')}
                  </button>
                </div>
              )}

              {/* Save */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveConfig}
                  disabled={updateConfig.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {t('common:save')}
                </button>
              </div>
            </section>

            {/* ── Section 2: Menu Tips ── */}
            <section className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('entitySettings:siteConfig.menuTips.title')}</h2>
              <p className="mb-4 text-sm text-gray-500">{t('entitySettings:siteConfig.menuTips.description')}</p>

              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 font-medium text-gray-600">{t('entitySettings:siteConfig.menuTips.menuName')}</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600">{t('entitySettings:siteConfig.menuTips.tipTitle')}</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600 text-center">{t('entitySettings:siteConfig.menuTips.active')}</th>
                      <th className="px-4 py-2.5 font-medium text-gray-600 text-center">{t('entitySettings:siteConfig.menuTips.action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ALL_MENU_CODES.map((code) => {
                      const tip = getTipForMenu(code);
                      return (
                        <tr key={code} className="hover:bg-gray-50">
                          <td className="px-4 py-2.5 font-mono text-xs text-gray-700">{code}</td>
                          <td className="px-4 py-2.5 text-gray-600">{tip?.title || <span className="text-gray-300">—</span>}</td>
                          <td className="px-4 py-2.5 text-center">
                            {tip ? (
                              <span className={`inline-block h-2 w-2 rounded-full ${tip.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button
                              onClick={() =>
                                setEditingTip({
                                  menuCode: code,
                                  title: tip?.title || '',
                                  content: tip?.content || '',
                                  isActive: tip?.isActive ?? true,
                                })
                              }
                              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-indigo-600 hover:bg-indigo-50"
                            >
                              {tip ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                              {tip ? t('common:edit') : t('common:add')}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ── Preview Modal ── */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowPreview(false)}>
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-3 text-lg font-semibold text-gray-900">{modalTitle || t('entitySettings:siteConfig.loginModal.defaultTitle')}</h3>
              <div className="mb-4 whitespace-pre-wrap text-sm text-gray-600">{modalContent || t('entitySettings:siteConfig.loginModal.noContent')}</div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  {t('common:confirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tip Edit Modal ── */}
        {editingTip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setEditingTip(null)}>
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                {t('entitySettings:siteConfig.menuTips.editTip')} — <span className="font-mono text-sm text-indigo-600">{editingTip.menuCode}</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:siteConfig.menuTips.tipTitle')}</label>
                  <input
                    value={editingTip.title}
                    onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                    maxLength={200}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">{t('entitySettings:siteConfig.menuTips.tipContent')}</label>
                  <textarea
                    value={editingTip.content}
                    onChange={(e) => setEditingTip({ ...editingTip, content: e.target.value })}
                    rows={5}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t('entitySettings:siteConfig.menuTips.active')}</span>
                  <button
                    onClick={() => setEditingTip({ ...editingTip, isActive: !editingTip.isActive })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${editingTip.isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${editingTip.isActive ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setEditingTip(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleSaveTip}
                  disabled={upsertTip.isPending}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
