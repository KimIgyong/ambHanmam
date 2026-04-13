import { useTranslation } from 'react-i18next';
import { Package, Users, CreditCard, AlertTriangle } from 'lucide-react';
import { useServiceList } from '../hooks/useServiceCatalog';
import { useClientList } from '../hooks/useClient';
import { useSubscriptionList, useExpiringSubscriptions } from '../hooks/useSubscription';

export default function ServiceDashboardPage() {
  const { t } = useTranslation(['service']);
  const { data: services } = useServiceList();
  const { data: clients } = useClientList();
  const { data: activeSubscriptions } = useSubscriptionList({ status: 'ACTIVE' });
  const { data: expiringSubscriptions } = useExpiringSubscriptions(30);

  const stats = [
    {
      label: t('service:dashboard.totalServices'),
      value: services?.length ?? 0,
      icon: Package,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      label: t('service:dashboard.totalClients'),
      value: clients?.length ?? 0,
      icon: Users,
      color: 'bg-green-100 text-green-600',
    },
    {
      label: t('service:dashboard.activeSubscriptions'),
      value: activeSubscriptions?.length ?? 0,
      icon: CreditCard,
      color: 'bg-purple-100 text-purple-600',
    },
    {
      label: t('service:dashboard.expiringSoon'),
      value: expiringSubscriptions?.length ?? 0,
      icon: AlertTriangle,
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">
          {t('service:dashboard.title')}
        </h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service overview cards */}
        {services && services.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('service:service.title')}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((svc) => (
                <div key={svc.serviceId} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {svc.color && (
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: svc.color }} />
                    )}
                    <h3 className="font-medium text-gray-900">{svc.name}</h3>
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                      svc.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      svc.status === 'INACTIVE' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {t(`service:status.${svc.status}`)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{svc.description || svc.code}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('service:service.plans')}: {svc.planCount ?? 0}</span>
                    <span className="text-gray-500">{t('service:service.subscribers')}: {svc.activeSubscriptionCount ?? 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
