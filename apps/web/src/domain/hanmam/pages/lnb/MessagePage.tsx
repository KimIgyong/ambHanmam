import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockTabPanel from '@/domain/hanmam/components/MockTabPanel';
import MockDataGrid from '@/domain/hanmam/components/MockDataGrid';

export default function MessagePage() {
  const { t } = useTranslation(['hanmam']);
  const [activeTab, setActiveTab] = useState('received');

  const tabs = [
    { key: 'received', label: t('hanmam:message.received') },
    { key: 'sent', label: t('hanmam:message.sent') },
  ];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:lnb.message')}</h1>
      <MockTabPanel tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <MockDataGrid
        columns={[
          { key: 'no', label: t('hanmam:column.no'), width: '50px', align: 'center' },
          { key: 'title', label: t('hanmam:column.title') },
          { key: activeTab === 'received' ? 'sender' : 'receiver',
            label: activeTab === 'received' ? t('hanmam:column.sender') : t('hanmam:column.receiver'),
            width: '120px' },
          { key: 'date', label: t('hanmam:column.date'), width: '150px' },
          { key: 'read', label: t('hanmam:column.readStatus'), width: '80px', align: 'center' },
        ]}
        showCheckbox
      />
    </div>
  );
}
