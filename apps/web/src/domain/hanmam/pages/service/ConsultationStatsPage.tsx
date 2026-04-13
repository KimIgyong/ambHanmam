import { useTranslation } from 'react-i18next';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function ConsultationStatsPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.service.consultationStats')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t('hanmam:status.completed'), value: '156', color: 'text-green-600' },
          { label: t('hanmam:status.inProgress'), value: '23', color: 'text-yellow-600' },
          { label: t('hanmam:status.pending'), value: '8', color: 'text-red-600' },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
      <MockDataGrid
        columns={[
          { key: 'consultType', label: t('hanmam:column.consultType') },
          { key: 'totalAmount', label: t('hanmam:column.totalAmount'), width: '100px', align: 'right' },
          { key: 'completed', label: t('hanmam:status.completed'), width: '100px', align: 'right' },
          { key: 'inProgress', label: t('hanmam:status.inProgress'), width: '100px', align: 'right' },
          { key: 'pending', label: t('hanmam:status.pending'), width: '100px', align: 'right' },
          { key: 'rate', label: t('hanmam:column.rate'), width: '80px', align: 'right' },
        ]}
      />
    </div>
  );
}
