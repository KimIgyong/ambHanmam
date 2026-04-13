import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useLoginModal } from '@/domain/entity-settings/hooks/useSiteConfig';
import { useAuthStore } from '@/domain/auth/store/auth.store';

const STORAGE_KEY = 'amb_login_modal_dismissed';

export default function LoginAnnouncementModal() {
  const { t } = useTranslation(['common']);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data } = useLoginModal();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !data?.enabled) return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const today = new Date().toISOString().slice(0, 10);
    if (dismissed === today) return;
    setVisible(true);
  }, [isAuthenticated, data]);

  const dismiss = (skipToday: boolean) => {
    if (skipToday) {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString().slice(0, 10));
    }
    setVisible(false);
  };

  if (!visible || !data) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => dismiss(false)}>
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <div className="mb-2 flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{data.title || t('common:notice')}</h3>
          <button onClick={() => dismiss(false)} className="rounded p-1 text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6 whitespace-pre-wrap text-sm text-gray-600">{data.content}</div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button onClick={() => dismiss(true)} className="text-xs text-gray-400 hover:text-gray-600">
            {t('common:dontShowToday')}
          </button>
          <button
            onClick={() => dismiss(false)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            {t('common:confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
