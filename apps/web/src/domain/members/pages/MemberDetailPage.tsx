import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Landmark,
  Building2,
  Users,
  Star,
  User,
  Link2,
  Unlink,
  FolderOpen,
  Pencil,
  Check,
  X,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  LockOpen,
} from 'lucide-react';
import { useMemberDetail, useRemoveEntityRole, useUnlinkEmployee, useUpdateCompanyEmail, useUpdateMemberName, useUpdateMemberJobTitle, useApproveMember, useRejectMember, useUpdateMemberRole, useUpdateMemberLevelCode, useResetMemberPassword, useUnlockMember } from '../hooks/useMembers';
import { useRemoveCellMember } from '../hooks/useCells';
import { unitService } from '@/domain/settings/service/unit.service';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import AssignEntityModal from '../components/AssignEntityModal';
import AssignUnitModal from '../components/AssignUnitModal';
import AssignCellModal from '../components/AssignCellModal';
import LinkEmployeeModal from '../components/LinkEmployeeModal';
import StatusBadge from '../components/StatusBadge';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';
import ActionResultModal from '@/components/common/ActionResultModal';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['members', 'common']);
  const { timezone } = useTimezoneStore();
  const { data: member, isLoading } = useMemberDetail(id || '');
  const removeEntityRole = useRemoveEntityRole();
  const unlinkEmployee = useUnlinkEmployee();
  const removeCellMember = useRemoveCellMember();
  const queryClient = useQueryClient();
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCellModal, setShowCellModal] = useState(false);
  const [showLinkEmployeeModal, setShowLinkEmployeeModal] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingJobTitle, setEditingJobTitle] = useState(false);
  const [jobTitleDraft, setJobTitleDraft] = useState('');
  const updateCompanyEmail = useUpdateCompanyEmail();
  const updateMemberName = useUpdateMemberName();
  const updateMemberJobTitle = useUpdateMemberJobTitle();
  const approveMember = useApproveMember();
  const rejectMember = useRejectMember();
  const updateMemberRole = useUpdateMemberRole();
  const updateMemberLevelCode = useUpdateMemberLevelCode();
  const resetMemberPassword = useResetMemberPassword();
  const unlockMember = useUnlockMember();
  const currentUser = useAuthStore((s) => s.user);
  const canEditRoleLevel = currentUser?.level === 'ADMIN_LEVEL' || currentUser?.role === 'SUPER_ADMIN';

  // 비밀번호 초기화
  const [newPassword, setNewPassword] = useState('');

  // 역할/레벨 편집 상태
  const [editingRole, setEditingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState('');
  const [editingLevel, setEditingLevel] = useState(false);
  const [levelDraft, setLevelDraft] = useState('');

  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const showSuccessModal = (message?: string) => {
    setResultMessage(message || t('common:saved'));
  };

  const removeUnitRole = useMutation({
    mutationFn: (udrId: string) => unitService.removeUserRole(udrId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        {t('common:error')}
      </div>
    );
  }

  const handleRemoveEntityRole = async (eurId: string) => {
    if (!id) return;
    if (!confirm(t('members:memberDetail.confirmRemoveEntity'))) return;
    await removeEntityRole.mutateAsync({ memberId: id, eurId });
    showSuccessModal();
  };

  const handleRemoveUnitRole = async (udrId: string) => {
    if (!confirm(t('members:memberDetail.confirmRemoveUnit'))) return;
    await removeUnitRole.mutateAsync(udrId);
    showSuccessModal();
  };

  const handleRemoveCell = async (cellId: string) => {
    if (!id) return;
    if (!confirm(t('members:memberDetail.confirmRemoveCell'))) return;
    await removeCellMember.mutateAsync({ cellId, userId: id });
    queryClient.invalidateQueries({ queryKey: ['members', 'detail', id] });
    showSuccessModal();
  };

  const handleUnlinkEmployee = async (employeeId: string) => {
    if (!confirm(t('members:memberDetail.confirmUnlink'))) return;
    await unlinkEmployee.mutateAsync(employeeId);
    queryClient.invalidateQueries({ queryKey: ['members', 'detail', id] });
    showSuccessModal();
  };

  const handleSaveEmail = () => {
    updateCompanyEmail.mutate(
      { id: id!, companyEmail: emailDraft || null },
      {
        onSuccess: () => {
          setEditingEmail(false);
          showSuccessModal();
        },
      },
    );
  };

  const handleSaveName = () => {
    if (!nameDraft.trim() || nameDraft.trim().length < 2) return;
    updateMemberName.mutate(
      { id: id!, name: nameDraft.trim() },
      {
        onSuccess: () => {
          setEditingName(false);
          showSuccessModal();
        },
      },
    );
  };

  const handleSaveJobTitle = () => {
    updateMemberJobTitle.mutate(
      { id: id!, jobTitle: jobTitleDraft.trim() },
      {
        onSuccess: () => {
          setEditingJobTitle(false);
          showSuccessModal();
        },
      },
    );
  };

  const handleResetPassword = () => {
    if (!id || newPassword.length < 8) return;
    if (!confirm(t('members:memberDetail.confirmResetPassword'))) return;
    resetMemberPassword.mutate(
      { id, newPassword },
      {
        onSuccess: () => {
          setNewPassword('');
          showSuccessModal();
        },
      },
    );
  };

  const handleUnlockAccount = () => {
    if (!id) return;
    if (!confirm(t('members:memberDetail.confirmUnlock'))) return;
    unlockMember.mutate(id, {
      onSuccess: () => {
        showSuccessModal();
      },
    });
  };

  const handleSaveRole = () => {
    if (!roleDraft) return;
    updateMemberRole.mutate(
      { id: id!, role: roleDraft },
      {
        onSuccess: () => {
          setEditingRole(false);
          showSuccessModal();
        },
      },
    );
  };

  const handleSaveLevelCode = () => {
    if (!levelDraft) return;
    updateMemberLevelCode.mutate(
      { id: id!, levelCode: levelDraft },
      {
        onSuccess: () => {
          setEditingLevel(false);
          showSuccessModal();
        },
      },
    );
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/members')}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('members:memberDetail.title')} - {member.name}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm text-gray-500">{member.email}</span>
                <StatusBadge status={member.status || 'ACTIVE'} />
              </div>
            </div>
          </div>
          {/* 승인/거절 버튼 (PENDING + ADMIN only) */}
          {member.status === 'PENDING' && (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') && (
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!id || !window.confirm(t('members:memberList.rejectConfirm'))) return;
                  try {
                    await rejectMember.mutateAsync(id);
                    showSuccessModal(t('members:memberList.rejectSuccess'));
                  } catch { /* handled */ }
                }}
                disabled={rejectMember.isPending}
                className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
              >
                {rejectMember.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                {t('members:memberList.reject')}
              </button>
              <button
                onClick={async () => {
                  if (!id || !window.confirm(t('members:memberList.approveConfirm'))) return;
                  try {
                    await approveMember.mutateAsync(id);
                    showSuccessModal(t('members:memberList.approveSuccess'));
                  } catch { /* handled */ }
                }}
                disabled={approveMember.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {approveMember.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {t('members:memberList.approve')}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('members:memberDetail.basicInfo')}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* 이름 (편집 가능) */}
              <div>
                <dt className="text-xs font-medium text-gray-500">{t('members:memberList.name')}</dt>
                {editingName ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <input
                      type="text"
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') setEditingName(false);
                      }}
                    />
                    <button onClick={handleSaveName} disabled={updateMemberName.isPending} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingName(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-900">
                    <span>{member.name}</span>
                    <button
                      onClick={() => { setNameDraft(member.name); setEditingName(true); }}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={t('common:edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                )}
              </div>
              <InfoItem label={t('members:memberList.email')} value={member.email} />
              {/* 역할 (ADMIN/SUPER_ADMIN만 편집 가능) */}
              <div>
                <dt className="text-xs font-medium text-gray-500">{t('members:memberList.role')}</dt>
                {editingRole ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <select
                      value={roleDraft}
                      onChange={(e) => setRoleDraft(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    >
                      {['SUPER_ADMIN', 'ADMIN', 'MASTER', 'MANAGER', 'MEMBER', 'VIEWER'].map((r) => (
                        <option key={r} value={r}>{t(`members:roles.${r}`, { defaultValue: r })}</option>
                      ))}
                    </select>
                    <button onClick={handleSaveRole} disabled={updateMemberRole.isPending} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingRole(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-900">
                    <span>{t(`members:roles.${member.role}`, { defaultValue: member.role })}</span>
                    {canEditRoleLevel && (
                      <button
                        onClick={() => { setRoleDraft(member.role); setEditingRole(true); }}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title={t('common:edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </dd>
                )}
              </div>
              {/* 레벨 코드 (ADMIN/SUPER_ADMIN만 편집 가능) */}
              <div>
                <dt className="text-xs font-medium text-gray-500">{t('members:memberDetail.levelCode', { defaultValue: '레벨' })}</dt>
                {editingLevel ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <select
                      value={levelDraft}
                      onChange={(e) => setLevelDraft(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    >
                      <option value="ADMIN_LEVEL">{t('members:levels.ADMIN_LEVEL', { defaultValue: 'Admin Level' })}</option>
                      <option value="USER_LEVEL">{t('members:levels.USER_LEVEL', { defaultValue: 'User Level' })}</option>
                    </select>
                    <button onClick={handleSaveLevelCode} disabled={updateMemberLevelCode.isPending} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingLevel(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-900">
                    <span>{t(`members:levels.${(member as any).levelCode || 'USER_LEVEL'}`, { defaultValue: (member as any).levelCode || 'USER_LEVEL' })}</span>
                    {canEditRoleLevel && (
                      <button
                        onClick={() => { setLevelDraft((member as any).levelCode || 'USER_LEVEL'); setEditingLevel(true); }}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title={t('common:edit')}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </dd>
                )}
              </div>
              <InfoItem label={t('members:memberList.department')} value={member.unit} />
              {/* 직무 (편집 가능) */}
              <div>
                <dt className="text-xs font-medium text-gray-500">{t('members:memberDetail.jobTitle', { defaultValue: '직무' })}</dt>
                {editingJobTitle ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <input
                      type="text"
                      value={jobTitleDraft}
                      onChange={(e) => setJobTitleDraft(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveJobTitle();
                        if (e.key === 'Escape') setEditingJobTitle(false);
                      }}
                    />
                    <button onClick={handleSaveJobTitle} disabled={updateMemberJobTitle.isPending} className="rounded p-1 text-green-600 hover:bg-green-50"><Check className="h-4 w-4" /></button>
                    <button onClick={() => setEditingJobTitle(false)} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-900">
                    <span>{(member as any).jobTitle || '-'}</span>
                    <button
                      onClick={() => { setJobTitleDraft((member as any).jobTitle || ''); setEditingJobTitle(true); }}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={t('common:edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                )}
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">{t('members:memberDetail.companyEmail')}</dt>
                {editingEmail ? (
                  <div className="mt-0.5 flex items-center gap-1">
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEmail();
                        if (e.key === 'Escape') setEditingEmail(false);
                      }}
                    />
                    <button
                      onClick={handleSaveEmail}
                      disabled={updateCompanyEmail.isPending}
                      className="rounded p-1 text-green-600 hover:bg-green-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingEmail(false)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <dd className="mt-0.5 flex items-center gap-1 text-sm text-gray-900">
                    <span>{member.companyEmail || '-'}</span>
                    <button
                      onClick={() => {
                        setEmailDraft(member.companyEmail || '');
                        setEditingEmail(true);
                      }}
                      className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={t('common:edit')}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </dd>
                )}
              </div>
              <InfoItem
                label={t('members:memberDetail.joinedAt')}
                value={formatDateTimeInTz(member.createdAt, timezone, 'YYYY-MM-DD HH:mm')}
              />
            </div>
          </div>

          {/* 비밀번호 관리 (ADMIN_LEVEL만) */}
          {canEditRoleLevel && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('members:memberDetail.passwordSection')}
                </h2>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t('members:memberDetail.newPassword')}
                  </label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('members:memberDetail.newPasswordPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleResetPassword();
                    }}
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  disabled={newPassword.length < 8 || resetMemberPassword.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  {resetMemberPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t('members:memberDetail.resetPassword')}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {t('members:memberDetail.resetPasswordNote')}
              </p>
            </div>
          )}

          {/* 계정 잠금 상태 (잠금 중이거나 실패 횟수 > 0일 때만 표시, ADMIN_LEVEL만) */}
          {canEditRoleLevel && ((member.failedLoginCount ?? 0) > 0 || member.lockedUntil) && (
            <div className={`rounded-xl border p-6 ${
              member.lockedUntil && new Date(member.lockedUntil) > new Date()
                ? 'border-red-300 bg-red-50'
                : 'border-amber-200 bg-amber-50'
            }`}>
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className={`h-5 w-5 ${
                  member.lockedUntil && new Date(member.lockedUntil) > new Date()
                    ? 'text-red-500'
                    : 'text-amber-500'
                }`} />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('members:memberDetail.lockSection')}
                </h2>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1 text-sm">
                  <p className="text-gray-700">
                    <span className="font-medium">{t('members:memberDetail.failedLoginCount')}:</span>{' '}
                    <span className="font-semibold text-red-600">{member.failedLoginCount ?? 0}</span>
                  </p>
                  {member.lockedUntil && (
                    <p className="text-gray-700">
                      <span className="font-medium">{t('members:memberDetail.lockedUntil')}:</span>{' '}
                      <span className="font-semibold text-red-600">
                        {formatDateTimeInTz(member.lockedUntil, timezone, 'YYYY-MM-DD HH:mm:ss')}
                      </span>
                      {new Date(member.lockedUntil) > new Date() && (
                        <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          {t('members:memberDetail.locked')}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleUnlockAccount}
                  disabled={unlockMember.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {unlockMember.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LockOpen className="h-4 w-4" />
                  )}
                  {t('members:memberDetail.unlockAccount')}
                </button>
              </div>
            </div>
          )}

          {/* 소속 법인 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('members:memberDetail.entitySection')}
                </h2>
              </div>
              <button
                onClick={() => setShowEntityModal(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t('members:memberDetail.addEntity')}
              </button>
            </div>

            {member.entityRoles.length === 0 ? (
              <p className="text-sm text-gray-400">{t('members:memberDetail.noEntities')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.entityName')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.entityCode')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.entityRole')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.status')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        {t('members:memberDetail.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {member.entityRoles.map((er) => (
                      <tr key={er.eurId}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{er.entityName}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {er.entityCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {t(`members:memberDetail.entityRoles.${er.role}`, { defaultValue: er.role })}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            er.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {er.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleRemoveEntityRole(er.eurId)}
                            className="text-red-500 hover:text-red-700"
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

          {/* 소속 부서 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('members:memberDetail.unitSection')}
                </h2>
              </div>
              <button
                onClick={() => setShowDeptModal(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t('members:memberDetail.addUnit')}
              </button>
            </div>

            {member.unitRoles.length === 0 ? (
              <p className="text-sm text-gray-400">{t('members:memberDetail.noUnits')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.unitName')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.deptRole')}
                      </th>
                      <th className="px-4 py-2 text-center font-medium text-gray-500">
                        {t('members:memberDetail.isPrimary')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.entityName')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        {t('members:memberDetail.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {member.unitRoles.map((dr) => (
                      <tr key={dr.uurId}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{dr.unitName}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {t(`members:memberDetail.deptRoles.${dr.role}`, { defaultValue: dr.role })}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {dr.isPrimary && <Star className="mx-auto h-4 w-4 text-amber-400" />}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {dr.entityName} ({dr.entityCode})
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleRemoveUnitRole(dr.uurId)}
                            className="text-red-500 hover:text-red-700"
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

          {/* 소속 그룹 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('members:memberDetail.cellSection')}
                </h2>
              </div>
              <button
                onClick={() => setShowCellModal(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t('members:memberDetail.addCell')}
              </button>
            </div>

            {!member.memberCells || member.memberCells.length === 0 ? (
              <p className="text-sm text-gray-400">{t('members:memberDetail.noCells')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:cellForm.name')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.entityName')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        {t('members:memberDetail.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {member.memberCells.map((mc) => (
                      <tr key={mc.cellId}>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{mc.name}</td>
                        <td className="px-4 py-2.5 text-gray-600">
                          {mc.entityName ? `${mc.entityName} (${mc.entityCode})` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleRemoveCell(mc.cellId)}
                            className="text-red-500 hover:text-red-700"
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

          {/* HR 직원 연결 현황 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-500" />
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('members:memberDetail.hrSection')}
                </h2>
              </div>
              <button
                onClick={() => setShowLinkEmployeeModal(true)}
                className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Link2 className="h-4 w-4" />
                {t('members:memberDetail.linkEmployee')}
              </button>
            </div>

            {member.hrEmployees.length === 0 ? (
              <p className="text-sm text-gray-400">{t('members:memberDetail.noHrEmployees')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.entityCode')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.employeeCode')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.fullName')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.hrDepartment')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.position')}
                      </th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">
                        {t('members:memberDetail.status')}
                      </th>
                      <th className="px-4 py-2 text-right font-medium text-gray-500">
                        {t('members:memberDetail.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {member.hrEmployees.map((emp) => (
                      <tr key={emp.employeeId}>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {emp.entityCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600">{emp.employeeCode}</td>
                        <td className="px-4 py-2.5 font-medium text-gray-900">{emp.fullName}</td>
                        <td className="px-4 py-2.5 text-gray-600">{emp.department}</td>
                        <td className="px-4 py-2.5 text-gray-600">{emp.position}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            emp.status === 'ACTIVE'
                              ? 'bg-green-50 text-green-700'
                              : emp.status === 'PROBATION'
                              ? 'bg-yellow-50 text-yellow-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <button
                            onClick={() => handleUnlinkEmployee(emp.employeeId)}
                            className="text-red-500 hover:text-red-700"
                            title={t('members:memberDetail.unlinkEmployee')}
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        <AssignEntityModal
          isOpen={showEntityModal}
          onClose={() => setShowEntityModal(false)}
          memberId={id || ''}
          existingEntityIds={member.entityRoles.map((er) => er.entityId)}
          onSuccess={() => showSuccessModal()}
        />
        <AssignUnitModal
          isOpen={showDeptModal}
          onClose={() => setShowDeptModal(false)}
          memberId={id || ''}
          existingDeptIds={member.unitRoles.map((dr) => dr.unitId)}
          onSuccess={() => showSuccessModal()}
        />
        <AssignCellModal
          isOpen={showCellModal}
          onClose={() => setShowCellModal(false)}
          memberId={id || ''}
          existingCellIds={(member.memberCells || []).map((mc) => mc.cellId)}
          onSuccess={() => showSuccessModal()}
        />
        <LinkEmployeeModal
          isOpen={showLinkEmployeeModal}
          onClose={() => setShowLinkEmployeeModal(false)}
          memberId={id || ''}
          onSuccess={() => showSuccessModal()}
        />
      </div>

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

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900">{value}</dd>
    </div>
  );
}
