import { useState } from 'react';
import { Plus, Mail, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  useInvitationList,
  useCancelInvitation,
  useResendInvitation,
  useDeleteInvitation,
} from '../hooks/useInvitations';
import { Link } from 'react-router-dom';
import InvitationFormModal from './InvitationFormModal';
import { LocalDateTime } from '@/components/common/LocalDateTime';

export default function InvitationListTab() {
  const { data: invitations, isLoading } = useInvitationList();
  const [formOpen, setFormOpen] = useState(false);
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();
  const deleteInvitation = useDeleteInvitation();
  const { t } = useTranslation(['members', 'common']);
  const [resultModal, setResultModal] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-500',
    EXPIRED: 'bg-red-100 text-red-700',
  };

  const handleResend = async (id: string, email: string) => {
    try {
      await resendInvitation.mutateAsync(id);
      setResultModal({
        type: 'success',
        message: t('members:invitationList.resendSuccessDesc', { email }),
      });
    } catch {
      setResultModal({
        type: 'error',
        message: t('members:invitationList.resendErrorDesc', { email }),
      });
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          {t('members:invitationList.sendInvitation')}
        </button>
      </div>

      {!invitations || invitations.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Mail className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            {t('members:invitationList.noInvitations')}
          </p>
          <p className="mt-1 text-sm text-gray-400">
            {t('members:invitationList.noInvitationsDesc')}
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('members:invitationList.sendFirst')}
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('members:invitationList.email')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('members:invitationList.role')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('members:invitationList.department')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('members:invitationList.status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('members:invitationList.invitedBy')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  {t('members:invitationList.sentAt')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invitations.map((inv) => (
                <tr key={inv.invitationId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                    {inv.acceptedUserId ? (
                      <Link
                        to={`/admin/members/${inv.acceptedUserId}`}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline"
                      >
                        {inv.email}
                      </Link>
                    ) : (
                      inv.email
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {t(`members:roles.${inv.role}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {inv.unit}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[inv.status] || ''}`}
                    >
                      {t(`members:status.${inv.status}`)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {inv.inviterName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                    {inv.lastSentAt
                      ? <LocalDateTime value={inv.lastSentAt} format='YYYY-MM-DD HH:mm' />
                      : '-'}
                    {inv.sendCount > 1 && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({inv.sendCount}{t('members:invitationList.sendCountUnit')})
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {inv.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() =>
                            handleResend(inv.invitationId, inv.email)
                          }
                          disabled={resendInvitation.isPending}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          {t('members:invitationList.resend')}
                        </button>
                        <button
                          onClick={() =>
                            cancelInvitation.mutate(inv.invitationId)
                          }
                          disabled={cancelInvitation.isPending}
                          className="text-red-600 hover:text-red-800"
                        >
                          {t('members:invitationList.cancel')}
                        </button>
                      </div>
                    )}
                    {(inv.status === 'CANCELLED' || inv.status === 'EXPIRED') && (
                      <button
                        onClick={() =>
                          deleteInvitation.mutate(inv.invitationId)
                        }
                        disabled={deleteInvitation.isPending}
                        className="text-gray-400 hover:text-red-600"
                      >
                        {t('members:invitationList.delete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <InvitationFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
      />

      {/* 재발송 결과 모달 */}
      {resultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <div className="flex flex-col items-center py-4">
              {resultModal.type === 'success' ? (
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              ) : (
                <XCircle className="h-12 w-12 text-red-500" />
              )}
              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                {resultModal.type === 'success'
                  ? t('members:invitationList.resendSuccessTitle')
                  : t('members:invitationList.resendErrorTitle')}
              </h3>
              <p className="mt-2 text-center text-sm text-gray-600">
                {resultModal.message}
              </p>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setResultModal(null)}
                className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                {t('common:confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
