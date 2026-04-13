import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ExpenseBudgetPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.management.budget')}</h1>
      <MockSearchFilter filters={[
        { type: 'select', label: t('hanmam:common.year'), options: [
          { value: '2026', label: '2026' }, { value: '2025', label: '2025' },
        ]},
        { type: 'text', label: t('hanmam:column.item'), placeholder: t('hanmam:column.item') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'item', label: t('hanmam:column.item') },
          { key: 'budget', label: t('hanmam:column.budget'), width: '130px', align: 'right' },
          { key: 'actual', label: t('hanmam:column.actual'), width: '130px', align: 'right' },
          { key: 'difference', label: t('hanmam:column.difference'), width: '130px', align: 'right' },
          { key: 'rate', label: t('hanmam:column.rate'), width: '80px', align: 'right' },
        ]}
      />
    </div>
  );
}
