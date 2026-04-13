import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Building2, Send, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import {
  usePartnerAdminList,
  useCreatePartnerAdmin,
  useDeletePartnerAdmin,
} from '../hooks/usePartnerAdmin';
import { entitySettingsService } from '@/domain/entity-settings/service/entity-settings.service';
import type { PartnerOrg } from '../service/partner-admin.service';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-500',
  SUSPENDED: 'bg-orange-100 text-orange-700',
};

export default function PartnerManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<PartnerOrg | null>(null);

  const { data: partners = [], isLoading } = usePartnerAdminList(debouncedSearch || undefined);
  const deleteMutation = useDeletePartnerAdmin();

  const handleDelete = (partner: PartnerOrg) => {
    if (!window.confirm(t('admin:partner.deleteConfirm', { defaultValue: 'Delete this partner?' }))) return;
    deleteMutation.mutate(partner.id, {
      onSuccess: () => toast.success(t('admin:partner.deleted', { defaultValue: 'Partner deleted' })),
      onError: () => toast.error('Failed to delete partner'),
    });
  };

  const handleInvite = (partner: PartnerOrg) => {
    setInviteTarget(partner);
    setShowInviteModal(true);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <Building2 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('admin:partner.title', { defaultValue: 'Partner Management' })}
              </h1>
              <p className="text-sm text-gray-500">
                {t('admin:partner.subtitle', { defaultValue: 'Manage partner organizations and send partner invitations' })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('admin:partner.create', { defaultValue: 'Add Partner' })}
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('admin:partner.searchPlaceholder', { defaultValue: 'Search by name or code...' })}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : partners.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              {t('admin:partner.noPartners', { defaultValue: 'No partners registered' })}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {t('admin:partner.code', { defaultValue: 'Code' })}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {t('admin:partner.companyName', { defaultValue: 'Company' })}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {t('admin:partner.contactEmail', { defaultValue: 'Contact' })}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    {t('admin:partner.status', { defaultValue: 'Status' })}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                    {t('common:actions', { defaultValue: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {partners.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {p.code}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{p.companyName}</div>
                      {p.companyNameLocal && (
                        <div className="text-xs text-gray-400">{p.companyNameLocal}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {p.contactEmail || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] || ''}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleInvite(p)}
                          className="rounded p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"
                          title={t('admin:partner.inviteUser', { defaultValue: 'Invite User' })}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p)}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title={t('common:delete', { defaultValue: 'Delete' })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreatePartnerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />
      )}

      {showInviteModal && inviteTarget && (
        <InvitePartnerUserModal
          partner={inviteTarget}
          onClose={() => { setShowInviteModal(false); setInviteTarget(null); }}
        />
      )}
    </div>
  );
}

/* ── Create Partner Modal ── */
function CreatePartnerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t } = useTranslation(['admin', 'common']);
  const createMutation = useCreatePartnerAdmin();
  const [form, setForm] = useState({
    code: '',
    company_name: '',
    company_name_local: '',
    country: '',
    contact_name: '',
    contact_email: '',
    note: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        code: form.code,
        company_name: form.company_name,
        company_name_local: form.company_name_local || undefined,
        country: form.country || undefined,
        contact_name: form.contact_name || undefined,
        contact_email: form.contact_email || undefined,
        note: form.note || undefined,
      });
      toast.success(t('admin:partner.created', { defaultValue: 'Partner created' }));
      onSuccess();
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to create partner');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('admin:partner.create', { defaultValue: 'Add Partner' })}
          </h3>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.code', { defaultValue: 'Partner Code' })} *
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.companyName', { defaultValue: 'Company Name' })} *
            </label>
            <input
              type="text"
              required
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.companyNameLocal', { defaultValue: 'Local Name' })}
            </label>
            <input
              type="text"
              value={form.company_name_local}
              onChange={(e) => setForm((f) => ({ ...f, company_name_local: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('admin:partner.country', { defaultValue: 'Country' })}
              </label>
              <input
                type="text"
                maxLength={5}
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('admin:partner.contactName', { defaultValue: 'Contact Name' })}
              </label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.contactEmail', { defaultValue: 'Contact Email' })}
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.note', { defaultValue: 'Note' })}
            </label>
            <textarea
              rows={2}
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? '...' : t('common:create', { defaultValue: 'Create' })}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Invite Partner User Modal ── */
function InvitePartnerUserModal({ partner, onClose }: { partner: PartnerOrg; onClose: () => void }) {
  const { t } = useTranslation(['admin', 'common', 'settings']);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PARTNER_MEMBER');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await entitySettingsService.inviteMember({
        email,
        role,
        department: 'Partner',
        level_code: 'PARTNER_LEVEL',
        partner_id: partner.id,
        auto_approve: true,
      });
      toast.success(t('admin:partner.inviteSent', { defaultValue: 'Invitation sent to {email}', email }));
      onClose();
    } catch (err: unknown) {
      const error = err as Error & { response?: { data?: { error?: { message?: string } } } };
      toast.error(error.response?.data?.error?.message || 'Failed to send invitation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t('admin:partner.inviteUser', { defaultValue: 'Invite Partner User' })}
            </h3>
            <p className="text-sm text-gray-500">{partner.companyName} ({partner.code})</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.email', { defaultValue: 'Email' })} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="partner@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('admin:partner.role', { defaultValue: 'Role' })}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="PARTNER_MEMBER">
                {t('settings:roles.PARTNER_MEMBER', { defaultValue: 'Partner Member' })}
              </option>
              <option value="PARTNER_ADMIN">
                {t('settings:roles.PARTNER_ADMIN', { defaultValue: 'Partner Admin' })}
              </option>
            </select>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '...' : t('admin:partner.sendInvitation', { defaultValue: 'Send Invitation' })}
          </button>
        </form>
      </div>
    </div>
  );
}
