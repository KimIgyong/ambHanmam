import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Search,
  MailPlus,
  RotateCw,
  XCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Ban,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminService, type PartnerInvitationItem } from '@/domain/admin/service/admin.service';
import { partnerAdminService, type PartnerOrg } from '@/domain/admin/service/partner-admin.service';
import { entitySettingsService } from '@/domain/entity-settings/service/entity-settings.service';

type Tab = 'send' | 'history';
const STATUS_TABS = ['ALL', 'PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'] as const;

const STATUS_BADGE: Record<string, { icon: React.ElementType; color: string }> = {
  PENDING: { icon: Clock, color: 'bg-yellow-50 text-yellow-700' },
  ACCEPTED: { icon: CheckCircle2, color: 'bg-green-50 text-green-700' },
  EXPIRED: { icon: AlertCircle, color: 'bg-red-50 text-red-700' },
  CANCELLED: { icon: Ban, color: 'bg-gray-100 text-gray-500' },
};

export default function PartnerInvitationsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState<Tab>('history');

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Send className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('admin:partnerInvitations.title', { defaultValue: '파트너 초대 관리' })}
            </h1>
            <p className="text-sm text-gray-500">
              {t('admin:partnerInvitations.description', { defaultValue: '파트너 사용자 초대 발송 및 이력을 관리합니다.' })}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('send')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'send' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <MailPlus className="mr-2 inline h-4 w-4" />
            {t('admin:partnerInvitations.tabs.send', { defaultValue: '새 초대 발송' })}
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <Clock className="mr-2 inline h-4 w-4" />
            {t('admin:partnerInvitations.tabs.history', { defaultValue: '초대 이력' })}
          </button>
        </div>

        {activeTab === 'send' ? <SendInvitationTab /> : <InvitationHistoryTab />}
      </div>
    </div>
  );
}

/* ── Send Invitation Tab ── */

function SendInvitationTab() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();

  const { data: partners = [] } = useQuery({
    queryKey: ['admin', 'partners'],
    queryFn: () => partnerAdminService.getPartners(),
  });

  const [rows, setRows] = useState<Array<{ partnerId: string; email: string; role: string }>>([
    { partnerId: '', email: '', role: 'PARTNER_MEMBER' },
  ]);
  const [sending, setSending] = useState(false);

  const addRow = () => setRows((r) => [...r, { partnerId: '', email: '', role: 'PARTNER_MEMBER' }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: string, value: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));

  const handleSend = async () => {
    const validRows = rows.filter((r) => r.partnerId && r.email);
    if (validRows.length === 0) {
      toast.error(t('admin:partnerInvitations.send.noRows', { defaultValue: '초대할 정보를 입력하세요.' }));
      return;
    }

    setSending(true);
    let successCount = 0;
    let errorCount = 0;

    for (const row of validRows) {
      try {
        await entitySettingsService.inviteMember({
          email: row.email,
          role: row.role,
          department: 'Partner',
          level_code: 'PARTNER_LEVEL',
          partner_id: row.partnerId,
          auto_approve: true,
        });
        successCount++;
      } catch (err: unknown) {
        errorCount++;
        const error = err as Error & { response?: { data?: { error?: { message?: string } } } };
        toast.error(`${row.email}: ${error.response?.data?.error?.message || 'Failed'}`);
      }
    }

    setSending(false);
    if (successCount > 0) {
      toast.success(
        t('admin:partnerInvitations.send.success', {
          defaultValue: '{{count}}건의 초대가 발송되었습니다.',
          count: successCount,
        }),
      );
      setRows([{ partnerId: '', email: '', role: 'PARTNER_MEMBER' }]);
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-invitations'] });
    }
    if (errorCount > 0) {
      toast.error(
        t('admin:partnerInvitations.send.errors', {
          defaultValue: '{{count}}건의 초대 발송에 실패했습니다.',
          count: errorCount,
        }),
      );
    }
  };

  const activePartners = partners.filter((p: PartnerOrg) => p.status === 'ACTIVE');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-base font-semibold text-gray-900">
        {t('admin:partnerInvitations.send.title', { defaultValue: '파트너 사용자 초대' })}
      </h2>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Partner select */}
            <select
              value={row.partnerId}
              onChange={(e) => updateRow(i, 'partnerId', e.target.value)}
              className="w-48 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">
                {t('admin:partnerInvitations.send.selectPartner', { defaultValue: '파트너 선택' })}
              </option>
              {activePartners.map((p: PartnerOrg) => (
                <option key={p.id} value={p.id}>
                  {p.companyName} ({p.code})
                </option>
              ))}
            </select>

            {/* Email */}
            <input
              type="email"
              value={row.email}
              onChange={(e) => updateRow(i, 'email', e.target.value)}
              placeholder={t('admin:partnerInvitations.send.emailPlaceholder', { defaultValue: 'partner@example.com' })}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            {/* Role select */}
            <select
              value={row.role}
              onChange={(e) => updateRow(i, 'role', e.target.value)}
              className="w-40 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="PARTNER_MEMBER">Partner Member</option>
              <option value="PARTNER_ADMIN">Partner Admin</option>
            </select>

            {/* Remove row */}
            {rows.length > 1 && (
              <button
                onClick={() => removeRow(i)}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={addRow}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          + {t('admin:partnerInvitations.send.addRow', { defaultValue: '추가' })}
        </button>

        <button
          onClick={handleSend}
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {sending
            ? t('admin:partnerInvitations.send.sending', { defaultValue: '발송 중...' })
            : t('admin:partnerInvitations.send.sendBtn', { defaultValue: '초대 발송' })}
        </button>
      </div>
    </div>
  );
}

