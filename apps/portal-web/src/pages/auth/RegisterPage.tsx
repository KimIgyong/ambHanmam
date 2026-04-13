import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSignupStore } from '@/stores/signup.store';
import { Step1AccountForm } from '@/components/signup/Step1AccountForm';
import { SignupCompleteScreen } from '@/components/signup/SignupCompleteScreen';
import { PageHead } from '@/components/seo/PageHead';
import { trackRegisterPageView } from '@/lib/ga-events';

export function RegisterPage() {
  const { t } = useTranslation();
  const autoLoginToken = useSignupStore((s) => s.autoLoginToken);
  const reset = useSignupStore((s) => s.reset);

  const isComplete = !!autoLoginToken;

  // GA4 퍼널 추적
  useEffect(() => {
    trackRegisterPageView(isComplete ? 'complete' : 1);
  }, [isComplete]);

  // 페이지 진입 시 초기화
  useEffect(() => {
    return () => {
      if (!useSignupStore.getState().autoLoginToken) {
        reset();
      }
    };
  }, [reset]);

  const headerTitle = isComplete
    ? t('auth.signup_complete_header')
    : t('auth.signup_step1_title');

  const headerSub = isComplete
    ? ''
    : t('auth.signup_step1_subtitle');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <PageHead title={t('auth.signup_title')} path="/register" noindex />
      <div className="w-full max-w-[480px]">
        {/* 카드 */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* 헤더 그라디언트 */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-6 py-5">
            <h1 className="text-lg font-bold text-white">{headerTitle}</h1>
            {headerSub && (
              <p className="text-xs text-blue-200 mt-1">{headerSub}</p>
            )}
          </div>

          {/* 바디 */}
          <div className="px-6 py-5">
            {!isComplete && <Step1AccountForm />}
            {isComplete && <SignupCompleteScreen />}
          </div>
        </div>
      </div>
    </div>
  );
}
