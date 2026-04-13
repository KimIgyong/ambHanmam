import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function InternalSalesPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.internalSales')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.project'), placeholder: t('hanmam:column.project') },
        { type: 'date-range', label: t('hanmam:column.period') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'date', label: t('hanmam:column.date'), width: '110px' },
          { key: 'project', label: t('hanmam:column.project') },
          { key: 'company', label: t('hanmam:column.company'), width: '150px' },
          { key: 'amount', label: t('hanmam:column.amount'), width: '130px', align: 'right' },
          { key: 'type', label: t('hanmam:column.type'), width: '100px' },
        ]}
      />
    </div>
  );
}
