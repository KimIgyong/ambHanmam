import { useTranslation } from 'react-i18next';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function MainDashboardPage() {
  const { t } = useTranslation(['hanmam']);

  const noticeColumns = [
    { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' as const },
    { key: 'category', label: t('hanmam:column.category'), width: '80px' },
    { key: 'title', label: t('hanmam:column.title') },
    { key: 'author', label: t('hanmam:column.author'), width: '100px' },
    { key: 'date', label: t('hanmam:column.date'), width: '100px' },
  ];

  const scheduleColumns = [
    { key: 'title', label: t('hanmam:column.title') },
    { key: 'date', label: t('hanmam:column.date'), width: '120px' },
    { key: 'author', label: t('hanmam:column.author'), width: '100px' },
  ];

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.management.dashboard')}</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('hanmam:dashboard.notices'), value: '12', color: 'bg-blue-50 text-blue-700' },
          { label: t('hanmam:dashboard.schedule'), value: '5', color: 'bg-green-50 text-green-700' },
          { label: t('hanmam:dashboard.attendance'), value: '48', color: 'bg-purple-50 text-purple-700' },
          { label: t('hanmam:dashboard.anniversary'), value: '3', color: 'bg-pink-50 text-pink-700' },
        ].map((card) => (
          <div key={card.label} className={`rounded-lg border border-gray-200 bg-white p-4`}>
            <div className="text-sm text-gray-500">{card.label}</div>
            <div className={`mt-1 text-2xl font-bold ${card.color.split(' ')[1]}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-600">{t('hanmam:dashboard.notices')}</h2>
          <MockDataGrid columns={noticeColumns} totalCount={12} />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-600">{t('hanmam:dashboard.schedule')}</h2>
          <MockDataGrid columns={scheduleColumns} totalCount={5} />
        </div>
      </div>
    </div>
  );
}
