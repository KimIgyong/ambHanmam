import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useServiceDetail, useServicePlans } from '@/domain/service-management/hooks/useServiceCatalog';
import i18n from '@/i18n';
import type { SvcServiceResponse } from '@amb/types';

function getServiceName(svc: SvcServiceResponse): string {
  const lang = i18n.language;
  if (lang === 'ko' && svc.nameKo) return svc.nameKo;
  if (lang === 'vi' && svc.nameVi) return svc.nameVi;
  return svc.name;
}

export default function AdminServiceDetailPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['admin', 'service', 'common']);
  const { data: service, isLoading } = useServiceDetail(serviceId!);
  const { data: plans } = useServicePlans(serviceId!);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!service) return null;

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/admin')}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            {service.color && (
              <span
                className="inline-block h-5 w-5 rounded-full"
                style={{ backgroundColor: service.color }}
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{getServiceName(service)}</h1>
              <p className="text-sm text-gray-500">
                {service.code} · {t(`service:category.${service.category}`)}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/admin/service/services/${service.serviceId}`)}
            className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t('admin:serviceDetail.editInServiceManagement')}
          </button>
        </div>

        {/* Overview */}
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            {t('admin:serviceDetail.overview')}
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t('service:service.status')}:</span>{' '}
                <span className={service.status === 'ACTIVE' ? 'font-medium text-green-600' : 'text-gray-600'}>
                  {t(`service:status.${service.status}`)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t('service:service.category')}:</span>{' '}
                {t(`service:category.${service.category}`)}
              </div>
              {service.launchDate && (
                <div>
                  <span className="text-gray-500">{t('admin:serviceDetail.launchDate')}:</span>{' '}
                  {service.launchDate}
                </div>
              )}
              {service.websiteUrl && (
                <div>
                  <span className="text-gray-500">{t('admin:serviceDetail.website')}:</span>{' '}
                  <a
                    href={service.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-600 hover:underline"
                  >
                    {service.websiteUrl}
                  </a>
                </div>
              )}
              {service.description && (
                <div className="col-span-2">
                  <span className="text-gray-500">{t('service:service.description')}:</span>{' '}
                  {service.description}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Plans */}
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            {t('admin:serviceDetail.plans')}
          </h2>
          {plans && plans.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.planId}
                  className="rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        plan.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {plan.isActive ? t('service:plan.active') : t('service:status.INACTIVE')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <div className="text-lg font-bold text-gray-900">
                      {plan.price > 0
                        ? `${plan.currency} ${plan.price.toLocaleString()}`
                        : 'Free'}
                    </div>
                    <div>{t(`service:billingCycle.${plan.billingCycle}`)}</div>
                    {plan.maxUsers && <div>Max {plan.maxUsers} users</div>}
                    <div className="text-xs text-gray-400">{plan.code}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4">{t('admin:serviceDetail.noPlans')}</p>
          )}
        </section>

        {/* Subscriptions (Coming Soon) */}
        <section className="mb-6">
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            {t('admin:serviceDetail.subscriptions')}
          </h2>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
            <p className="text-sm text-gray-400">{t('admin:serviceDetail.comingSoon')}</p>
          </div>
        </section>

        {/* Clients (Coming Soon) */}
        <section>
          <h2 className="mb-3 text-base font-semibold text-gray-900">
            {t('admin:serviceDetail.clients')}
          </h2>
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 py-8 text-center">
            <p className="text-sm text-gray-400">{t('admin:serviceDetail.comingSoon')}</p>
          </div>
        </section>
      </div>
    </div>
  );
}
