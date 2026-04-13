import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ProjectManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.management.projects')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.project'), placeholder: t('hanmam:column.project') },
        { type: 'text', label: t('hanmam:column.manager'), placeholder: t('hanmam:column.manager') },
        { type: 'select', label: t('hanmam:column.status'), options: [
          { value: 'inProgress', label: t('hanmam:status.inProgress') },
          { value: 'completed', label: t('hanmam:status.completed') },
          { value: 'pending', label: t('hanmam:status.pending') },
        ]},
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'project', label: t('hanmam:column.project') },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
          { key: 'period', label: t('hanmam:column.period'), width: '180px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px' },
        ]}
        showCheckbox
      />
    </div>
  );
}
