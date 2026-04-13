import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockTabPanel from '@/domain/hanmam/components/MockTabPanel';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function WorkContactPage() {
  const { t } = useTranslation(['hanmam']);
  const [activeTab, setActiveTab] = useState('processing');

  const tabs = [
    { key: 'processing', label: t('hanmam:workContact.processing') },
    { key: 'assigned', label: t('hanmam:workContact.assigned') },
    { key: 'interested', label: t('hanmam:workContact.interested') },
  ];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:lnb.workContact')}</h1>
      <MockTabPanel tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: 'requestor', label: t('hanmam:column.requestor'), width: '100px' },
          { key: 'assignee', label: t('hanmam:column.assignee'), width: '100px' },
          { key: 'dueDate', label: t('hanmam:column.dueDate'), width: '110px' },
          { key: 'status', label: t('hanmam:column.status'), width: '100px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
