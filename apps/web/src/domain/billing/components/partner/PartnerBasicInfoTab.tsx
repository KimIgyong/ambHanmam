import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BilPartnerResponse } from '@amb/types';

const PARTNER_TYPES = ['CLIENT', 'AFFILIATE', 'PARTNER', 'OUTSOURCING', 'GENERAL_AFFAIRS'] as const;

const TYPE_PREFIX: Record<string, string> = {
  CLIENT:          'CLI',
  AFFILIATE:       'AFF',
  PARTNER:         'PTN',
  OUTSOURCING:     'OUT',
  GENERAL_AFFAIRS: 'GEN',
};

// ISO 3166-1 alpha-2 기반 국가 목록 (주요 국가 상단, 나머지 알파벳 순)
const COUNTRIES = [
  { code: 'KR', flag: '🇰🇷', name: '한국 (South Korea)' },
  { code: 'VN', flag: '🇻🇳', name: '베트남 (Vietnam)' },
  { code: 'US', flag: '🇺🇸', name: '미국 (United States)' },
  { code: 'JP', flag: '🇯🇵', name: '일본 (Japan)' },
  { code: 'CN', flag: '🇨🇳', name: '중국 (China)' },
  { code: 'IN', flag: '🇮🇳', name: '인도 (India)' },
  { code: 'SG', flag: '🇸🇬', name: '싱가포르 (Singapore)' },
  { code: 'TH', flag: '🇹🇭', name: '태국 (Thailand)' },
  { code: 'PH', flag: '🇵🇭', name: '필리핀 (Philippines)' },
  { code: 'MY', flag: '🇲🇾', name: '말레이시아 (Malaysia)' },
  { code: 'ID', flag: '🇮🇩', name: '인도네시아 (Indonesia)' },
  { code: 'TW', flag: '🇹🇼', name: '대만 (Taiwan)' },
  { code: 'HK', flag: '🇭🇰', name: '홍콩 (Hong Kong)' },
  { code: 'AU', flag: '🇦🇺', name: '호주 (Australia)' },
  { code: 'NZ', flag: '🇳🇿', name: '뉴질랜드 (New Zealand)' },
  { code: 'GB', flag: '🇬🇧', name: '영국 (United Kingdom)' },
  { code: 'DE', flag: '🇩🇪', name: '독일 (Germany)' },
  { code: 'FR', flag: '🇫🇷', name: '프랑스 (France)' },
  { code: 'IT', flag: '🇮🇹', name: '이탈리아 (Italy)' },
  { code: 'ES', flag: '🇪🇸', name: '스페인 (Spain)' },
  { code: 'NL', flag: '🇳🇱', name: '네덜란드 (Netherlands)' },
  { code: 'CA', flag: '🇨🇦', name: '캐나다 (Canada)' },
  { code: 'MX', flag: '🇲🇽', name: '멕시코 (Mexico)' },
  { code: 'BR', flag: '🇧🇷', name: '브라질 (Brazil)' },
  { code: 'AE', flag: '🇦🇪', name: '아랍에미리트 (UAE)' },
  { code: 'SA', flag: '🇸🇦', name: '사우디아라비아 (Saudi Arabia)' },
  { code: 'RU', flag: '🇷🇺', name: '러시아 (Russia)' },
  { code: 'TR', flag: '🇹🇷', name: '터키 (Turkey)' },
  { code: 'ZA', flag: '🇿🇦', name: '남아프리카공화국 (South Africa)' },
] as const;

function generatePartnerCode(type: string, companyName: string): string {
  const typePrefix = TYPE_PREFIX[type] ?? type.slice(0, 3).toUpperCase();
  // 영문+숫자만 추출, 대문자 변환, 최대 8자
  const cleaned = companyName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
  const compPrefix = cleaned || 'COMP';
  return `${typePrefix}-${compPrefix}-001`;
}

interface PartnerForm {
  code: string;
  type: string;
  company_name: string;
  company_name_local: string;
  country: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  tax_id: string;
  biz_type: string;
  biz_category: string;
  ceo_name: string;
  default_currency: string;
  payment_terms: number;
  status: string;
  note: string;
}

const emptyForm: PartnerForm = {
  code: '',
  type: 'CLIENT',
  company_name: '',
  company_name_local: '',
  country: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  tax_id: '',
  biz_type: '',
  biz_category: '',
  ceo_name: '',
  default_currency: 'KRW',
  payment_terms: 30,
  status: 'ACTIVE',
  note: '',
};

