import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function CardUsagePage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.finance.cardUsage')}</h1>
      <MockSearchFilter filters={[
        { type: 'select', label: t('hanmam:column.cardName'), options: [] },
        { type: 'date-range', label: t('hanmam:column.usageDate') },
        { type: 'text', label: t('hanmam:column.storeName'), placeholder: t('hanmam:column.storeName') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'usageDate', label: t('hanmam:column.usageDate'), width: '110px' },
          { key: 'cardName', label: t('hanmam:column.cardName'), width: '140px' },
          { key: 'storeName', label: t('hanmam:column.storeName') },
          { key: 'amount', label: t('hanmam:column.amount'), width: '130px', align: 'right' },
          { key: 'category', label: t('hanmam:column.category'), width: '100px' },
        ]}
      />
    </div>
  );
}
