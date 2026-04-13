import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Plus, Package } from 'lucide-react';
import { useServiceList, useCreateService } from '../hooks/useServiceCatalog';

export default function ServiceListPage() {
  const { t } = useTranslation(['service', 'common']);
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const { data: services, isLoading } = useServiceList({
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
  });
  const createService = useCreateService();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', category: 'COMMUNICATION', description: '', color: '' });

  const handleCreate = async () => {
    if (!form.code || !form.name) return;
    await createService.mutateAsync(form);
    setShowForm(false);
    setForm({ code: '', name: '', category: 'COMMUNICATION', description: '', color: '' });
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t('service:service.title')}</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-cyan-600 px-3 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            <Plus className="h-4 w-4" />
            {t('service:service.add')}
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('service:service.status')}: All</option>
            {['ACTIVE', 'INACTIVE', 'DEPRECATED'].map((s) => (
              <option key={s} value={s}>{t(`service:status.${s}`)}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            <option value="">{t('service:service.category')}: All</option>
            {['COMMUNICATION', 'COMMERCE', 'MARKETING', 'PACKAGE', 'OTHER'].map((c) => (
              <option key={c} value={c}>{t(`service:category.${c}`)}</option>
            ))}
          </select>
        </div>

        {/* Service Cards */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-cyan-600" />
          </div>
        ) : !services?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="h-12 w-12 mb-3" />
            <p className="text-sm">{t('service:service.noServices')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((svc) => (
              <button
                key={svc.serviceId}
                onClick={() => navigate(`/service/services/${svc.serviceId}`)}
                className="rounded-lg border border-gray-200 bg-white p-4 text-left hover:border-cyan-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 mb-2">
                  {svc.color && (
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: svc.color }} />
                  )}
                  <h3 className="font-medium text-gray-900">{svc.name}</h3>
                </div>
                <p className="text-xs text-gray-400 mb-2">{svc.code} · {t(`service:category.${svc.category}`)}</p>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{svc.description}</p>
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    svc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    svc.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {t(`service:status.${svc.status}`)}
                  </span>
                  <span className="text-xs text-gray-400">{svc.activeSubscriptionCount ?? 0} {t('service:service.subscribers')}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold mb-4">{t('service:service.add')}</h2>
              <div className="space-y-3">
                <input
                  placeholder={t('service:service.code')}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder={t('service:service.name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {['COMMUNICATION', 'COMMERCE', 'MARKETING', 'PACKAGE', 'OTHER'].map((c) => (
                    <option key={c} value={c}>{t(`service:category.${c}`)}</option>
                  ))}
                </select>
                <textarea
                  placeholder={t('service:service.description')}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  rows={3}
                />
                <input
                  placeholder={t('service:service.color') + ' (#3B82F6)'}
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                  disabled={createService.isPending}
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
