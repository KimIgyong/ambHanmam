import { useTranslation } from 'react-i18next';
import { X, CreditCard, Lock } from 'lucide-react';

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPolar: () => void;
}

export default function PaymentMethodModal({
  open,
  onClose,
  onSelectPolar,
}: PaymentMethodModalProps) {
  const { t } = useTranslation(['subscription']);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {t('subscription:payment.selectMethod')}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Polar — Active */}
          <button
            onClick={onSelectPolar}
            className="flex w-full items-center gap-4 rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4 text-left transition-colors hover:border-indigo-400"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <CreditCard className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t('subscription:payment.polar')}
              </p>
              <p className="text-xs text-gray-500">
                {t('subscription:payment.polarDesc')}
              </p>
            </div>
          </button>

          {/* Toss — Coming Soon */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t('subscription:payment.toss')}
              </p>
              <p className="text-xs text-gray-500">
                {t('subscription:payment.tossDesc')}
              </p>
            </div>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
              {t('subscription:payment.comingSoon')}
            </span>
          </div>

          {/* MegaPay — Coming Soon */}
          <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 opacity-60">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                {t('subscription:payment.megapay')}
              </p>
              <p className="text-xs text-gray-500">
                {t('subscription:payment.megapayDesc')}
              </p>
            </div>
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-500">
              {t('subscription:payment.comingSoon')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
