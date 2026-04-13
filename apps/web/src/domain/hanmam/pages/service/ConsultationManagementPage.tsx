import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ConsultationManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.service.consultationManagement')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.customer'), placeholder: t('hanmam:column.customer') },
        { type: 'select', label: t('hanmam:column.consultStatus'), options: [
          { value: 'inProgress', label: t('hanmam:status.inProgress') },
          { value: 'completed', label: t('hanmam:status.completed') },
          { value: 'pending', label: t('hanmam:status.pending') },
        ]},
        { type: 'date-range', label: t('hanmam:column.date') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'date', label: t('hanmam:column.date'), width: '110px' },
          { key: 'customer', label: t('hanmam:column.customer'), width: '150px' },
          { key: 'consultType', label: t('hanmam:column.consultType'), width: '120px' },
          { key: 'content', label: t('hanmam:column.content') },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
          { key: 'consultStatus', label: t('hanmam:column.consultStatus'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
