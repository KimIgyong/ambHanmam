import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, Phone, Lock, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { COUNTRIES } from '@/data/countries';
import { CountryIconGrid } from '@/components/signup/CountryIconGrid';
import { TermsCheckboxGroup } from '@/components/signup/TermsCheckboxGroup';
import { PasswordStrengthBar, PASSWORD_REGEX } from '@/components/signup/PasswordStrengthBar';
import { AlertModal } from '@/components/ui/AlertModal';
import { PageHead } from '@/components/seo/PageHead';
import type { ModalState } from '@/hooks/useEmailVerify';
import {
  trackGoogleOnboardingView,
  trackGoogleOnboardingSubmit,
  trackGoogleOnboardingComplete,
  trackSignupGoAmaClick,
} from '@/lib/ga-events';

const AMA_URL = import.meta.env.VITE_AMA_URL || 'https://ama.amoeba.site';
const MODAL_CLOSED: ModalState = { isOpen: false, type: 'success', title: '', message: '' };

export function GoogleOnboardingPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  // Form state
  const [companyName, setCompanyName] = useState('');
  const [countryCode, setCountryCode] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [agreedTos, setAgreedTos] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedMarketing, setAgreedMarketing] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const closeModal = useCallback(() => setModal(MODAL_CLOSED), []);

  // Result state
  const [amaLoginUrl, setAmaLoginUrl] = useState('');
  const [entityCode, setEntityCode] = useState('');
  const [entityName, setEntityName] = useState('');

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
  const dialCode = selectedCountry?.dialCode || '';

  useEffect(() => {
    if (token) trackGoogleOnboardingView();
  }, [token]);

  const canSubmit =
    companyName.trim().length >= 1 &&
    countryCode &&
    password.length >= 8 &&
    PASSWORD_REGEX.test(password) &&
    agreedTos &&
    agreedPrivacy;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');

    trackGoogleOnboardingSubmit({ company: companyName, country: countryCode || '' });

    try {
      const { data: response } = await api.post('/portal/auth/google/onboarding', {
        token,
        company_name: companyName,
        country: countryCode,
        password,
        phone: phone || undefined,
        terms_agreed: agreedTos,
        privacy_agreed: agreedPrivacy,
        marketing_agreed: agreedMarketing,
      });
      const result = response.data || response;

      const loginUrl = result.amaLoginUrl || (result.entityCode
        ? `${AMA_URL}/${result.entityCode}/login`
        : `${AMA_URL}/user/login`);

      setAmaLoginUrl(loginUrl);
      setEntityCode(result.entityCode || '');
      setEntityName(result.customer?.companyName || companyName);
      trackGoogleOnboardingComplete();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data;
      const msg = errData?.error?.message || errData?.message || t('auth.google_onboarding_failed');
      setError(msg);
      setModal({ isOpen: true, type: 'error', title: t('auth.modal_register_fail_title'), message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoAma = () => {
    trackSignupGoAmaClick();
    window.location.href = amaLoginUrl;
  };

  // Invalid token
  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-xl font-semibold text-red-700">{t('auth.invalid_token')}</h1>
          <Link to="/register" className="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
            {t('auth.signup_link')}
          </Link>
        </div>
      </div>
    );
  }

  // Success screen
  if (amaLoginUrl) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <PageHead title={t('auth.signup_title')} path="/auth/google/onboarding" noindex />
        <div className="w-full max-w-[480px]">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-6 py-5">
              <h1 className="text-lg font-bold text-white">{t('auth.signup_complete_header')}</h1>
            </div>
            <div className="px-6 py-5 space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-blue-100 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-gray-900">{t('auth.signup_complete_heading')}</h2>
                <p className="text-sm text-gray-500 mt-2">{t('auth.signup_complete_sub')}</p>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">{t('auth.signup_company_info')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('auth.signup_company_name')}</span>
                    <span className="font-medium text-gray-900">{entityName || companyName}</span>
                  </div>
                  {entityCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{t('auth.signup_company_code')}</span>
                      <span className="font-mono font-bold text-blue-700">{entityCode}</span>
                    </div>
                  )}
                </div>
                {entityCode && (
                  <p className="mt-3 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
                    ⚠ {t('auth.signup_save_code_notice')}
                  </p>
                )}
              </div>

              <div className="rounded-xl bg-gradient-to-br from-blue-900 to-blue-600 p-5 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 mb-1">
                  {t('auth.signup_ama_eyebrow')}
                </p>
                <h3 className="text-base font-bold mb-1">{t('auth.signup_ama_title')}</h3>
                <p className="text-xs text-blue-100 mb-3">{t('auth.signup_ama_desc')}</p>
                <div className="bg-white/10 rounded-lg px-3 py-2 text-xs text-blue-100 mb-4">
                  🔑 {t('auth.signup_ama_note')}
                </div>
                <button
                  onClick={handleGoAma}
                  className="w-full h-10 bg-white text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  {t('auth.signup_ama_login_cta')}
                  <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-[10px] text-blue-300 mt-2">
                  {entityCode ? `ama.amoeba.site/${entityCode}/login` : 'ama.amoeba.site'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Onboarding form
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
      <PageHead title={t('auth.signup_title')} path="/auth/google/onboarding" noindex />
      <div className="w-full max-w-[480px]">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] px-6 py-5">
            <h1 className="text-lg font-bold text-white">{t('auth.google_onboarding_title')}</h1>
            <p className="text-xs text-blue-200 mt-1">{t('auth.google_onboarding_subtitle')}</p>
          </div>

          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span className="text-xs font-medium text-blue-700">{t('auth.google_verified_badge')}</span>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.signup_field_company')} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder={t('auth.company_name')}
                  className="input-field pl-9"
                  autoComplete="organization"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('auth.signup_field_country')} <span className="text-red-500">*</span>
              </label>
              <CountryIconGrid
                value={countryCode}
                onChange={(code) => setCountryCode(code || null)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.password')} <span className="text-red-500">*</span>
                <span className="text-[10px] font-normal text-gray-400 ml-1">{t('auth.signup_portal_password_note')}</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-9 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
              {!password && (
                <p className="text-[11px] text-gray-400 mt-1">{t('auth.password_hint')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth.signup_field_phone')}{' '}
                <span className="text-xs text-gray-400 font-normal">({t('auth.signup_phone_optional')})</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={dialCode ? `${dialCode} 00-0000-0000` : '00-0000-0000'}
                  className="input-field pl-9"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 border-t border-gray-200" />
              <span className="text-xs font-medium text-gray-400">{t('auth.signup_terms_section')}</span>
              <div className="flex-1 border-t border-gray-200" />
            </div>

            <TermsCheckboxGroup
              agreedTos={agreedTos}
              agreedPrivacy={agreedPrivacy}
              agreedMarketing={agreedMarketing}
              onChangeTos={setAgreedTos}
              onChangePrivacy={setAgreedPrivacy}
              onChangeMarketing={setAgreedMarketing}
            />

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="w-full h-11 bg-blue-600 text-white rounded-lg text-[15px] font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {submitting && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              {t('auth.signup_submit')}
            </button>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full h-10 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
            >
              ← {t('auth.signup_back')}
            </button>

            <p className="text-[11px] text-gray-400 text-center">{t('auth.signup_footnote')}</p>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onClose={closeModal}
      />
    </div>
  );
}
