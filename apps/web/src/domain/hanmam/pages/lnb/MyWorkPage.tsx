import { useTranslation } from 'react-i18next';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function MyWorkPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:lnb.myWork')}</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: t('hanmam:status.inProgress'), count: 8, color: 'bg-blue-50 text-blue-700' },
          { label: t('hanmam:status.pending'), count: 3, color: 'bg-yellow-50 text-yellow-700' },
          { label: t('hanmam:status.completed'), count: 15, color: 'bg-green-50 text-green-700' },
          { label: t('hanmam:status.overdue'), count: 1, color: 'bg-red-50 text-red-700' },
        ].map((card) => (
          <div key={card.label} className={`rounded-lg p-4 ${card.color}`}>
            <p className="text-sm font-medium">{card.label}</p>
            <p className="mt-1 text-2xl font-bold">{card.count}</p>
          </div>
        ))}
      </div>

      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'category', label: t('hanmam:column.category'), width: '120px' },
          { key: 'dueDate', label: t('hanmam:column.dueDate'), width: '110px' },
          { key: 'priority', label: t('hanmam:column.priority'), width: '80px', align: 'center' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
