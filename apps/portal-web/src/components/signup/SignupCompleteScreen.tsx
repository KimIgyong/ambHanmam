import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useSignupStore } from '@/stores/signup.store';
import { trackRegisterComplete, trackSignupGoAmaClick } from '@/lib/ga-events';

const AMA_URL = import.meta.env.VITE_AMA_URL || 'https://ama.amoeba.site';
const AUTO_REDIRECT_DELAY = 3; // seconds

export function SignupCompleteScreen() {
  const { t } = useTranslation();
  const reset = useSignupStore((s) => s.reset);
  const entityCode = useSignupStore((s) => s.entityCode);
  const autoLoginToken = useSignupStore((s) => s.autoLoginToken);
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_DELAY);

  const amaLoginUrl = entityCode
    ? `${AMA_URL}/${entityCode}/login`
    : `${AMA_URL}/user/login`;

  const amaAutoLoginUrl = autoLoginToken
    ? `${amaLoginUrl}?alt=${encodeURIComponent(autoLoginToken)}`
    : amaLoginUrl;

  useEffect(() => {
    trackRegisterComplete('email');
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    if (!autoLoginToken) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          reset();
          trackSignupGoAmaClick();
          window.location.href = amaAutoLoginUrl;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoLoginToken, amaAutoLoginUrl, reset]);

  const handleGoAma = () => {
    reset();
    trackSignupGoAmaClick();
    window.location.href = amaAutoLoginUrl;
  };

  return (
    <div className="space-y-6">
      {/* 성공 아이콘 */}
      <div className="flex justify-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* 헤딩 */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 leading-snug">
          {t('auth.signup_complete_heading')}
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          {t('auth.signup_complete_sub')}
        </p>
      </div>

      {/* AMA 자동 이동 */}
      {autoLoginToken ? (
        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-5 text-white text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3 text-blue-200" />
          <h3 className="text-base font-bold mb-1">{t('auth.signup_auto_redirect_title')}</h3>
          <p className="text-xs text-blue-100 mb-3">
            {t('auth.signup_auto_redirect_desc', { seconds: countdown })}
          </p>

          <button
            onClick={handleGoAma}
            className="w-full h-10 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {t('auth.signup_go_now')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-5 text-white">
          <h3 className="text-base font-bold mb-1">{t('auth.signup_ama_title')}</h3>
          <p className="text-xs text-blue-100 mb-3">{t('auth.signup_ama_desc')}</p>

          <button
            onClick={handleGoAma}
            className="w-full h-10 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
          >
            {t('auth.signup_ama_login_cta')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 포탈 로그인 링크 */}
      <p className="text-center text-xs text-gray-400">
        <a href="/login" className="text-blue-600 hover:underline">
          {t('auth.login_link')}
        </a>
      </p>
    </div>
  );
}
