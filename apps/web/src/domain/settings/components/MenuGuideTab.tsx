import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExternalLink, Loader2, Pencil, Plus, BookOpen } from 'lucide-react';
import { MenuConfigResponse } from '@amb/types';
import StaticEditor from '@/domain/site-management/components/StaticEditor';
import { useMenuConfigs } from '../hooks/useMenuPermissions';
import { useMenuTips, useUpsertMenuTip } from '@/domain/entity-settings/hooks/useSiteConfig';
import { getManualLinks } from '@/global/utils/manual-links';
import { MENU_GUIDE_DEFAULTS } from '../constants/menuGuideDefaults';
import { useEntityStore } from '@/domain/hr/store/entity.store';

interface MenuTipItem {
  id: string;
  menuCode: string;
  title: string | null;
  content: string | null;
  isActive: boolean;
}

interface EditingTip {
  menuCode: string;
  menuName: string;
  title: string;
  content: string;
  isActive: boolean;
}

// 업무도구 → 업무모듈 → 설정 → 엔터티설정 순
const CATEGORY_ORDER: Record<string, number> = {
  WORK_TOOL: 0,
  MODULE: 1,
  SETTINGS: 2,
  ENTITY_SETTINGS: 3,
};

const CATEGORY_LABELS: Record<string, string> = {
  WORK_TOOL: '업무도구',
  MODULE: '업무모듈',
  SETTINGS: '설정',
  ENTITY_SETTINGS: '엔터티 설정',
};

