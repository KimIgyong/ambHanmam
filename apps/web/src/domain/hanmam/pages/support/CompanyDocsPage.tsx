import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function CompanyDocsPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.support.companyDocs')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'select', label: t('hanmam:column.category'), options: [{ value: '', label: '전체' }, { value: 'mgmt', label: '경영' }, { value: 'hr', label: '인사' }, { value: 'fin', label: '재무' }, { value: 'tech', label: '기술' }] },
        { type: 'date-range', label: t('hanmam:column.date') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'category', label: t('hanmam:column.category'), width: '120px' },
          { key: 'version', label: t('hanmam:column.version'), width: '80px', align: 'center' },
          { key: 'author', label: t('hanmam:column.author'), width: '100px' },
          { key: 'regDate', label: t('hanmam:column.regDate'), width: '110px' },
        ]}
        showCheckbox
      />
    </div>
  );
}
