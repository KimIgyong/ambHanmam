import { useState } from 'react';
// [DISABLED] Google OAuth 비활성화 중 — 해제 시 useEffect, useCallback 복원
// import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
// [DISABLED] Google OAuth 비활성화 중
// import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useSignupStore } from '@/stores/signup.store';
import { useAuthStore } from '@/stores/auth.store';
import { useEmailVerify } from '@/hooks/useEmailVerify';
import { EmailVerifyInline } from './EmailVerifyInline';
import { TermsCheckboxGroup } from './TermsCheckboxGroup';
import { AlertModal } from '@/components/ui/AlertModal';
import type { ModalState } from '@/hooks/useEmailVerify';
// [DISABLED] Google OAuth 비활성화 중
// import api from '@/lib/api';
import { trackRegisterSubmit, trackRegisterSubmitError } from '@/lib/ga-events';
// import { trackGoogleSignupStart, trackGoogleCallbackError } from '@/lib/ga-events';

// [DISABLED] Google OAuth 비활성화 중
// const POPUP_WIDTH = 500;
// const POPUP_HEIGHT = 600;
const MODAL_CLOSED: ModalState = { isOpen: false, type: 'success', title: '', message: '' };

export function Step1AccountForm() {
  const { t } = useTranslation();
  // [DISABLED] Google OAuth 비활성화 중
  // const navigate = useNavigate();
  const store = useSignupStore();
  const registerFn = useAuthStore((s) => s.register);

  const emailVerify = useEmailVerify();
  const [submitting, setSubmitting] = useState(false);
  const [submitModal, setSubmitModal] = useState<ModalState>(MODAL_CLOSED);
  // [DISABLED] Google 로그인 비활성화 중 (2026-04-12)
  // const [googleLoading, setGoogleLoading] = useState(false);
  // const [googleError, setGoogleError] = useState<string | null>(null);

  const canSubmit =
    emailVerify.verified &&
    store.agreedTos &&
    store.agreedPrivacy;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      // Sync verifyToken from emailVerify hook
      if (emailVerify.verifyToken) {
        store.setEmailVerified(emailVerify.verifyToken);
      }

      const result = await registerFn({
        email: store.email,
        verify_token: emailVerify.verifyToken || store.verifyToken || '',
        terms_agreed: store.agreedTos,
        privacy_agreed: store.agreedPrivacy,
        marketing_agreed: store.agreedMarketing,
      });

      store.setRegistrationResult({
        entityCode: result?.entityCode,
        entityName: result?.entityName,
        autoLoginToken: result?.autoLoginToken,
      });

      trackRegisterSubmit({
        method: 'email',
        company: '',
        country: '',
      });

      // Go to complete screen (auto-redirect to AMA)
      store.setField('emailVerified', true);
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { code?: string; message?: string }; message?: string } } })?.response?.data;
      const msg = errData?.error?.message || errData?.message;
      const errCode = errData?.error?.code || 'unknown';
      const errMsg = msg || t('auth.register_failed');
      trackRegisterSubmitError(errCode);
      setSubmitModal({ isOpen: true, type: 'error', title: t('auth.modal_register_fail_title'), message: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  /* [DISABLED] Google OAuth 전체 로직 — 구글 로그인 간소화 작업 전까지 비활성화 (2026-04-12)
  // Listen for postMessage from Google OAuth popup
  const handleOAuthMessage = useCallback((event: MessageEvent) => {
    if (event.origin !== window.location.origin) return;
    const { type, onboarding_token, error } = event.data || {};
    if (type === 'google_oauth_success' && onboarding_token) {
      setGoogleLoading(false);
      navigate(`/auth/google/onboarding?token=${encodeURIComponent(onboarding_token)}`);
    } else if (type === 'google_oauth_error' && error) {
      setGoogleLoading(false);
      if (error === 'email_exists') {
        setGoogleError(t('auth.google_email_exists_desc'));
      } else {
        setGoogleError(decodeURIComponent(error));
      }
      trackGoogleCallbackError(error);
    }
  }, [t]);

  useEffect(() => {
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [handleOAuthMessage]);

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    trackGoogleSignupStart();
    try {
      const { data } = await api.get('/portal/auth/google/start');
      const result = data.data || data;
      const url = result.url;

      const left = window.screenX + (window.outerWidth - POPUP_WIDTH) / 2;
      const top = window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2;
      const popup = window.open(
        url,
        'google_oauth_popup',
        `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},scrollbars=yes`,
      );

      if (!popup || popup.closed) {
        window.location.href = url;
        return;
      }

      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setGoogleLoading(false);
        }
      }, 500);
    } catch {
      setGoogleLoading(false);
    }
  };
  */

  const emailFieldClass = emailVerify.verified
    ? 'border-green-500 bg-green-50'
    : '';

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-800">{t('auth.signup_panel1_title')}</p>
        <p className="text-xs text-gray-400 mt-0.5">{t('auth.signup_panel1_sub')}</p>
      </div>

      {/* [DISABLED] Google 로그인 버튼 — 구글 로그인 간소화 작업 전까지 비활성화 (2026-04-12)
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {googleLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {t('auth.continue_with_google')}
      </button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">{t('auth.or_divider')}</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      */}

      {/* 이메일 + 인증 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.signup_field_email')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="email"
            value={store.email}
            onChange={(e) => store.setField('email', e.target.value)}
            placeholder="email@company.com"
            className={`input-field pl-9 pr-28 ${emailFieldClass}`}
            disabled={emailVerify.verified}
            autoComplete="email"
          />
          {!emailVerify.verified && (
            <button
              type="button"
              onClick={() => emailVerify.handleSendCode(store.email)}
              disabled={!store.email || emailVerify.sending || (emailVerify.codeSent && emailVerify.resendTimer > 0)}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-[11px] font-semibold hover:bg-blue-100 disabled:opacity-40 transition-colors whitespace-nowrap"
            >
              {emailVerify.sending
                ? '...'
                : emailVerify.codeSent
                  ? t('auth.signup_resend')
                  : t('auth.signup_send_code')}
            </button>
          )}
          {emailVerify.verified && (
            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 flex items-center bg-green-50 text-green-600 border border-green-100 rounded-lg text-[11px] font-semibold">
              ✓ {t('auth.signup_verified_badge')}
            </span>
          )}
        </div>

        <EmailVerifyInline
          codeSent={emailVerify.codeSent}
          verified={emailVerify.verified}
          sending={emailVerify.sending}
          verifying={emailVerify.verifying}
          error={emailVerify.error}
          resendTimer={emailVerify.resendTimer}
          onSendCode={() => emailVerify.handleSendCode(store.email)}
          onVerify={(code) => emailVerify.handleVerify(store.email, code)}
        />
      </div>

      {/* 약관 동의 */}
      <div className="flex items-center gap-2 pt-1">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs font-medium text-gray-400">{t('auth.signup_terms_section')}</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <TermsCheckboxGroup
        agreedTos={store.agreedTos}
        agreedPrivacy={store.agreedPrivacy}
        agreedMarketing={store.agreedMarketing}
        onChangeTos={(v) => store.setField('agreedTos', v)}
        onChangePrivacy={(v) => store.setField('agreedPrivacy', v)}
        onChangeMarketing={(v) => store.setField('agreedMarketing', v)}
      />

      {/* 가입 버튼 */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full h-11 bg-blue-600 text-white rounded-lg text-[15px] font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 mt-4"
      >
        {submitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {t('auth.signup_submit')}
      </button>

      <p className="text-[11px] text-gray-400 text-center mt-3">
        {t('auth.have_account')}{' '}
        <a href="/login" className="text-blue-600 hover:underline">
          {t('auth.login_link')}
        </a>
      </p>

      {/* [DISABLED] Google OAuth 에러 — 구글 로그인 비활성화 중
      {googleError && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
          {googleError}
          <a href="/login" className="ml-2 font-medium text-primary-600 hover:underline">{t('auth.login_link')}</a>
        </div>
      )}
      */}

      {/* 이메일 인증 모달 */}
      <AlertModal
        isOpen={emailVerify.modal.isOpen}
        type={emailVerify.modal.type}
        title={emailVerify.modal.title}
        message={emailVerify.modal.message}
        onClose={emailVerify.closeModal}
      />

      {/* 가입 결과 모달 */}
      <AlertModal
        isOpen={submitModal.isOpen}
        type={submitModal.type}
        title={submitModal.title}
        message={submitModal.message}
        onClose={() => setSubmitModal(MODAL_CLOSED)}
      />
    </div>
  );
}
