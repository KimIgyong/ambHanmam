import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function CompanyLifePage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.support.companyLife')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'date-range', label: t('hanmam:column.date') },
        { type: 'text', label: t('hanmam:column.author'), placeholder: t('hanmam:column.author') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'regDate', label: t('hanmam:column.regDate'), width: '110px' },
          { key: 'author', label: t('hanmam:column.author'), width: '100px' },
        ]}
      />
    </div>
  );
}
