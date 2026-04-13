import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { CMS_MENU_TYPE } from '@amb/types';
import { useCreateMenu, useMenuTree } from '../hooks/useMenus';
import PageTypeSelector from './PageTypeSelector';

interface MenuCreateModalProps {
  open: boolean;
  onClose: () => void;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function MenuCreateModal({ open, onClose }: MenuCreateModalProps) {
  const { t } = useTranslation(['site', 'common']);
  const createMenuMutation = useCreateMenu();
  const { data: menuTree = [] } = useMenuTree();

  const [nameEn, setNameEn] = useState('');
  const [nameKo, setNameKo] = useState('');
  const [slug, setSlug] = useState('');
  const [parentId, setParentId] = useState('');
  const [menuType, setMenuType] = useState<string>(CMS_MENU_TYPE.INTERNAL);
  const [externalUrl, setExternalUrl] = useState('');
  const [pageType, setPageType] = useState('STATIC');
  const slugManuallyEdited = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // top-level menus only for parent selection
  const topLevelMenus = menuTree.filter((m) => m.parentId === null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setNameEn('');
      setNameKo('');
      setSlug('');
      setParentId('');
      setMenuType(CMS_MENU_TYPE.INTERNAL);
      setExternalUrl('');
      setPageType('STATIC');
      slugManuallyEdited.current = false;
    }
  }, [open]);

  // Auto-generate slug from name_en (debounced)
  const updateSlugFromName = useCallback((name: string) => {
    if (slugManuallyEdited.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSlug(toSlug(name));
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleNameEnChange = (value: string) => {
    setNameEn(value);
    updateSlugFromName(value);
  };

  const handleSlugChange = (value: string) => {
    slugManuallyEdited.current = true;
    setSlug(toSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !slug.trim()) return;

    try {
      await createMenuMutation.mutateAsync({
        name_en: nameEn.trim(),
        name_ko: nameKo.trim() || undefined,
        slug: slug.trim(),
        parent_id: parentId || null,
        menu_type: menuType,
        external_url: menuType === CMS_MENU_TYPE.EXTERNAL ? externalUrl.trim() : undefined,
        page_type: menuType === CMS_MENU_TYPE.INTERNAL ? pageType : undefined,
      });
      onClose();
    } catch {
      // Error handled by React Query
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('site:menu.addMenu')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          {/* Menu Name (EN) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('site:menu.menuNameEn')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => handleNameEnChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Menu Name (KO) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('site:menu.menuNameKo')}
            </label>
            <input
              type="text"
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* URL Slug */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('site:menu.slug')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="e.g. about-us"
              className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Parent Menu */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('site:menu.parentMenu')}
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{t('site:menu.noParent')}</option>
              {topLevelMenus.map((menu) => (
                <option key={menu.id} value={menu.id}>
                  {menu.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Menu Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('site:menu.type')}
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="menuType"
                  value={CMS_MENU_TYPE.INTERNAL}
                  checked={menuType === CMS_MENU_TYPE.INTERNAL}
                  onChange={(e) => setMenuType(e.target.value)}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {t('site:menu.internal')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="menuType"
                  value={CMS_MENU_TYPE.EXTERNAL}
                  checked={menuType === CMS_MENU_TYPE.EXTERNAL}
                  onChange={(e) => setMenuType(e.target.value)}
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                {t('site:menu.external')}
              </label>
            </div>
          </div>

          {/* External URL (conditional) */}
          {menuType === CMS_MENU_TYPE.EXTERNAL && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('site:menu.externalUrl')}
              </label>
              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          {/* Page Type (conditional) */}
          {menuType === CMS_MENU_TYPE.INTERNAL && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('site:menu.pageType')}
              </label>
              <p className="mb-2 text-xs text-gray-500">
                {t('site:menu.pageTypeNote')}
              </p>
              <PageTypeSelector value={pageType} onChange={setPageType} />
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              disabled={createMenuMutation.isPending || !nameEn.trim() || !slug.trim()}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {createMenuMutation.isPending ? '...' : t('common:create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
