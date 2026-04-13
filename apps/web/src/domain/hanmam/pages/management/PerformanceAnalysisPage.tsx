import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockTabPanel from '@/domain/hanmam/components/MockTabPanel';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function PerformanceAnalysisPage() {
  const { t } = useTranslation(['hanmam']);
  const [tab, setTab] = useState('monthly');
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.management.performance')}</h1>
      <MockTabPanel
        tabs={[
          { id: 'monthly', label: t('hanmam:common.month') },
          { id: 'quarterly', label: 'Q' },
          { id: 'yearly', label: t('hanmam:common.year') },
        ]}
        activeTab={tab}
        onTabChange={setTab}
      />
      <MockDataGrid
        columns={[
          { key: 'item', label: t('hanmam:column.item') },
          { key: 'budget', label: t('hanmam:column.budget'), width: '120px', align: 'right' },
          { key: 'actual', label: t('hanmam:column.actual'), width: '120px', align: 'right' },
          { key: 'rate', label: t('hanmam:column.rate'), width: '80px', align: 'right' },
        ]}
      />
    </div>
  );
}
