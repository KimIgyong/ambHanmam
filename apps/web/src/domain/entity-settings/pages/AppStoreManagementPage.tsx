import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Store, ExternalLink, Loader2, AlertTriangle, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { useAppStoreSubscriptions } from '../hooks/useEntitySettings';
import { buildStoreUrl } from '../util/build-store-url';
import type { AppStoreApp } from '../service/entity-settings.service';

const APP_STORE_URL = import.meta.env.VITE_APP_STORE_URL || 'https://apps.amoeba.site';

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; colorClass: string; bgClass: string }> = {
  ACTIVE: { icon: CheckCircle, colorClass: 'text-green-700', bgClass: 'bg-green-50 border-green-200' },
  PENDING: { icon: Clock, colorClass: 'text-yellow-700', bgClass: 'bg-yellow-50 border-yellow-200' },
  SUSPENDED: { icon: XCircle, colorClass: 'text-red-700', bgClass: 'bg-red-50 border-red-200' },
};

export default function AppStoreManagementPage() {
  const isAdmin = useAuthStore((s) => s.isAdmin);
  if (isAdmin()) {
    return <Navigate to="/admin/custom-apps" replace />;
  }
  return <AppStoreContent />;
}

function AppStoreContent() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const user = useAuthStore((s) => s.user);
  const { data: apps, isLoading, error, refetch } = useAppStoreSubscriptions(currentEntity?.entityId);

  const storeUrl = useMemo(
    () => buildStoreUrl(APP_STORE_URL, currentEntity, user),
    [currentEntity, user],
  );

  const subscribedApps = useMemo(
    () => apps?.filter((a) => a.subscription) ?? [],
    [apps],
  );

  const availableApps = useMemo(
    () => apps?.filter((a) => !a.subscription && a.appStatus === 'ACTIVE') ?? [],
    [apps],
  );

  const openStore = () => window.open(storeUrl, '_blank', 'noopener');

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
        <AlertTriangle className="h-10 w-10 text-yellow-500" />
        <p className="text-sm">{t('entitySettings:appStore.loadError')}</p>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t('entitySettings:appStore.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('entitySettings:appStore.title')}</h1>
            <p className="mt-1 text-sm text-gray-500">{t('entitySettings:appStore.description')}</p>
          </div>
          <button
            onClick={openStore}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Store className="h-4 w-4" />
            {t('entitySettings:appStore.goToStore')}
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Subscribed Apps */}
        {subscribedApps.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              {t('entitySettings:appStore.subscribedApps')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subscribedApps.map((app) => (
                <SubscriptionCard key={app.appSlug} app={app} />
              ))}
            </div>
          </section>
        )}

        {/* Available Apps */}
        {availableApps.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-semibold text-gray-800">
              {t('entitySettings:appStore.availableApps')}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableApps.map((app) => (
                <AvailableCard key={app.appSlug} app={app} storeUrl={storeUrl} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!apps?.length && (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
            <Store className="mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">{t('entitySettings:appStore.noApps')}</p>
            <p className="mt-1 text-xs text-gray-400">{t('entitySettings:appStore.noAppsDesc')}</p>
            <button
              onClick={openStore}
              className="mt-4 flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              <Store className="h-4 w-4" />
              {t('entitySettings:appStore.goToStore')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SubscriptionCard({ app }: { app: AppStoreApp }) {
  const { t } = useTranslation(['entitySettings']);
  const status = app.subscription?.status ?? 'PENDING';
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;
  const StatusIcon = cfg.icon;

  const openApp = () => {
    const url = `${APP_STORE_URL}/${app.appSlug}/`;
    window.open(url, '_blank', 'noopener');
  };

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {app.appIconUrl ? (
            <img src={app.appIconUrl} alt="" className="h-8 w-8 rounded" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-100">
              <Store className="h-4 w-4 text-indigo-600" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-gray-900">{app.appName}</p>
            <p className="text-xs text-gray-400">{app.appSlug}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.bgClass} ${cfg.colorClass}`}>
          <StatusIcon className="h-3 w-3" />
          {t(`entitySettings:appStore.status${status.charAt(0)}${status.slice(1).toLowerCase()}`)}
        </span>
      </div>

      {app.subscription && (
        <div className="mb-3 space-y-1 text-xs text-gray-500">
          <p>{t('entitySettings:appStore.subscribedAt')}: {new Date(app.subscription.requestedAt).toLocaleDateString()}</p>
          {app.subscription.approvedAt && (
            <p>{t('entitySettings:appStore.approvedAt')}: {new Date(app.subscription.approvedAt).toLocaleDateString()}</p>
          )}
        </div>
      )}

      {status === 'ACTIVE' && (
        <button
          onClick={openApp}
          className="mt-auto flex items-center justify-center gap-1.5 rounded-md bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t('entitySettings:appStore.openApp')}
        </button>
      )}
    </div>
  );
}

function AvailableCard({ app, storeUrl }: { app: AppStoreApp; storeUrl: string }) {
  const { t } = useTranslation(['entitySettings']);

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        {app.appIconUrl ? (
          <img src={app.appIconUrl} alt="" className="h-8 w-8 rounded grayscale" />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200">
            <Store className="h-4 w-4 text-gray-400" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-gray-700">{app.appName}</p>
          <p className="text-xs text-gray-400">{app.appSlug}</p>
        </div>
      </div>
      <p className="mb-3 text-xs text-gray-400">{t('entitySettings:appStore.notSubscribed')}</p>
      <button
        onClick={() => window.open(storeUrl, '_blank', 'noopener')}
        className="mt-auto flex items-center justify-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
      >
        <Store className="h-3.5 w-3.5" />
        {t('entitySettings:appStore.goToStore')}
      </button>
    </div>
  );
}
