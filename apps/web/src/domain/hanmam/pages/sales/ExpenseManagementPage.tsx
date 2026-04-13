import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ExpenseManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.expense')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'select', label: t('hanmam:column.expenseType'), options: [] },
        { type: 'date-range', label: t('hanmam:column.period') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'expenseType', label: t('hanmam:column.expenseType'), width: '120px' },
          { key: 'amount', label: t('hanmam:column.amount'), width: '130px', align: 'right' },
          { key: 'date', label: t('hanmam:column.date'), width: '110px' },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
        ]}
        showCheckbox
      />
    </div>
  );
}
