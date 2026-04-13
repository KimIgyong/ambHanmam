import { useTranslation } from 'react-i18next';
import { Loader2, Package } from 'lucide-react';
import { useEntityServiceUsage } from '../hooks/useAdmin';

export default function EntityServiceTab({ entityId }: { entityId: string }) {
  const { t } = useTranslation(['entityManagement']);
  const { data, isLoading } = useEntityServiceUsage(entityId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Linked Client */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:service.linkedClient')}</h3>
        {data?.client ? (
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{data.client.companyName}</p>
              <p className="text-xs text-gray-400">{data.client.clientCode}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              data.client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {data.client.status}
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t('entityManagement:service.noClient')}</p>
        )}
      </div>

      {/* Subscriptions */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:service.subscriptions')}</h3>
        {!data?.subscriptions?.length ? (
          <div className="flex flex-col items-center py-8 text-gray-400">
            <Package className="h-10 w-10 mb-2" />
            <p className="text-sm">{t('entityManagement:service.noSubscriptions')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:service.serviceName')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:service.plan')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:col.status')}</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">{t('entityManagement:service.period')}</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-gray-500">{t('entityManagement:service.price')}</th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase text-gray-500">{t('entityManagement:service.users')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.subscriptions.map((sub) => (
                  <tr key={sub.subscriptionId}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{sub.serviceName}</div>
                      <div className="text-xs text-gray-400">{sub.serviceCode}</div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">{sub.planName || '-'}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        sub.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                      {sub.startDate}{sub.endDate ? ` ~ ${sub.endDate}` : ''}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-gray-600">
                      {sub.price != null ? `${sub.price.toLocaleString()} ${sub.currency}` : '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center text-sm text-gray-600">
                      {sub.actualUsers}{sub.maxUsers ? ` / ${sub.maxUsers}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
