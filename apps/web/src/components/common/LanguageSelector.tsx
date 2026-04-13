import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'ko', label: 'KO' },
  { code: 'vi', label: 'VI' },
] as const;

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('amb-lang', lang);
  };

  return (
    <div className="flex items-center gap-1.5">
      <Globe className="h-4 w-4 text-gray-400" />
      <select
        value={i18n.language}
        onChange={handleChange}
        className="appearance-none rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
