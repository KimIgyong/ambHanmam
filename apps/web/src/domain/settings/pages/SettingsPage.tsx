import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Settings, UsersRound, Key, Mail, Shield, HardDrive, Building2, MessageSquare, PenTool, Upload, Trash2, Loader2, Bot, Network, Calendar, Package, Globe, BarChart3, AppWindow, TrendingUp } from 'lucide-react';
import { useMyPermissions } from '../hooks/useMenuPermissions';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { apiClient } from '@/lib/api-client';

export interface SettingsCard {
  menuCode: string;
  titleKey: string;
  descriptionKey: string;
  icon: typeof Settings;
  iconColor: string;
  bgColor: string;
  path: string;
}

export const SETTINGS_CARDS: SettingsCard[] = [
  // ── 주요 관리 메뉴 (상단 고정) ──
  {
    menuCode: 'SETTINGS_USER_MANAGEMENT',
    titleKey: 'common:settingsPage.userManagement.title',
    descriptionKey: 'common:settingsPage.userManagement.description',
    icon: Building2,
    iconColor: 'text-rose-600',
    bgColor: 'bg-rose-100',
    path: '/admin/user-management',
  },
  {
    menuCode: 'SERVICE_MANAGEMENT',
    titleKey: 'common:settingsPage.serviceManagement.title',
    descriptionKey: 'common:settingsPage.serviceManagement.description',
    icon: Building2,
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    path: '/admin/service/dashboard',
  },
  {
    menuCode: 'SETTINGS_TOTAL_USERS',
    titleKey: 'common:settingsPage.totalUsers.title',
    descriptionKey: 'common:settingsPage.totalUsers.description',
    icon: UsersRound,
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-100',
    path: '/admin/total-users',
  },
  {
    menuCode: 'SETTINGS_PORTAL_BRIDGE',
    titleKey: 'common:settingsPage.portalBridge.title',
    descriptionKey: 'common:settingsPage.portalBridge.description',
    icon: Globe,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    path: '/admin/portal-bridge',
  },
  {
    menuCode: 'SETTINGS_AI_USAGE',
    titleKey: 'common:settingsPage.aiUsage.title',
    descriptionKey: 'common:settingsPage.aiUsage.description',
    icon: BarChart3,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    path: '/admin/ai-usage',
  },
  {
    menuCode: 'SITE_MANAGEMENT',
    titleKey: 'common:settingsPage.siteManagement.title',
    descriptionKey: 'common:settingsPage.siteManagement.description',
    icon: Globe,
    iconColor: 'text-lime-600',
    bgColor: 'bg-lime-100',
    path: '/admin/site/menus',
  },
  {
    menuCode: 'SITE_MANAGEMENT',
    titleKey: 'common:settingsPage.siteAnalytics.title',
    descriptionKey: 'common:settingsPage.siteAnalytics.description',
    icon: TrendingUp,
    iconColor: 'text-sky-600',
    bgColor: 'bg-sky-100',
    path: '/admin/site/analytics',
  },
  // ── 시스템 설정 ──
  {
    menuCode: 'SETTINGS_API_KEYS',
    titleKey: 'common:settingsPage.apiKeys.title',
    descriptionKey: 'common:settingsPage.apiKeys.description',
    icon: Key,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    path: '/admin/api-keys',
  },
  {
    menuCode: 'SETTINGS_SMTP',
    titleKey: 'common:settingsPage.smtp.title',
    descriptionKey: 'common:settingsPage.smtp.description',
    icon: Mail,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    path: '/admin/smtp',
  },
  {
    menuCode: 'SETTINGS_EMAIL_TEMPLATES',
    titleKey: 'common:settingsPage.emailTemplates.title',
    descriptionKey: 'common:settingsPage.emailTemplates.description',
    icon: Mail,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    path: '/admin/email-templates',
  },
  {
    menuCode: 'SETTINGS_PERMISSIONS',
    titleKey: 'common:settingsPage.permissions.title',
    descriptionKey: 'common:settingsPage.permissions.description',
    icon: Shield,
    iconColor: 'text-red-600',
    bgColor: 'bg-red-100',
    path: '/admin/permissions',
  },
  {
    menuCode: 'SETTINGS_DRIVE',
    titleKey: 'common:settingsPage.drive.title',
    descriptionKey: 'common:settingsPage.drive.description',
    icon: HardDrive,
    iconColor: 'text-violet-600',
    bgColor: 'bg-violet-100',
    path: '/admin/drive',
  },
  {
    menuCode: 'SETTINGS_ENTITIES',
    titleKey: 'common:settingsPage.entities.title',
    descriptionKey: 'common:settingsPage.entities.description',
    icon: Building2,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-100',
    path: '/admin/entities',
  },
  {
    menuCode: 'UNITS',
    titleKey: 'common:settingsPage.units.title',
    descriptionKey: 'common:settingsPage.units.description',
    icon: Network,
    iconColor: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    path: '/admin/units',
  },
  {
    menuCode: 'SETTINGS_CONVERSATIONS',
    titleKey: 'common:settingsPage.conversations.title',
    descriptionKey: 'common:settingsPage.conversations.description',
    icon: MessageSquare,
    iconColor: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    path: '/admin/conversations',
  },
  {
    menuCode: 'SETTINGS_MAIL_ACCOUNTS',
    titleKey: 'common:settingsPage.mailAccounts.title',
    descriptionKey: 'common:settingsPage.mailAccounts.description',
    icon: Mail,
    iconColor: 'text-sky-600',
    bgColor: 'bg-sky-100',
    path: '/admin/mail-accounts',
  },
  {
    menuCode: 'SETTINGS_AGENTS',
    titleKey: 'common:settingsPage.chatAgents.title',
    descriptionKey: 'common:settingsPage.chatAgents.pageDescription',
    icon: Bot,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    path: '/admin/agents',
  },
  {
    menuCode: 'CALENDAR',
    titleKey: 'common:settingsPage.calendar.title',
    descriptionKey: 'common:settingsPage.calendar.description',
    icon: Calendar,
    iconColor: 'text-teal-600',
    bgColor: 'bg-teal-100',
    path: '/calendar',
  },
  {
    menuCode: 'ASSET_MANAGEMENT',
    titleKey: 'common:settingsPage.assetManagement.title',
    descriptionKey: 'common:settingsPage.assetManagement.description',
    icon: Package,
    iconColor: 'text-amber-600',
    bgColor: 'bg-amber-100',
    path: '/assets',
  },
  {
    menuCode: 'ENTITY_CUSTOM_APPS',
    titleKey: 'common:settingsPage.customApps.title',
    descriptionKey: 'common:settingsPage.customApps.description',
    icon: AppWindow,
    iconColor: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-100',
    path: '/admin/custom-apps',
  },
  {
    menuCode: 'SETTINGS_SITE',
    titleKey: 'common:settingsPage.site.title',
    descriptionKey: 'common:settingsPage.site.description',
    icon: Globe,
    iconColor: 'text-orange-600',
    bgColor: 'bg-orange-100',
    path: '/admin/site-settings',
  },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['common', 'settings']);
  const { data: accessibleMenus } = useMyPermissions();

  const visibleCards = SETTINGS_CARDS.filter(
    (card) => !accessibleMenus || accessibleMenus.includes(card.menuCode),
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <Settings className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t('common:settingsPage.title')}
            </h1>
            <p className="text-sm text-gray-500">
              {t('common:settingsPage.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.menuCode}
                onClick={() => navigate(card.path)}
                className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left transition-all hover:border-indigo-200 hover:shadow-md"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}
                >
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t(card.titleKey)}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {t(card.descriptionKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* My Signature */}
        <SignatureSection t={t} />
      </div>
    </div>
  );
}

