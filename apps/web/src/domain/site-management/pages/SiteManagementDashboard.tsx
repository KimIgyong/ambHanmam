import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Globe, Menu, FileText, Newspaper, Users, Building2, ArrowLeft, Loader2 } from 'lucide-react';
import { cmsStatsService, type EntityCmsStats } from '../service/cms-api.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const useCmsEntityStats = () => {
  return useQuery({
    queryKey: ['cms-stats', 'entities'],
    queryFn: () => cmsStatsService.getEntityStats(),
  });
};

export default function SiteManagementDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation(['site', 'common']);
  const { data: stats, isLoading } = useCmsEntityStats();
  const setCurrentEntity = useEntityStore((s) => s.setCurrentEntity);
  const entities = useEntityStore((s) => s.entities);

  const totals = (stats || []).reduce(
    (acc, s) => ({
      menuCount: acc.menuCount + s.menuCount,
      pageCount: acc.pageCount + s.pageCount,
      postCount: acc.postCount + s.postCount,
      subscriberCount: acc.subscriberCount + s.subscriberCount,
    }),
    { menuCount: 0, pageCount: 0, postCount: 0, subscriberCount: 0 },
  );

  const handleEntityClick = (stat: EntityCmsStats) => {
    const entity = entities.find((e) => e.entityId === stat.entityId);
    if (entity) {
      setCurrentEntity(entity);
    }
    navigate('/site/menus');
  };

  const STAT_CARDS = [
    { label: t('site:dashboard.totalEntities'), value: stats?.length || 0, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: t('site:dashboard.totalMenus'), value: totals.menuCount, icon: Menu, color: 'text-lime-600', bg: 'bg-lime-100' },
    { label: t('site:dashboard.totalPages'), value: totals.pageCount, icon: FileText, color: 'text-violet-600', bg: 'bg-violet-100' },
    { label: t('site:dashboard.totalPosts'), value: totals.postCount, icon: Newspaper, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100">
            <Globe className="h-5 w-5 text-lime-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('site:dashboard.title')}</h1>
            <p className="text-sm text-gray-500">{t('site:dashboard.subtitle')}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {STAT_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                        <Icon className={`h-5 w-5 ${card.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-xs text-gray-500">{card.label}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Entity List */}
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900">{t('site:dashboard.entityList')}</h2>
            </div>

            {!stats || stats.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
                <Building2 className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">{t('site:dashboard.noEntities')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.map((stat) => (
                  <button
                    key={stat.entityId}
                    onClick={() => handleEntityClick(stat)}
                    className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-lime-200 hover:shadow-md"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-lime-100">
                      <Building2 className="h-6 w-6 text-lime-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {stat.entityCode} - {stat.entityName}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Menu className="h-3 w-3" />
                          {t('site:dashboard.menus')} {stat.menuCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {t('site:dashboard.pages')} {stat.pageCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Newspaper className="h-3 w-3" />
                          {t('site:dashboard.posts')} {stat.postCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {t('site:dashboard.subscribers')} {stat.subscriberCount}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-lime-600">
                      {t('site:dashboard.manageSite')} →
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
