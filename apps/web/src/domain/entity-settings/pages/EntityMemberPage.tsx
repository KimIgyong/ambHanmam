import { useState, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Users, UserPlus, Send, XCircle, Mail, Loader2, Pencil, X, Save, Link, Unlink, Trash2, KeyRound, Building2, Copy, Check, ChevronDown } from 'lucide-react';
import {
  useEntityMembers,
  useEntityInvitations,
  useInviteMember,
  useCancelInvitation,
  useResendInvitation,
  useUpdateMember,
  useRemoveMember,
  useDeleteInvitation,
  useOrgUnits,
  useOrgCells,
  useChangeMemberUnit,
  useAddMemberCell,
  useRemoveMemberCell,
  useAvailableEmployees,
  useLinkEmployee,
  useUnlinkEmployee,
  useResetMemberPassword,
} from '../hooks/useEntitySettings';
import type { InviteMemberDto, EntityMember } from '../service/entity-settings.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import ActionResultModal from '@/components/common/ActionResultModal';

type TabKey = 'members' | 'clients' | 'invitations' | 'accepted';

const USER_ROLES = ['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'] as const;
const CLIENT_ROLES = ['CLIENT_ADMIN', 'CLIENT_MEMBER'] as const;

const ROLE_COLORS: Record<string, string> = {
  MASTER: 'bg-purple-100 text-purple-700',
  MANAGER: 'bg-blue-100 text-blue-700',
  MEMBER: 'bg-green-100 text-green-700',
  VIEWER: 'bg-gray-100 text-gray-700',
  CLIENT_ADMIN: 'bg-cyan-100 text-cyan-700',
  CLIENT_MEMBER: 'bg-teal-100 text-teal-700',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-gray-100 text-gray-400',
  ACCEPTED: 'bg-green-100 text-green-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};

const MEMBER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

export default function EntityMemberPage() {
  const { t } = useTranslation(['entitySettings', 'common', 'settings']);
  const [activeTab, setActiveTab] = useState<TabKey>('members');
  const [showInvite, setShowInvite] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const { data: members, isLoading: membersLoading } = useEntityMembers();
  const { data: invitations, isLoading: invLoading } = useEntityInvitations();
  const inviteMutation = useInviteMember();
  const cancelMutation = useCancelInvitation();
  const resendMutation = useResendInvitation();
  const updateMemberMutation = useUpdateMember();
  const removeMemberMutation = useRemoveMember();
  const deleteInvitationMutation = useDeleteInvitation();

  const [inviteForm, setInviteForm] = useState<InviteMemberDto>({
    email: '',
    role: 'MEMBER',
    department: 'Holding',
  });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    await inviteMutation.mutateAsync(inviteForm);
    toast.success(t('entitySettings:members.inviteSent', { defaultValue: '초대메일을 발송했습니다' }));
    setInviteForm({ email: '', role: 'MEMBER', department: 'Holding' });
    setShowInvite(false);
  };

  const pendingInvitations = invitations?.filter((inv) => inv.status === 'PENDING') ?? [];
  const acceptedInvitations = invitations?.filter((inv) => inv.status === 'ACCEPTED') ?? [];
  const userMembers = members?.filter((m) => m.levelCode !== 'CLIENT_LEVEL') ?? [];
  const clientMembers = members?.filter((m) => m.levelCode === 'CLIENT_LEVEL') ?? [];
  const selectedMember = useMemo(
    () => members?.find((m) => m.userId === selectedMemberId) ?? null,
    [members, selectedMemberId],
  );

  const showSuccessModal = (message: string) => {
    setResultMessage(message);
  };

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'members', label: t('entitySettings:members.userMembers', { defaultValue: '구성원' }), count: userMembers.length },
    { key: 'clients', label: t('entitySettings:members.clientMembers', { defaultValue: '클라이언트' }), count: clientMembers.length },
    { key: 'invitations', label: t('entitySettings:members.pendingInvitations', { defaultValue: '초대 대기' }), count: pendingInvitations.length },
    { key: 'accepted', label: t('entitySettings:members.acceptedClients', { defaultValue: '승인 고객' }), count: acceptedInvitations.length },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-teal-500" />
            <h1 className="text-xl font-bold text-gray-900">
              {t('entitySettings:members.title')}
            </h1>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <UserPlus className="h-4 w-4" />
            {t('entitySettings:members.invite')}
          </button>
        </div>

        <div className="mt-3 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-b-2 border-indigo-600 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {activeTab === 'members' && (
          <MemberList
            members={userMembers}
            isLoading={membersLoading}
            t={t}
            onSelect={(m) => setSelectedMemberId(m.userId)}
            isClientView={false}
          />
        )}
        {activeTab === 'clients' && (
          <MemberList
            members={clientMembers}
            isLoading={membersLoading}
            t={t}
            onSelect={(m) => setSelectedMemberId(m.userId)}
            isClientView={true}
          />
        )}
        {activeTab === 'invitations' && (
          <InvitationList
            invitations={pendingInvitations}
            isLoading={invLoading}
            onCancel={(id) => cancelMutation.mutate(id)}
            onResend={(id) => resendMutation.mutate(id)}
            onDelete={(id) => deleteInvitationMutation.mutate(id)}
            cancelLoading={cancelMutation.isPending}
            resendLoading={resendMutation.isPending}
            deleteLoading={deleteInvitationMutation.isPending}
            t={t}
          />
        )}
        {activeTab === 'accepted' && (
          <InvitationList
            invitations={acceptedInvitations}
            isLoading={invLoading}
            onCancel={(id) => cancelMutation.mutate(id)}
            onResend={(id) => resendMutation.mutate(id)}
            onDelete={(id) => deleteInvitationMutation.mutate(id)}
            cancelLoading={cancelMutation.isPending}
            resendLoading={resendMutation.isPending}
            deleteLoading={deleteInvitationMutation.isPending}
            t={t}
          />
        )}
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {t('entitySettings:members.invite')}
            </h2>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:members.email')}
                </label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('entitySettings:members.role')}
                </label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {t(`settings:roles.${role}`, { defaultValue: role })}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500">
                {t('entitySettings:members.holdingUnit')}
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {t('common:cancel')}
                </button>
                <button
                  type="submit"
                  disabled={inviteMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {t('entitySettings:members.invite')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Detail / Edit Modal */}
      {selectedMember && (
        <MemberDetailModal
          member={selectedMember}
          t={t}
          onClose={() => setSelectedMemberId(null)}
          onActionSuccess={showSuccessModal}
          onSave={async (dto) => {
            await updateMemberMutation.mutateAsync({ userId: selectedMember.userId, dto });
            showSuccessModal(t('entitySettings:members.updateSuccess'));
            setSelectedMemberId(null);
          }}
          onDelete={async () => {
            await removeMemberMutation.mutateAsync(selectedMember.userId);
            showSuccessModal(t('entitySettings:members.deleteSuccess'));
            setSelectedMemberId(null);
          }}
          saving={updateMemberMutation.isPending}
          deleting={removeMemberMutation.isPending}
        />
      )}

      <ActionResultModal
        isOpen={!!resultMessage}
        title={t('common:notice')}
        message={resultMessage || ''}
        confirmLabel={t('common:confirm')}
        onClose={() => setResultMessage(null)}
      />
    </div>
  );
}

