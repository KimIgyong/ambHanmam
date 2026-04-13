import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { useContractList } from '../../hooks/useContract';

interface Props {
  partnerId: string;
}

export default function PartnerContractsTab({ partnerId }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const navigate = useNavigate();
  const { data: contracts, isLoading } = useContractList({ partner_id: partnerId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-200 border-t-orange-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => navigate('/billing/contracts/new')}
          className="inline-flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {t('billing:contract.addNew')}
        </button>
      </div>

      {!contracts || contracts.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-sm text-gray-500">{t('billing:partner.noContracts')}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.title')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.direction')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.form.category')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.type')}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.amount')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.period')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {t('billing:contract.columns.status')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contracts.map((c) => (
                <tr
                  key={c.contractId}
                  onClick={() => navigate(`/billing/contracts/${c.contractId}`)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {c.title}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {t(`billing:contract.direction.${c.direction}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {t(`billing:contract.category.${c.category}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {t(`billing:contract.type.${c.type}`)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-right text-gray-600">
                    {c.amount.toLocaleString()} {c.currency}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {c.startDate} ~ {c.endDate || '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                      {t(`billing:contract.status.${c.status}`)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
