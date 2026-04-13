import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import PageTitle from '@/global/components/PageTitle';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useNoticeList, useCreateNotice } from '../hooks/useNotices';
import NoticeCard from '../components/NoticeCard';
import NoticeFormModal from '../components/NoticeFormModal';

export default function NoticesPage({ embedded }: { embedded?: boolean }) {
  const { t } = useTranslation(['notices', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'MASTER' || user?.role === 'MANAGER';

  const { data: notices = [], isLoading } = useNoticeList();
  const createMutation = useCreateNotice();

  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pinned'>('all');

  const filteredNotices = filter === 'pinned'
    ? notices.filter((n) => n.isPinned)
    : notices;

  const handleCreate = (formData: FormData | Record<string, unknown>) => {
    createMutation.mutate(formData as FormData, {
      onSuccess: () => setShowForm(false),
    });
  };

  return (
    <div className={embedded ? '' : 'flex h-full flex-col overflow-hidden'}>
      {/* Header */}
      {!embedded && (
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <PageTitle>{t('notices:title')}</PageTitle>
            <p className="mt-1 text-sm text-gray-500">{t('notices:subtitle')}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('notices:createNotice')}
            </button>
          )}
        </div>
      </div>
      )}

      {/* Embedded header with create button */}
      {embedded && isAdmin && (
        <div className="mb-4 flex justify-end">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            {t('notices:createNotice')}
          </button>
        </div>
      )}

      {/* Filter */}
      <div className="shrink-0 border-b border-gray-100 bg-white px-6 py-2">
        <div className="flex gap-2">
          {(['all', 'pinned'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === f
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {t(`notices:filter.${f}`)}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            {t('common:loading')}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            {t('notices:noNotices')}
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-3">
            {filteredNotices.map((notice) => (
              <NoticeCard
                key={notice.noticeId}
                notice={notice}
                onClick={() => navigate(`/notices/${notice.noticeId}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showForm && (
        <NoticeFormModal
          onSubmit={handleCreate}
          onClose={() => setShowForm(false)}
          isSaving={createMutation.isPending}
        />
      )}
    </div>
  );
}
