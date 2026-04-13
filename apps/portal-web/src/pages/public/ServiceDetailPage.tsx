import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { PageHead } from '@/components/seo/PageHead';

interface Plan {
  planId: string;
  code: string;
  name: string;
  description: string;
  billingCycle: string;
  price: number;
  currency: string;
  maxUsers: number;
  features: string[] | null;
  trialDays: number;
}

interface ServiceDetail {
  serviceId: string;
  code: string;
  name: string;
  nameKo: string;
  nameVi: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  websiteUrl: string;
  plans: Plan[];
}

export function ServiceDetailPage() {
  const { code } = useParams<{ code: string }>();
  const { t, i18n } = useTranslation();

  const { data: service, isLoading, error } = useQuery<ServiceDetail>({
    queryKey: ['portal-service', code],
    queryFn: async () => {
      const { data } = await api.get(`/portal/services/${code}`);
      return data.data || data;
    },
    enabled: !!code,
  });

  const getLocalName = (svc: ServiceDetail) => {
    if (i18n.language === 'ko' && svc.nameKo) return svc.nameKo;
    if (i18n.language === 'vi' && svc.nameVi) return svc.nameVi;
    return svc.name;
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="py-32 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('service_detail.not_found')}</h2>
        <Link to="/" className="mt-4 inline-flex items-center gap-1 text-primary-600 hover:text-primary-700">
          <ArrowLeft className="h-4 w-4" />
          {t('service_detail.back_home')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHead
        title={getLocalName(service)}
        path={`/services/${code}`}
      />
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-blue-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="h-4 w-4" />
            {t('service_detail.back_home')}
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {getLocalName(service)}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-gray-600">
            {service.description}
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link to="/register" className="btn-primary px-6 py-3 text-base flex items-center gap-2">
              {t('service_detail.start_trial')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            {service.websiteUrl && (
              <a
                href={service.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline px-6 py-3 text-base"
              >
                {t('service_detail.visit_website')}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Plans */}
      {service.plans.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              {t('service_detail.plans_title')}
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {service.plans.map((plan, idx) => (
                <div
                  key={plan.planId}
                  className={`relative rounded-2xl border p-6 ${
                    idx === 1
                      ? 'border-primary-300 shadow-lg ring-1 ring-primary-200'
                      : 'border-gray-200'
                  }`}
                >
                  {idx === 1 && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-semibold text-white">
                      {t('pricing.popular')}
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                  <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900">
                      {formatPrice(plan.price, plan.currency)}
                    </span>
                    <span className="text-sm text-gray-500">
                      /{plan.billingCycle === 'MONTHLY' ? t('pricing.month') : t('pricing.year')}
                    </span>
                  </div>

                  {plan.trialDays > 0 && (
                    <p className="mt-2 text-sm font-medium text-primary-600">
                      {t('pricing.trial_days', { days: plan.trialDays })}
                    </p>
                  )}

                  <Link
                    to="/register"
                    className={`mt-6 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                      idx === 1 ? 'btn-primary' : 'btn-outline'
                    }`}
                  >
                    {t('pricing.start_trial')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  {plan.features && plan.features.length > 0 && (
                    <ul className="mt-6 space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
