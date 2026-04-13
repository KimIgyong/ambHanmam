import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages, Loader2, MessageSquarePlus } from 'lucide-react';
import { useTranslateMessage, useTranslateAndPost } from '../hooks/useTalk';
import { useTalkStore } from '../store/talk.store';

interface MessageTranslateButtonProps {
  channelId: string;
  messageId: string;
}

const LANGUAGES = [
  { code: 'English', isoCode: 'en', label: 'english' },
  { code: 'Korean', isoCode: 'ko', label: 'korean' },
  { code: 'Vietnamese', isoCode: 'vi', label: 'vietnamese' },
] as const;

export default function MessageTranslateButton({ channelId, messageId }: MessageTranslateButtonProps) {
  const { t } = useTranslation(['talk']);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mode, setMode] = useState<'inline' | 'post'>('inline');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { activeTranslation, setActiveTranslation, setTranslation } = useTalkStore();
  const translateMutation = useTranslateMessage();
  const translateAndPostMutation = useTranslateAndPost();

  const isOpen = activeTranslation === messageId && showDropdown;
  const isPending = translateMutation.isPending || translateAndPostMutation.isPending;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    if (isOpen) {
      setShowDropdown(false);
      setActiveTranslation(null);
    } else {
      setShowDropdown(true);
      setActiveTranslation(messageId);
      setMode('inline');
    }
  };

  const handleTranslate = (langCode: string, isoCode: string) => {
    setShowDropdown(false);
    setActiveTranslation(null);

    if (mode === 'post') {
      translateAndPostMutation.mutate(
        { channelId, messageId, targetLang: isoCode },
      );
    } else {
      translateMutation.mutate(
        { channelId, messageId, targetLang: langCode },
        {
          onSuccess: (data) => {
            setTranslation(messageId, langCode, {
              content: data.translatedContent,
              detectedLang: data.detectedLanguage,
            });
          },
        },
      );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="shrink-0 text-gray-300 hover:text-indigo-400"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Languages className="h-3.5 w-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="absolute bottom-6 left-0 z-10 min-w-[180px] rounded-md border bg-white py-1 shadow-lg">
          {/* Mode Toggle */}
          <div className="flex gap-1 border-b px-2 py-1.5">
            <button
              onClick={() => setMode('inline')}
              className={`flex-1 rounded px-2 py-1 text-xs ${
                mode === 'inline'
                  ? 'bg-indigo-100 font-medium text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t('talk:translate')}
            </button>
            <button
              onClick={() => setMode('post')}
              className={`flex items-center gap-1 flex-1 rounded px-2 py-1 text-xs ${
                mode === 'post'
                  ? 'bg-indigo-100 font-medium text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <MessageSquarePlus className="h-3 w-3" />
              {t('talk:translateAndPost')}
            </button>
          </div>

          <p className="px-3 py-1 text-xs font-medium text-gray-400">{t('talk:translateTo')}</p>
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleTranslate(lang.code, lang.isoCode)}
              className="flex w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              {t(`talk:${lang.label}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
