import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateTimezone } from '../hooks/useMyPage';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const TIMEZONE_OPTIONS = [
  'Asia/Ho_Chi_Minh',
  'Asia/Seoul',
  'Asia/Tokyo',
  'America/New_York',
  'Europe/London',
  'UTC',
] as const;

const LOCALE_OPTIONS = ['vi', 'ko', 'en'] as const;

export default function TimezoneSection() {
  const { t } = useTranslation('myPage');
  const { timezone: currentTimezone } = useTimezoneStore();
  const user = useAuthStore((s) => s.user);

  const [selectedTimezone, setSelectedTimezone] = useState(
    user?.timezone || currentTimezone || 'Asia/Ho_Chi_Minh',
  );
  const [selectedLocale, setSelectedLocale] = useState(user?.locale || 'vi');

  const mutation = useUpdateTimezone();

  const handleSave = async () => {
    try {
      await mutation.mutateAsync({ timezone: selectedTimezone, locale: selectedLocale });
      toast.success(t('myPage:timezone.success'));
    } catch {
      toast.error(t('myPage:timezone.failed'));
    }
  };

  const isChanged =
    selectedTimezone !== (user?.timezone || currentTimezone) ||
    selectedLocale !== (user?.locale || 'vi');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-5 w-5 text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">{t('myPage:timezone.title')}</h2>
      </div>

      <div className="space-y-4">
        {/* Timezone */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('myPage:timezone.timezoneLabel')}
            </label>
            <select
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {t(`myPage:timezone.timezones.${tz}`, { defaultValue: tz })}
                </option>
              ))}
            </select>
          </div>

          {/* Locale */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              {t('myPage:timezone.localeLabel')}
            </label>
            <select
              value={selectedLocale}
              onChange={(e) => setSelectedLocale(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              {LOCALE_OPTIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {t(`myPage:timezone.locales.${loc}`, { defaultValue: loc })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Current timezone preview */}
        <p className="text-xs text-gray-400">
          {t('myPage:timezone.timezones.' + selectedTimezone, { defaultValue: selectedTimezone })}
          {' · '}
          {new Intl.DateTimeFormat('en-CA', {
            timeZone: selectedTimezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }).format(new Date())}
        </p>

        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isChanged || mutation.isPending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mutation.isPending ? '...' : t('myPage:timezone.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
