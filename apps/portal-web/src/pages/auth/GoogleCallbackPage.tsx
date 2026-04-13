import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { trackGoogleCallbackSuccess, trackGoogleCallbackError } from '@/lib/ga-events';

const ORIGIN = window.location.origin;

export function GoogleCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [popupCloseBlocked, setPopupCloseBlocked] = useState(false);

  const token = searchParams.get('onboarding_token');
  const error = searchParams.get('error');
  const isPopup = !!window.opener;

  // Popup mode: postMessage to opener and close
  useEffect(() => {
    if (!isPopup) return;

    if (token) {
      trackGoogleCallbackSuccess();
      window.opener.postMessage(
        { type: 'google_oauth_success', onboarding_token: token },
        ORIGIN,
      );
    } else if (error) {
      trackGoogleCallbackError(error);
      window.opener.postMessage(
        { type: 'google_oauth_error', error },
        ORIGIN,
      );
    }
    window.close();
    // window.close()가 브라우저 정책으로 실패할 수 있음
    setTimeout(() => setPopupCloseBlocked(true), 300);
  }, [token, error, isPopup]);

  // Redirect mode (fallback when not popup)
  useEffect(() => {
    if (isPopup) return;
    if (token) {
      trackGoogleCallbackSuccess();
      navigate(`/auth/google/onboarding?token=${encodeURIComponent(token)}`, { replace: true });
    }
  }, [token, navigate, isPopup]);

  useEffect(() => {
    if (isPopup) return;
    if (error) {
      trackGoogleCallbackError(error);
    }
  }, [error, isPopup]);

  // 팝업 모드에서 "Sign in" / "Sign up" 클릭 시 → 부모창으로 전달 후 닫기
  const handleLinkClick = (path: string) => {
    if (isPopup) {
      // 에러 정보를 부모에게 다시 전달 (이미 useEffect에서 전달했지만, close 실패한 경우 대비)
      if (error) {
        window.opener.postMessage(
          { type: 'google_oauth_error', error },
          ORIGIN,
        );
      }
      window.close();
      // close 실패 시 안내
      setTimeout(() => setPopupCloseBlocked(true), 300);
    } else {
      navigate(path);
    }
  };

  // 팝업에서 window.close() 실패 시 안내 화면
  if (isPopup && popupCloseBlocked) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900">{t('auth.google_close_popup_title')}</h1>
          <p className="mt-2 text-sm text-gray-600">{t('auth.google_close_popup_desc')}</p>
          <button
            type="button"
            onClick={() => window.close()}
            className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            {t('auth.google_close_popup_btn')}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    const isEmailExists = error === 'email_exists';
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
        <div className={`w-full max-w-md rounded-xl border p-6 text-center ${
          isEmailExists ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'
        }`}>
          <h1 className={`text-xl font-semibold ${isEmailExists ? 'text-amber-700' : 'text-red-700'}`}>
            {isEmailExists ? t('auth.google_email_exists_title') : t('auth.google_auth_failed')}
          </h1>
          <p className={`mt-2 text-sm ${isEmailExists ? 'text-amber-600' : 'text-red-600'}`}>
            {isEmailExists ? t('auth.google_email_exists_desc') : decodeURIComponent(error)}
          </p>
          <button
            type="button"
            onClick={() => handleLinkClick(isEmailExists ? '/login' : '/register')}
            className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            {isEmailExists ? t('auth.login_link') : t('auth.signup_link')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">{t('auth.google_auth_processing')}</h1>
        <p className="mt-2 text-sm text-gray-600">{t('auth.google_auth_processing_desc')}</p>
      </div>
    </div>
  );
}
