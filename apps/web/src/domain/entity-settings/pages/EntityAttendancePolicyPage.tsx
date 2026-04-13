import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useAttendancePolicy, useUpdateAttendancePolicy } from '@/domain/attendance/hooks/useAttendance';

export default function EntityAttendancePolicyPage() {
  const { t } = useTranslation(['attendance', 'common']);
  const { data: policy, isLoading } = useAttendancePolicy();
  const updateMutation = useUpdateAttendancePolicy();

  const [remoteDefaultCount, setRemoteDefaultCount] = useState(1);
  const [remoteExtraCount, setRemoteExtraCount] = useState(0);
  const [remoteBlockOnExceed, setRemoteBlockOnExceed] = useState(true);
  const [leaveAutoDeduct, setLeaveAutoDeduct] = useState(false);
  const [halfLeaveAutoDeduct, setHalfLeaveAutoDeduct] = useState(false);

  useEffect(() => {
    if (policy) {
      setRemoteDefaultCount(policy.remoteDefaultCount);
      setRemoteExtraCount(policy.remoteExtraCount);
      setRemoteBlockOnExceed(policy.remoteBlockOnExceed);
      setLeaveAutoDeduct(policy.leaveAutoDeduct);
      setHalfLeaveAutoDeduct(policy.halfLeaveAutoDeduct);
    }
  }, [policy]);

  const handleSave = () => {
    updateMutation.mutate(
      {
        remote_default_count: remoteDefaultCount,
        remote_extra_count: remoteExtraCount,
        remote_block_on_exceed: remoteBlockOnExceed,
        leave_auto_deduct: leaveAutoDeduct,
        half_leave_auto_deduct: halfLeaveAutoDeduct,
      },
      {
        onSuccess: () => {
          toast.success(t('attendance:policy.saved'));
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-400">
        {t('common:loading')}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('attendance:policy.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('attendance:policy.subtitle')}</p>

        <div className="mt-8 space-y-8">
          {/* Remote Work Policy */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('attendance:policy.remotePolicy')}
            </h2>

            <div className="mt-4 space-y-4">
              {/* Monthly default count */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t('attendance:policy.remoteDefaultCount')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={remoteDefaultCount}
                    onChange={(e) => setRemoteDefaultCount(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
                    className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-500">{t('attendance:policy.perMonth')}</span>
                </div>
              </div>

              {/* Extra count */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t('attendance:policy.remoteExtraCount')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={31}
                    value={remoteExtraCount}
                    onChange={(e) => setRemoteExtraCount(Math.max(0, Math.min(31, parseInt(e.target.value) || 0)))}
                    className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-500">{t('attendance:policy.perMonth')}</span>
                </div>
              </div>

              {/* Block on exceed toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t('attendance:policy.remoteBlockOnExceed')}
                </label>
                <button
                  type="button"
                  onClick={() => setRemoteBlockOnExceed(!remoteBlockOnExceed)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    remoteBlockOnExceed ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      remoteBlockOnExceed ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Leave Policy (Future) */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 opacity-60">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('attendance:policy.leavePolicy')}
              <span className="ml-2 text-sm font-normal text-gray-400">
                {t('attendance:policy.leavePolicyFuture')}
              </span>
            </h2>

            <div className="mt-4 space-y-4">
              {/* Leave auto deduct toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t('attendance:policy.leaveAutoDeduct')}
                </label>
                <button
                  type="button"
                  onClick={() => setLeaveAutoDeduct(!leaveAutoDeduct)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    leaveAutoDeduct ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      leaveAutoDeduct ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Half leave auto deduct toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  {t('attendance:policy.halfLeaveAutoDeduct')}
                </label>
                <button
                  type="button"
                  onClick={() => setHalfLeaveAutoDeduct(!halfLeaveAutoDeduct)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    halfLeaveAutoDeduct ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${
                      halfLeaveAutoDeduct ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {t('common:save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