export default function MenuGuideTab() {
  const { t } = useTranslation(['settings', 'common']);
  const { guideUrl, manualUrl } = getManualLinks();

  // 법인 선택
  const entities = useEntityStore((s) => s.entities);
  const storeEntity = useEntityStore((s) => s.currentEntity);
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');

  useEffect(() => {
    if (!selectedEntityId) {
      const initial = storeEntity?.entityId ?? entities[0]?.entityId ?? '';
      if (initial) setSelectedEntityId(initial);
    }
  }, [storeEntity, entities]);

  const { data: menuConfigs, isLoading: configLoading } = useMenuConfigs();
  const { data: tips = [], isLoading: tipsLoading } = useMenuTips(selectedEntityId || undefined);
  const upsertTip = useUpsertMenuTip(selectedEntityId || undefined);

  const [editingTip, setEditingTip] = useState<EditingTip | null>(null);
  const [applyingDefaults, setApplyingDefaults] = useState(false);

  const tipMap = useMemo(() => {
    const map = new Map<string, MenuTipItem>();
    (tips as MenuTipItem[]).forEach((tip) => map.set(tip.menuCode, tip));
    return map;
  }, [tips]);

  const sortedMenus = useMemo(() => {
    const configs = (menuConfigs || []) as MenuConfigResponse[];
    return [...configs].sort((a, b) => {
      const orderA = CATEGORY_ORDER[a.category] ?? 99;
      const orderB = CATEGORY_ORDER[b.category] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.sortOrder - b.sortOrder;
    });
  }, [menuConfigs]);

  // 카테고리별 그룹핑
  const groupedMenus = useMemo(() => {
    const groups: { category: string; label: string; menus: MenuConfigResponse[] }[] = [];
    let current: { category: string; label: string; menus: MenuConfigResponse[] } | null = null;
    for (const menu of sortedMenus) {
      if (!current || current.category !== menu.category) {
        current = {
          category: menu.category,
          label: CATEGORY_LABELS[menu.category] ?? menu.category,
          menus: [],
        };
        groups.push(current);
      }
      current.menus.push(menu);
    }
    return groups;
  }, [sortedMenus]);

  const isLoading = configLoading || tipsLoading;

  const openEditModal = (menu: MenuConfigResponse) => {
    const existing = tipMap.get(menu.menuCode);
    const fallback = MENU_GUIDE_DEFAULTS[menu.menuCode];
    setEditingTip({
      menuCode: menu.menuCode,
      menuName: t(menu.labelKey, { defaultValue: menu.menuCode }),
      title: existing?.title || fallback?.title || t(menu.labelKey, { defaultValue: menu.menuCode }),
      content: existing?.content || fallback?.content || '',
      isActive: existing?.isActive ?? true,
    });
  };

  const handleSave = () => {
    if (!editingTip) return;
    upsertTip.mutate(
      {
        menuCode: editingTip.menuCode,
        title: editingTip.title,
        content: editingTip.content,
        is_active: editingTip.isActive,
      },
      { onSuccess: () => setEditingTip(null) },
    );
  };

  const applyDefaultGuides = async () => {
    const configs = (menuConfigs || []) as MenuConfigResponse[];
    setApplyingDefaults(true);
    try {
      for (const menu of configs) {
        const existing = tipMap.get(menu.menuCode);
        if (existing?.content?.trim()) continue;
        const fallback = MENU_GUIDE_DEFAULTS[menu.menuCode];
        if (!fallback) continue;
        await upsertTip.mutateAsync({
          menuCode: menu.menuCode,
          title: fallback.title,
          content: fallback.content,
          is_active: true,
        });
      }
    } finally {
      setApplyingDefaults(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings:permissions.menuGuide.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings:permissions.menuGuide.description')}
        </p>
      </div>

      {/* 법인 선택 */}
      {entities.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">
            {t('settings:permissions.menuGuide.entity', { defaultValue: '법인' })}
          </label>
          <select
            value={selectedEntityId}
            onChange={(e) => setSelectedEntityId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {entities.map((e) => (
              <option key={e.entityId} value={e.entityId}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-indigo-900">
          <BookOpen className="h-4 w-4" />
          {t('settings:permissions.menuGuide.officialDocs')}
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={guideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm text-indigo-700 shadow-sm ring-1 ring-indigo-100 hover:bg-indigo-100/40"
          >
            AMA-User-Guide-v1.html
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={manualUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm text-indigo-700 shadow-sm ring-1 ring-indigo-100 hover:bg-indigo-100/40"
          >
            AMA-User-Manual-v1.html
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-3">
          <button
            onClick={applyDefaultGuides}
            disabled={applyingDefaults}
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applyingDefaults && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('settings:permissions.menuGuide.applyDefaults')}
          </button>
        </div>
      </div>

      {/* 카테고리별 그룹 테이블 */}
      <div className="space-y-6">
        {groupedMenus.map((group) => (
          <div key={group.category} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {group.label}
              </span>
            </div>
            <table className="w-full">
              <tbody>
                {group.menus.map((menu, idx) => {
                  const tip = tipMap.get(menu.menuCode);
                  const hasContent = !!tip?.content?.trim();
                  return (
                    <tr key={menu.menuCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {t(menu.labelKey, { defaultValue: menu.menuCode })}
                        </div>
                        <div className="text-xs text-gray-400">{menu.menuCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        {hasContent ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                            {t('settings:permissions.menuGuide.completed')}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                            {t('settings:permissions.menuGuide.empty')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openEditModal(menu)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                        >
                          {hasContent ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {hasContent ? t('common:edit') : t('common:add')}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* 편집 모달 — 스크롤 지원 */}
      {editingTip && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/40"
          onClick={() => setEditingTip(null)}
        >
          <div className="flex min-h-full items-start justify-center px-4 py-8">
            <div
              className="w-full max-w-3xl rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="rounded-t-xl border-b border-gray-100 bg-white px-6 py-4">
                <h3 className="text-base font-semibold text-gray-900">
                  {t('settings:permissions.menuGuide.editTitle')} — {editingTip.menuName}
                </h3>
              </div>

              {/* 모달 바디 */}
              <div className="space-y-4 px-6 py-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('settings:permissions.menuGuide.fieldTitle')}
                  </label>
                  <input
                    value={editingTip.title}
                    onChange={(e) => setEditingTip({ ...editingTip, title: e.target.value })}
                    maxLength={200}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    {t('settings:permissions.menuGuide.fieldContent')}
                  </label>
                  <StaticEditor
                    content={editingTip.content}
                    onChange={(html) => setEditingTip({ ...editingTip, content: html })}
                    placeholder={t('settings:permissions.menuGuide.editorPlaceholder')}
                    minHeight={220}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t('settings:permissions.menuGuide.active')}</span>
                  <button
                    onClick={() => setEditingTip({ ...editingTip, isActive: !editingTip.isActive })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${editingTip.isActive ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${editingTip.isActive ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>

              {/* 모달 푸터 */}
              <div className="rounded-b-xl border-t border-gray-100 bg-white px-6 py-4 flex justify-end gap-2">
                <button
                  onClick={() => setEditingTip(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={upsertTip.isPending}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {upsertTip.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
