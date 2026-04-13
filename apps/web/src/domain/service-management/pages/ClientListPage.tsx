import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useClientList, useCreateClient } from '../hooks/useClient';

export default function ClientListPage() {
  const { t } = useTranslation(['service', 'common']);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const debouncedSearch = useDebounce(searchInput, 500);
  const { data: clients, isLoading } = useClientList({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    search: debouncedSearch || undefined,
  });
  const createClient = useCreateClient();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'COMPANY', company_name: '', company_name_local: '', country: '', industry: '', note: '' });

  const handleCreate = async () => {
    if (!form.company_name) return;
    await createClient.mutateAsync(form);
    setShowForm(false);
    setForm({ type: 'COMPANY', company_name: '', company_name_local: '', country: '', industry: '', note: '' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t('service:client.title')}</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            {t('service:client.add')}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder={t('common:search')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('service:client.status')}: All</option>
            {['ACTIVE', 'INACTIVE', 'PROSPECT', 'CHURNED'].map((s) => (
              <option key={s} value={s}>{t(`service:status.${s}`)}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('service:client.type')}: All</option>
            {['COMPANY', 'INDIVIDUAL'].map((tp) => (
              <option key={tp} value={tp}>{t(`service:clientType.${tp}`)}</option>
            ))}
          </select>
        </div>

        {/* Client Table */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-cyan-600" />
          </div>
        ) : !clients?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Users className="h-12 w-12 mb-3" />
            <p className="text-sm">{t('service:client.noClients')}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.companyName')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.code')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.country')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.status')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('service:client.subscriptions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr
                    key={client.clientId}
                    onClick={() => navigate(`/service/clients/${client.clientId}`)}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {client.companyName}
                      {client.companyNameLocal && <span className="text-xs text-gray-400 ml-1">({client.companyNameLocal})</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{client.code}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{t(`service:clientType.${client.type}`)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{client.country || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        client.status === 'PROSPECT' ? 'bg-blue-100 text-blue-700' :
                        client.status === 'CHURNED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t(`service:status.${client.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{client.subscriptionCount ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:client.add')}</h2>
              <div className="space-y-3">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {['COMPANY', 'INDIVIDUAL'].map((tp) => (
                    <option key={tp} value={tp}>{t(`service:clientType.${tp}`)}</option>
                  ))}
                </select>
                <input
                  placeholder={t('service:client.companyName')}
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder={t('service:client.companyNameLocal')}
                  value={form.company_name_local}
                  onChange={(e) => setForm({ ...form, company_name_local: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder={t('service:client.country')}
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder={t('service:client.industry')}
                  value={form.industry}
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <textarea
                  placeholder={t('service:client.note')}
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={2}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  {t('common:close')}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={createClient.isPending}
                  className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {t('common:save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
