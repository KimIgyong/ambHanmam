import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function LaborCostPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.sales.laborCost')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.project'), placeholder: t('hanmam:column.project') },
        { type: 'select', label: t('hanmam:common.year'), options: [
          { value: '2026', label: '2026' }, { value: '2025', label: '2025' },
        ]},
        { type: 'select', label: t('hanmam:common.month'), options: Array.from({length: 12}, (_, i) => ({ value: String(i+1), label: `${i+1}` })) },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'project', label: t('hanmam:column.project') },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
          { key: 'amount', label: t('hanmam:column.amount'), width: '130px', align: 'right' },
          { key: 'month', label: t('hanmam:column.month'), width: '80px', align: 'center' },
        ]}
      />
    </div>
  );
}
