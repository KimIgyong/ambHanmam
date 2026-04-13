import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  DollarSign,
  Package,
  Building2,
  CalendarDays,
  FolderOpen,
  FileSearch,
  Send,
  Inbox,
  Briefcase,
  ClipboardList,
  Receipt,
  TrendingUp,
  CreditCard,
  Landmark,
  AlertCircle,
  Headphones,
  BarChart,
  Globe,
  BookOpen,
  Code2,
  FolderTree,
  Eye,
  Mail,
  MailOpen,
  Star,
  type LucideIcon,
} from 'lucide-react';

export interface HanmamTab {
  id: string;
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export interface HanmamSubMenu {
  id: string;
  labelKey: string;
  path: string;
  icon: LucideIcon;
}

export const HANMAM_TABS: HanmamTab[] = [
  { id: 'management', labelKey: 'hanmam:tab.management', path: '/hm/main', icon: LayoutDashboard },
  { id: 'sales', labelKey: 'hanmam:tab.sales', path: '/hm/client', icon: TrendingUp },
  { id: 'service', labelKey: 'hanmam:tab.service', path: '/hm/consult-receipt', icon: Headphones },
  { id: 'support', labelKey: 'hanmam:tab.support', path: '/hm/company-life', icon: BookOpen },
  { id: 'notice', labelKey: 'hanmam:tab.notice', path: '/hm/schedule-sharing', icon: CalendarDays },
  { id: 'finance', labelKey: 'hanmam:tab.finance', path: '/hm/invoice-issuance', icon: DollarSign },
];

export const HANMAM_SUB_MENUS: Record<string, HanmamSubMenu[]> = {
  management: [
    { id: 'dashboard', labelKey: 'hanmam:menu.management.dashboard', path: '/hm/main', icon: LayoutDashboard },
    { id: 'meetings', labelKey: 'hanmam:menu.management.meetings', path: '/hm/meeting', icon: CalendarDays },
    { id: 'projects', labelKey: 'hanmam:menu.management.projects', path: '/hm/project', icon: Briefcase },
    { id: 'annualPlan', labelKey: 'hanmam:menu.management.annualPlan', path: '/hm/annual-plan', icon: ClipboardList },
    { id: 'performance', labelKey: 'hanmam:menu.management.performance', path: '/hm/performance', icon: BarChart3 },
    { id: 'collection', labelKey: 'hanmam:menu.management.collection', path: '/hm/collection-status', icon: DollarSign },
    { id: 'budget', labelKey: 'hanmam:menu.management.budget', path: '/hm/expense-budget', icon: Receipt },
    { id: 'products', labelKey: 'hanmam:menu.management.products', path: '/hm/product', icon: Package },
    { id: 'overview', labelKey: 'hanmam:menu.management.overview', path: '/hm/general', icon: Building2 },
  ],
  sales: [
    { id: 'clients', labelKey: 'hanmam:menu.sales.clients', path: '/hm/client', icon: Users },
    { id: 'contracts', labelKey: 'hanmam:menu.sales.contracts', path: '/hm/contract', icon: FileText },
    { id: 'invoiceRequest', labelKey: 'hanmam:menu.sales.invoiceRequest', path: '/hm/invoice-request', icon: Receipt },
    { id: 'externalSales', labelKey: 'hanmam:menu.sales.externalSales', path: '/hm/external-sales', icon: TrendingUp },
    { id: 'internalSales', labelKey: 'hanmam:menu.sales.internalSales', path: '/hm/internal-sales', icon: TrendingUp },
    { id: 'internalPurchases', labelKey: 'hanmam:menu.sales.internalPurchases', path: '/hm/internal-purchases', icon: Package },
    { id: 'collectionAnalysis', labelKey: 'hanmam:menu.sales.collectionAnalysis', path: '/hm/collection-analysis', icon: BarChart3 },
    { id: 'laborCost', labelKey: 'hanmam:menu.sales.laborCost', path: '/hm/labor-cost', icon: Users },
    { id: 'expenseBudget', labelKey: 'hanmam:menu.sales.expenseBudget', path: '/hm/expense-budget-mgmt', icon: DollarSign },
    { id: 'expense', labelKey: 'hanmam:menu.sales.expense', path: '/hm/expense-mgmt', icon: CreditCard },
  ],
  finance: [
    { id: 'invoiceIssue', labelKey: 'hanmam:menu.finance.invoiceIssue', path: '/hm/invoice-issuance', icon: Receipt },
    { id: 'expensePayment', labelKey: 'hanmam:menu.finance.expensePayment', path: '/hm/expense-payment', icon: DollarSign },
    { id: 'cardUsage', labelKey: 'hanmam:menu.finance.cardUsage', path: '/hm/card-usage', icon: CreditCard },
    { id: 'bankTransaction', labelKey: 'hanmam:menu.finance.bankTransaction', path: '/hm/bank-transaction', icon: Landmark },
    { id: 'pendingExpense', labelKey: 'hanmam:menu.finance.pendingExpense', path: '/hm/pending-expense', icon: AlertCircle },
    { id: 'pendingCollection', labelKey: 'hanmam:menu.finance.pendingCollection', path: '/hm/pending-collection', icon: AlertCircle },
  ],
  service: [
    { id: 'consultationReceipt', labelKey: 'hanmam:menu.service.consultationReceipt', path: '/hm/consult-receipt', icon: Headphones },
    { id: 'consultationManagement', labelKey: 'hanmam:menu.service.consultationManagement', path: '/hm/consult-mgmt', icon: ClipboardList },
    { id: 'consultationStats', labelKey: 'hanmam:menu.service.consultationStats', path: '/hm/consult-stats', icon: BarChart },
    { id: 'ipManagement', labelKey: 'hanmam:menu.service.ipManagement', path: '/hm/ip-mgmt', icon: Globe },
  ],
  support: [
    { id: 'companyLife', labelKey: 'hanmam:menu.support.companyLife', path: '/hm/company-life', icon: BookOpen },
    { id: 'devBoard', labelKey: 'hanmam:menu.support.devBoard', path: '/hm/dev-board', icon: Code2 },
    { id: 'companyDocs', labelKey: 'hanmam:menu.support.companyDocs', path: '/hm/company-docs', icon: FolderTree },
    { id: 'designDocs', labelKey: 'hanmam:menu.support.designDocs', path: '/hm/design-doc-mgmt', icon: FolderOpen },
    { id: 'designDocsView', labelKey: 'hanmam:menu.support.designDocsView', path: '/hm/design-doc-view', icon: Eye },
    { id: 'docSendLog', labelKey: 'hanmam:menu.support.docSendLog', path: '/hm/doc-send-log', icon: Send },
    { id: 'docReceiveLog', labelKey: 'hanmam:menu.support.docReceiveLog', path: '/hm/doc-receive-log', icon: Inbox },
  ],
  notice: [
    { id: 'schedule', labelKey: 'hanmam:menu.notice.schedule', path: '/hm/schedule-sharing', icon: CalendarDays },
    { id: 'reservation', labelKey: 'hanmam:menu.notice.reservation', path: '/hm/reservation', icon: CalendarDays },
  ],
};

export const HANMAM_FIXED_MENUS: HanmamSubMenu[] = [
  { id: 'my-work', labelKey: 'hanmam:lnb.myWork', path: '/hm/my-work', icon: Briefcase },
  { id: 'work-contact', labelKey: 'hanmam:lnb.workContact', path: '/hm/work-contact', icon: Mail },
  { id: 'approval', labelKey: 'hanmam:lnb.approval', path: '/hm/e-approval', icon: FileSearch },
  { id: 'message', labelKey: 'hanmam:lnb.message', path: '/hm/message', icon: MailOpen },
  { id: 'my-menu', labelKey: 'hanmam:lnb.myMenu', path: '/hm/my-work', icon: Star },
];
