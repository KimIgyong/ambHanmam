import { useTranslation } from 'react-i18next';
import MockSearchFilter from '@/domain/hanmam/components/MockSearchFilter';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function DevBoardPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.support.devBoard')}</h1>
      <MockSearchFilter filters={[
        { type: 'text', label: t('hanmam:column.title'), placeholder: t('hanmam:column.title') },
        { type: 'text', label: t('hanmam:column.author'), placeholder: t('hanmam:column.author') },
        { type: 'date-range', label: t('hanmam:column.date') },
      ]} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'category', label: t('hanmam:column.category'), width: '120px' },
          { key: 'author', label: t('hanmam:column.author'), width: '100px' },
          { key: 'regDate', label: t('hanmam:column.regDate'), width: '110px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
      />
    </div>
  );
}
