import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface Props {
  value: string | null;
  onChange: (code: string | null) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ATTENDANCE_CODES = [
  { code: '8', color: 'bg-green-100 text-green-800' },
  { code: '4', color: 'bg-green-50 text-green-700' },
  { code: 'AL', color: 'bg-orange-100 text-orange-800' },
  { code: 'PL', color: 'bg-orange-100 text-orange-800' },
  { code: 'UP', color: 'bg-red-100 text-red-800' },
  { code: 'H', color: 'bg-blue-100 text-blue-800' },
  { code: 'RE', color: 'bg-purple-100 text-purple-800' },
  { code: 'M', color: 'bg-orange-100 text-orange-800' },
  { code: 'SL', color: 'bg-orange-100 text-orange-800' },
  { code: 'AB', color: 'bg-red-100 text-red-800' },
] as const;

export default function AttendanceCodeSelector({ value, onChange, isOpen, onClose }: Props) {
  const { t } = useTranslation(['hr', 'common']);

  if (!isOpen) return null;

  return (
    <div className="absolute z-20 mt-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5">
        <span className="text-xs font-medium text-gray-500">
          {t('hr:timesheet.attendance.select', { defaultValue: 'Select' })}
        </span>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="max-h-52 overflow-y-auto py-1">
        {ATTENDANCE_CODES.map(({ code, color }) => (
          <button
            key={code}
            onClick={() => {
              onChange(code);
              onClose();
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-50 ${
              value === code ? 'bg-teal-50' : ''
            }`}
          >
            <span
              className={`inline-flex h-5 min-w-[28px] items-center justify-center rounded px-1 text-xs font-semibold ${color}`}
            >
              {code}
            </span>
            <span className="truncate text-gray-700">
              {t(`hr:timesheet.attendance.${code}`)}
            </span>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-100 px-1 py-1">
        <button
          onClick={() => {
            onChange(null);
            onClose();
          }}
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-50"
        >
          <span className="inline-flex h-5 min-w-[28px] items-center justify-center rounded border border-gray-200 bg-gray-50 px-1 text-xs text-gray-400">
            --
          </span>
          <span>{t('common:clear', { defaultValue: 'Clear' })}</span>
        </button>
      </div>
    </div>
  );
}
