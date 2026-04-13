import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, GripVertical, Eye, EyeOff, Save } from 'lucide-react';
import { useAttendanceMembers, useUpdateAttendanceMembers } from '../hooks/useAttendance';
import type { AttendanceMemberSetting } from '../service/attendance.service';

interface Props {
  onClose: () => void;
}

export default function AttendanceMemberModal({ onClose }: Props) {
  const { t } = useTranslation(['attendance', 'common']);
  const { data: serverMembers = [] } = useAttendanceMembers();
  const updateMutation = useUpdateAttendanceMembers();

  const [members, setMembers] = useState<AttendanceMemberSetting[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    if (serverMembers.length > 0) {
      setMembers([...serverMembers]);
    }
  }, [serverMembers]);

  const toggleHidden = useCallback((userId: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, hidden: !m.hidden } : m)),
    );
  }, []);

  const handleDragStart = (idx: number) => {
    setDragIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    setMembers((prev) => {
      const list = [...prev];
      const [moved] = list.splice(dragIdx, 1);
      list.splice(idx, 0, moved);
      return list;
    });
    setDragIdx(idx);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
  };

  const handleSave = () => {
    const payload = members.map((m, idx) => ({
      user_id: m.userId,
      hidden: m.hidden,
      order: idx + 1,
    }));
    updateMutation.mutate(payload, { onSuccess: () => onClose() });
  };

  const visibleCount = members.filter((m) => !m.hidden).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="relative w-full max-w-md rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            {t('attendance:memberManage.title', { defaultValue: '출퇴근 기록자 관리' })}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subtitle */}
        <div className="px-6 pt-3 pb-2">
          <p className="text-xs text-gray-500">
            {t('attendance:memberManage.desc', {
              defaultValue: '노출할 직원을 선택하고 드래그하여 순서를 지정하세요.',
            })}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {t('attendance:memberManage.visibleCount', {
              defaultValue: '노출 {{count}}명 / 전체 {{total}}명',
              count: visibleCount,
              total: members.length,
            })}
          </p>
        </div>

        {/* Member List */}
        <div className="max-h-[400px] overflow-y-auto px-6 py-2">
          {members.map((m, idx) => (
            <div
              key={m.userId}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 mb-1.5 transition-colors select-none ${
                dragIdx === idx
                  ? 'border-indigo-300 bg-indigo-50'
                  : m.hidden
                    ? 'border-gray-100 bg-gray-50'
                    : 'border-gray-200 bg-white'
              }`}
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-gray-300 active:cursor-grabbing" />

              <span className="text-xs font-mono text-gray-400 w-5 text-center">
                {idx + 1}
              </span>

              <span className={`flex-1 text-sm font-medium ${m.hidden ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                {m.userName}
                {m.levelCode === 'CLIENT_LEVEL' && (
                  <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20">
                    Client
                  </span>
                )}
              </span>

              <button
                onClick={() => toggleHidden(m.userId)}
                className={`rounded p-1.5 transition-colors ${
                  m.hidden
                    ? 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                    : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50'
                }`}
                title={m.hidden
                  ? t('attendance:memberManage.show', { defaultValue: '노출' })
                  : t('attendance:memberManage.hide', { defaultValue: '숨기기' })
                }
              >
                {m.hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel', { defaultValue: '취소' })}
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {t('common:save', { defaultValue: '저장' })}
          </button>
        </div>
      </div>
    </div>
  );
}
