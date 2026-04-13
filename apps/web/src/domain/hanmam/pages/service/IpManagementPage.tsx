import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function IpManagementPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.service.ipManagement')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.ip'), placeholder: '192.168.0.0' },
        { type: 'text', label: t('hanmam:column.description'), placeholder: t('hanmam:column.description') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'ip', label: t('hanmam:column.ip'), width: '160px' },
          { key: 'description', label: t('hanmam:column.description') },
          { key: 'manager', label: t('hanmam:column.manager'), width: '100px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
          { key: 'regDate', label: t('hanmam:column.regDate'), width: '110px' },
        ]}
        showCheckbox
      />
    </div>
  );
}
