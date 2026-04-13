import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ContractManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.contracts')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.contractName'), placeholder: t('hanmam:column.contractName') },
        { type: 'text', label: t('hanmam:column.customer'), placeholder: t('hanmam:column.customer') },
        { type: 'date-range', label: t('hanmam:column.period') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'contractName', label: t('hanmam:column.contractName') },
          { key: 'customer', label: t('hanmam:column.customer'), width: '150px' },
          { key: 'amount', label: t('hanmam:column.amount'), width: '130px', align: 'right' },
          { key: 'period', label: t('hanmam:column.period'), width: '180px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
