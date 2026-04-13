import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShieldCheck,
  Plus,
  Search,
  MoreHorizontal,
  KeyRound,
  Trash2,
  UserCog,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService, type AdminUserListItem, type CreateAdminUserBody } from '@/domain/admin/service/admin.service';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const STATUS_TABS = ['ALL', 'ACTIVE', 'INACTIVE'] as const;

export default function AdminUsersPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = useAuthStore((s) => s.isSuperAdmin);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'admin-users', { search, status: statusFilter === 'ALL' ? undefined : statusFilter, page }],
    queryFn: () =>
      adminService.getAdminUsers({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 50,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admin-users'] });
      toast.success(t('admin:adminUsers.deleted'));
    },
  });

  const resetPwMutation = useMutation({
    mutationFn: (id: string) => adminService.resetAdminPassword(id),
    onSuccess: (data) => {
      toast.success(`${t('admin:adminUsers.passwordReset')}: ${data.tempPassword}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, string> }) =>
      adminService.updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'admin-users'] });
      toast.success(t('admin:adminUsers.updated'));
    },
  });

  const handleDelete = (id: string) => {
    if (confirm(t('admin:adminUsers.confirm.delete'))) {
      deleteMutation.mutate(id);
    }
    setActionMenuId(null);
  };

  const handleResetPassword = (id: string) => {
    if (confirm(t('admin:adminUsers.confirm.resetPassword'))) {
      resetPwMutation.mutate(id);
    }
    setActionMenuId(null);
  };

  const handleToggleRole = (user: AdminUserListItem) => {
    const newRole = user.role === 'SUPER_ADMIN' ? 'ADMIN' : 'SUPER_ADMIN';
    updateMutation.mutate({ id: user.userId, data: { role: newRole } });
    setActionMenuId(null);
  };

  const handleToggleStatus = (user: AdminUserListItem) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateMutation.mutate({ id: user.userId, data: { status: newStatus } });
    setActionMenuId(null);
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-gray-100 text-gray-600',
      PENDING: 'bg-yellow-100 text-yellow-700',
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'bg-gray-100 text-gray-600'}`}>
        {status}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const isSA = role === 'SUPER_ADMIN';
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isSA ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
        {isSA ? 'Super Admin' : 'Admin'}
      </span>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
              <ShieldCheck className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('admin:adminUsers.title')}</h1>
              <p className="text-sm text-gray-500">{data?.total ?? 0} {t('common:users')}</p>
            </div>
          </div>
          {isSuperAdmin() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('admin:adminUsers.addAdmin')}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => { setStatusFilter(tab); setPage(1); }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'ALL' ? t('admin:adminUsers.filter.all') : tab}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={t('admin:adminUsers.searchPlaceholder')}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:adminUsers.table.name')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:adminUsers.table.email')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:adminUsers.table.role')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:adminUsers.table.status')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:adminUsers.table.createdAt')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:adminUsers.table.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !data?.items.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('admin:adminUsers.noUsers')}</td></tr>
              ) : (
                data.items.map((u) => (
                  <tr key={u.userId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3">{statusBadge(u.status)}</td>
                    <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="relative px-4 py-3">
                      <button
                        onClick={() => setActionMenuId(actionMenuId === u.userId ? null : u.userId)}
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                      {actionMenuId === u.userId && (
                        <div className="absolute right-4 top-10 z-10 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                          {isSuperAdmin() && (
                            <button onClick={() => handleToggleRole(u)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                              <UserCog className="h-4 w-4" />
                              {t('admin:adminUsers.actions.changeRole')}
                            </button>
                          )}
                          {isSuperAdmin() && (
                            <button onClick={() => handleToggleStatus(u)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                              <UserCog className="h-4 w-4" />
                              {t('admin:adminUsers.actions.changeStatus')}
                            </button>
                          )}
                          <button onClick={() => handleResetPassword(u.userId)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50">
                            <KeyRound className="h-4 w-4" />
                            {t('admin:adminUsers.actions.resetPassword')}
                          </button>
                          {isSuperAdmin() && u.userId !== currentUser?.userId && (
                            <button onClick={() => handleDelete(u.userId)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                              {t('admin:adminUsers.actions.delete')}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex justify-center gap-1">
            {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-md px-3 py-1.5 text-sm ${
                  p === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['admin', 'admin-users'] });
          }}
        />
      )}
    </div>
  );
}

function CreateAdminModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation(['admin']);
  const [form, setForm] = useState<CreateAdminUserBody>({
    email: '',
    name: '',
    password: '',
    role: 'ADMIN',
  });

  const mutation = useMutation({
    mutationFn: () => adminService.createAdminUser(form),
    onSuccess: () => {
      toast.success(t('admin:adminUsers.created'));
      onSuccess();
    },
    onError: () => {
      toast.error(t('admin:adminUsers.createError'));
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-900">{t('admin:adminUsers.modal.createTitle')}</h2>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin:adminUsers.modal.email')}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin:adminUsers.modal.name')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin:adminUsers.modal.password')}</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin:adminUsers.modal.role')}</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as 'ADMIN' | 'SUPER_ADMIN' })}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ADMIN">{t('admin:adminUsers.modal.roleAdmin')}</option>
              <option value="SUPER_ADMIN">{t('admin:adminUsers.modal.roleSuperAdmin')}</option>
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
            {t('common:cancel')}
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.email || !form.name || !form.password}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {mutation.isPending ? '...' : t('common:create')}
          </button>
        </div>
      </div>
    </div>
  );
}
