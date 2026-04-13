import { useTranslation } from 'react-i18next';

interface StepIndicatorProps {
  currentStep: 1 | 2 | 'complete';
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const { t } = useTranslation();
  const step = currentStep === 'complete' ? 3 : currentStep;

  return (
    <div className="flex items-center justify-center gap-3 px-6 py-3 bg-gray-50 border-b border-gray-100">
      {/* Step 1 */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step === 1
              ? 'bg-blue-600 text-white'
              : step > 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
          }`}
        >
          {step > 1 ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            '1'
          )}
        </div>
        <span
          className={`text-xs font-medium ${
            step >= 1 ? 'text-blue-700' : 'text-gray-400'
          }`}
        >
          {t('auth.signup_step_account')}
        </span>
      </div>

      {/* Line */}
      <div className="w-12 h-0.5 rounded-full transition-colors">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            step > 1 ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          style={{ width: step > 1 ? '100%' : '0%' }}
        />
      </div>

      {/* Step 2 */}
      <div className="flex items-center gap-2">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
            step === 2
              ? 'bg-blue-600 text-white'
              : step > 2
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
          }`}
        >
          {step > 2 ? (
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            '2'
          )}
        </div>
        <span
          className={`text-xs font-medium ${
            step >= 2 ? 'text-blue-700' : 'text-gray-400'
          }`}
        >
          {t('auth.signup_step_company')}
        </span>
      </div>
    </div>
  );
}
