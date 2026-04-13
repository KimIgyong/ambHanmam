import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COUNTRIES, getCountryName } from '@/data/countries';

const PRESET_CODES = ['KR', 'VN', 'SG', 'ID', 'MY', 'TH', 'TW', 'US', 'CA', 'MX', 'JP'];

const FLAG_MAP: Record<string, string> = {
  KR: '🇰🇷', VN: '🇻🇳', SG: '🇸🇬', ID: '🇮🇩', MY: '🇲🇾', TH: '🇹🇭',
  TW: '🇹🇼', US: '🇺🇸', CA: '🇨🇦', MX: '🇲🇽', JP: '🇯🇵',
  CN: '🇨🇳', PH: '🇵🇭', IN: '🇮🇳', AU: '🇦🇺', GB: '🇬🇧', DE: '🇩🇪',
  FR: '🇫🇷', HK: '🇭🇰', NZ: '🇳🇿', AE: '🇦🇪', BR: '🇧🇷', ZA: '🇿🇦',
};

interface CountryIconGridProps {
  value: string | null;
  onChange: (code: string) => void;
}

export function CountryIconGrid({ value, onChange }: CountryIconGridProps) {
  const { t, i18n } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherCountry, setOtherCountry] = useState<{ code: string; name: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const presetCountries = PRESET_CODES.map(
    (code) => COUNTRIES.find((c) => c.code === code)!,
  ).filter(Boolean);

  const isPreset = value && PRESET_CODES.includes(value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [searchOpen]);

  const nonPresetCountries = COUNTRIES.filter((c) => !PRESET_CODES.includes(c.code));
  const filteredCountries = searchQuery
    ? nonPresetCountries.filter((c) => {
        const name = getCountryName(c, i18n.language).toLowerCase();
        return name.includes(searchQuery.toLowerCase()) || c.code.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : nonPresetCountries;

  const handleSelectOther = (c: typeof COUNTRIES[0]) => {
    setOtherCountry({ code: c.code, name: getCountryName(c, i18n.language) });
    onChange(c.code);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-1.5">
        {presetCountries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => {
              setOtherCountry(null);
              onChange(c.code);
            }}
            className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border transition-all ${
              value === c.code && isPreset
                ? 'border-2 border-blue-600 bg-blue-50'
                : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50'
            }`}
          >
            <span className="text-xl leading-none">{FLAG_MAP[c.code] || ''}</span>
            <span
              className={`text-[9px] font-medium text-center leading-tight ${
                value === c.code && isPreset ? 'text-blue-700' : 'text-gray-500'
              }`}
            >
              {getCountryName(c, i18n.language)}
            </span>
          </button>
        ))}

        {/* 기타 국가 */}
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 transition-colors"
        >
          <span className="text-base text-gray-400 leading-none">+</span>
          <span className="text-[9px] text-gray-400 text-center">{t('auth.signup_more_country')}</span>
        </button>
      </div>

      {/* 선택된 기타 국가 배지 */}
      {otherCountry && value === otherCountry.code && (
        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700">
          {FLAG_MAP[otherCountry.code] || ''} {otherCountry.name}
          <button
            type="button"
            onClick={() => {
              setOtherCountry(null);
              onChange('');
            }}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* 검색 오버레이 */}
      {searchOpen && (
        <div
          ref={overlayRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={t('auth.signup_country_search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 border-b border-gray-200 px-3 text-sm outline-none"
          />
          <div className="max-h-40 overflow-y-auto">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelectOther(c)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left"
              >
                {FLAG_MAP[c.code] || ''} {getCountryName(c, i18n.language)}
              </button>
            ))}
            {filteredCountries.length === 0 && (
              <p className="px-3 py-2 text-xs text-gray-400">No results</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
