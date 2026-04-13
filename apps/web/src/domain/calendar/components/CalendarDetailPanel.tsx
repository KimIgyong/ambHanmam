import { useTranslation } from 'react-i18next';
import { X, Trash2, Edit2, MapPin, Clock, Users, Repeat, Calendar } from 'lucide-react';
import { useCalendarStore } from '../store/calendar.store';
import { useCalendarDetail, useDeleteCalendar } from '../hooks/useCalendar';
import { getCategoryBgClass } from './calendar-utils';
import { LocalDateTime } from '@/components/common/LocalDateTime';

export default function CalendarDetailPanel() {
  const { t } = useTranslation('calendar');
  const { selectedCalendarId, setSelectedCalendarId, openForm } = useCalendarStore();
  const { data: schedule, isLoading } = useCalendarDetail(selectedCalendarId);
  const deleteMutation = useDeleteCalendar();

  if (!selectedCalendarId) return null;

  const handleClose = () => setSelectedCalendarId(null);

  const handleEdit = () => {
    if (schedule) {
      setSelectedCalendarId(schedule.calId);
      openForm(undefined);
    }
  };

  const handleDelete = async () => {
    if (!schedule) return;
    if (!window.confirm(t('deleteConfirm.message'))) return;
    await deleteMutation.mutateAsync(schedule.calId);
    setSelectedCalendarId(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('form.title', { defaultValue: '일정 상세' })}
          </h3>
          <div className="flex items-center gap-1">
            <button onClick={handleEdit} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" title={t('editSchedule')}>
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
            <button onClick={handleClose} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : !schedule ? (
          <div className="p-8 text-center text-gray-400">{t('error.notFound')}</div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Color bar + Title */}
            <div className="flex items-start gap-3">
              {schedule.calColor && (
                <div className="w-1 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: schedule.calColor }} />
              )}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{schedule.calTitle}</h2>
                <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 border ${getCategoryBgClass(schedule.calCategory)}`}>
                  {t(`category.${schedule.calCategory}`)}
                </span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {schedule.calIsAllDay ? (
                  <span>{<LocalDateTime value={schedule.calStartAt} format='YYYY-MM-DD HH:mm' />}</span>
                ) : (
                  <>
                    <div>{<LocalDateTime value={schedule.calStartAt} format='YYYY-MM-DD HH:mm' />}</div>
                    <div>~ {<LocalDateTime value={schedule.calEndAt} format='YYYY-MM-DD HH:mm' />}</div>
                  </>
                )}
              </div>
            </div>

            {/* Location */}
            {schedule.calLocation && (
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{schedule.calLocation}</span>
              </div>
            )}

            {/* Description */}
            {schedule.calDescription && (
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                {schedule.calDescription}
              </div>
            )}

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span className="font-medium">{t('form.visibility')}:</span>{' '}
                {t(`visibility.${schedule.calVisibility}`)}
              </div>
              <div>
                <span className="font-medium">{t('form.category')}:</span>{' '}
                {t(`category.${schedule.calCategory}`)}
              </div>
              {schedule.calRecurrenceType !== 'NONE' && (
                <div className="col-span-2">
                  <Repeat className="w-3 h-3 inline mr-1" />
                  {t(`recurrence.${schedule.calRecurrenceType}`)}
                </div>
              )}
            </div>

            {/* Participants */}
            {schedule.participants && schedule.participants.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {t('participant.title')} ({schedule.participants.length})
                </h4>
                <div className="space-y-1.5">
                  {schedule.participants.map((p) => (
                    <div key={p.clpId} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {p.user?.usrName || p.usrId}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        p.clpResponseStatus === 'ACCEPTED' ? 'bg-green-100 text-green-700' :
                        p.clpResponseStatus === 'DECLINED' ? 'bg-red-100 text-red-700' :
                        p.clpResponseStatus === 'TENTATIVE' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {t(`response.${p.clpResponseStatus}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google sync status */}
            {schedule.calSyncStatus && schedule.calSyncStatus !== 'NOT_SYNCED' && (
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t(`google.${schedule.calSyncStatus === 'SYNCED' ? 'synced' : schedule.calSyncStatus === 'FAILED' ? 'syncFailed' : 'notSynced'}`)}
              </div>
            )}

            {/* Owner */}
            {schedule.owner && (
              <div className="text-xs text-gray-400">
                Created by {schedule.owner.usrName}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-end pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t('deleteSchedule')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
