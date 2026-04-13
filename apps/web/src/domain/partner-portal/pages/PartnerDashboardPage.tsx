import { useTranslation } from 'react-i18next';
import { usePartnerAuthStore } from '../store/partner-auth.store';
import { AppWindow } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PartnerDashboardPage() {
  const { t } = useTranslation('partnerPortal');
  const user = usePartnerAuthStore((s) => s.user);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">
        {t('dashboard.welcome', { name: user?.name })}
      </h1>

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Link to="/partner/apps" className="rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-emerald-300">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <AppWindow className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('dashboard.myApps')}</p>
              <p className="text-xs text-gray-500">{t('dashboard.myAppsDesc')}</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-gray-900">{t('dashboard.partnerInfo')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.partnerName')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.partnerName || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.partnerCode')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.partnerCode || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.role')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.role || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('dashboard.email')}</p>
            <p className="mt-1 text-sm font-medium text-gray-900">{user?.email || '-'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
