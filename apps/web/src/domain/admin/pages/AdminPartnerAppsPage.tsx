import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { partnerAppAdminService } from '../service/partner-app-admin.service';
import type { PartnerApp } from '@/domain/partner-portal/service/partner-portal.service';

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  IN_REVIEW: 'bg-yellow-50 text-yellow-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
  PUBLISHED: 'bg-green-50 text-green-700',
  SUSPENDED: 'bg-orange-50 text-orange-700',
};

const STATUS_TABS = ['ALL', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUSPENDED'] as const;

export default function AdminPartnerAppsPage() {
  const { t } = useTranslation(['admin', 'partnerPortal']);
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ appId: string } | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['admin-partner-apps', statusFilter],
    queryFn: () =>
      partnerAppAdminService.getApps(statusFilter === 'ALL' ? undefined : { status: statusFilter }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-partner-apps'] });

  const reviewMut = useMutation({
    mutationFn: (id: string) => partnerAppAdminService.startReview(id),
    onSuccess: () => { invalidate(); toast.success(t('admin:partnerApps.reviewStarted')); },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => partnerAppAdminService.approve(id),
    onSuccess: () => { invalidate(); toast.success(t('admin:partnerApps.approved')); },
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => partnerAppAdminService.reject(id, note),
    onSuccess: () => {
      invalidate();
      toast.success(t('admin:partnerApps.rejected'));
      setRejectModal(null);
      setRejectNote('');
    },
  });

  const publishMut = useMutation({
    mutationFn: (id: string) => partnerAppAdminService.publish(id),
    onSuccess: () => { invalidate(); toast.success(t('admin:partnerApps.published')); },
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => partnerAppAdminService.suspend(id),
    onSuccess: () => { invalidate(); toast.success(t('admin:partnerApps.suspended')); },
  });

  const filtered = search
    ? apps.filter((a: PartnerApp) =>
        a.papName.toLowerCase().includes(search.toLowerCase()) ||
        a.papCode.toLowerCase().includes(search.toLowerCase()),
      )
    : apps;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{t('admin:partnerApps.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('admin:partnerApps.subtitle')}</p>
      </div>

      {/* Status Tabs */}
      <div className="mb-4 flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              statusFilter === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'ALL' ? 'All' : t(`partnerPortal:app.statuses.${tab}`)}
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
          placeholder={t('admin:partnerApps.searchPlaceholder')}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-16 text-center">
          <p className="text-sm text-gray-500">{t('admin:partnerApps.noApps')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('admin:partnerApps.appName')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('admin:partnerApps.partner')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('admin:partnerApps.category')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('admin:partnerApps.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">{t('admin:partnerApps.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((app: PartnerApp) => (
                <tr key={app.papId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-600">
                        {app.papIcon || app.papName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{app.papName}</p>
                        <p className="text-xs text-gray-400">{app.papCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {app.partner?.ptnCompanyName || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {t(`partnerPortal:app.categories.${app.papCategory}`)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[app.papStatus] || 'bg-gray-100 text-gray-500'}`}>
                      {t(`partnerPortal:app.statuses.${app.papStatus}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {/* URL link */}
                      <a
                        href={app.papUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                      >
                        <ExternalLink className="h-3 w-3" />
                        URL
                      </a>

                      {/* Status-dependent actions */}
                      {app.papStatus === 'SUBMITTED' && (
                        <button
                          onClick={() => reviewMut.mutate(app.papId)}
                          disabled={reviewMut.isPending}
                          className="rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
                        >
                          {t('admin:partnerApps.startReview')}
                        </button>
                      )}

                      {app.papStatus === 'IN_REVIEW' && (
                        <>
                          <button
                            onClick={() => approveMut.mutate(app.papId)}
                            disabled={approveMut.isPending}
                            className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {t('admin:partnerApps.approve')}
                          </button>
                          <button
                            onClick={() => setRejectModal({ appId: app.papId })}
                            className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            {t('admin:partnerApps.reject')}
                          </button>
                        </>
                      )}

                      {app.papStatus === 'APPROVED' && (
                        <button
                          onClick={() => publishMut.mutate(app.papId)}
                          disabled={publishMut.isPending}
                          className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {t('admin:partnerApps.publish')}
                        </button>
                      )}

                      {app.papStatus === 'PUBLISHED' && (
                        <button
                          onClick={() => suspendMut.mutate(app.papId)}
                          disabled={suspendMut.isPending}
                          className="rounded bg-orange-500 px-2 py-1 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                        >
                          {t('admin:partnerApps.suspend')}
                        </button>
                      )}

                      {/* Show review note */}
                      {app.papReviewNote && app.papStatus === 'REJECTED' && (
                        <span className="text-xs text-red-500 italic">{app.papReviewNote}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-base font-semibold text-gray-900">{t('admin:partnerApps.reject')}</h3>
            <textarea
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder={t('admin:partnerApps.reviewNotePlaceholder')}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejectModal(null); setRejectNote(''); }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => rejectMut.mutate({ id: rejectModal.appId, note: rejectNote })}
                disabled={!rejectNote.trim() || rejectMut.isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {t('admin:partnerApps.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
