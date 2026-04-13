import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function DocSendLogPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.support.docSendLog')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.docNo'), placeholder: t('hanmam:column.docNo') },
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'text', label: t('hanmam:column.receiver'), placeholder: t('hanmam:column.receiver') },
        { type: 'date-range', label: t('hanmam:column.sendDate') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'docNo', label: t('hanmam:column.docNo'), width: '130px' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'receiver', label: t('hanmam:column.receiver'), width: '120px' },
          { key: 'sendDate', label: t('hanmam:column.sendDate'), width: '110px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
      />
    </div>
  );
}
