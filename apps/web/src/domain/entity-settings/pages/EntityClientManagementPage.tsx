import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Send, RefreshCw, X, Users, Mail, Building2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { entityClientApiService, type ClientListItem, type ClientDetail } from '../service/entity-client.service';

export default function EntityClientManagementPage() {
  const { t } = useTranslation('entitySettings');
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // 모달 상태
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTargetId, setInviteTargetId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const data = await entityClientApiService.getClients();
      setClients(data);
    } catch {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const handleSelectClient = async (cliId: string) => {
    try {
      const data = await entityClientApiService.getClientDetail(cliId);
      setSelectedClient(data);
    } catch {
      toast.error('Failed to load client details');
    }
  };

  const handleDelete = async (cliId: string) => {
    if (!confirm(t('clients.confirmDelete', { defaultValue: 'Are you sure you want to delete this client?' }))) return;
    try {
      await entityClientApiService.deleteClient(cliId);
      toast.success(t('clients.deleted', { defaultValue: 'Client deleted' }));
      setSelectedClient(null);
      loadClients();
    } catch {
      toast.error('Failed to delete client');
    }
  };

  const handleResendInvitation = async (cliId: string, civId: string) => {
    try {
      await entityClientApiService.resendInvitation(cliId, civId);
      toast.success(t('clients.invite.resent', { defaultValue: 'Invitation resent' }));
      if (selectedClient) handleSelectClient(selectedClient.id);
    } catch {
      toast.error('Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (cliId: string, civId: string) => {
    try {
      await entityClientApiService.cancelInvitation(cliId, civId);
      toast.success(t('clients.invite.cancelled', { defaultValue: 'Invitation cancelled' }));
      if (selectedClient) handleSelectClient(selectedClient.id);
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  // 상세 뷰
  if (selectedClient) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl p-6">
          <button
            onClick={() => setSelectedClient(null)}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('clients.backToList', { defaultValue: 'Back to list' })}
          </button>

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{selectedClient.companyName}</h2>
              <p className="text-sm text-gray-500">{selectedClient.code} · {selectedClient.type} · {selectedClient.status}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setInviteTargetId(selectedClient.id); setShowInviteModal(true); }}
                className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Send className="h-4 w-4" />
                {t('clients.inviteClient', { defaultValue: 'Invite Client' })}
              </button>
              <button
                onClick={() => handleDelete(selectedClient.id)}
                className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                {t('clients.delete', { defaultValue: 'Delete' })}
              </button>
            </div>
          </div>

          {/* 사용자 목록 */}
          <div className="mb-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Users className="h-4 w-4" />
              {t('clients.users', { defaultValue: 'Users' })} ({selectedClient.users.length})
            </h3>
            {selectedClient.users.length === 0 ? (
              <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-400">
                {t('clients.noUsers', { defaultValue: 'No users registered' })}
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">{t('clients.email', { defaultValue: 'Email' })}</th>
                      <th className="px-4 py-2">{t('clients.name', { defaultValue: 'Name' })}</th>
                      <th className="px-4 py-2">{t('clients.role', { defaultValue: 'Role' })}</th>
                      <th className="px-4 py-2">{t('clients.status', { defaultValue: 'Status' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedClient.users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-2.5 text-gray-700">{u.email}</td>
                        <td className="px-4 py-2.5 text-gray-900">{u.name}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 초대 목록 */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Mail className="h-4 w-4" />
              {t('clients.invitations', { defaultValue: 'Invitations' })} ({selectedClient.invitations.length})
            </h3>
            {selectedClient.invitations.length === 0 ? (
              <p className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center text-sm text-gray-400">
                {t('clients.noInvitations', { defaultValue: 'No invitations' })}
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-2">{t('clients.email', { defaultValue: 'Email' })}</th>
                      <th className="px-4 py-2">{t('clients.role', { defaultValue: 'Role' })}</th>
                      <th className="px-4 py-2">{t('clients.status', { defaultValue: 'Status' })}</th>
                      <th className="px-4 py-2">{t('clients.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selectedClient.invitations.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-4 py-2.5 text-gray-700">{inv.email}</td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                            {inv.role}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            inv.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700' :
                            inv.status === 'ACCEPTED' ? 'bg-green-50 text-green-700' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          {inv.status === 'PENDING' && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleResendInvitation(selectedClient.id, inv.id)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                                title={t('clients.invite.resend', { defaultValue: 'Resend' })}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleCancelInvitation(selectedClient.id, inv.id)}
                                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                                title={t('clients.invite.cancel', { defaultValue: 'Cancel' })}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && inviteTargetId && (
          <InviteModal
            cliId={inviteTargetId}
            onClose={() => { setShowInviteModal(false); setInviteTargetId(null); }}
            onSuccess={() => {
              setShowInviteModal(false);
              setInviteTargetId(null);
              if (selectedClient) handleSelectClient(selectedClient.id);
            }}
          />
        )}
      </div>
    );
  }

  // 목록 뷰
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {t('clients.title', { defaultValue: 'Client Management' })}
          </h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('clients.addClient', { defaultValue: 'Add Client' })}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-12 text-center">
            <Building2 className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">{t('clients.noClients', { defaultValue: 'No clients registered' })}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">{t('clients.companyName', { defaultValue: 'Company' })}</th>
                  <th className="px-4 py-3">{t('clients.type', { defaultValue: 'Type' })}</th>
                  <th className="px-4 py-3">{t('clients.statusLabel', { defaultValue: 'Status' })}</th>
                  <th className="px-4 py-3 text-center">{t('clients.userCount', { defaultValue: 'Users' })}</th>
                  <th className="px-4 py-3 text-center">{t('clients.invitationCount', { defaultValue: 'Invitations' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients.map((cli) => (
                  <tr
                    key={cli.id}
                    onClick={() => handleSelectClient(cli.id)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{cli.companyName}</div>
                      <div className="text-xs text-gray-400">{cli.code}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{cli.type}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        cli.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cli.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{cli.userCount}</td>
                    <td className="px-4 py-3 text-center">
                      {cli.invitationCount > 0 ? (
                        <span className="rounded-full bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-700">
                          {cli.invitationCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Client Modal */}
      {showCreateModal && (
        <CreateClientModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadClients(); }}
        />
      )}
    </div>
  );
}

/* ── Create Client Modal ── */
function CreateClientModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation('entitySettings');
  const [companyName, setCompanyName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('GENERAL');
  const [country, setCountry] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await entityClientApiService.createClient({ company_name: companyName, code, type, country: country || undefined });
      toast.success(t('clients.created', { defaultValue: 'Client created' }));
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create client');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('clients.addClient', { defaultValue: 'Add Client' })}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.companyName', { defaultValue: 'Company Name' })} *</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.code', { defaultValue: 'Client Code' })} *</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required maxLength={20}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.type', { defaultValue: 'Type' })}</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="GENERAL">General</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="SMB">SMB</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.country', { defaultValue: 'Country' })}</label>
            <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={5}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <button type="submit" disabled={saving}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '...' : t('clients.create', { defaultValue: 'Create' })}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Invite Client Modal ── */
function InviteModal({ cliId, onClose, onSuccess }: { cliId: string; onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation('entitySettings');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('CLIENT_MEMBER');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await entityClientApiService.inviteClient(cliId, { email, name: name || undefined, role });
      toast.success(t('clients.invite.sent', { defaultValue: 'Invitation sent' }));
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{t('clients.inviteClient', { defaultValue: 'Invite Client' })}</h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.email', { defaultValue: 'Email' })} *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.name', { defaultValue: 'Name' })}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('clients.role', { defaultValue: 'Role' })}</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
              <option value="CLIENT_MEMBER">{t('clients.roleOptions.CLIENT_MEMBER', { defaultValue: 'Client Member' })}</option>
              <option value="CLIENT_ADMIN">{t('clients.roleOptions.CLIENT_ADMIN', { defaultValue: 'Client Admin' })}</option>
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {saving ? '...' : t('clients.invite.send', { defaultValue: 'Send Invitation' })}
          </button>
        </form>
      </div>
    </div>
  );
}
