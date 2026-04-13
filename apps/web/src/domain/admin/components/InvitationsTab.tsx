import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, RotateCw, X } from 'lucide-react';
import { useInvitationList, useCancelInvitation, useResendInvitation } from '@/domain/members/hooks/useInvitations';

const STATUS_FILTERS = ['', 'PENDING', 'ACCEPTED', 'EXPIRED', 'CANCELLED'];

export default function InvitationsTab() {
  const { t } = useTranslation(['totalUsers', 'members']);
  const [statusFilter, setStatusFilter] = useState('');
  const { data: invitations, isLoading } = useInvitationList();
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  const filtered = invitations?.filter(
    (inv) => !statusFilter || inv.status === statusFilter,
  );

  const handleCancel = async (id: string) => {
    if (window.confirm(t('totalUsers:invitations.cancelConfirm'))) {
      await cancelInvitation.mutateAsync(id);
    }
  };

  const handleResend = async (id: string) => {
    await resendInvitation.mutateAsync(id);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {s ? t(`members:status.${s}`) : t('totalUsers:allStatus')}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      ) : !filtered || filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-500">{t('totalUsers:noData')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.email')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.role')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:invitations.invitedBy')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:invitations.expiresAt')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{t('totalUsers:invitations.sendCount')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{t('totalUsers:col.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map((inv) => (
                <tr key={inv.invitationId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{inv.email}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {t(`members:roles.${inv.role}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <InvStatusBadge status={inv.status} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{inv.inviterName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {new Date(inv.expiresAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{inv.sendCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      {inv.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleResend(inv.invitationId)}
                            disabled={resendInvitation.isPending}
                            className="text-violet-600 hover:text-violet-800"
                            title={t('members:invitationList.resend')}
                          >
                            <RotateCw className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(inv.invitationId)}
                            disabled={cancelInvitation.isPending}
                            className="text-red-500 hover:text-red-700"
                            title={t('members:invitationList.cancel')}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
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

function InvStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation('members');
  const colorMap: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-500'}`}>
      {t(`status.${status}`)}
    </span>
  );
}
