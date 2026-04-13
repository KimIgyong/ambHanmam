import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ClientManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.clients')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.companyName'), placeholder: t('hanmam:column.companyName') },
        { type: 'text', label: t('hanmam:column.businessRegNo'), placeholder: t('hanmam:column.businessRegNo') },
        { type: 'text', label: t('hanmam:column.manager'), placeholder: t('hanmam:column.manager') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'companyName', label: t('hanmam:column.companyName') },
          { key: 'representative', label: t('hanmam:column.representative'), width: '120px' },
          { key: 'businessRegNo', label: t('hanmam:column.businessRegNo'), width: '140px' },
          { key: 'contractName', label: t('hanmam:column.contractName') },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
        ]}
      />
    </div>
  );
}