interface Props {
  partner: BilPartnerResponse | null | undefined;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
  isNew: boolean;
  currentEntity: { country: string; currency: string } | null;
}

export default function PartnerBasicInfoTab({ partner, onSave, isSaving, isNew, currentEntity }: Props) {
  const { t } = useTranslation(['billing', 'common']);
  const [form, setForm] = useState<PartnerForm>(emptyForm);

  useEffect(() => {
    if (partner) {
      setForm({
        code: partner.code,
        type: partner.type,
        company_name: partner.companyName,
        company_name_local: partner.companyNameLocal || '',
        country: partner.country || '',
        contact_name: partner.contactName || '',
        contact_email: partner.contactEmail || '',
        contact_phone: partner.contactPhone || '',
        address: partner.address || '',
        tax_id: partner.taxId || '',
        biz_type: partner.bizType || '',
        biz_category: partner.bizCategory || '',
        ceo_name: partner.ceoName || '',
        default_currency: partner.defaultCurrency,
        payment_terms: partner.paymentTerms,
        status: partner.status,
        note: partner.note || '',
      });
    } else if (isNew && currentEntity) {
      setForm((prev) => ({
        ...prev,
        country: currentEntity.country,
        default_currency: currentEntity.currency,
      }));
    }
  }, [partner, isNew, currentEntity]);

  const handleChange = (field: keyof PartnerForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 신규 등록 시 Type 또는 Company Name 변경 시 Code 자동생성
  useEffect(() => {
    if (!isNew) return;
    if (form.type && form.company_name) {
      const autoCode = generatePartnerCode(form.type, form.company_name);
      setForm((prev) => ({ ...prev, code: autoCode }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, form.company_name, isNew]);

  const handleSubmit = () => {
    const payload: Record<string, unknown> = { ...form };
    Object.keys(payload).forEach((key) => {
      if (payload[key] === '') payload[key] = null;
    });
    onSave(payload);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSaving || !form.code || !form.company_name}
          className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? t('common:processing') : t('common:save')}
        </button>
      </div>

      {/* Basic Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.code')} *
              {isNew && (
                <span className="ml-1.5 text-xs font-normal text-orange-400">
                  {t('billing:partner.form.codeAutoGenerated', { defaultValue: '자동생성' })}
                </span>
              )}
            </label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder={t('billing:partner.form.codePlaceholder')}
              disabled={!isNew}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:bg-gray-50 disabled:text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.type')} *
            </label>
            <select
              value={form.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {PARTNER_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`billing:partner.type.${type}`)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.companyName')} *
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.companyNameLocal')}
            </label>
            <input
              type="text"
              value={form.company_name_local}
              onChange={(e) => handleChange('company_name_local', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.status')}
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="ACTIVE">{t('billing:partner.status.ACTIVE')}</option>
              <option value="INACTIVE">{t('billing:partner.status.INACTIVE')}</option>
              <option value="PROSPECT">{t('billing:partner.status.PROSPECT')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Business Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.taxId')}
            </label>
            <input
              type="text"
              value={form.tax_id}
              onChange={(e) => handleChange('tax_id', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.ceoName')}
            </label>
            <input
              type="text"
              value={form.ceo_name}
              onChange={(e) => handleChange('ceo_name', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.bizType')}
            </label>
            <input
              type="text"
              value={form.biz_type}
              onChange={(e) => handleChange('biz_type', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.bizCategory')}
            </label>
            <input
              type="text"
              value={form.biz_category}
              onChange={(e) => handleChange('biz_category', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.country')}
            </label>
            <select
              value={form.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="">{t('common:select', { defaultValue: '선택하세요' })}</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.defaultCurrency')}
            </label>
            <input
              type="text"
              value={form.default_currency}
              onChange={(e) => handleChange('default_currency', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.paymentTerms')}
            </label>
            <input
              type="number"
              value={form.payment_terms}
              onChange={(e) => handleChange('payment_terms', parseInt(e.target.value) || 0)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.address')}
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.contactName')}
            </label>
            <input
              type="text"
              value={form.contact_name}
              onChange={(e) => handleChange('contact_name', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.contactEmail')}
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('billing:partner.form.contactPhone')}
            </label>
            <input
              type="text"
              value={form.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('billing:partner.form.note')}
        </label>
        <textarea
          value={form.note}
          onChange={(e) => handleChange('note', e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
      </div>
    </div>
  );
}
