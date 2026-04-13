import { useState, useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { HR_OT_TYPE } from '@amb/types';
import { useCreateOtRecord } from '../../hooks/useOvertime';

interface OvertimeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Array<{ employeeId: string; employeeCode: string; fullName: string }>;
}

const OT_MULTIPLIERS: Record<string, number> = {
  WEEKDAY_150: 1.5,
  WEEKDAY_NIGHT_200: 2.0,
  WEEKEND_200: 2.0,
  WEEKEND_NIGHT_210: 2.1,
  HOLIDAY_300: 3.0,
};

export default function OvertimeForm({ isOpen, onClose, employees }: OvertimeFormProps) {
  const { t } = useTranslation(['hr', 'common']);
  const createOt = useCreateOtRecord();

  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState('');
  const [timeStart, setTimeStart] = useState('');
  const [timeEnd, setTimeEnd] = useState('');
  const [otType, setOtType] = useState('');
  const [actualHours, setActualHours] = useState<number | ''>('');
  const [convertedHours, setConvertedHours] = useState<number | ''>('');
  const [projectDescription, setProjectDescription] = useState('');

  // Auto-calculate converted hours
  useEffect(() => {
    if (actualHours !== '' && otType && OT_MULTIPLIERS[otType]) {
      const converted = Math.round(actualHours * OT_MULTIPLIERS[otType] * 100) / 100;
      setConvertedHours(converted);
    }
  }, [actualHours, otType]);

  const resetForm = () => {
    setEmployeeId('');
    setDate('');
    setTimeStart('');
    setTimeEnd('');
    setOtType('');
    setActualHours('');
    setConvertedHours('');
    setProjectDescription('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!employeeId || !date || !timeStart || !timeEnd || !otType || actualHours === '' || convertedHours === '') {
      return;
    }

    await createOt.mutateAsync({
      employee_id: employeeId,
      date,
      time_start: timeStart,
      time_end: timeEnd,
      ot_type: otType,
      actual_hours: Number(actualHours),
      converted_hours: Number(convertedHours),
      project_description: projectDescription || undefined,
    });

    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{t('hr:overtime.addRecord')}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Employee */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:overtime.form.employee')}
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">{t('hr:overtime.form.selectEmployee')}</option>
              {employees.map((emp) => (
                <option key={emp.employeeId} value={emp.employeeId}>
                  {emp.employeeCode} - {emp.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:overtime.form.date')}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Time Start / Time End */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:overtime.form.timeStart')}
              </label>
              <input
                type="time"
                value={timeStart}
                onChange={(e) => setTimeStart(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:overtime.form.timeEnd')}
              </label>
              <input
                type="time"
                value={timeEnd}
                onChange={(e) => setTimeEnd(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* OT Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:overtime.form.otType')}
            </label>
            <select
              value={otType}
              onChange={(e) => setOtType(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="">{t('hr:overtime.form.selectType')}</option>
              {Object.values(HR_OT_TYPE).map((type) => (
                <option key={type} value={type}>
                  {t(`hr:overtime.otType.${type}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Actual Hours / Converted Hours */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:overtime.form.actualHours')}
              </label>
              <input
                type="number"
                value={actualHours}
                onChange={(e) => setActualHours(e.target.value ? Number(e.target.value) : '')}
                required
                min={0}
                step={0.5}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('hr:overtime.form.convertedHours')}
              </label>
              <input
                type="number"
                value={convertedHours}
                onChange={(e) => setConvertedHours(e.target.value ? Number(e.target.value) : '')}
                required
                min={0}
                step={0.01}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Project Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('hr:overtime.form.projectDescription')}
            </label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              disabled={createOt.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {createOt.isPending && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {t('common:create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
