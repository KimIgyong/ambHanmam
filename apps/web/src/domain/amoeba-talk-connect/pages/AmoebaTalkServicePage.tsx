import { useTranslation } from 'react-i18next';
import { MessageCircle, Bot, BarChart3, Users, ShoppingCart, Shield, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { useAmoebaTalkConnect } from '../hooks/useAmoebaTalkConnect';

const CHANNELS = [
  { name: 'Facebook', icon: '📘' },
  { name: 'Zalo', icon: '💬' },
  { name: 'LINE', icon: '💚' },
  { name: 'KakaoTalk', icon: '💛' },
  { name: 'WhatsApp', icon: '💬' },
  { name: 'Instagram', icon: '📸' },
  { name: 'Webchat', icon: '🌐' },
];

const FEATURES = [
  { icon: MessageCircle, titleKey: 'inbox', descKey: 'inboxDesc', color: 'bg-blue-100 text-blue-600' },
  { icon: Bot, titleKey: 'ai', descKey: 'aiDesc', color: 'bg-purple-100 text-purple-600' },
  { icon: BarChart3, titleKey: 'analytics', descKey: 'analyticsDesc', color: 'bg-green-100 text-green-600' },
  { icon: Users, titleKey: 'team', descKey: 'teamDesc', color: 'bg-orange-100 text-orange-600' },
  { icon: ShoppingCart, titleKey: 'ecommerce', descKey: 'ecommerceDesc', color: 'bg-pink-100 text-pink-600' },
  { icon: Shield, titleKey: 'security', descKey: 'securityDesc', color: 'bg-slate-100 text-slate-600' },
];

export default function AmoebaTalkServicePage() {
  const { t } = useTranslation('atkConnect');
  const { isLinked, status, loading, handleConnect } = useAmoebaTalkConnect();

  // If already linked, show embedded iframe
  if (isLinked && status) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">
              {status.companyName} — {t('connected')}
            </span>
          </div>
          <a
            href={import.meta.env.VITE_ATK_URL || 'http://localhost:3002'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            {t('openNewTab')} <ArrowRight className="w-3 h-3" />
          </a>
        </div>
        <iframe
          src={import.meta.env.VITE_ATK_URL || 'http://localhost:3002'}
          className="flex-1 w-full border-0"
          title="AmoebaTalk"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
      </div>
    );
  }

  // Service landing page
  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1e3a5f] via-[#0ea5e9] to-[#7c3aed] px-8 py-16 text-center rounded-2xl mx-4 mt-4">
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <MessageCircle className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          {t('hero.headline')}
        </h1>
        <p className="text-lg text-white/80 mt-3 max-w-xl mx-auto">
          {t('hero.sub')}
        </p>
        <button
          onClick={handleConnect}
          disabled={loading}
          className="mt-8 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 animate-spin" /> {t('hero.connecting')}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4" /> {t('hero.cta')}
            </span>
          )}
        </button>
        <p className="text-sm text-white/60 mt-4">{t('hero.badges')}</p>
      </div>

      {/* Channels */}
      <div className="px-8 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900">{t('channels.title')}</h2>
        <p className="text-gray-500 mt-1">{t('channels.sub')}</p>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-4 mt-8 max-w-2xl mx-auto">
          {CHANNELS.map((ch) => (
            <div key={ch.name} className="flex flex-col items-center gap-2 p-3 bg-gray-50 rounded-xl hover:shadow-md hover:scale-105 transition-all">
              <span className="text-2xl">{ch.icon}</span>
              <span className="text-xs font-medium text-gray-700">{ch.name}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">{t('channels.ecommerce')}</p>
      </div>

      {/* Features */}
      <div className="px-8 py-12 bg-gray-50">
        <h2 className="text-xl font-bold text-gray-900 text-center">{t('features.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
          {FEATURES.map((f) => (
            <div key={f.titleKey} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
              <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 mt-4">{t(`features.${f.titleKey}`)}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{t(`features.${f.descKey}`)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="px-8 py-12 text-center">
        <h2 className="text-xl font-bold text-gray-900">{t('howItWorks.title')}</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mt-8 max-w-2xl mx-auto">
          {[
            { step: '1', icon: '🔗', titleKey: 'step1' },
            { step: '2', icon: '💬', titleKey: 'step2' },
            { step: '3', icon: '🚀', titleKey: 'step3' },
          ].map((s, i) => (
            <div key={s.step} className="flex items-center gap-4">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-2xl mx-auto">
                  {s.icon}
                </div>
                <p className="font-semibold text-gray-900 mt-2">{t(`howItWorks.${s.titleKey}`)}</p>
                <p className="text-xs text-gray-500 mt-1">{t(`howItWorks.${s.titleKey}Desc`)}</p>
              </div>
              {i < 2 && <ArrowRight className="w-5 h-5 text-gray-300 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl mx-4 px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center text-white max-w-3xl mx-auto">
          {[
            { value: '7+', label: t('stats.channels') },
            { value: '50%', label: t('stats.responseTime') },
            { value: '24/7', label: t('stats.ai') },
            { value: '1m', label: t('stats.setup') },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold">{stat.value}</p>
              <p className="text-sm text-white/70 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="px-8 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900">{t('cta.title')}</h2>
        <p className="text-gray-500 mt-1">{t('cta.sub')}</p>

        <div className="mt-8 max-w-md mx-auto bg-white rounded-2xl shadow-lg border p-6">
          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
          >
            {loading ? t('hero.connecting') : t('cta.button')}
          </button>
          <div className="mt-4 space-y-2 text-left">
            {['noVerify', 'autoLink', 'passwordOnly'].map((key) => (
              <div key={key} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-gray-500">{t(`cta.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
