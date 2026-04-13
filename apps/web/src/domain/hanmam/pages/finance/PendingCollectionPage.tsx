import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function PendingCollectionPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.finance.pendingCollection')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.customer'), placeholder: t('hanmam:column.customer') },
        { type: 'date-range', label: t('hanmam:column.date') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'customer', label: t('hanmam:column.customer') },
          { key: 'invoiceAmount', label: t('hanmam:column.invoiceAmount'), width: '130px', align: 'right' },
          { key: 'collectionAmount', label: t('hanmam:column.collectionAmount'), width: '130px', align: 'right' },
          { key: 'date', label: t('hanmam:column.date'), width: '110px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
