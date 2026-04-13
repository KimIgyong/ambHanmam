import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, CheckCircle, XCircle, Info, Lock, Building2 } from 'lucide-react';
import { MenuPermissionResponse, MenuConfigResponse, CellResponse } from '@amb/types';
import {
  useMenuPermissionList,
  useUpdateMenuPermissions,
  useMenuConfigs,
  useMenuGroupPermissions,
  useUpdateMenuGroupPermissions,
} from '../hooks/useMenuPermissions';
import { useCellList } from '@/domain/members/hooks/useCells';
import { useEntityStore } from '@/domain/hr/store/entity.store';

type LevelTab = 'ADMIN_LEVEL' | 'USER_LEVEL';

// Admin Level: 잠금 (전체 접근, 수정 불가)
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;
// User Level: 수정 가능
const USER_ROLES = ['MANAGER', 'MEMBER', 'VIEWER'] as const;

interface PermissionState {
  [key: string]: boolean;
}

export default function RolePermissionTab() {
  const { t } = useTranslation(['settings', 'common', 'units']);
  const { data: permissions, isLoading: permLoading } = useMenuPermissionList();
  const { data: menuConfigs, isLoading: configLoading } = useMenuConfigs();
  const { data: groups, isLoading: groupsLoading } = useCellList({ allEntities: true });
  const { data: groupPerms, isLoading: groupPermsLoading } = useMenuGroupPermissions();
  const updateMutation = useUpdateMenuPermissions();
  const updateGroupMutation = useUpdateMenuGroupPermissions();
  const entities = useEntityStore((s) => s.entities);

  const [activeLevel, setActiveLevel] = useState<LevelTab>('USER_LEVEL');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('all');
  const [localState, setLocalState] = useState<PermissionState>({});
  const [groupPermState, setGroupPermState] = useState<PermissionState>({});
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (permissions) {
      const state: PermissionState = {};
      permissions.forEach((p: MenuPermissionResponse) => {
        state[`${p.menuCode}_${p.role}`] = p.accessible;
      });
      setLocalState(state);
    }
  }, [permissions]);

  useEffect(() => {
    if (groupPerms) {
      const state: PermissionState = {};
      groupPerms.forEach((gp) => {
        state[`${gp.menuCode}_${gp.celId}`] = gp.accessible;
      });
      setGroupPermState(state);
    }
  }, [groupPerms]);

  // Sort cells by entity name
  const sortedGroups = useMemo(() => {
    if (!groups) return [];
    let filtered = [...groups];
    // Filter by selected entity
    if (selectedEntityId !== 'all') {
      filtered = filtered.filter((g: CellResponse) => g.entityId === selectedEntityId);
    }
    return filtered.sort((a: CellResponse, b: CellResponse) => {
      const entityA = a.entityName || '';
      const entityB = b.entityName || '';
      if (entityA !== entityB) return entityA.localeCompare(entityB);
      return a.name.localeCompare(b.name);
    });
  }, [groups, selectedEntityId]);

  // Get unique entities from groups for the selector
  const groupEntities = useMemo(() => {
    if (!groups) return [];
    const entityMap = new Map<string, { entityId: string; entityName: string; entityCode: string }>();
    groups.forEach((g: CellResponse) => {
      if (g.entityId && g.entityName && !entityMap.has(g.entityId)) {
        entityMap.set(g.entityId, {
          entityId: g.entityId,
          entityName: g.entityName,
          entityCode: g.entityCode || '',
        });
      }
    });
    // Also add entities from store that might not have groups yet
    entities.forEach((e) => {
      if (!entityMap.has(e.entityId)) {
        entityMap.set(e.entityId, {
          entityId: e.entityId,
          entityName: e.name,
          entityCode: e.code || '',
        });
      }
    });
    return Array.from(entityMap.values()).sort((a, b) => a.entityName.localeCompare(b.entityName));
  }, [groups, entities]);

  const getMenuDisplayName = useCallback(
    (menuCode: string): string => {
      if (menuCode.startsWith('CHAT_')) {
        const deptCode = menuCode.replace('CHAT_', '');
        return t(`units:${deptCode}.name`, { defaultValue: deptCode });
      }
      const config = menuConfigs?.find((c: MenuConfigResponse) => c.menuCode === menuCode);
      if (config) return t(config.labelKey, { defaultValue: menuCode });
      return menuCode;
    },
    [t, menuConfigs],
  );

  const handleToggle = (menuCode: string, role: string) => {
    const key = `${menuCode}_${role}`;
    setLocalState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCellToggle = (menuCode: string, celId: string) => {
    const key = `${menuCode}_${celId}`;
    setGroupPermState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setStatusMessage(null);
    const changedPermissions: Array<{
      menu_code: string;
      role: string;
      accessible: boolean;
    }> = [];

    const knownRoles = [...ADMIN_ROLES, ...USER_ROLES];
    Object.entries(localState).forEach(([key, accessible]) => {
      const role = knownRoles.find((r) => key.endsWith(`_${r}`));
      if (role) {
        const menuCode = key.slice(0, key.length - role.length - 1);
        changedPermissions.push({ menu_code: menuCode, role, accessible });
      }
    });

    // Build group permission changes
    const groupPermChanges: Array<{
      menu_code: string;
      cel_id: string;
      accessible: boolean;
    }> = [];
    Object.entries(groupPermState).forEach(([key, accessible]) => {
      // key format: MENU_CODE_celId (UUID with hyphens)
      // UUID pattern: find the celId by matching UUID at the end
      const uuidMatch = key.match(/^(.+)_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
      if (uuidMatch) {
        groupPermChanges.push({
          menu_code: uuidMatch[1],
          cel_id: uuidMatch[2],
          accessible,
        });
      }
    });

    try {
      const promises: Promise<unknown>[] = [
        updateMutation.mutateAsync({ permissions: changedPermissions }),
      ];
      if (groupPermChanges.length > 0) {
        promises.push(updateGroupMutation.mutateAsync({ permissions: groupPermChanges }));
      }
      await Promise.all(promises);
      setStatusMessage({ type: 'success', text: t('settings:permissions.saveSuccess') });
    } catch {
      setStatusMessage({ type: 'error', text: t('common:errors.E8003') });
    }
  };

  if (permLoading || configLoading || groupsLoading || groupPermsLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const enabledMenuCodes = new Set(
    (menuConfigs || [])
      .filter((c: MenuConfigResponse) => c.enabled)
      .map((c: MenuConfigResponse) => c.menuCode),
  );

  // 구현된 채팅 에이전트만 노출 (CHAT_MANAGEMENT 기본 + 전용 AI 에이전트가 있는 부서)
  // CHAT 메뉴는 Role Permissions에서 숨김 (별도 관리)
  const chatMenuCodes: string[] = [];
  const settingsMenuCodes = [
    'SETTINGS_MEMBERS', 'SETTINGS_API_KEYS', 'SETTINGS_SMTP',
    'SETTINGS_PERMISSIONS', 'SETTINGS_DRIVE', 'SETTINGS_ENTITIES',
  ];
  const workToolMenuCodes = (menuConfigs || [])
    .filter((c: MenuConfigResponse) => c.category === 'WORK_TOOL' && c.enabled)
    .sort((a: MenuConfigResponse, b: MenuConfigResponse) => a.sortOrder - b.sortOrder)
    .map((c: MenuConfigResponse) => c.menuCode);
  const moduleMenuCodes = (menuConfigs || [])
    .filter((c: MenuConfigResponse) => c.category === 'MODULE' && c.enabled)
    .sort((a: MenuConfigResponse, b: MenuConfigResponse) => a.sortOrder - b.sortOrder)
    .map((c: MenuConfigResponse) => c.menuCode);

  const isVisible = (code: string) =>
    enabledMenuCodes.has(code) || code.startsWith('CHAT_') || code.startsWith('SETTINGS_');

  const renderRoleHeader = (roles: readonly string[]) => (
    <tr className="border-b border-gray-100 bg-gray-50">
      <th className="w-48 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
        {t('settings:permissions.menu')}
      </th>
      {roles.map((role) => (
        <th key={role} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
          <div>{t(`settings:permissions.roles.${role}`, { defaultValue: role })}</div>
          <div className="font-normal normal-case text-gray-400">{role}</div>
        </th>
      ))}
    </tr>
  );

  /** ADMIN_LEVEL 테이블: 전체 ON + disabled */
  const renderAdminTable = (menuCodes: string[], sectionTitle: string) => {
    const visibleCodes = menuCodes.filter(isVisible);
    if (visibleCodes.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{sectionTitle}</h4>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>{renderRoleHeader(ADMIN_ROLES)}</thead>
            <tbody>
              {visibleCodes.map((menuCode, idx) => (
                <tr key={menuCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{getMenuDisplayName(menuCode)}</td>
                  {ADMIN_ROLES.map((role) => (
                    <td key={role} className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          disabled
                          className="relative inline-flex h-5 w-9 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent bg-indigo-400 opacity-70 transition-colors"
                        >
                          <span className="pointer-events-none inline-block h-4 w-4 translate-x-4 transform rounded-full bg-white shadow ring-0 transition duration-200" />
                        </button>
                        <Lock className="h-3 w-3 text-gray-400" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /** USER_LEVEL 테이블: MANAGER / MEMBER / VIEWER 토글 + 그룹 체크박스 */
  const renderUserTable = (menuCodes: string[], sectionTitle: string) => {
    const visibleCodes = menuCodes.filter(isVisible);
    if (visibleCodes.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">{sectionTitle}</h4>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="sticky left-0 z-10 w-48 bg-gray-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t('settings:permissions.menu')}
                </th>
                {USER_ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <div>{t(`settings:permissions.roles.${role}`, { defaultValue: role })}</div>
                    <div className="font-normal normal-case text-gray-400">{role}</div>
                  </th>
                ))}
                {sortedGroups.length > 0 && (
                  <th className="border-l border-gray-200 px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-indigo-500">
                    |
                  </th>
                )}
                {sortedGroups.map((group: CellResponse) => (
                  <th key={group.cellId} className="px-3 py-3 text-center text-xs font-semibold tracking-wider text-gray-500">
                    <div className="whitespace-nowrap">{group.name}</div>
                    {group.entityCode && (
                      <div className="font-normal normal-case text-gray-400">[{group.entityCode}]</div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleCodes.map((menuCode, idx) => (
                <tr key={menuCode} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-gray-900" style={{ backgroundColor: idx % 2 === 0 ? 'white' : 'rgb(249 250 251 / 0.5)' }}>
                    {getMenuDisplayName(menuCode)}
                  </td>
                  {USER_ROLES.map((role) => {
                    const key = `${menuCode}_${role}`;
                    const checked = localState[key] ?? false;
                    return (
                      <td key={role} className="px-4 py-3 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          onClick={() => handleToggle(menuCode, role)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`}
                          />
                        </button>
                      </td>
                    );
                  })}
                  {sortedGroups.length > 0 && (
                    <td className="border-l border-gray-200 px-2 py-3" />
                  )}
                  {sortedGroups.map((group: CellResponse) => {
                    const gKey = `${menuCode}_${group.cellId}`;
                    const gChecked = groupPermState[gKey] ?? false;
                    return (
                      <td key={group.cellId} className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={gChecked}
                          onChange={() => handleCellToggle(menuCode, group.cellId)}
                          className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          {t('settings:permissions.rolePermissions.title')}
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings:permissions.rolePermissions.description')}
        </p>
      </div>

      {/* 그룹 서브탭 */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-6">
          {(['ADMIN_LEVEL', 'USER_LEVEL'] as LevelTab[]).map((level) => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`border-b-2 px-1 py-3 text-sm font-medium transition-colors ${
                activeLevel === level
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {t(`settings:permissions.groups.${level}`, { defaultValue: level })}
            </button>
          ))}
        </nav>
      </div>

      {/* 상태 메시지 */}
      {statusMessage && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
            statusMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
          {statusMessage.text}
        </div>
      )}

      {/* ADMIN_LEVEL 탭 */}
      {activeLevel === 'ADMIN_LEVEL' && (
        <>
          <div className="mb-5 flex items-start gap-2 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{t('settings:permissions.adminGroupNote')}</span>
          </div>
          {renderAdminTable(chatMenuCodes, t('settings:permissions.chatMenus'))}
          {renderAdminTable(workToolMenuCodes, t('settings:permissions.workToolMenus'))}
          {renderAdminTable(moduleMenuCodes, t('settings:permissions.moduleMenus'))}
          {renderAdminTable(settingsMenuCodes, t('settings:permissions.settingsMenus'))}
        </>
      )}

      {/* USER_LEVEL 탭 */}
      {activeLevel === 'USER_LEVEL' && (
        <>
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            <Info className="h-4 w-4 shrink-0" />
            {t('settings:permissions.rolePermissions.disabledMenuNote')}
          </div>

          {/* 법인 선택 필터 */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Building2 className="h-4 w-4" />
              {t('settings:permissions.entityFilter', { defaultValue: '법인 선택' })}
            </div>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">
                {t('settings:permissions.allEntities', { defaultValue: '전체 법인' })}
              </option>
              {groupEntities.map((entity) => (
                <option key={entity.entityId} value={entity.entityId}>
                  {entity.entityName} {entity.entityCode ? `[${entity.entityCode}]` : ''}
                </option>
              ))}
            </select>
            {selectedEntityId !== 'all' && (
              <span className="text-xs text-gray-500">
                {t('settings:permissions.filteredGroupCount', {
                  defaultValue: '{{count}}개 그룹',
                  count: sortedGroups.length,
                })}
              </span>
            )}
          </div>

          {sortedGroups.length > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-teal-50 p-3 text-xs text-teal-700">
              <Info className="h-4 w-4 shrink-0" />
              {t('settings:permissions.groupColumnTooltip', { defaultValue: '체크박스(✓)로 그룹별 메뉴 접근을 제한할 수 있습니다. 체크된 그룹만 해당 메뉴에 접근 가능하며, 아무 그룹도 체크하지 않으면 전체 허용입니다.' })}
            </div>
          )}
          {renderUserTable(chatMenuCodes, t('settings:permissions.chatMenus'))}
          {renderUserTable(workToolMenuCodes, t('settings:permissions.workToolMenus'))}
          {renderUserTable(moduleMenuCodes, t('settings:permissions.moduleMenus'))}
          {renderUserTable(settingsMenuCodes, t('settings:permissions.settingsMenus'))}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending || updateGroupMutation.isPending}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {(updateMutation.isPending || updateGroupMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('common:save')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
