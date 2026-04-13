import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockTabPanel from '@/domain/hanmam/components/MockTabPanel';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function EApprovalPage() {
  const { t } = useTranslation(['hanmam']);
  const [activeTab, setActiveTab] = useState('toApprove');

  const tabs = [
    { key: 'toApprove', label: t('hanmam:approval.toApprove') },
    { key: 'inProgress', label: t('hanmam:approval.inProgress') },
    { key: 'notSubmitted', label: t('hanmam:approval.notSubmitted') },
  ];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:lnb.approval')}</h1>
      <MockTabPanel tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'docType', label: t('hanmam:column.docType'), width: '120px' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'drafter', label: t('hanmam:column.drafter'), width: '100px' },
          { key: 'draftDate', label: t('hanmam:column.draftDate'), width: '110px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
