import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function BankTransactionPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.finance.bankTransaction')}</h1>
      <MockSearchFilter filters={[
        { type: 'select', label: t('hanmam:column.bankName'), options: [] },
        { type: 'date-range', label: t('hanmam:column.date') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'date', label: t('hanmam:column.date'), width: '110px' },
          { key: 'bankName', label: t('hanmam:column.bankName'), width: '130px' },
          { key: 'content', label: t('hanmam:column.content') },
          { key: 'deposit', label: t('hanmam:column.deposit'), width: '130px', align: 'right' },
          { key: 'withdrawal', label: t('hanmam:column.withdrawal'), width: '130px', align: 'right' },
          { key: 'balance', label: t('hanmam:column.balance'), width: '130px', align: 'right' },
        ]}
      />
    </div>
  );
}