function SignatureSection({ t }: { t: (key: string) => string }) {
  const user = useAuthStore((s) => s.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasSignature, setHasSignature] = useState<boolean>(user?.hasSignature ?? false);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadSignatureImage = async () => {
    try {
      const res = await apiClient.get('/users/me/signature', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data]));
      setSignatureUrl(url);
      setHasSignature(true);
    } catch {
      setHasSignature(false);
    }
  };

  useEffect(() => {
    if (user?.hasSignature) {
      loadSignatureImage();
    }
  }, [user?.hasSignature]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post('/users/me/signature', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      loadSignatureImage();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    await apiClient.delete('/users/me/signature');
    setHasSignature(false);
    setSignatureUrl(null);
  };

  return (
    <div className="mt-8 rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
          <PenTool className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t('common:settingsPage.signature.title')}
          </h3>
          <p className="text-sm text-gray-500">
            {t('common:settingsPage.signature.description')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {signatureUrl && (
          <div className="rounded-lg border border-gray-200 p-2 bg-gray-50">
            <img src={signatureUrl} alt="Signature" className="h-16 object-contain" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleUpload}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {hasSignature ? t('common:settingsPage.signature.change') : t('common:settingsPage.signature.upload')}
        </button>

        {hasSignature && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            {t('common:settingsPage.signature.delete')}
          </button>
        )}
      </div>
    </div>
  );
}
