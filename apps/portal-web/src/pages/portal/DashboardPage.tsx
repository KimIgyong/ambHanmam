import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth.store';
import { Package, CreditCard, AlertCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { t } = useTranslation();
  const customer = useAuthStore((s) => s.customer);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {t('portal.dashboard.welcome', { name: customer?.name })}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('portal.dashboard.subtitle')}
        </p>
      </div>

      {/* Email verification warning */}
      {customer && !customer.emailVerified && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div>
            <p className="text-sm font-medium text-amber-800">{t('portal.dashboard.email_not_verified')}</p>
            <p className="mt-1 text-sm text-amber-700">{t('portal.dashboard.email_not_verified_desc')}</p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Package className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('portal.dashboard.active_subscriptions')}</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{t('portal.dashboard.pending_invoices')}</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('portal.dashboard.quick_actions')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            to="/pricing"
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 hover:border-primary-200 hover:shadow-sm transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">{t('portal.dashboard.browse_services')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('portal.dashboard.browse_services_desc')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </Link>
          <Link
            to="/portal/settings"
            className="group flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 hover:border-primary-200 hover:shadow-sm transition-all"
          >
            <div>
              <h3 className="font-medium text-gray-900">{t('portal.dashboard.manage_account')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('portal.dashboard.manage_account_desc')}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}
