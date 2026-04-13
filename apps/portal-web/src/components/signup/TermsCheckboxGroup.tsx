import { useTranslation } from 'react-i18next';

interface TermsCheckboxGroupProps {
  agreedTos: boolean;
  agreedPrivacy: boolean;
  agreedMarketing: boolean;
  onChangeTos: (v: boolean) => void;
  onChangePrivacy: (v: boolean) => void;
  onChangeMarketing: (v: boolean) => void;
}

export function TermsCheckboxGroup({
  agreedTos,
  agreedPrivacy,
  agreedMarketing,
  onChangeTos,
  onChangePrivacy,
  onChangeMarketing,
}: TermsCheckboxGroupProps) {
  const { t } = useTranslation();

  const allAgreed = agreedTos && agreedPrivacy && agreedMarketing;

  const handleToggleAll = () => {
    const next = !allAgreed;
    onChangeTos(next);
    onChangePrivacy(next);
    onChangeMarketing(next);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* 전체 동의 */}
      <label className="flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50 border-b border-gray-200 cursor-pointer">
        <input
          type="checkbox"
          checked={allAgreed}
          onChange={handleToggleAll}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
        />
        <span className="text-sm font-semibold text-gray-900">{t('auth.signup_agree_all')}</span>
      </label>

      {/* 이용약관 */}
      <label className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer border-b border-gray-100">
        <input
          type="checkbox"
          checked={agreedTos}
          onChange={(e) => onChangeTos(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
        />
        <span className="text-sm text-gray-700">{t('auth.signup_tos')}</span>
        <span className="ml-auto text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
          {t('auth.signup_required')}
        </span>
      </label>

      {/* 개인정보 처리방침 */}
      <label className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer border-b border-gray-100">
        <input
          type="checkbox"
          checked={agreedPrivacy}
          onChange={(e) => onChangePrivacy(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
        />
        <span className="text-sm text-gray-700">{t('auth.signup_privacy')}</span>
        <span className="ml-auto text-[10px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
          {t('auth.signup_required')}
        </span>
      </label>

      {/* 마케팅 동의 */}
      <label className="flex items-center gap-2.5 px-3.5 py-2 cursor-pointer">
        <input
          type="checkbox"
          checked={agreedMarketing}
          onChange={(e) => onChangeMarketing(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 accent-blue-600"
        />
        <span className="text-sm text-gray-700">{t('auth.signup_marketing')}</span>
        <span className="ml-auto text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
          {t('auth.signup_optional')}
        </span>
      </label>
    </div>
  );
}
