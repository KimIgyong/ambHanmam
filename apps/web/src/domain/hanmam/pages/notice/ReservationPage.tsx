import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MockMonthCalendar from '@/domain/hanmam/components/MockMonthCalendar';
import MockTabPanel from '@/domain/hanmam/components/MockTabPanel';

export default function ReservationPage() {
  const { t } = useTranslation(['hanmam']);
  const [activeTab, setActiveTab] = useState('meetingRoom');

  const tabs = [
    { key: 'meetingRoom', label: t('hanmam:reservation.meetingRoom') },
    { key: 'vehicle', label: t('hanmam:reservation.vehicle') },
  ];

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.notice.reservation')}</h1>
      <MockTabPanel tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select className="rounded border border-gray-300 px-3 py-1.5 text-sm" disabled>
            {activeTab === 'meetingRoom' ? (
              <>
                <option>{t('hanmam:common.all')}</option>
                <option>회의실 A</option>
                <option>회의실 B</option>
              </>
            ) : (
              <>
                <option>{t('hanmam:common.all')}</option>
                <option>차량 1</option>
                <option>차량 2</option>
              </>
            )}
          </select>
        </div>
        <button className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white" disabled>
          {t('hanmam:button.register')}
        </button>
      </div>
      <MockMonthCalendar />
    </div>
  );
}
