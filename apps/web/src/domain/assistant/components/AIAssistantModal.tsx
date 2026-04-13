import { Bot, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAssistantModalStore } from '../store/assistant-modal.store';
import WelcomeSection from './WelcomeSection';
import ChatSection from './ChatSection';

export default function AIAssistantModal() {
  const isOpen = useAssistantModalStore((s) => s.isOpen);
  const phase = useAssistantModalStore((s) => s.phase);
  const close = useAssistantModalStore((s) => s.close);
  const { t } = useTranslation('assistant');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" onClick={close}>
      <div className="fixed inset-0 bg-black/30" />
      <div
        className="fixed inset-0 flex flex-col overflow-hidden bg-white shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] md:inset-auto md:bottom-6 md:right-6 md:h-[600px] md:w-[440px] md:rounded-2xl md:pt-0 md:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-white" />
            <h2 className="text-sm font-semibold text-white">{t('title')}</h2>
          </div>
          <button
            onClick={close}
            className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
            title={t('close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        {phase === 'welcome' ? <WelcomeSection /> : <ChatSection />}
      </div>
    </div>
  );
}
