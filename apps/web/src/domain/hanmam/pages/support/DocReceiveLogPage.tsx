import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function DocReceiveLogPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.support.docReceiveLog')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.docNo'), placeholder: t('hanmam:column.docNo') },
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'text', label: t('hanmam:column.sender'), placeholder: t('hanmam:column.sender') },
        { type: 'date-range', label: t('hanmam:column.receiveDate') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'docNo', label: t('hanmam:column.docNo'), width: '130px' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'sender', label: t('hanmam:column.sender'), width: '120px' },
          { key: 'receiveDate', label: t('hanmam:column.receiveDate'), width: '110px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
      />
    </div>
  );
}
