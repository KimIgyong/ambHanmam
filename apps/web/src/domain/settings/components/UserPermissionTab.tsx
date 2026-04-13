import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  UserPlus,
  Info,
} from 'lucide-react';
import { UserMenuPermissionResponse, MenuConfigResponse } from '@amb/types';
import {
  useAllUserPermissions,
  useSetUserPermissions,
  useRemoveUserPermission,
  useMenuConfigs,
  useMenuPermissionList,
} from '../hooks/useMenuPermissions';
import { useMemberList } from '@/domain/members/hooks/useMembers';

export default function UserPermissionTab() {
  const { t } = useTranslation(['settings', 'common']);
  const { data: userPerms, isLoading } = useAllUserPermissions();
  const { data: menuConfigs } = useMenuConfigs();
  const { data: rolePerms } = useMenuPermissionList();
  const { data: members } = useMemberList();
  const setPermsMutation = useSetUserPermissions();
  const removeMutation = useRemoveUserPermission();

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMenuCode, setSelectedMenuCode] = useState('');
  const [selectedAccessible, setSelectedAccessible] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const getMenuName = (menuCode: string): string => {
    const config = menuConfigs?.find((c: MenuConfigResponse) => c.menuCode === menuCode);
    if (config) return t(config.labelKey, { defaultValue: menuCode });
    return menuCode;
  };

  const getRoleDefault = (menuCode: string, userRole: string): boolean => {
    if (userRole === 'ADMIN') return true;
    const perm = rolePerms?.find(
      (p) => p.menuCode === menuCode && p.role === userRole,
    );
    return perm?.accessible ?? false;
  };

  const handleAdd = async () => {
    if (!selectedUserId || !selectedMenuCode) return;
    setStatusMessage(null);
    try {
      await setPermsMutation.mutateAsync({
        userId: selectedUserId,
        data: {
          permissions: [{ menu_code: selectedMenuCode, accessible: selectedAccessible }],
        },
      });
      setStatusMessage({
        type: 'success',
        text: t('settings:permissions.saveSuccess'),
      });
      setShowAddForm(false);
      setSelectedUserId('');
      setSelectedMenuCode('');
      setSelectedAccessible(true);
    } catch {
      setStatusMessage({ type: 'error', text: t('common:errors.E8003') });
    }
  };

  const handleRemove = async (userId: string, menuCode: string) => {
    if (!window.confirm(t('settings:permissions.userPermissions.deleteConfirm'))) return;
    setStatusMessage(null);
    try {
      await removeMutation.mutateAsync({ userId, menuCode });
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

  const enabledMenus = (menuConfigs || []).filter((c: MenuConfigResponse) => c.enabled);

  return (
    <div>
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

      <div className="mb-3 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <Info className="h-4 w-4 shrink-0" />
        {t('settings:permissions.userPermissions.overrideNote')}
      </div>

      {/* Add Permission Form */}
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
                {(members || [])
                  .filter((m: { userId: string; name: string; role: string }) =>
                    m.role !== 'SUPER_ADMIN' && m.role !== 'ADMIN',
                  )
                  .map((m: { userId: string; name: string; role: string }) => (
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
                {enabledMenus.map((c: MenuConfigResponse) => (
                  <option key={c.menuCode} value={c.menuCode}>
                    {t(c.labelKey, { defaultValue: c.menuCode })}
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

          {selectedUserId && selectedMenuCode && (
            <div className="mt-2 text-xs text-gray-500">
              {t('settings:permissions.userPermissions.currentRoleDefault')}:{' '}
              {(() => {
                const member = (members || []).find((m: { userId: string }) => m.userId === selectedUserId);
                if (!member) return '-';
                const def = getRoleDefault(selectedMenuCode, member.role);
                return def
                  ? `${member.role} = ${t('settings:permissions.userPermissions.allowed')}`
                  : `${member.role} = ${t('settings:permissions.userPermissions.blocked')}`;
              })()}
            </div>
          )}

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

      {/* Permissions Table */}
      {(!userPerms || userPerms.length === 0) ? (
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
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">
                  {t('settings:permissions.userPermissions.roleDefault')}
                </th>
                <th className="w-12 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {userPerms.map((perm: UserMenuPermissionResponse, idx: number) => (
                <tr
                  key={perm.id}
                  className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {perm.userName}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {perm.userRole}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {getMenuName(perm.menuCode)}
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
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        getRoleDefault(perm.menuCode, perm.userRole)
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {getRoleDefault(perm.menuCode, perm.userRole)
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
