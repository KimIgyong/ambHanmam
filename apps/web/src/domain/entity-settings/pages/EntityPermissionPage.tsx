import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Shield, Loader2, CheckCircle, XCircle, Info, Building2, Users, User,
  Plus, Trash2, UserPlus, MenuSquare, ArrowUp, ArrowDown, RotateCcw, Eye, EyeOff,
} from 'lucide-react';
import { useQueries } from '@tanstack/react-query';
import {
  useEntityMembers,
  useAvailableMenus,
  useSetMemberPermissions,
  useRemoveMemberPermission,
  useUnits,
  useSetUnitPermissions,
  useCells,
  useSetCellPermissions,
  useEntityMenuConfigs,
  useSetEntityMenuConfigs,
  useResetEntityMenuConfigs,
  entitySettingsKeys,
} from '../hooks/useEntitySettings';
import {
  entitySettingsService,
  type AvailableMenu,
} from '../service/entity-settings.service';

type PermissionTab = 'unit' | 'cell' | 'individual';
type MenuCategory = 'WORK_TOOL' | 'WORK_MODULE';

// 구분자: 유닛명/ID와 메뉴코드 합성 키용
const SEP = '\x1F';

export default function EntityPermissionPage() {
  const { t } = useTranslation(['entitySettings', 'common', 'settings']);
  const [activeTab, setActiveTab] = useState<PermissionTab | 'menu-management'>('menu-management');

  const tabs = [
    { key: 'menu-management' as const, labelKey: 'entitySettings:permissions.tabs.menuManagement', icon: MenuSquare },
    { key: 'unit' as const, labelKey: 'entitySettings:permissions.tabs.unit', icon: Building2 },
    { key: 'cell' as const, labelKey: 'entitySettings:permissions.tabs.cell', icon: Users },
    { key: 'individual' as const, labelKey: 'entitySettings:permissions.tabs.individual', icon: User },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Shield className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('entitySettings:permissions.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('entitySettings:permissions.subtitle')}
            </p>
          </div>
        </div>

        {/* Underline Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-6">
            {tabs.map(({ key, labelKey, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
              </button>
            ))}
          </nav>
        </div>

        {activeTab === 'menu-management' && <MenuManagementPanel />}
        {activeTab === 'unit' && <UnitPermissionPanel />}
        {activeTab === 'cell' && <CellPermissionPanel />}
        {activeTab === 'individual' && <IndividualPermissionPanel />}
      </div>
    </div>
  );
}

function MenuManagementPanel() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data: menus = [], isLoading } = useEntityMenuConfigs();
  const setConfigMutation = useSetEntityMenuConfigs();
  const resetConfigMutation = useResetEntityMenuConfigs();
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [localMenus, setLocalMenus] = useState<Array<AvailableMenu & {
    category: MenuCategory;
    sortOrder: number;
    visible: boolean;
  }>>([]);

  useEffect(() => {
    const sorted = [...menus]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((menu) => ({
        menuCode: menu.menuCode,
        label: menu.label,
        icon: menu.icon,
        path: menu.path,
        category: menu.category as MenuCategory,
        sortOrder: menu.sortOrder,
        visible: menu.visible,
      }));
    setLocalMenus(sorted);
  }, [menus]);

  const dirty = useMemo(() => {
    if (menus.length !== localMenus.length) return true;
    return localMenus.some((menu, index) => {
      const origin = menus[index];
      if (!origin) return true;
      return menu.menuCode !== origin.menuCode || menu.category !== origin.category || menu.sortOrder !== origin.sortOrder || menu.visible !== origin.visible;
    });
  }, [localMenus, menus]);

  const moveRow = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= localMenus.length) return;
    setLocalMenus((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy.map((item, idx) => ({ ...item, sortOrder: idx + 1 }));
    });
  };

  const changeCategory = (index: number, category: MenuCategory) => {
    setLocalMenus((prev) => prev.map((row, idx) => (idx === index ? { ...row, category } : row)));
  };

  const toggleVisible = (index: number) => {
    setLocalMenus((prev) => prev.map((row, idx) => (idx === index ? { ...row, visible: !row.visible } : row)));
  };

  const handleSave = async () => {
    setStatus(null);
    try {
      await setConfigMutation.mutateAsync({
        configs: localMenus.map((menu, idx) => ({
          menu_code: menu.menuCode,
          category: menu.category,
          sort_order: idx + 1,
          visible: menu.visible,
        })),
      });
      setStatus({ type: 'success', text: t('entitySettings:permissions.saveSuccess') });
    } catch {
      setStatus({ type: 'error', text: t('common:errors.E8003', { defaultValue: '저장에 실패했습니다' }) });
    }
  };

  const handleReset = async () => {
    setStatus(null);
    try {
      await resetConfigMutation.mutateAsync();
      setStatus({ type: 'success', text: t('entitySettings:permissions.resetSuccess') });
    } catch {
      setStatus({ type: 'error', text: t('common:errors.E8003', { defaultValue: '초기화에 실패했습니다' }) });
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center">
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-500">{t('common:loading')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm text-indigo-700">
        {t('entitySettings:permissions.menuManagementHint')}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">#</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('entitySettings:permissions.menu')}</th>
              <th className="px-3 py-2 text-center font-semibold text-gray-600">{t('entitySettings:permissions.visible')}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('entitySettings:permissions.category')}</th>
              <th className="px-3 py-2 text-left font-semibold text-gray-600">{t('entitySettings:permissions.order')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {localMenus.map((menu, index) => (
              <tr key={menu.menuCode} className={menu.visible ? '' : 'opacity-50'}>
                <td className="px-3 py-3 text-gray-500">{index + 1}</td>
                <td className="px-3 py-3">
                  <div className="font-medium text-gray-800">{t(menu.label, { defaultValue: menu.menuCode })}</div>
                  <div className="text-xs text-gray-400">{menu.menuCode}</div>
                </td>
                <td className="px-3 py-3 text-center">
                  <button
                    type="button"
                    onClick={() => toggleVisible(index)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                      menu.visible
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {menu.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {menu.visible ? t('entitySettings:permissions.shown') : t('entitySettings:permissions.hidden')}
                  </button>
                </td>
                <td className="px-3 py-3">
                  <select
                    value={menu.category}
                    onChange={(e) => changeCategory(index, e.target.value as MenuCategory)}
                    className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  >
                    <option value="WORK_TOOL">{t('entitySettings:permissions.categories.workTool')}</option>
                    <option value="WORK_MODULE">{t('entitySettings:permissions.categories.workModule')}</option>
                  </select>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveRow(index, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-gray-300 p-1.5 text-gray-600 disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveRow(index, 1)}
                      disabled={index === localMenus.length - 1}
                      className="rounded-md border border-gray-300 p-1.5 text-gray-600 disabled:opacity-40"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {status ? (
          <p className={`text-sm ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {status.text}
          </p>
        ) : <span />}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={resetConfigMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            {t('entitySettings:permissions.reset')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || setConfigMutation.isPending}
            className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {setConfigMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Unit Permission Panel ─── */

function UnitPermissionPanel() {
  const { t } = useTranslation(['entitySettings', 'common', 'settings']);
  const { data: availableMenus, isLoading: menusLoading } = useAvailableMenus();
  const { data: units, isLoading: unitsLoading } = useUnits();
  const setPermsMutation = useSetUnitPermissions();

  const unitPermQueries = useQueries({
    queries: (units ?? []).map((u) => ({
      queryKey: entitySettingsKeys.unitPermissions(u.unitName),
      queryFn: () => entitySettingsService.getUnitPermissions(u.unitName),
    })),
  });

  const allLoaded =
    !menusLoading &&
    !unitsLoading &&
    (units?.length === 0 || unitPermQueries.every((q) => !q.isPending));

  const dataKey = unitPermQueries.map((q) => q.dataUpdatedAt ?? 0).join(',');

  const serverState = useMemo(() => {
    const state: Record<string, boolean> = {};
    (units ?? []).forEach((u, idx) => {
      unitPermQueries[idx]?.data?.forEach((p) => {
        state[`${u.unitName}${SEP}${p.menuCode}`] = p.accessible;
      });
    });
    return state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, units]);

  const [localState, setLocalState] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (allLoaded) setLocalState(serverState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, allLoaded]);

  const dirty = useMemo(
    () => JSON.stringify(localState) !== JSON.stringify(serverState),
    [localState, serverState],
  );

  const handleToggle = useCallback((colId: string, menuCode: string) => {
    setLocalState((prev) => ({ ...prev, [`${colId}${SEP}${menuCode}`]: !prev[`${colId}${SEP}${menuCode}`] }));
  }, []);

  const handleSave = async () => {
    if (!units || !availableMenus) return;
    setStatus(null);
    try {
      const changedUnits = units.filter((u) =>
        availableMenus.some((m) => {
          const k = `${u.unitName}${SEP}${m.menuCode}`;
          return localState[k] !== serverState[k];
        }),
      );
      await Promise.all(
        changedUnits.map((u) =>
          setPermsMutation.mutateAsync({
            unitName: u.unitName,
            dto: {
              permissions: availableMenus.map((m) => ({
                menu_code: m.menuCode,
                accessible: !!localState[`${u.unitName}${SEP}${m.menuCode}`],
              })),
            },
          }),
        ),
      );
      setStatus({ type: 'success', text: t('entitySettings:permissions.saveSuccess') });
    } catch {
      setStatus({ type: 'error', text: t('common:errors.E8003', { defaultValue: '저장에 실패했습니다' }) });
    }
  };

  const columns = (units ?? []).map((u) => ({
    id: u.unitName,
    label: u.unitName,
    sublabel: t('entitySettings:permissions.memberCount', { count: u.memberCount }),
  }));

  return (
    <PermissionMatrixPanel
      columns={columns}
      availableMenus={availableMenus ?? []}
      localState={localState}
      onToggle={handleToggle}
      onSave={handleSave}
      isLoading={!allLoaded}
      isSaving={setPermsMutation.isPending}
      dirty={dirty}
      status={status}
      emptyColumnsMessage={t('entitySettings:permissions.noUnits')}
    />
  );
}

/* ─── Cell Permission Panel ─── */

function CellPermissionPanel() {
  const { t } = useTranslation(['entitySettings', 'common', 'settings']);
  const { data: availableMenus, isLoading: menusLoading } = useAvailableMenus();
  const { data: cells, isLoading: cellsLoading } = useCells();
  const setPermsMutation = useSetCellPermissions();

  const cellPermQueries = useQueries({
    queries: (cells ?? []).map((c) => ({
      queryKey: entitySettingsKeys.cellPermissions(c.cellId),
      queryFn: () => entitySettingsService.getCellPermissions(c.cellId),
    })),
  });

  const allLoaded =
    !menusLoading &&
    !cellsLoading &&
    (cells?.length === 0 || cellPermQueries.every((q) => !q.isPending));

  const dataKey = cellPermQueries.map((q) => q.dataUpdatedAt ?? 0).join(',');

  const serverState = useMemo(() => {
    const state: Record<string, boolean> = {};
    (cells ?? []).forEach((c, idx) => {
      cellPermQueries[idx]?.data?.forEach((p) => {
        state[`${c.cellId}${SEP}${p.menuCode}`] = p.accessible;
      });
    });
    return state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, cells]);

  const [localState, setLocalState] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (allLoaded) setLocalState(serverState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, allLoaded]);

  const dirty = useMemo(
    () => JSON.stringify(localState) !== JSON.stringify(serverState),
    [localState, serverState],
  );

  const handleToggle = useCallback((colId: string, menuCode: string) => {
    setLocalState((prev) => ({ ...prev, [`${colId}${SEP}${menuCode}`]: !prev[`${colId}${SEP}${menuCode}`] }));
  }, []);

  const handleSave = async () => {
    if (!cells || !availableMenus) return;
    setStatus(null);
    try {
      const changedCells = cells.filter((c) =>
        availableMenus.some((m) => {
          const k = `${c.cellId}${SEP}${m.menuCode}`;
          return localState[k] !== serverState[k];
        }),
      );
      await Promise.all(
        changedCells.map((c) =>
          setPermsMutation.mutateAsync({
            cellId: c.cellId,
            dto: {
              permissions: availableMenus.map((m) => ({
                menu_code: m.menuCode,
                accessible: !!localState[`${c.cellId}${SEP}${m.menuCode}`],
              })),
            },
          }),
        ),
      );
      setStatus({ type: 'success', text: t('entitySettings:permissions.saveSuccess') });
    } catch {
      setStatus({ type: 'error', text: t('common:errors.E8003', { defaultValue: '저장에 실패했습니다' }) });
    }
  };

  const columns = (cells ?? []).map((c) => ({
    id: c.cellId,
    label: c.cellName,
    sublabel: c.description ?? undefined,
  }));

  return (
    <PermissionMatrixPanel
      columns={columns}
      availableMenus={availableMenus ?? []}
      localState={localState}
      onToggle={handleToggle}
      onSave={handleSave}
      isLoading={!allLoaded}
      isSaving={setPermsMutation.isPending}
      dirty={dirty}
      status={status}
      emptyColumnsMessage={t('entitySettings:permissions.noCells')}
    />
  );
}

/* ─── Individual Permission Panel ─── */

function IndividualPermissionPanel() {
  const { t } = useTranslation(['entitySettings', 'common', 'settings']);
  const { data: members, isLoading: membersLoading } = useEntityMembers();
  const { data: availableMenus, isLoading: menusLoading } = useAvailableMenus();
  const setPermsMutation = useSetMemberPermissions();
  const removeMutation = useRemoveMemberPermission();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMenuCode, setSelectedMenuCode] = useState('');
  const [selectedAccessible, setSelectedAccessible] = useState(true);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const editableMembers = useMemo(
    () => members?.filter((m) => m.levelCode === 'USER_LEVEL' && m.role !== 'MASTER') ?? [],
    [members],
  );

  const memberPermQueries = useQueries({
    queries: editableMembers.map((m) => ({
      queryKey: entitySettingsKeys.memberPermissions(m.userId),
      queryFn: () => entitySettingsService.getMemberPermissions(m.userId),
    })),
  });

  const allLoaded =
    !menusLoading &&
    !membersLoading &&
    (editableMembers.length === 0 || memberPermQueries.every((q) => !q.isPending));

  const dataKey = memberPermQueries.map((q) => q.dataUpdatedAt ?? 0).join(',');

  // Flatten: 각 멤버의 오버라이드 권한을 하나의 리스트로
  const flatPerms = useMemo(() => {
    const list: {
      userId: string;
      userName: string;
      userRole: string;
      menuCode: string;
      accessible: boolean;
    }[] = [];
    editableMembers.forEach((m, idx) => {
      const perms = memberPermQueries[idx]?.data ?? [];
      perms.forEach((p) => {
        list.push({
          userId: m.userId,
          userName: m.name,
          userRole: m.role,
          menuCode: p.menuCode,
          accessible: p.accessible,
        });
      });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataKey, editableMembers]);

  const getMenuLabel = useCallback(
    (menuCode: string) => {
      const menu = availableMenus?.find((m) => m.menuCode === menuCode);
      if (menu) return t(menu.label, { defaultValue: menuCode });
      return menuCode;
    },
    [availableMenus, t],
  );

  const handleAdd = async () => {
    if (!selectedUserId || !selectedMenuCode) return;
    setStatus(null);
    try {
      await setPermsMutation.mutateAsync({
        userId: selectedUserId,
        dto: { permissions: [{ menu_code: selectedMenuCode, accessible: selectedAccessible }] },
      });
      setStatus({ type: 'success', text: t('entitySettings:permissions.saveSuccess') });
      setShowAddForm(false);
      setSelectedUserId('');
      setSelectedMenuCode('');
      setSelectedAccessible(true);
    } catch {
      setStatus({ type: 'error', text: t('common:errors.E8003', { defaultValue: '저장에 실패했습니다' }) });
    }
  };

  const handleRemove = async (userId: string, menuCode: string) => {
    if (!window.confirm(t('settings:permissions.userPermissions.deleteConfirm'))) return;
    setStatus(null);
    try {
      await removeMutation.mutateAsync({ userId, menuCode });
      setStatus({ type: 'success', text: t('entitySettings:permissions.saveSuccess') });
    } catch {
      setStatus({ type: 'error', text: t('common:errors.E8003', { defaultValue: '저장에 실패했습니다' }) });
    }
  };

  if (!allLoaded) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const enabledMenus = availableMenus ?? [];

  return (
    <div>
      {/* Header + 추가 버튼 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {t('settings:permissions.userPermissions.title')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('settings:permissions.userPermissions.description')}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('settings:permissions.userPermissions.addPermission')}
        </button>
      </div>

      {/* 상태 메시지 */}
      {status && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {status.text}
        </div>
      )}

      {/* 안내 */}
      <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <Info className="h-4 w-4 shrink-0" />
        {t('settings:permissions.userPermissions.overrideNote')}
      </div>

      {/* 권한 추가 폼 */}
      {showAddForm && (
        <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            <h4 className="text-sm font-semibold text-gray-900">
              {t('settings:permissions.userPermissions.addPermission')}
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('settings:permissions.userPermissions.selectUser')}
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
              >
                <option value="">--</option>
                {editableMembers.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} ({t(`settings:permissions.roles.${m.role}`, { defaultValue: m.role })})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('settings:permissions.userPermissions.selectMenu')}
              </label>
              <select
                value={selectedMenuCode}
                onChange={(e) => setSelectedMenuCode(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
              >
                <option value="">--</option>
                {enabledMenus.map((m) => (
                  <option key={m.menuCode} value={m.menuCode}>
                    {t(m.label, { defaultValue: m.menuCode })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {t('settings:permissions.userPermissions.setting')}
              </label>
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="accessible"
                    checked={selectedAccessible}
                    onChange={() => setSelectedAccessible(true)}
                    className="text-indigo-600"
                  />
                  {t('settings:permissions.userPermissions.allowed')}
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="accessible"
                    checked={!selectedAccessible}
                    onChange={() => setSelectedAccessible(false)}
                    className="text-red-600"
                  />
                  {t('settings:permissions.userPermissions.blocked')}
                </label>
              </div>
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              onClick={handleAdd}
              disabled={!selectedUserId || !selectedMenuCode || setPermsMutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {setPermsMutation.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              {t('common:save')}
            </button>
          </div>
        </div>
      )}

      {/* 권한 목록 테이블 */}
      {flatPerms.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <UserPlus className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm font-medium text-gray-600">
            {t('settings:permissions.userPermissions.noPermissions')}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('settings:permissions.userPermissions.noPermissionsDesc')}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  {t('settings:permissions.userPermissions.user')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  {t('settings:permissions.role')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                  {t('settings:permissions.userPermissions.menuLabel')}
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  {t('settings:permissions.userPermissions.setting')}
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {flatPerms.map((perm, idx) => (
                <tr
                  key={`${perm.userId}-${perm.menuCode}`}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {perm.userName}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {t(`settings:permissions.roles.${perm.userRole}`, { defaultValue: perm.userRole })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {getMenuLabel(perm.menuCode)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        perm.accessible
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {perm.accessible
                        ? t('settings:permissions.userPermissions.allowed')
                        : t('settings:permissions.userPermissions.blocked')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemove(perm.userId, perm.menuCode)}
                      disabled={removeMutation.isPending}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title={t('common:delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Matrix Table Component ─── */

interface Column {
  id: string;
  label: string;
  sublabel?: string;
}

interface PermissionMatrixPanelProps {
  columns: Column[];
  availableMenus: AvailableMenu[];
  localState: Record<string, boolean>;
  onToggle: (colId: string, menuCode: string) => void;
  onSave: () => void;
  isLoading: boolean;
  isSaving: boolean;
  dirty: boolean;
  status: { type: 'success' | 'error'; text: string } | null;
  emptyColumnsMessage: string;
}

function PermissionMatrixPanel({
  columns,
  availableMenus,
  localState,
  onToggle,
  onSave,
  isLoading,
  isSaving,
  dirty,
  status,
  emptyColumnsMessage,
}: PermissionMatrixPanelProps) {
  const { t } = useTranslation(['entitySettings', 'common', 'settings']);

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <p className="text-sm text-gray-400">{emptyColumnsMessage}</p>
      </div>
    );
  }

  // 카테고리별 메뉴 그룹화
  const grouped: Record<string, AvailableMenu[]> = {};
  availableMenus.forEach((m) => {
    const cat = m.category || 'OTHER';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(m);
  });

  const categoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      WORK_TOOL: t('settings:permissions.workToolMenus'),
      MODULE: t('settings:permissions.moduleMenus'),
      SETTINGS: t('settings:permissions.settingsMenus'),
    };
    return map[cat] ?? cat;
  };

  return (
    <div>
      {/* Info */}
      <div className="mb-4 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          {t('settings:permissions.rolePermissions.disabledMenuNote', {
            defaultValue: '토글을 켜면 해당 대상이 메뉴에 접근할 수 있습니다.',
          })}
        </span>
      </div>

      {/* Status message */}
      {status && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
            status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {status.text}
        </div>
      )}

      {/* Category sections */}
      {Object.entries(grouped).map(([cat, menus]) => (
        <div key={cat} className="mb-6">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {categoryLabel(cat)}
          </h4>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="sticky left-0 z-10 w-44 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {t('entitySettings:permissions.menuCode')}
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-500"
                    >
                      <div className="whitespace-nowrap">{col.label}</div>
                      {col.sublabel && (
                        <div className="font-normal normal-case text-gray-400 truncate max-w-32">{col.sublabel}</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {menus.map((menu, idx) => (
                  <tr key={menu.menuCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <td
                      className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-gray-900"
                      style={{ backgroundColor: idx % 2 === 0 ? 'white' : 'rgb(249 250 251 / 0.5)' }}
                    >
                      {t(menu.label, { defaultValue: menu.menuCode })}
                    </td>
                    {columns.map((col) => {
                      const checked = !!localState[`${col.id}${SEP}${menu.menuCode}`];
                      return (
                        <td key={col.id} className="px-3 py-3 text-center">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={checked}
                            onClick={() => onToggle(col.id, menu.menuCode)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                              checked ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                checked ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Save */}
      <div className="flex items-center justify-end gap-4">
        <button
          onClick={onSave}
          disabled={!dirty || isSaving}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
        >
          {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
          {t('common:save')}
        </button>
      </div>
    </div>
  );
}
