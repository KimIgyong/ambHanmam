import { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, X } from 'lucide-react';

export interface AlertModalProps {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  onClose: () => void;
  /** 자동 닫힘 시간(ms). 0이면 자동 닫힘 없음. 기본 3000ms (success만) */
  autoCloseMs?: number;
}

export function AlertModal({ isOpen, type, title, message, onClose, autoCloseMs }: AlertModalProps) {
  const { t } = useTranslation();
  const resolvedAutoClose = autoCloseMs ?? (type === 'success' ? 3000 : 0);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (!isOpen || resolvedAutoClose <= 0) return;
    const timer = setTimeout(onClose, resolvedAutoClose);
    return () => clearTimeout(timer);
  }, [isOpen, resolvedAutoClose, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 py-6 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isSuccess ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              {isSuccess ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <XCircle className="w-6 h-6 text-red-500" />
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className={`text-base font-semibold ${
              isSuccess ? 'text-gray-900' : 'text-red-700'
            }`}
          >
            {title}
          </h3>

          {/* Message */}
          {message && (
            <p className="mt-1.5 text-sm text-gray-500">{message}</p>
          )}

          {/* Button */}
          <button
            onClick={onClose}
            className={`mt-5 w-full h-10 rounded-lg text-sm font-semibold transition-colors ${
              isSuccess
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {t('auth.modal_confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
