import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function InvoiceIssuancePage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.finance.invoiceIssue')}</h1>
      <MockSearchFilter filters={[
        { type: 'radio', label: t('hanmam:common.month'), options: Array.from({length: 12}, (_, i) => ({ value: String(i+1), label: `${i+1}${t('hanmam:common.month')}` })) },
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'text', label: t('hanmam:column.customer'), placeholder: t('hanmam:column.customer') },
        { type: 'select', label: t('hanmam:column.type'), options: [] },
        { type: 'select', label: t('hanmam:column.status'), options: [
          { value: 'pending', label: t('hanmam:status.pending') },
          { value: 'completed', label: t('hanmam:status.completed') },
        ]},
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'date', label: t('hanmam:column.date'), width: '110px' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'customer', label: t('hanmam:column.customer'), width: '140px' },
          { key: 'requestor', label: t('hanmam:column.requestor'), width: '100px' },
          { key: 'invoiceAmount', label: t('hanmam:column.invoiceAmount'), width: '130px', align: 'right' },
          { key: 'collectionAmount', label: t('hanmam:column.collectionAmount'), width: '130px', align: 'right' },
          { key: 'type', label: t('hanmam:column.type'), width: '80px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
