import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Trash2, ChevronLeft, ChevronRight, AlertTriangle, X, ExternalLink } from 'lucide-react';
import { useAdminUsers, useUserDeletionPreview, usePermanentDeleteUser } from '../hooks/useAdmin';
import { useEntities } from '@/domain/hr/hooks/useEntity';
import { useDeleteMember } from '@/domain/members/hooks/useMembers';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '../hooks/useAdmin';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { AdminUserItem } from '../service/admin.service';

const STATUS_OPTIONS = ['', 'ACTIVE', 'PENDING', 'INACTIVE', 'SUSPENDED', 'WITHDRAWN'];
const ROLE_OPTIONS = ['', 'SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'];

export default function InternalUsersTab() {
  const { t } = useTranslation(['totalUsers', 'members']);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<AdminUserItem | null>(null);

  const params = {
    page,
    limit: 50,
    search: search || undefined,
    entity_id: entityFilter || undefined,
    status: statusFilter || undefined,
    role: roleFilter || undefined,
  };

  const { data, isLoading } = useAdminUsers(params);
  const { data: entities } = useEntities();
  const deleteMember = useDeleteMember();

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  const handleSoftDelete = async (user: AdminUserItem) => {
    try {
      await deleteMember.mutateAsync(user.userId);
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      setDeleteTarget(null);
      toast.success(t('totalUsers:userDelete.softDeleteSuccess'));
    } catch {
      toast.error(t('totalUsers:userDelete.softDeleteFailed'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t('totalUsers:search')}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={entityFilter}
          onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          <option value="">{t('totalUsers:allEntities')}</option>
          {entities?.map((ent) => (
            <option key={ent.entityId} value={ent.entityId}>
              {ent.name} ({ent.code})
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s ? t(`members:userStatus.${s}`) : t('totalUsers:allStatus')}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r ? t(`members:roles.${r}`) : t('totalUsers:allRoles')}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">{t('totalUsers:noUsers')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.role')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.level')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.entity')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.joinMethod')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.createdAt')}</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map((user) => (
                  <tr key={user.userId} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                      <button
                        onClick={() => setDeleteTarget(user)}
                        className="text-violet-600 hover:text-violet-800 hover:underline"
                      >
                        {user.name}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{user.email}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <LevelBadge level={user.levelCode} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {user.companyName || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {user.joinMethod || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <button
                        onClick={() => navigate(`/admin/members/${user.userId}`)}
                        className="text-gray-400 hover:text-violet-600"
                        title={t('totalUsers:userDelete.viewDetail')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('totalUsers:pagination', { total: data.total, page: data.page, totalPages: data.totalPages })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                  className="rounded-md border border-gray-300 p-2 text-sm disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete Option Modal */}
      {deleteTarget && (
        <UserDeleteOptionModal
          target={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSoftDelete={() => handleSoftDelete(deleteTarget)}
          onPermanentDelete={() => {
            const user = deleteTarget;
            setDeleteTarget(null);
            setPermanentDeleteTarget(user);
          }}
        />
      )}

      {/* Permanent Delete Modal */}
      {permanentDeleteTarget && (
        <UserPermanentDeleteModal
          user={permanentDeleteTarget}
          onClose={() => setPermanentDeleteTarget(null)}
        />
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const { t } = useTranslation('members');
  const colorMap: Record<string, string> = {
    SUPER_ADMIN: 'bg-purple-100 text-purple-700',
    ADMIN: 'bg-red-100 text-red-700',
    MASTER: 'bg-orange-100 text-orange-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    MEMBER: 'bg-green-100 text-green-700',
    VIEWER: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[role] || 'bg-gray-100 text-gray-500'}`}>
      {t(`roles.${role}`)}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const { t } = useTranslation('members');
  const isAdmin = level === 'ADMIN_LEVEL';
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${isAdmin ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
      {t(`levels.${level}`)}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('members');
  const colorMap: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    INACTIVE: 'bg-gray-100 text-gray-500',
    SUSPENDED: 'bg-red-100 text-red-700',
    WITHDRAWN: 'bg-gray-100 text-gray-400',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-500'}`}>
      {t(`userStatus.${status}`)}
    </span>
  );
}

function UserDeleteOptionModal({
  target,
  onClose,
  onSoftDelete,
  onPermanentDelete,
}: {
  target: AdminUserItem;
  onClose: () => void;
  onSoftDelete: () => void;
  onPermanentDelete: () => void;
}) {
  const { t } = useTranslation(['totalUsers']);
  const isSuperAdmin = target.role === 'SUPER_ADMIN';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{t('totalUsers:userDelete.deleteOptionTitle')}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-sm font-medium text-gray-900">{target.name}</p>
            <p className="text-sm text-gray-500">{target.email}</p>
            <p className="text-xs text-gray-400">{target.companyName || '-'} · {target.role}</p>
          </div>

          {isSuperAdmin ? (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">{t('totalUsers:userDelete.superAdminWarning')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">{t('totalUsers:userDelete.deleteOptionDesc')}</p>

              <div className="space-y-2">
                <button
                  onClick={onSoftDelete}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-orange-50 hover:border-orange-300 transition-colors"
                >
                  <Trash2 className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t('totalUsers:userDelete.softDelete')}</p>
                    <p className="text-xs text-gray-500">{t('totalUsers:userDelete.softDeleteDesc')}</p>
                  </div>
                </button>

                <button
                  onClick={onPermanentDelete}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 p-3 text-left hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-600">{t('totalUsers:userDelete.permanentDelete')}</p>
                    <p className="text-xs text-gray-500">{t('totalUsers:userDelete.permanentDeleteDesc')}</p>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('totalUsers:userDelete.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}

function UserPermanentDeleteModal({ user, onClose }: { user: AdminUserItem; onClose: () => void }) {
  const { t } = useTranslation(['totalUsers']);
  const { data: preview, isLoading } = useUserDeletionPreview(user.userId, true);
  const permanentMutation = usePermanentDeleteUser();
  const [level, setLevel] = useState<1 | 2>(1);
  const [confirmEmail, setConfirmEmail] = useState('');

  const emailMatch = preview && confirmEmail.toLowerCase() === preview.user.usrEmail.toLowerCase();
  const canDelete = emailMatch && !permanentMutation.isPending;

  const handleDelete = async () => {
    if (!canDelete || !preview) return;
    try {
      await permanentMutation.mutateAsync({
        userId: user.userId,
        level,
        confirmEmail,
      });
      toast.success(t('totalUsers:userDelete.permanentDeleteSuccess'));
      onClose();
    } catch {
      toast.error(t('totalUsers:userDelete.permanentDeleteFailed'));
    }
  };

  const totalCount = preview
    ? Object.values(preview.counts).reduce((sum, c) => sum + c, 0)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative mx-4 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">{t('totalUsers:userDelete.permanentDelete')}</h3>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          ) : preview ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                <p className="font-medium">{t('totalUsers:userDelete.permanentDeleteWarning')}</p>
              </div>

              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-sm font-medium text-gray-900">{preview.user.usrName}</p>
                <p className="text-sm text-gray-500">{preview.user.usrEmail}</p>
                {preview.user.companyName && (
                  <p className="text-sm text-gray-500">{preview.user.companyName} · {preview.user.usrRole}</p>
                )}
                {preview.user.isSoftDeleted && (
                  <span className="mt-1 inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                    {t('totalUsers:userDelete.alreadySoftDeleted')}
                  </span>
                )}
              </div>

              {totalCount > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700">{t('totalUsers:userDelete.deletionPreviewTitle')}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    {preview.counts.entityRoles > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewEntityRoles')} count={preview.counts.entityRoles} />
                    )}
                    {preview.counts.unitRoles > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewUnitRoles')} count={preview.counts.unitRoles} />
                    )}
                    {preview.counts.conversations > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewConversations')} count={preview.counts.conversations} />
                    )}
                    {preview.counts.talkChannels > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewTalkChannels')} count={preview.counts.talkChannels} />
                    )}
                    {preview.counts.talkMessages > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewTalkMessages')} count={preview.counts.talkMessages} />
                    )}
                    {preview.counts.todos > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewTodos')} count={preview.counts.todos} />
                    )}
                    {preview.counts.workItems > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewWorkItems')} count={preview.counts.workItems} />
                    )}
                    {preview.counts.calendars > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewCalendars')} count={preview.counts.calendars} />
                    )}
                    {preview.counts.meetingNotes > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewMeetingNotes')} count={preview.counts.meetingNotes} />
                    )}
                    {preview.counts.workReports > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewWorkReports')} count={preview.counts.workReports} />
                    )}
                    {preview.counts.attendances > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewAttendances')} count={preview.counts.attendances} />
                    )}
                    {preview.counts.notifications > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewNotifications')} count={preview.counts.notifications} />
                    )}
                    {preview.counts.notices > 0 && (
                      <PreviewRow label={t('totalUsers:userDelete.previewNotices')} count={preview.counts.notices} />
                    )}
                    {(preview.counts.pushSubscriptions + preview.counts.loginHistories + preview.counts.pageViews + preview.counts.aiTokenUsages + preview.counts.pgTransactions + preview.counts.aiQuotaTopups) > 0 && (
                      <PreviewRow
                        label={t('totalUsers:userDelete.previewOthers')}
                        count={preview.counts.pushSubscriptions + preview.counts.loginHistories + preview.counts.pageViews + preview.counts.aiTokenUsages + preview.counts.pgTransactions + preview.counts.aiQuotaTopups}
                      />
                    )}
                  </div>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">{t('totalUsers:userDelete.deletionLevel')}</p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={level === 1}
                      onChange={() => setLevel(1)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('totalUsers:userDelete.level1Title')}</p>
                      <p className="text-xs text-gray-500">{t('totalUsers:userDelete.level1Desc')}</p>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                    <input
                      type="radio"
                      checked={level === 2}
                      onChange={() => setLevel(2)}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('totalUsers:userDelete.level2Title')}</p>
                      <p className="text-xs text-gray-500">{t('totalUsers:userDelete.level2Desc')}</p>
                      <p className="mt-1 text-xs font-medium text-orange-600">{t('totalUsers:userDelete.level2Warning')}</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('totalUsers:userDelete.confirmEmailLabel')}
                </label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder={preview.user.usrEmail}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('totalUsers:userDelete.cancel')}
          </button>
          <button
            onClick={handleDelete}
            disabled={!canDelete}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {permanentMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('totalUsers:userDelete.confirmPermanentDelete')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className="font-medium">{count}</span>
    </div>
  );
}
