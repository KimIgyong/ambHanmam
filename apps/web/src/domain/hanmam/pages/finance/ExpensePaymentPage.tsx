import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ExpensePaymentPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.finance.expensePayment')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'date-range', label: t('hanmam:column.paymentDate') },
        { type: 'select', label: t('hanmam:column.expenseType'), options: [] },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'amount', label: t('hanmam:column.amount'), width: '130px', align: 'right' },
          { key: 'expenseType', label: t('hanmam:column.expenseType'), width: '120px' },
          { key: 'paymentDate', label: t('hanmam:column.paymentDate'), width: '110px' },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
        ]}
        showCheckbox
      />
    </div>
  );
}