/* ── Invitation History Tab ── */

function InvitationHistoryTab() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'partner-invitations', { search, status: statusFilter === 'ALL' ? undefined : statusFilter, page }],
    queryFn: () =>
      adminService.getPartnerInvitations({
        search: search || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 50,
      }),
  });

  const resendMutation = useMutation({
    mutationFn: (id: string) => adminService.resendPartnerInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-invitations'] });
      toast.success(t('admin:partnerInvitations.history.resent', { defaultValue: '초대를 재발송했습니다.' }));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminService.cancelPartnerInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'partner-invitations'] });
      toast.success(t('admin:partnerInvitations.history.cancelled', { defaultValue: '초대가 취소되었습니다.' }));
    },
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      {/* Search + filter */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={t('admin:partnerInvitations.history.searchPlaceholder', { defaultValue: '이메일 또는 파트너명 검색...' })}
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200 px-5">
        {STATUS_TABS.map((st) => (
          <button
            key={st}
            onClick={() => { setStatusFilter(st); setPage(1); }}
            className={`px-3 py-2.5 text-sm font-medium transition-colors ${statusFilter === st ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {st === 'ALL' ? t('common:all', { defaultValue: '전체' }) : st}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-500">
          {t('admin:partnerInvitations.history.noInvitations', { defaultValue: '초대 이력이 없습니다.' })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-left text-xs font-medium text-gray-500">
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.email', { defaultValue: '이메일' })}</th>
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.partner', { defaultValue: '파트너' })}</th>
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.role', { defaultValue: '역할' })}</th>
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.status', { defaultValue: '상태' })}</th>
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.sendCount', { defaultValue: '발송횟수' })}</th>
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.expiresAt', { defaultValue: '만료일' })}</th>
                <th className="px-5 py-3">{t('admin:partnerInvitations.history.table.createdAt', { defaultValue: '생성일' })}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((inv: PartnerInvitationItem) => {
                const badge = STATUS_BADGE[inv.status] || STATUS_BADGE.PENDING;
                const Icon = badge.icon;
                return (
                  <tr key={inv.invitationId} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 font-medium text-gray-900">{inv.email}</td>
                    <td className="px-5 py-3 text-gray-600">{inv.partnerName || '-'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{inv.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                        <Icon className="h-3 w-3" />
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-gray-600">{inv.sendCount}</td>
                    <td className="px-5 py-3 text-gray-600">
                      {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      {inv.status === 'PENDING' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => resendMutation.mutate(inv.invitationId)}
                            disabled={resendMutation.isPending}
                            className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                            title={t('admin:partnerInvitations.history.actions.resend', { defaultValue: '재발송' })}
                          >
                            <RotateCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t('admin:partnerInvitations.history.confirmCancel', { defaultValue: '이 초대를 취소하시겠습니까?' }))) {
                                cancelMutation.mutate(inv.invitationId);
                              }
                            }}
                            disabled={cancelMutation.isPending}
                            className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                            title={t('admin:partnerInvitations.history.actions.cancel', { defaultValue: '취소' })}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {inv.status === 'EXPIRED' && (
                        <button
                          onClick={() => resendMutation.mutate(inv.invitationId)}
                          disabled={resendMutation.isPending}
                          className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                          title={t('admin:partnerInvitations.history.actions.resend', { defaultValue: '재발송' })}
                        >
                          <RotateCw className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3">
          <span className="text-sm text-gray-500">
            {t('common:pagination.total', { defaultValue: '총 {{count}}건', count: total })}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded px-3 py-1 text-sm ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
