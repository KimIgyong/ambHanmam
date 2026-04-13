import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function CollectionAnalysisPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.collectionAnalysis')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.customer'), placeholder: t('hanmam:column.customer') },
        { type: 'date-range', label: t('hanmam:column.period') },
        { type: 'select', label: t('hanmam:column.status'), options: [
          { value: 'completed', label: t('hanmam:status.completed') },
          { value: 'pending', label: t('hanmam:status.pending') },
        ]},
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'customer', label: t('hanmam:column.customer') },
          { key: 'invoiceAmount', label: t('hanmam:column.invoiceAmount'), width: '130px', align: 'right' },
          { key: 'collectionAmount', label: t('hanmam:column.collectionAmount'), width: '130px', align: 'right' },
          { key: 'difference', label: t('hanmam:column.difference'), width: '120px', align: 'right' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
      />
    </div>
  );
}
