import { useTranslation } from 'react-i18next';
import MockMonthCalendar from '@/domain/hanmam/components/MockMonthCalendar';

export default function ScheduleSharingPage() {
  const { t } = useTranslation(['hanmam']);
  return (
    <div className="space-y-4 p-6">
      <h1 className="text-xl font-bold text-gray-800">{t('hanmam:menu.notice.schedule')}</h1>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <select className="rounded border border-gray-300 px-3 py-1.5 text-sm" disabled>
            <option>{t('hanmam:common.all')}</option>
            <option>{t('hanmam:common.mySchedule')}</option>
            <option>{t('hanmam:common.teamSchedule')}</option>
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
