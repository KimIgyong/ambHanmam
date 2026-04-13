import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function InvoiceRequestPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.invoiceRequest')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'text', label: t('hanmam:column.customer'), placeholder: t('hanmam:column.customer') },
        { type: 'select', label: t('hanmam:column.status'), options: [
          { value: 'pending', label: t('hanmam:status.pending') },
          { value: 'completed', label: t('hanmam:status.completed') },
        ]},
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'customer', label: t('hanmam:column.customer'), width: '140px' },
          { key: 'requestor', label: t('hanmam:column.requestor'), width: '100px' },
          { key: 'invoiceAmount', label: t('hanmam:column.invoiceAmount'), width: '130px', align: 'right' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
