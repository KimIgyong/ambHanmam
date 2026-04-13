import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockTabPanel from '@/domain/hanmam/components/MockTabPanel';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function GeneralManagementPage() {
  const { t } = useTranslation(['hanmam']);
  const [tab, setTab] = useState('sales');
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.management.overview')}</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t('hanmam:tab.sales'), value: '₩1,250,000,000', color: 'text-blue-600' },
          { label: t('hanmam:tab.finance'), value: '₩890,000,000', color: 'text-green-600' },
          { label: t('hanmam:column.budget'), value: '₩360,000,000', color: 'text-purple-600' },
        ].map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-sm text-gray-500">{c.label}</div>
            <div className={`mt-1 text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>
      <MockTabPanel
        tabs={[
          { id: 'sales', label: t('hanmam:tab.sales') },
          { id: 'finance', label: t('hanmam:tab.finance') },
          { id: 'management', label: t('hanmam:tab.management') },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />
      <MockDataGrid
        columns={[
          { key: 'item', label: t('hanmam:column.item') },
          { key: 'budget', label: t('hanmam:column.budget'), width: '130px', align: 'right' },
          { key: 'actual', label: t('hanmam:column.actual'), width: '130px', align: 'right' },
          { key: 'rate', label: t('hanmam:column.rate'), width: '80px', align: 'right' },
        ]}
      />
    </div>
  );
}
