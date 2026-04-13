import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AppWindow, Search } from 'lucide-react';
import { toast } from 'sonner';
import { partnerPortalApiService, type PartnerApp } from '../service/partner-portal.service';
import PartnerAppFormModal from './PartnerAppFormModal';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  IN_REVIEW: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  PUBLISHED: 'bg-green-50 text-green-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
};

const STATUS_TABS = ['ALL', 'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED'] as const;

export default function PartnerAppListPage() {
  const { t } = useTranslation('partnerPortal');
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editApp, setEditApp] = useState<PartnerApp | null>(null);

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['partner-apps', statusFilter],
    queryFn: () => partnerPortalApiService.getApps(statusFilter === 'ALL' ? undefined : statusFilter),
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => partnerPortalApiService.submitApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-apps'] });
      toast.success(t('app.submitted'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => partnerPortalApiService.deleteApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partner-apps'] });
      toast.success(t('app.deleted'));
    },
  });

  const filtered = search
    ? apps.filter((a: PartnerApp) =>
        a.papName.toLowerCase().includes(search.toLowerCase()) ||
        a.papCode.toLowerCase().includes(search.toLowerCase()),
      )
    : apps;

  const handleEdit = (app: PartnerApp) => {
    setEditApp(app);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditApp(null);
    setFormOpen(true);
  };

  const handleSubmit = (app: PartnerApp) => {
    if (window.confirm(t('app.submitConfirm'))) {
      submitMutation.mutate(app.papId);
    }
  };

  const handleDelete = (app: PartnerApp) => {
    if (window.confirm(t('app.deleteConfirm'))) {
      deleteMutation.mutate(app.papId);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">{t('app.title')}</h1>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('app.create')}
        </button>
      </div>

      {/* Status Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              statusFilter === tab
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'ALL' ? 'All' : t(`app.statuses.${tab}`)}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`${t('app.name')} / ${t('app.code')}`}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      </div>

      {/* App Cards */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center">
          <AppWindow className="mx-auto mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">{t('app.noApps')}</p>
          <p className="mt-1 text-xs text-gray-400">{t('app.noAppsDesc')}</p>
          <button
            onClick={handleCreate}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="mr-1 inline-block h-4 w-4" />
            {t('app.create')}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app: PartnerApp) => (
            <div
              key={app.papId}
              className="rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 text-sm font-bold">
                    {app.papIcon || app.papName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{app.papName}</p>
                    <p className="text-xs text-gray-400">{app.papCode}</p>
                  </div>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[app.papStatus] || 'bg-gray-100 text-gray-500'}`}>
                  {t(`app.statuses.${app.papStatus}`)}
                </span>
              </div>

              {app.papDescription && (
                <p className="mb-3 text-xs text-gray-500 line-clamp-2">{app.papDescription}</p>
              )}

              <div className="mb-3 space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>{t('app.category')}</span>
                  <span className="font-medium text-gray-700">{t(`app.categories.${app.papCategory}`)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t('app.openMode')}</span>
                  <span className="font-medium text-gray-700">{t(`app.openModes.${app.papOpenMode}`)}</span>
                </div>
              </div>

              <div className="flex gap-2 border-t border-gray-100 pt-3">
                {(app.papStatus === 'DRAFT' || app.papStatus === 'REJECTED') && (
                  <>
                    <button
                      onClick={() => handleEdit(app)}
                      className="flex-1 rounded-md border border-gray-300 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {t('app.edit')}
                    </button>
                    <button
                      onClick={() => handleSubmit(app)}
                      disabled={submitMutation.isPending}
                      className="flex-1 rounded-md bg-emerald-600 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {t('app.submit')}
                    </button>
                  </>
                )}
                {app.papStatus === 'DRAFT' && (
                  <button
                    onClick={() => handleDelete(app)}
                    disabled={deleteMutation.isPending}
                    className="rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {t('app.delete')}
                  </button>
                )}
              </div>

              {app.papStatus === 'REJECTED' && app.papReviewNote && (
                <div className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">
                  {app.papReviewNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {formOpen && (
        <PartnerAppFormModal
          app={editApp}
          onClose={() => {
            setFormOpen(false);
            setEditApp(null);
          }}
          onSaved={() => {
            setFormOpen(false);
            setEditApp(null);
            queryClient.invalidateQueries({ queryKey: ['partner-apps'] });
          }}
        />
      )}
    </div>
  );
}
