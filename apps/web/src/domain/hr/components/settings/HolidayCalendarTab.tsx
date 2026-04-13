import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, X } from 'lucide-react';
import { useHolidays, useCreateHoliday, useDeleteHoliday } from '../../hooks/useHrSettings';
import { formatDate } from '@/lib/format-utils';

interface HolidayCalendarTabProps {
  isAdmin: boolean;
}

export default function HolidayCalendarTab({ isAdmin }: HolidayCalendarTabProps) {
  const { t } = useTranslation(['hr', 'common']);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data: holidays = [], isLoading } = useHolidays(selectedYear);
  const createMutation = useCreateHoliday();
  const deleteMutation = useDeleteHoliday();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: '',
    name: '',
    name_vi: '',
    year: currentYear,
  });

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const resetForm = () => {
    setForm({ date: '', name: '', name_vi: '', year: selectedYear });
    setShowForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ ...form, year: selectedYear }, { onSuccess: resetForm });
  };

  const handleDelete = (holidayId: string) => {
    if (confirm(t('hr:settings.deleteHolidayConfirm'))) {
      deleteMutation.mutate(holidayId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Year selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">{t('hr:settings.year')}</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          ({holidays.length} {t('hr:settings.holidays').toLowerCase()})
        </span>
      </div>

      {/* Holidays table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t('hr:settings.date')}</th>
              <th className="px-3 py-2">{t('hr:settings.holidayName')}</th>
              <th className="px-3 py-2">{t('hr:settings.holidayNameVi')}</th>
              {isAdmin && <th className="px-3 py-2"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {holidays.map((h, i) => (
              <tr key={h.holidayId}>
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2 font-medium text-gray-900">{formatDate(h.date)}</td>
                <td className="px-3 py-2 text-gray-900">{h.name}</td>
                <td className="px-3 py-2 text-gray-600">{h.nameVi || '-'}</td>
                {isAdmin && (
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleDelete(h.holidayId)}
                      disabled={deleteMutation.isPending}
                      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {holidays.length === 0 && (
          <div className="py-8 text-center text-sm text-gray-500">
            {t('hr:settings.noHolidays')}
          </div>
        )}
      </div>

      {/* Add button */}
      {isAdmin && !showForm && (
        <button
          onClick={() => {
            setForm((f) => ({ ...f, year: selectedYear }));
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Plus className="h-4 w-4" />
          {t('hr:settings.addHoliday')}
        </button>
      )}

      {/* Add form */}
      {showForm && (
        <div className="rounded-lg border border-gray-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              {t('hr:settings.addHoliday')}
            </h4>
            <button onClick={resetForm} className="rounded p-1 text-gray-400 hover:bg-gray-100">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.date')} *
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.holidayName')} *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                placeholder="New Year's Day"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('hr:settings.holidayNameVi')}
              </label>
              <input
                type="text"
                value={form.name_vi}
                onChange={(e) => setForm((f) => ({ ...f, name_vi: e.target.value }))}
                placeholder="Tet Duong lich"
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 sm:col-span-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('common:close')}
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {t('common:save')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
