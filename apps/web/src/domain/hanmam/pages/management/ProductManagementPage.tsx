import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ProductManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.management.products')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.productName'), placeholder: t('hanmam:column.productName') },
        { type: 'select', label: t('hanmam:column.category'), options: [] },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'productName', label: t('hanmam:column.productName') },
          { key: 'category', label: t('hanmam:column.category'), width: '120px' },
          { key: 'unitPrice', label: t('hanmam:column.unitPrice'), width: '120px', align: 'right' },
          { key: 'quantity', label: t('hanmam:column.quantity'), width: '80px', align: 'right' },
          { key: 'regDate', label: t('hanmam:column.regDate'), width: '110px' },
        ]}
        showCheckbox
      />
    </div>
  );
}
