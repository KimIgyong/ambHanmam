import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle, GripVertical, AlertTriangle } from 'lucide-react';
import { MenuConfigResponse } from '@amb/types';
import { useMenuConfigs, useUpdateMenuConfigs } from '../hooks/useMenuPermissions';

interface LocalConfig {
  menu_code: string;
  enabled: boolean;
  sort_order: number;
  labelKey: string;
  icon: string;
  path: string;
  category: string;
}

export default function MenuConfigTab() {
  const { t } = useTranslation(['settings', 'common']);
  const { data: configs, isLoading } = useMenuConfigs();
  const updateMutation = useUpdateMenuConfigs();

  const [localConfigs, setLocalConfigs] = useState<LocalConfig[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (configs) {
      setLocalConfigs(
        configs.map((c: MenuConfigResponse) => ({
          menu_code: c.menuCode,
          enabled: c.enabled,
          sort_order: c.sortOrder,
          labelKey: c.labelKey,
          icon: c.icon,
          path: c.path,
          category: c.category,
        })),
      );
    }
  }, [configs]);

  const handleToggle = (menuCode: string) => {
    if (menuCode === 'SETTINGS_PERMISSIONS') {
      const current = localConfigs.find((c) => c.menu_code === menuCode);
      if (current?.enabled) {
        if (!window.confirm(t('settings:permissions.menuConfig.protectWarning'))) return;
      }
    }
    setLocalConfigs((prev) =>
      prev.map((c) =>
        c.menu_code === menuCode ? { ...c, enabled: !c.enabled } : c,
      ),
    );
  };

  const handleSortOrderChange = (menuCode: string, value: string) => {
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    setLocalConfigs((prev) =>
      prev.map((c) =>
        c.menu_code === menuCode ? { ...c, sort_order: num } : c,
      ),
    );
  };

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      await updateMutation.mutateAsync({
        configs: localConfigs.map((c) => ({
          menu_code: c.menu_code,
          enabled: c.enabled,
          sort_order: c.sort_order,
        })),
      });
      setStatusMessage({
        type: 'success',
        text: t('settings:permissions.saveSuccess'),
      });
    } catch {
      setStatusMessage({ type: 'error', text: t('common:errors.E8003') });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const categories = [
    { key: 'WORK_TOOL', label: t('settings:permissions.workToolMenus') },
    { key: 'MODULE', label: t('settings:permissions.moduleMenus') },
    { key: 'SETTINGS', label: t('settings:permissions.settingsMenus') },
  ];

  const sortedConfigs = [...localConfigs].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings:permissions.menuConfig.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings:permissions.menuConfig.description')}
        </p>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
            statusMessage.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {statusMessage.text}
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        {t('settings:permissions.menuConfig.disabledNote')}
      </div>

      {categories.map(({ key, label }) => {
        const items = sortedConfigs.filter((c) => c.category === key);
        if (items.length === 0) return null;

        return (
          <div key={key} className="mb-6">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {label}
            </h4>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="w-8 px-2 py-2" />
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                      {t('settings:permissions.menuConfig.sortOrder')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                      {t('settings:permissions.menuConfig.menuName')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                      {t('settings:permissions.menuConfig.icon')}
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">
                      {t('settings:permissions.menuConfig.path')}
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase">
                      {t('settings:permissions.menuConfig.enabled')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((config, idx) => (
                    <tr
                      key={config.menu_code}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${
                        !config.enabled ? 'opacity-40' : ''
                      }`}
                    >
                      <td className="px-2 py-2 text-center">
                        <GripVertical className="mx-auto h-4 w-4 text-gray-300" />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={config.sort_order}
                          onChange={(e) =>
                            handleSortOrderChange(config.menu_code, e.target.value)
                          }
                          className="w-20 rounded border border-gray-200 px-2 py-1 text-sm text-center focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {t(config.labelKey, { defaultValue: config.menu_code })}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500">
                        {config.icon}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                        {config.path}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={config.enabled}
                          onClick={() => handleToggle(config.menu_code)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            config.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              config.enabled ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('common:save')}
        </button>
      </div>
    </div>
  );
}