/* ── Sub Components ── */

function MemberList({
  members,
  isLoading,
  t,
  onSelect,
  isClientView,
}: {
  members: EntityMember[] | undefined;
  isLoading: boolean;
  t: ReturnType<typeof useTranslation>['t'];
  onSelect: (m: EntityMember) => void;
  isClientView: boolean;
}) {
  const { data: orgUnits } = useOrgUnits();

  // Filter / Sort state
  const [sortBy, setSortBy] = useState<string>('joinedAt_desc');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['ACTIVE']);

  // Dropdown open states
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const roles = isClientView ? CLIENT_ROLES : USER_ROLES;

  const filteredMembers = useMemo(() => {
    let result = members || [];
    // Status filter
    if (selectedStatuses.length > 0) {
      result = result.filter((m) => selectedStatuses.includes(m.status));
    }
    // Role filter
    if (selectedRoles.length > 0) {
      result = result.filter((m) => selectedRoles.includes(m.role));
    }
    // Unit filter
    if (selectedUnit) {
      result = result.filter(
        (m) => m.unitRoles?.some((ur) => ur.unitId === selectedUnit) || false,
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'joinedAt_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'joinedAt_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_desc':
          return (b.name || '').localeCompare(a.name || '');
        default:
          return 0;
      }
    });
    return result;
  }, [members, selectedStatuses, selectedRoles, selectedUnit, sortBy]);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">No members found</p>
      </div>
    );
  }

  // Entity를 개설한 사용자 = MASTER 중 가장 먼저 가입한 사용자
  const ownerUserId = members
    .filter((m) => m.role === 'MASTER')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0]?.userId;

  const sortOptions = [
    { value: 'joinedAt_desc', label: t('entitySettings:members.filter.sortJoinedDesc', { defaultValue: '최신 가입순' }) },
    { value: 'joinedAt_asc', label: t('entitySettings:members.filter.sortJoinedAsc', { defaultValue: '오래된 가입순' }) },
    { value: 'name_asc', label: t('entitySettings:members.filter.sortNameAsc', { defaultValue: '이름 오름차순' }) },
    { value: 'name_desc', label: t('entitySettings:members.filter.sortNameDesc', { defaultValue: '이름 내림차순' }) },
  ];

  const roleLabel =
    selectedRoles.length === 0
      ? t('entitySettings:members.filter.roleAll', { defaultValue: '역할: 전체' })
      : selectedRoles.map((r) => t(`settings:roles.${r}`, { defaultValue: r })).join(', ');

  const statusLabel =
    selectedStatuses.length === 0
      ? t('entitySettings:members.filter.statusAll', { defaultValue: '상태: 전체' })
      : selectedStatuses.join(', ');

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Role multi-select dropdown */}
        <div ref={roleDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setRoleDropdownOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="max-w-[140px] truncate">{roleLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
          {roleDropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {roles.map((role) => (
                <label
                  key={role}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  {t(`settings:roles.${role}`, { defaultValue: role })}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Unit single-select */}
        <select
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">{t('entitySettings:members.filter.unitAll', { defaultValue: '유닛: 전체' })}</option>
          {orgUnits?.map((u) => (
            <option key={u.unitId} value={u.unitId}>
              {u.name}
            </option>
          ))}
        </select>

        {/* Status multi-select dropdown */}
        <div ref={statusDropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setStatusDropdownOpen((v) => !v)}
            className="flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            <span className="max-w-[140px] truncate">{statusLabel}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
          {statusDropdownOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
              {MEMBER_STATUSES.map((status) => (
                <label
                  key={status}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedStatuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`inline-block rounded-full px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
                    {status}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Result count */}
        <span className="text-xs text-gray-400">
          {filteredMembers.length} / {members.length}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('entitySettings:members.nameEmail', { defaultValue: '이름 / 이메일' })}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('entitySettings:members.role')}
              </th>
              {isClientView && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('entitySettings:members.connectedClient', { defaultValue: '연결된 고객사' })}
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('entitySettings:members.department')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('entitySettings:members.status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                {t('entitySettings:members.joinedAt')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMembers.map((m) => (
              <tr
                key={m.userId}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => onSelect(m)}
              >
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">{m.name || '-'}</div>
                  <div className="text-xs text-gray-500">{m.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role] || 'bg-gray-100 text-gray-600'}`}>
                    {t(`settings:roles.${m.role}`, { defaultValue: m.role })}
                  </span>
                  {m.userId === ownerUserId && (
                    <span className="ml-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      OWNER
                    </span>
                  )}
                </td>
                {isClientView && (
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {m.clientInfo ? (
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        {m.clientInfo.clientName}
                      </span>
                    ) : '-'}
                  </td>
                )}
                <td className="px-4 py-3 text-sm text-gray-600">
                  {m.unitRoles?.find((ur) => ur.isPrimary)?.unitName || m.unit || '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600'}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {m.createdAt ? <LocalDateTime value={m.createdAt} format='YYYY-MM-DD HH:mm' /> : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    </div>
  );
}

function InvitationList({
  invitations,
  isLoading,
  onCancel,
  onResend,
  onDelete,
  cancelLoading,
  resendLoading,
  deleteLoading,
  t,
}: {
  invitations: ReturnType<typeof useEntityInvitations>['data'];
  isLoading: boolean;
  onCancel: (id: string) => void;
  onResend: (id: string) => void;
  onDelete: (id: string) => void;
  cancelLoading: boolean;
  resendLoading: boolean;
  deleteLoading: boolean;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <Mail className="mx-auto mb-3 h-10 w-10 text-gray-300" />
        <p className="text-sm text-gray-500">No invitations</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
        >
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{inv.email}</p>
              <p className="text-xs text-gray-500">
                {t(`settings:roles.${inv.role}`, { defaultValue: inv.role })}
                {inv.unit ? ` · ${inv.unit}` : ''}
                {' · '}
                {<LocalDateTime value={inv.createdAt} format='YYYY-MM-DD HH:mm' />}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
              {inv.status}
            </span>
            {inv.status === 'PENDING' && (
              <>
                <button
                  onClick={() => onResend(inv.id)}
                  disabled={resendLoading}
                  className="rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-50"
                >
                  {t('entitySettings:invitations.resend')}
                </button>
                <button
                  onClick={() => onCancel(inv.id)}
                  disabled={cancelLoading}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  {t('entitySettings:invitations.cancel')}
                </button>
              </>
            )}
            {inv.status !== 'PENDING' && (
              <button
                onClick={() => {
                  if (confirm(t('entitySettings:invitations.deleteConfirm'))) {
                    onDelete(inv.id);
                  }
                }}
                disabled={deleteLoading}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('entitySettings:invitations.delete')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Member Detail / Edit Modal ── */

function MemberDetailModal({
  member,
  t,
  onClose,
  onActionSuccess,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  member: EntityMember;
  t: ReturnType<typeof useTranslation>['t'];
  onClose: () => void;
  onActionSuccess: (message: string) => void;
  onSave: (dto: { role?: string; department?: string; status?: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  saving: boolean;
  deleting: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    role: member.role,
    status: member.status,
  });
  const [addingCell, setAddingCell] = useState(false);
  const [selectedCellId, setSelectedCellId] = useState('');
  const [linkingEmployee, setLinkingEmployee] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const user = useAuthStore((s) => s.user);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const { data: orgUnits } = useOrgUnits();
  const { data: orgCells } = useOrgCells();
  const changeMemberUnit = useChangeMemberUnit();
  const addMemberCell = useAddMemberCell();
  const removeMemberCell = useRemoveMemberCell();
  const { data: availableEmployees } = useAvailableEmployees(isEditing ? member.userId : null);
  const linkEmployee = useLinkEmployee();
  const unlinkEmployee = useUnlinkEmployee();
  const resetPassword = useResetMemberPassword();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copiedPw, setCopiedPw] = useState(false);

  const isClientLevel = member.levelCode === 'CLIENT_LEVEL';
  const isSelf = user?.userId === member.userId;
  const canDelete = !isSelf && (isAdmin() || member.role !== 'MASTER');

  const primaryUnit = member.unitRoles?.find((ur) => ur.isPrimary);
  const [selectedUnitId, setSelectedUnitId] = useState(primaryUnit?.unitId || '');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const dto: { role?: string; status?: string } = {};
    if (form.role !== member.role) dto.role = form.role;
    if (form.status !== member.status) dto.status = form.status;
    await onSave(dto);
  };

  const handleUnitChange = async (unitId: string) => {
    setSelectedUnitId(unitId);
    await changeMemberUnit.mutateAsync({ userId: member.userId, unitId });
    onActionSuccess(t('entitySettings:members.unitChangeSuccess'));
  };

  const handleAddCell = async () => {
    if (!selectedCellId) return;
    await addMemberCell.mutateAsync({ userId: member.userId, cellId: selectedCellId });
    setSelectedCellId('');
    setAddingCell(false);
    onActionSuccess(t('entitySettings:members.cellAddSuccess'));
  };

  const handleRemoveCell = async (cellId: string) => {
    await removeMemberCell.mutateAsync({ userId: member.userId, cellId });
    onActionSuccess(t('entitySettings:members.cellRemoveSuccess'));
  };

  const handleLinkEmployee = async () => {
    if (!selectedEmployeeId) return;
    await linkEmployee.mutateAsync({ userId: member.userId, employeeId: selectedEmployeeId });
    setSelectedEmployeeId('');
    setLinkingEmployee(false);
    onActionSuccess(t('entitySettings:members.linkSuccess'));
  };

  const handleUnlinkEmployee = async () => {
    await unlinkEmployee.mutateAsync(member.userId);
    onActionSuccess(t('entitySettings:members.unlinkSuccess'));
  };

  // Filter out cells already assigned to this member
  const assignedCellIds = new Set(member.cells?.map((c) => c.cellId) || []);
  const availableCells = orgCells?.filter((c) => !assignedCellIds.has(c.cellId)) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('entitySettings:members.memberDetail')}
          </h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
              >
                <Pencil className="h-3.5 w-3.5" />
                {t('entitySettings:members.editMember')}
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="space-y-4 px-6 py-5">
          {/* Read-only fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('entitySettings:members.email')}
              </label>
              <p className="text-sm font-medium text-gray-900">{member.email}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('entitySettings:members.name')}
              </label>
              <p className="text-sm font-medium text-gray-900">{member.name || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('entitySettings:members.level')}
              </label>
              <p className="text-sm text-gray-700">{member.levelCode || '-'}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('entitySettings:members.joinMethod')}
              </label>
              <p className="text-sm text-gray-700">{member.joinMethod || '-'}</p>
            </div>
          </div>

          {/* Editable fields */}
          <div className="border-t border-gray-100 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t('entitySettings:members.role')}
                </label>
                {isEditing ? (
                  <select
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {(isClientLevel ? CLIENT_ROLES : USER_ROLES).map((role) => (
                      <option key={role} value={role}>
                        {t(`settings:roles.${role}`, { defaultValue: role })}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[member.role] || 'bg-gray-100 text-gray-600'}`}>
                    {t(`settings:roles.${member.role}`, { defaultValue: member.role })}
                  </span>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t('entitySettings:members.unit')}
                </label>
                {isEditing ? (
                  <select
                    value={selectedUnitId}
                    onChange={(e) => handleUnitChange(e.target.value)}
                    disabled={changeMemberUnit.isPending}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">{t('entitySettings:members.selectUnit')}</option>
                    {orgUnits?.map((u) => (
                      <option key={u.unitId} value={u.unitId}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-700">
                    {primaryUnit?.unitName || member.unit || '-'}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500">
                  {t('entitySettings:members.status')}
                </label>
                {isEditing ? (
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    {MEMBER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                ) : (
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[member.status] || 'bg-gray-100 text-gray-600'}`}>
                    {member.status}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cell section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">
                {t('entitySettings:members.cells')}
              </label>
              {isEditing && availableCells.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddingCell(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  + {t('entitySettings:members.addCell')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {member.cells && member.cells.length > 0 ? (
                member.cells.map((cell) => (
                  <span
                    key={cell.cellId}
                    className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700"
                  >
                    {cell.cellName}
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCell(cell.cellId)}
                        disabled={removeMemberCell.isPending}
                        className="ml-0.5 rounded-full p-0.5 hover:bg-teal-100 disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400">{t('entitySettings:members.noCells')}</p>
              )}
            </div>
            {addingCell && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={selectedCellId}
                  onChange={(e) => setSelectedCellId(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">{t('entitySettings:members.selectCell')}</option>
                  {availableCells.map((c) => (
                    <option key={c.cellId} value={c.cellId}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCell}
                  disabled={!selectedCellId || addMemberCell.isPending}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addMemberCell.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    t('entitySettings:members.confirm')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setAddingCell(false); setSelectedCellId(''); }}
                  className="rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                >
                  {t('common:cancel')}
                </button>
              </div>
            )}
          </div>

          {/* Client Info section (CLIENT_LEVEL only) */}
          {isClientLevel && member.clientInfo && (
            <div className="border-t border-gray-100 pt-4">
              <div className="mb-2 flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-gray-500" />
                <label className="block text-xs font-medium text-gray-500">
                  {t('entitySettings:members.connectedClient', { defaultValue: '연결된 고객사' })}
                </label>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.clientCode', { defaultValue: '고객사 코드' })}: </span>
                    <span className="font-medium text-gray-900">{member.clientInfo.clientCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.clientName', { defaultValue: '고객사명' })}: </span>
                    <span className="font-medium text-gray-900">{member.clientInfo.clientName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.clientStatus', { defaultValue: '상태' })}: </span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[member.clientInfo.clientStatus] || 'bg-gray-100 text-gray-600'}`}>
                      {member.clientInfo.clientStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HR Employee section */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-medium text-gray-500">
                {t('entitySettings:members.hrEmployee')}
              </label>
              {isEditing && !member.hrEmployee && !linkingEmployee && (
                <button
                  type="button"
                  onClick={() => setLinkingEmployee(true)}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                >
                  <Link className="h-3 w-3" />
                  {t('entitySettings:members.linkEmployee')}
                </button>
              )}
            </div>
            {member.hrEmployee ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.employeeCode')}: </span>
                    <span className="font-medium text-gray-900">{member.hrEmployee.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.name')}: </span>
                    <span className="font-medium text-gray-900">{member.hrEmployee.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.employeeDept')}: </span>
                    <span className="text-gray-700">{member.hrEmployee.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('entitySettings:members.employeePosition')}: </span>
                    <span className="text-gray-700">{member.hrEmployee.position}</span>
                  </div>
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleUnlinkEmployee}
                    disabled={unlinkEmployee.isPending}
                    className="mt-2 flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {unlinkEmployee.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Unlink className="h-3 w-3" />
                    )}
                    {t('entitySettings:members.unlinkEmployee')}
                  </button>
                )}
              </div>
            ) : (
              <>
                {!linkingEmployee && (
                  <p className="text-xs text-gray-400">{t('entitySettings:members.noEmployee')}</p>
                )}
              </>
            )}
            {linkingEmployee && (
              <div className="mt-2 flex items-center gap-2">
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">{t('entitySettings:members.selectEmployee')}</option>
                  {availableEmployees?.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeCode} - {emp.fullName} ({emp.department})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleLinkEmployee}
                  disabled={!selectedEmployeeId || linkEmployee.isPending}
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {linkEmployee.isPending ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    t('entitySettings:members.linkEmployee')
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setLinkingEmployee(false); setSelectedEmployeeId(''); }}
                  className="rounded-md px-2 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                >
                  {t('common:cancel')}
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={() => {
                  setForm({ role: member.role, status: member.status });
                  setSelectedUnitId(primaryUnit?.unitId || '');
                  setIsEditing(false);
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:cancel')}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {t('entitySettings:members.save')}
              </button>
            </div>
          )}

          {/* Reset Password */}
          <div className="border-t border-gray-100 pt-4">
            <div className="mb-2">
              <p className="text-xs text-gray-400">
                {t('entitySettings:members.resetPasswordDesc')}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(t('entitySettings:members.resetPasswordConfirm'))) return;
                  try {
                    const res = await resetPassword.mutateAsync({ userId: member.userId, mode: 'email' });
                    toast.success(
                      res.emailSent
                        ? t('entitySettings:members.resetPasswordEmailSent')
                        : t('entitySettings:members.resetPasswordSuccess'),
                    );
                  } catch {
                    toast.error(t('entitySettings:members.resetPasswordFail'));
                  }
                }}
                disabled={resetPassword.isPending}
                className="flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50"
              >
                {resetPassword.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Mail className="h-3.5 w-3.5" />
                )}
                {t('entitySettings:members.resetByEmail', { defaultValue: '이메일로 발송' })}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(t('entitySettings:members.generateTempPwConfirm', { defaultValue: '임시 비밀번호를 생성하시겠습니까?' }))) return;
                  try {
                    const res = await resetPassword.mutateAsync({ userId: member.userId, mode: 'generate' });
                    setTempPassword(res.tempPassword || null);
                    toast.success(t('entitySettings:members.tempPwGenerated', { defaultValue: '임시 비밀번호가 생성되었습니다' }));
                  } catch {
                    toast.error(t('entitySettings:members.resetPasswordFail'));
                  }
                }}
                disabled={resetPassword.isPending}
                className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
              >
                {resetPassword.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5" />
                )}
                {t('entitySettings:members.generateTempPw', { defaultValue: '임시 비밀번호 생성' })}
              </button>
            </div>
            {tempPassword && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                <code className="flex-1 text-sm font-mono text-red-800">{tempPassword}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    setCopiedPw(true);
                    setTimeout(() => setCopiedPw(false), 2000);
                  }}
                  className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-gray-600"
                >
                  {copiedPw ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
                <p className="text-xs text-red-600">
                  {t('entitySettings:members.tempPwWarning', { defaultValue: '지금만 표시됩니다. 안전하게 전달하세요.' })}
                </p>
              </div>
            )}
          </div>

          {/* Delete Member */}
          {canDelete && (
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {t('entitySettings:members.deleteWarning')}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (confirm(t('entitySettings:members.deleteConfirm'))) {
                    onDelete();
                  }
                }}
                disabled={deleting}
                className="ml-4 flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {t('entitySettings:members.deleteMember')}
              </button>
            </div>
          </div>
          )}
        </form>
      </div>
    </div>
  );
}
