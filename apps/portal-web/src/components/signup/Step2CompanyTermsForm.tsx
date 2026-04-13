// @ts-nocheck
// NOTE: This component is currently unused (dead code) — kept for potential future use.
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Phone } from 'lucide-react';
import { useSignupStore } from '@/stores/signup.store';
import { useAuthStore } from '@/stores/auth.store';
import { CountryIconGrid } from './CountryIconGrid';
import { TermsCheckboxGroup } from './TermsCheckboxGroup';
import { COUNTRIES } from '@/data/countries';
import { AlertModal } from '@/components/ui/AlertModal';
import type { ModalState } from '@/hooks/useEmailVerify';
import { trackRegisterSubmit, trackRegisterSubmitError } from '@/lib/ga-events';

const MODAL_CLOSED: ModalState = { isOpen: false, type: 'success', title: '', message: '' };

export function Step2CompanyTermsForm() {
  const { t } = useTranslation();
  const store = useSignupStore();
  const registerFn = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<ModalState>(MODAL_CLOSED);
  const closeModal = useCallback(() => setModal(MODAL_CLOSED), []);

  const selectedCountry = COUNTRIES.find((c) => c.code === store.countryCode);
  const dialCode = selectedCountry?.dialCode || '';

  const canSubmit =
    store.companyName.trim().length >= 1 &&
    store.countryCode &&
    store.agreedTos &&
    store.agreedPrivacy;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const result = await registerFn({
        email: store.email,
        password: store.password,
        name: store.fullName,
        company_name: store.companyName,
        phone: store.phone || undefined,
        country_code: store.countryCode!,
        terms_agreed: store.agreedTos,
        privacy_agreed: store.agreedPrivacy,
        marketing_agreed: store.agreedMarketing,
        verify_token: store.verifyToken!,
      });

      store.setRegistrationResult({
        entityCode: result?.entityCode,
        entityName: result?.entityName,
      });

      trackRegisterSubmit({
        method: 'email',
        company: store.companyName,
        country: store.countryCode || '',
      });

      store.setStep('complete');
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { error?: { code?: string; message?: string }; message?: string } } })?.response?.data;
      const msg = errData?.error?.message || errData?.message;
      const errCode = errData?.error?.code || 'unknown';
      const errMsg = msg || t('auth.register_failed');
      setError(errMsg);
      trackRegisterSubmitError(errCode);
      setModal({ isOpen: true, type: 'error', title: t('auth.modal_register_fail_title'), message: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold text-gray-800">{t('auth.signup_step2_title')}</p>
        <p className="text-xs text-gray-400 mt-0.5">{t('auth.signup_step2_subtitle')}</p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {/* 회사명 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.signup_field_company')} <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={store.companyName}
            onChange={(e) => store.setField('companyName', e.target.value)}
            placeholder={t('auth.company_name')}
            className="input-field pl-9"
            autoComplete="organization"
          />
        </div>
      </div>

      {/* 국가 선택 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {t('auth.signup_field_country')} <span className="text-red-500">*</span>
        </label>
        <CountryIconGrid
          value={store.countryCode}
          onChange={(code) => store.setField('countryCode', code || null)}
        />
      </div>

      {/* 연락처 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('auth.signup_field_phone')}{' '}
          <span className="text-xs text-gray-400 font-normal">({t('auth.signup_phone_optional')})</span>
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="tel"
            value={store.phone}
            onChange={(e) => store.setField('phone', e.target.value)}
            placeholder={dialCode ? `${dialCode} 00-0000-0000` : '00-0000-0000'}
            className="input-field pl-9"
            autoComplete="tel"
          />
        </div>
      </div>

      {/* 약관 구분 */}
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
        className="w-full h-11 bg-blue-600 text-white rounded-lg text-[15px] font-semibold disabled:opacity-40 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : null}
        {t('auth.signup_submit')}
      </button>

      {/* 이전 단계 */}
      <button
        type="button"
        onClick={() => store.setStep(1)}
        className="w-full h-10 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
      >
        ← {t('auth.signup_back')}
      </button>

      <p className="text-[11px] text-gray-400 text-center">
        {t('auth.signup_footnote')}
      </p>

      {/* 알림 모달 */}
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
