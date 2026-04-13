import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  UsersRound,
  Building2,
  Package,
  Handshake,
  ShieldCheck,
  Users,
  Send,
  UserCheck,
  Lock,
  Globe,
  Key,
  Server,
  FileText,
  MessageSquare,
  Bot,
  BarChart3,
  AlertTriangle,
  AppWindow,
  Boxes,
  Link2,
  Layers,
  Store,
  Settings,
  HardDrive,
  BookOpen,
  CreditCard,
  DollarSign,
  Receipt,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { useMyPermissions } from '@/domain/settings/hooks/useMenuPermissions';
import { useServiceList } from '@/domain/service-management/hooks/useServiceCatalog';
import { adminService } from '@/domain/admin/service/admin.service';
import { useQuery } from '@tanstack/react-query';

/* ── 카드 데이터 구조 ── */
interface DashboardCard {
  id: string;
  titleKey: string;
  descriptionKey: string;
  path: string;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
  menuCode?: string;
}

interface DashboardCardGroup {
  id: string;
  titleKey: string;
  cards: DashboardCard[];
}

const CARD_GROUPS: DashboardCardGroup[] = [
  {
    id: 'userManagement',
    titleKey: 'admin:dashboard.groups.userManagement',
    cards: [
      { id: 'adminUsers', titleKey: 'admin:dashboard.cards.adminUsers.title', descriptionKey: 'admin:dashboard.cards.adminUsers.desc', path: '/admin/admin-users', icon: ShieldCheck, iconColor: 'text-red-600', bgColor: 'bg-red-50' },
      { id: 'partnerUsers', titleKey: 'admin:dashboard.cards.partnerUsers.title', descriptionKey: 'admin:dashboard.cards.partnerUsers.desc', path: '/admin/partner-users', icon: Users, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
      { id: 'partnerInvitations', titleKey: 'admin:dashboard.cards.partnerInvitations.title', descriptionKey: 'admin:dashboard.cards.partnerInvitations.desc', path: '/admin/partner-invitations', icon: Send, iconColor: 'text-pink-600', bgColor: 'bg-pink-50' },
      { id: 'totalUsers', titleKey: 'admin:dashboard.cards.totalUsers.title', descriptionKey: 'admin:dashboard.cards.totalUsers.desc', path: '/admin/total-users', icon: UserCheck, iconColor: 'text-blue-600', bgColor: 'bg-blue-50', menuCode: 'SETTINGS_TOTAL_USERS' },
      { id: 'entityManagement', titleKey: 'admin:dashboard.cards.entityManagement.title', descriptionKey: 'admin:dashboard.cards.entityManagement.desc', path: '/admin/entities', icon: Building2, iconColor: 'text-violet-600', bgColor: 'bg-violet-50', menuCode: 'SETTINGS_ENTITIES' },
      { id: 'members', titleKey: 'admin:dashboard.cards.members.title', descriptionKey: 'admin:dashboard.cards.members.desc', path: '/admin/members', icon: UsersRound, iconColor: 'text-teal-600', bgColor: 'bg-teal-50', menuCode: 'SETTINGS_MEMBERS' },
      { id: 'permissions', titleKey: 'admin:dashboard.cards.permissions.title', descriptionKey: 'admin:dashboard.cards.permissions.desc', path: '/admin/permissions', icon: Lock, iconColor: 'text-amber-600', bgColor: 'bg-amber-50', menuCode: 'SETTINGS_PERMISSIONS' },
    ],
  },
  {
    id: 'serviceManagement',
    titleKey: 'admin:dashboard.groups.serviceManagement',
    cards: [
      { id: 'serviceManagement', titleKey: 'admin:dashboard.cards.serviceManagement.title', descriptionKey: 'admin:dashboard.cards.serviceManagement.desc', path: '/admin/service/dashboard', icon: Package, iconColor: 'text-cyan-600', bgColor: 'bg-cyan-50', menuCode: 'SERVICE_MANAGEMENT' },
      { id: 'siteManagement', titleKey: 'admin:dashboard.cards.siteManagement.title', descriptionKey: 'admin:dashboard.cards.siteManagement.desc', path: '/admin/site/menus', icon: Globe, iconColor: 'text-lime-600', bgColor: 'bg-lime-50', menuCode: 'SITE_MANAGEMENT' },
      { id: 'apiKeys', titleKey: 'admin:dashboard.cards.apiKeys.title', descriptionKey: 'admin:dashboard.cards.apiKeys.desc', path: '/admin/api-keys', icon: Key, iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50', menuCode: 'SETTINGS_API_KEYS' },
      { id: 'paymentGateway', titleKey: 'admin:dashboard.cards.paymentGateway.title', descriptionKey: 'admin:dashboard.cards.paymentGateway.desc', path: '/admin/payment-gateway', icon: CreditCard, iconColor: 'text-green-600', bgColor: 'bg-green-50', menuCode: 'SETTINGS_PAYMENT_GATEWAY' },
      { id: 'paymentTransaction', titleKey: 'admin:dashboard.cards.paymentTransaction.title', descriptionKey: 'admin:dashboard.cards.paymentTransaction.desc', path: '/admin/payment-transactions', icon: Receipt, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50', menuCode: 'SETTINGS_PAYMENT_TRANSACTION' },
      { id: 'siteAnalytics', titleKey: 'admin:dashboard.cards.siteAnalytics.title', descriptionKey: 'admin:dashboard.cards.siteAnalytics.desc', path: '/admin/site-analytics', icon: BarChart3, iconColor: 'text-lime-600', bgColor: 'bg-lime-50' },
      { id: 'siteErrors', titleKey: 'admin:dashboard.cards.siteErrors.title', descriptionKey: 'admin:dashboard.cards.siteErrors.desc', path: '/admin/site-errors', icon: AlertTriangle, iconColor: 'text-red-600', bgColor: 'bg-red-50' },        { id: 'pricePlan', titleKey: 'admin:dashboard.cards.pricePlan.title', descriptionKey: 'admin:dashboard.cards.pricePlan.desc', path: '/admin/service/priceplan', icon: DollarSign, iconColor: 'text-amber-600', bgColor: 'bg-amber-50' },    ],
  },
  {
    id: 'communication',
    titleKey: 'admin:dashboard.groups.communication',
    cards: [
      { id: 'smtp', titleKey: 'admin:dashboard.cards.smtp.title', descriptionKey: 'admin:dashboard.cards.smtp.desc', path: '/admin/smtp', icon: Server, iconColor: 'text-slate-600', bgColor: 'bg-slate-50', menuCode: 'SETTINGS_SMTP' },
      { id: 'emailTemplates', titleKey: 'admin:dashboard.cards.emailTemplates.title', descriptionKey: 'admin:dashboard.cards.emailTemplates.desc', path: '/admin/email-templates', icon: FileText, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-50', menuCode: 'SETTINGS_EMAIL_TEMPLATES' },
      { id: 'conversations', titleKey: 'admin:dashboard.cards.conversations.title', descriptionKey: 'admin:dashboard.cards.conversations.desc', path: '/admin/conversations', icon: MessageSquare, iconColor: 'text-sky-600', bgColor: 'bg-sky-50', menuCode: 'SETTINGS_CONVERSATIONS' },
    ],
  },
  {
    id: 'aiAutomation',
    titleKey: 'admin:dashboard.groups.aiAutomation',
    cards: [
      { id: 'agents', titleKey: 'admin:dashboard.cards.agents.title', descriptionKey: 'admin:dashboard.cards.agents.desc', path: '/admin/agents', icon: Bot, iconColor: 'text-purple-600', bgColor: 'bg-purple-50', menuCode: 'SETTINGS_AGENTS' },
      { id: 'aiUsage', titleKey: 'admin:dashboard.cards.aiUsage.title', descriptionKey: 'admin:dashboard.cards.aiUsage.desc', path: '/admin/ai-usage', icon: BarChart3, iconColor: 'text-fuchsia-600', bgColor: 'bg-fuchsia-50', menuCode: 'SETTINGS_AI_USAGE' },
    ],
  },
  {
    id: 'appIntegration',
    titleKey: 'admin:dashboard.groups.appIntegration',
    cards: [
      { id: 'customApps', titleKey: 'admin:dashboard.cards.customApps.title', descriptionKey: 'admin:dashboard.cards.customApps.desc', path: '/admin/custom-apps', icon: AppWindow, iconColor: 'text-blue-600', bgColor: 'bg-blue-50', menuCode: 'ENTITY_CUSTOM_APPS' },
      { id: 'partnerApps', titleKey: 'admin:dashboard.cards.partnerApps.title', descriptionKey: 'admin:dashboard.cards.partnerApps.desc', path: '/admin/partner-apps', icon: Boxes, iconColor: 'text-orange-600', bgColor: 'bg-orange-50' },
      { id: 'appStoreOAuth', titleKey: 'admin:dashboard.cards.appStoreOAuth.title', descriptionKey: 'admin:dashboard.cards.appStoreOAuth.desc', path: '/admin/app-store-oauth', icon: Store, iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
      { id: 'portalBridge', titleKey: 'admin:dashboard.cards.portalBridge.title', descriptionKey: 'admin:dashboard.cards.portalBridge.desc', path: '/admin/portal-bridge', icon: Link2, iconColor: 'text-green-600', bgColor: 'bg-green-50', menuCode: 'SETTINGS_PORTAL_BRIDGE' },
    ],
  },
  {
    id: 'system',
    titleKey: 'admin:dashboard.groups.system',
    cards: [
      { id: 'units', titleKey: 'admin:dashboard.cards.units.title', descriptionKey: 'admin:dashboard.cards.units.desc', path: '/admin/units', icon: Layers, iconColor: 'text-stone-600', bgColor: 'bg-stone-50', menuCode: 'UNITS' },
      { id: 'siteSettings', titleKey: 'admin:dashboard.cards.siteSettings.title', descriptionKey: 'admin:dashboard.cards.siteSettings.desc', path: '/admin/site-settings', icon: Settings, iconColor: 'text-gray-600', bgColor: 'bg-gray-100', menuCode: 'SETTINGS_SITE' },
      { id: 'driveSettings', titleKey: 'admin:dashboard.cards.driveSettings.title', descriptionKey: 'admin:dashboard.cards.driveSettings.desc', path: '/admin/drive', icon: HardDrive, iconColor: 'text-yellow-600', bgColor: 'bg-yellow-50', menuCode: 'SETTINGS_DRIVE' },
      { id: 'glossary', titleKey: 'admin:dashboard.cards.glossary.title', descriptionKey: 'admin:dashboard.cards.glossary.desc', path: '/admin/glossary', icon: BookOpen, iconColor: 'text-teal-600', bgColor: 'bg-teal-50' },
    ],
  },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['admin', 'common']);
  const { data: accessibleMenus } = useMyPermissions();
  const { data: services } = useServiceList({ status: 'ACTIVE' });
  const [searchQuery, setSearchQuery] = useState('');

  const { data: usersData } = useQuery({
    queryKey: ['admin', 'users-count'],
    queryFn: () => adminService.getUsers({ page: 1, limit: 1 }),
  });
  const { data: entitiesData } = useQuery({
    queryKey: ['admin', 'entities-count'],
    queryFn: () => adminService.getEntities({ page: 1, limit: 1 }),
  });

  const stats = [
    { label: t('admin:dashboard.stats.totalUsers'), value: usersData?.total ?? '—', icon: UsersRound, iconColor: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: t('admin:dashboard.stats.totalEntities'), value: entitiesData?.total ?? '—', icon: Building2, iconColor: 'text-violet-600', bgColor: 'bg-violet-100' },
    { label: t('admin:dashboard.stats.activeServices'), value: services?.length ?? '—', icon: Package, iconColor: 'text-emerald-600', bgColor: 'bg-emerald-100' },
    { label: t('admin:dashboard.stats.totalPartners'), value: '—', icon: Handshake, iconColor: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return CARD_GROUPS.map((group) => ({
      ...group,
      cards: group.cards.filter((card) => {
        if (card.menuCode && accessibleMenus && !accessibleMenus.includes(card.menuCode)) return false;
        if (!query) return true;
        const title = t(card.titleKey).toLowerCase();
        const desc = t(card.descriptionKey).toLowerCase();
        return title.includes(query) || desc.includes(query);
      }),
    })).filter((g) => g.cards.length > 0);
  }, [searchQuery, accessibleMenus, t]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Title */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
            <LayoutDashboard className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('admin:dashboard.title')}</h1>
            <p className="text-sm text-gray-500">{t('admin:dashboard.subtitle')}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${s.bgColor}`}>
                  <Icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin:dashboard.search')}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* Card Groups */}
        <div className="space-y-8">
          {filteredGroups.map((group) => (
            <section key={group.id}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {t(group.titleKey)}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.cards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.id}
                      onClick={() => navigate(card.path)}
                      className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-indigo-200 hover:shadow-md"
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}>
                        <Icon className={`h-5 w-5 ${card.iconColor}`} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900">{t(card.titleKey)}</h3>
                        <p className="mt-0.5 text-xs text-gray-500">{t(card.descriptionKey)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
