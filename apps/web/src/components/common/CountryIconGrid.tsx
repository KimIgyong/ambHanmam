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
  value: string;
  onChange: (code: string) => void;
}

export function CountryIconGrid({ value, onChange }: CountryIconGridProps) {
  const { t, i18n } = useTranslation('auth');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otherCountry, setOtherCountry] = useState<{ code: string; name: string } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const presetCountries = PRESET_CODES.map(
    (code) => COUNTRIES.find((c) => c.code === code)!,
  ).filter(Boolean);

  const isPreset = value && PRESET_CODES.includes(value);

  // Initialize otherCountry if value is non-preset on mount
  useEffect(() => {
    if (value && !PRESET_CODES.includes(value)) {
      const found = COUNTRIES.find((c) => c.code === value);
      if (found) {
        setOtherCountry({ code: found.code, name: getCountryName(found, i18n.language) });
      }
    }
  }, []);

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
                ? 'border-2 border-blue-600 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/30'
                : 'border-gray-200 bg-gray-50 hover:border-blue-200 hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-blue-500 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-xl leading-none">{FLAG_MAP[c.code] || ''}</span>
            <span
              className={`text-[9px] font-medium text-center leading-tight ${
                value === c.code && isPreset ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {getCountryName(c, i18n.language)}
            </span>
          </button>
        ))}

        {/* More countries */}
        <button
          type="button"
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg border border-dashed border-gray-300 hover:border-blue-400 transition-colors dark:border-gray-500 dark:hover:border-blue-400"
        >
          <span className="text-base text-gray-400 leading-none">+</span>
          <span className="text-[9px] text-gray-400 text-center">{t('initialSetup.moreCountry')}</span>
        </button>
      </div>

      {/* Selected other-country badge */}
      {otherCountry && value === otherCountry.code && (
        <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 bg-blue-50 border border-blue-100 rounded-md text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300">
          {FLAG_MAP[otherCountry.code] || ''} {otherCountry.name}
          <button
            type="button"
            onClick={() => {
              setOtherCountry(null);
              onChange('');
            }}
            className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search overlay */}
      {searchOpen && (
        <div
          ref={overlayRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden dark:bg-gray-700 dark:border-gray-600"
        >
          <input
            ref={inputRef}
            type="text"
            placeholder={t('initialSetup.countrySearch')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 border-b border-gray-200 px-3 text-sm outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
          />
          <div className="max-h-40 overflow-y-auto">
            {filteredCountries.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => handleSelectOther(c)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left dark:text-gray-200 dark:hover:bg-gray-600"
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
