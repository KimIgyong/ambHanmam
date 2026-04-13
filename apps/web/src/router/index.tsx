import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';
import SubMenuLayout from '@/layouts/SubMenuLayout';
import AuthLayout from '@/layouts/AuthLayout';
import AuthGuard from '@/router/AuthGuard';
import LoginPage from '@/domain/auth/pages/LoginPage';
import RegisterPage from '@/domain/auth/pages/RegisterPage';
import ForgotPasswordPage from '@/domain/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/domain/auth/pages/ResetPasswordPage';
import PendingPage from '@/domain/auth/pages/PendingPage';
import InactivePage from '@/domain/auth/pages/InactivePage';
import ForceChangePasswordPage from '@/domain/auth/pages/ForceChangePasswordPage';
import InitialSetupPage from '@/domain/auth/pages/InitialSetupPage';
import UnauthorizedPage from '@/domain/auth/pages/UnauthorizedPage';
import InviteAcceptPage from '@/domain/auth/pages/InviteAcceptPage';
import EntitySelectPage from '@/domain/auth/pages/EntitySelectPage';
import EntityLoginPage from '@/domain/auth/pages/EntityLoginPage';
import TodayPage from '@/domain/today/pages/TodayPage';
import TodayHistoryPage from '@/domain/today/pages/TodayHistoryPage';
import WorkReportPage from '@/domain/report/pages/WorkReportPage';
import ChatPage from '@/domain/chat/pages/ChatPage';
import ApiKeyManagementPage from '@/domain/settings/pages/ApiKeyManagementPage';
import MemberManagementPage from '@/domain/members/pages/MemberManagementPage';
import MemberDetailPage from '@/domain/members/pages/MemberDetailPage';
import SmtpSettingsPage from '@/domain/settings/pages/SmtpSettingsPage';
import PaymentGatewaySettingsPage from '@/domain/settings/pages/PaymentGatewaySettingsPage';
import PaymentTransactionPage from '@/domain/admin/pages/PaymentTransactionPage';
import PaymentResultPage from '@/domain/payment/pages/PaymentResultPage';
import EmailTemplatesPage from '@/domain/settings/pages/EmailTemplatesPage';
import MenuPermissionsPage from '@/domain/settings/pages/MenuPermissionsPage';
import DriveSettingsPage from '@/domain/settings/pages/DriveSettingsPage';
import EntityManagementPage from '@/domain/settings/pages/EntityManagementPage';
import ConversationManagementPage from '@/domain/settings/pages/ConversationManagementPage';
import AgentSettingsPage from '@/domain/settings/pages/AgentSettingsPage';
import UnitManagementPage from '@/domain/settings/pages/UnitManagementPage';
import WorkItemsPage from '@/domain/work-items/pages/WorkItemsPage';
import TodoPage from '@/domain/todos/pages/TodoPage';
import CompletedTodosPage from '@/domain/todos/pages/CompletedTodosPage';
import AgentsPage from '@/domain/agents/pages/AgentsPage';
import MeetingNotesPage from '@/domain/meeting-notes/pages/MeetingNotesPage';
import MeetingNoteDetailPage from '@/domain/meeting-notes/pages/MeetingNoteDetailPage';
import NoteGraphPage from '@/domain/meeting-notes/pages/NoteGraphPage';
import AmoebaTalkPage from '@/domain/amoeba-talk/pages/AmoebaTalkPage';
import CrewPage from '@/domain/amoeba-talk/pages/CrewPage';
import AmoebaTalkServicePage from '@/domain/amoeba-talk-connect/pages/AmoebaTalkServicePage';
import AttendancePage from '@/domain/attendance/pages/AttendancePage';
import CalendarPage from '@/domain/calendar/pages/CalendarPage';
import AssetManagementPage from '@/domain/asset/pages/AssetManagementPage';
import NoticesPage from '@/domain/notices/pages/NoticesPage';
import NoticeDetailPage from '@/domain/notices/pages/NoticeDetailPage';
import DocumentsPage from '@/domain/drive/pages/DocumentsPage';
import AccountingPage from '@/domain/accounting/pages/AccountingPage';
import AccountingDashboardPage from '@/domain/accounting/pages/AccountingDashboardPage';
import AccountTransactionsPage from '@/domain/accounting/pages/AccountTransactionsPage';
import HrLayout from '@/domain/hr/pages/HrLayout';
import EmployeeListPage from '@/domain/hr/pages/EmployeeListPage';
import EmployeeDetailPage from '@/domain/hr/pages/EmployeeDetailPage';
import TimesheetPage from '@/domain/hr/pages/TimesheetPage';
import OvertimePage from '@/domain/hr/pages/OvertimePage';
import LeavePage from '@/domain/hr/pages/LeavePage';
import PayrollListPage from '@/domain/hr/pages/PayrollListPage';
import PayrollDetailPage from '@/domain/hr/pages/PayrollDetailPage';
import SeverancePage from '@/domain/hr/pages/SeverancePage';
import HrReportsPage from '@/domain/hr/pages/HrReportsPage';
import HrSettingsPage from '@/domain/hr/pages/HrSettingsPage';
import FreelancerListPage from '@/domain/hr/pages/FreelancerListPage';
import FreelancerDetailPage from '@/domain/hr/pages/FreelancerDetailPage';
import BusinessIncomePage from '@/domain/hr/pages/BusinessIncomePage';
import YearendAdjustmentPage from '@/domain/hr/pages/YearendAdjustmentPage';
import BillingLayout from '@/domain/billing/pages/BillingLayout';
import PartnerListPage from '@/domain/billing/pages/PartnerListPage';
import PartnerDetailPage from '@/domain/billing/pages/PartnerDetailPage';
import ContractListPage from '@/domain/billing/pages/ContractListPage';
import ContractDetailPage from '@/domain/billing/pages/ContractDetailPage';
import SowListPage from '@/domain/billing/pages/SowListPage';
import SowDetailPage from '@/domain/billing/pages/SowDetailPage';
import InvoiceListPage from '@/domain/billing/pages/InvoiceListPage';
import InvoiceDetailPage from '@/domain/billing/pages/InvoiceDetailPage';
import PaymentListPage from '@/domain/billing/pages/PaymentListPage';
import BillingDashboardPage from '@/domain/billing/pages/BillingDashboardPage';
import ProjectLayout from '@/domain/project/pages/ProjectLayout';
import ProposalListPage from '@/domain/project/pages/ProposalListPage';
import ProposalFormPage from '@/domain/project/pages/ProposalFormPage';
import ProposalDetailPage from '@/domain/project/pages/ProposalDetailPage';
import ProjectListPage from '@/domain/project/pages/ProjectListPage';
import ProjectDetailPage from '@/domain/project/pages/ProjectDetailPage';
import KmsLayout from '@/domain/kms/pages/KmsLayout';
import TagManagementPage from '@/domain/kms/pages/TagManagementPage';
import TagCloudPage from '@/domain/kms/pages/TagCloudPage';
import KnowledgeGraphPage from '@/domain/kms/pages/KnowledgeGraphPage';
import AmbKmsGraphPage from '@/domain/kms/pages/AmbKmsGraphPage';
import DocBuilderPage from '@/domain/kms/pages/DocBuilderPage';
import DddPage from '@/domain/kms/pages/DddPage';
import DddSettingsPage from '@/domain/kms/pages/DddSettingsPage';
import ServiceLayout from '@/domain/service-management/pages/ServiceLayout';
import SiteLayout from '@/domain/site-management/pages/SiteLayout';
import SiteMenuPage from '@/domain/site-management/pages/SiteMenuPage';
import SitePageListPage from '@/domain/site-management/pages/SitePageListPage';
import SitePageEditorPage from '@/domain/site-management/pages/SitePageEditorPage';
import SitePreviewPage from '@/domain/site-management/pages/SitePreviewPage';
import HanmamLayout from '@/layouts/HanmamLayout';
// ── 한마음 경영정보 ──
import MainDashboardPage from '@/domain/hanmam/pages/management/MainDashboardPage';
import HmMeetingManagementPage from '@/domain/hanmam/pages/management/MeetingManagementPage';
import HmProjectManagementPage from '@/domain/hanmam/pages/management/ProjectManagementPage';
import AnnualPlanPage from '@/domain/hanmam/pages/management/AnnualPlanPage';
import PerformanceAnalysisPage from '@/domain/hanmam/pages/management/PerformanceAnalysisPage';
import CollectionStatusPage from '@/domain/hanmam/pages/management/CollectionStatusPage';
import HmExpenseBudgetPage from '@/domain/hanmam/pages/management/ExpenseBudgetPage';
import ProductManagementPage from '@/domain/hanmam/pages/management/ProductManagementPage';
import GeneralManagementPage from '@/domain/hanmam/pages/management/GeneralManagementPage';
// ── 한마음 영업업무 ──
import HmClientManagementPage from '@/domain/hanmam/pages/sales/ClientManagementPage';
import HmContractManagementPage from '@/domain/hanmam/pages/sales/ContractManagementPage';
import InvoiceRequestPage from '@/domain/hanmam/pages/sales/InvoiceRequestPage';
import ExternalSalesPage from '@/domain/hanmam/pages/sales/ExternalSalesPage';
import InternalSalesPage from '@/domain/hanmam/pages/sales/InternalSalesPage';
import InternalPurchasesPage from '@/domain/hanmam/pages/sales/InternalPurchasesPage';
import CollectionAnalysisPage from '@/domain/hanmam/pages/sales/CollectionAnalysisPage';
import LaborCostPage from '@/domain/hanmam/pages/sales/LaborCostPage';
import ExpenseBudgetManagementPage from '@/domain/hanmam/pages/sales/ExpenseBudgetManagementPage';
import ExpenseManagementPage from '@/domain/hanmam/pages/sales/ExpenseManagementPage';
// ── 한마음 서비스업무 ──
import ConsultationReceiptPage from '@/domain/hanmam/pages/service/ConsultationReceiptPage';
import ConsultationManagementPage from '@/domain/hanmam/pages/service/ConsultationManagementPage';
import ConsultationStatsPage from '@/domain/hanmam/pages/service/ConsultationStatsPage';
import IpManagementPage from '@/domain/hanmam/pages/service/IpManagementPage';
// ── 한마음 업무지원 ──
import CompanyLifePage from '@/domain/hanmam/pages/support/CompanyLifePage';
import DevBoardPage from '@/domain/hanmam/pages/support/DevBoardPage';
import CompanyDocsPage from '@/domain/hanmam/pages/support/CompanyDocsPage';
import DesignDocManagementPage from '@/domain/hanmam/pages/support/DesignDocManagementPage';
import DesignDocViewPage from '@/domain/hanmam/pages/support/DesignDocViewPage';
import DocSendLogPage from '@/domain/hanmam/pages/support/DocSendLogPage';
import DocReceiveLogPage from '@/domain/hanmam/pages/support/DocReceiveLogPage';
// ── 한마음 자금업무 ──
import InvoiceIssuancePage from '@/domain/hanmam/pages/finance/InvoiceIssuancePage';
import ExpensePaymentPage from '@/domain/hanmam/pages/finance/ExpensePaymentPage';
import CardUsagePage from '@/domain/hanmam/pages/finance/CardUsagePage';
import BankTransactionPage from '@/domain/hanmam/pages/finance/BankTransactionPage';
import PendingExpensePage from '@/domain/hanmam/pages/finance/PendingExpensePage';
import PendingCollectionPage from '@/domain/hanmam/pages/finance/PendingCollectionPage';
// ── 한마음 알림게시판 ──
import ScheduleSharingPage from '@/domain/hanmam/pages/notice/ScheduleSharingPage';
import ReservationPage from '@/domain/hanmam/pages/notice/ReservationPage';
// ── 한마음 LNB 고정 ──
import MyWorkPage from '@/domain/hanmam/pages/lnb/MyWorkPage';
import WorkContactPage from '@/domain/hanmam/pages/lnb/WorkContactPage';
import EApprovalPage from '@/domain/hanmam/pages/lnb/EApprovalPage';
import HmMessagePage from '@/domain/hanmam/pages/lnb/MessagePage';
import SiteAnalyticsPage from '@/domain/site-management/pages/SiteAnalyticsPage';
import SiteGaSettingsPage from '@/domain/site-management/pages/SiteGaSettingsPage';
import ServiceDashboardPage from '@/domain/service-management/pages/ServiceDashboardPage';
import ServiceListPage from '@/domain/service-management/pages/ServiceListPage';
import ServiceDetailPage from '@/domain/service-management/pages/ServiceDetailPage';
import ClientListPage from '@/domain/service-management/pages/ClientListPage';
import ClientDetailPage from '@/domain/service-management/pages/ClientDetailPage';
import SubscriptionListPage from '@/domain/service-management/pages/SubscriptionListPage';
import SubscriptionDetailPage from '@/domain/service-management/pages/SubscriptionDetailPage';
import PricePlanPage from '@/domain/admin/pages/PricePlanPage';
import ContractListStandalonePage from '@/domain/contracts/pages/ContractListStandalonePage';
import MyPage from '@/domain/my-page/pages/MyPage';
import MyLeavePage from '@/domain/hr/pages/MyLeavePage';
import LeaveRequestAdminPage from '@/domain/hr/pages/LeaveRequestAdminPage';
import IssuesPage from '@/domain/issues/pages/IssuesPage';
import GlossaryPage from '@/domain/translations/pages/GlossaryPage';
import SiteSettingsPage from '@/domain/settings/pages/SiteSettingsPage';
import AiUsageManagementPage from '@/domain/settings/pages/AiUsageManagementPage';
import AdminCustomAppsPage from '@/domain/settings/pages/AdminCustomAppsPage';
import MenuGuard from '@/components/common/MenuGuard';
import ChatMenuGuard from '@/components/common/ChatMenuGuard';
import AdminGuard from '@/components/common/AdminGuard';
import EntitySettingsGuard from '@/components/common/EntitySettingsGuard';
import EntitySettingsPage from '@/domain/entity-settings/pages/EntitySettingsPage';
import EntityMemberPage from '@/domain/entity-settings/pages/EntityMemberPage';
import EntityPermissionPage from '@/domain/entity-settings/pages/EntityPermissionPage';
import EntityApiKeyPage from '@/domain/entity-settings/pages/EntityApiKeyPage';
// EntityDrivePage re-enabled as independent entity settings page
import EntityDrivePage from '@/domain/entity-settings/pages/EntityDrivePage';
import EntityUsagePage from '@/domain/entity-settings/pages/EntityUsagePage';
import EntityOrganizationPage from '@/domain/entity-settings/pages/EntityOrganizationPage';
import EntityWorkStatisticsPage from '@/domain/entity-settings/pages/EntityWorkStatisticsPage';
import EntityActivityIndexPage from '@/domain/entity-settings/pages/EntityActivityIndexPage';
import EntityCustomAppsTabPage from '@/domain/entity-settings/pages/EntityCustomAppsTabPage';
import AppStoreManagementPage from '@/domain/entity-settings/pages/AppStoreManagementPage';
import EntityEmailTemplatePage from '@/domain/entity-settings/pages/EntityEmailTemplatePage';
import EntitySiteConfigPage from '@/domain/entity-settings/pages/EntitySiteConfigPage';
import EntityClientManagementPage from '@/domain/entity-settings/pages/EntityClientManagementPage';
import CustomAppHostPage from '@/domain/custom-apps/pages/CustomAppHostPage';
import ExpenseRequestListPage from '@/domain/expense-request/pages/ExpenseRequestListPage';
import ExpenseRequestFormPage from '@/domain/expense-request/pages/ExpenseRequestFormPage';
import ExpenseRequestDetailPage from '@/domain/expense-request/pages/ExpenseRequestDetailPage';
import MonthlyExpenseReportPage from '@/domain/expense-request/pages/MonthlyExpenseReportPage';
import ForecastReportPage from '@/domain/expense-request/pages/ForecastReportPage';
import PortalCustomerPage from '@/domain/portal-bridge/pages/PortalCustomerPage';
import TotalUserManagementPage from '@/domain/admin/pages/TotalUserManagementPage';
import RedmineMigrationPage from '@/domain/admin/pages/RedmineMigrationPage';
import RedmineImportedIssuesPage from '@/domain/admin/pages/RedmineImportedIssuesPage';
import ExternalTaskToolsPage from '@/domain/external-task-import/pages/ExternalTaskToolsPage';
import OAuthConsentPage from '@/domain/oauth/pages/OAuthConsentPage';
import EntityAppsPage from '@/domain/entity-settings/pages/EntityAppsPage';
import EntitySlackIntegrationPage from '@/domain/entity-settings/pages/EntitySlackIntegrationPage';
import EntityAsanaIntegrationPage from '@/domain/entity-settings/pages/EntityAsanaIntegrationPage';
import EntityExternalConnectPage from '@/domain/entity-settings/pages/EntityExternalConnectPage';
import EntityAttendancePolicyPage from '@/domain/entity-settings/pages/EntityAttendancePolicyPage';
import SubscriptionPage from '@/domain/subscription/pages/SubscriptionPage';
import ExternalTaskImportPage from '@/domain/external-task-import/pages/ExternalTaskImportPage';
import EntityRedmineMigrationPage from '@/domain/external-task-import/pages/EntityRedmineMigrationPage';
import EntityRedmineImportedPage from '@/domain/external-task-import/pages/EntityRedmineImportedPage';
import PartnerManagementPage from '@/domain/admin/pages/PartnerManagementPage';
import AdminPartnerAppsPage from '@/domain/admin/pages/AdminPartnerAppsPage';
import AdminAppStoreOAuthPage from '@/domain/admin/pages/AdminAppStoreOAuthPage';
import UserManagementPage from '@/domain/admin/pages/EntityManagementPage';
import UserManagementDetailPage from '@/domain/admin/pages/EntityManagementDetailPage';
import AdminDashboardPage from '@/domain/admin/pages/AdminDashboardPage';
import AdminSiteAnalyticsPage from '@/domain/admin/pages/AdminSiteAnalyticsPage';
import SiteErrorPage from '@/domain/admin/pages/SiteErrorPage';
import AdminLoginPage from '@/domain/admin/pages/AdminLoginPage';
import AdminForgotPasswordPage from '@/domain/admin/pages/AdminForgotPasswordPage';
import AdminUsersPage from '@/domain/admin/pages/AdminUsersPage';
import PartnerUsersPage from '@/domain/admin/pages/PartnerUsersPage';
import PartnerInvitationsPage from '@/domain/admin/pages/PartnerInvitationsPage';
import AdminServiceDetailPage from '@/domain/admin/pages/AdminServiceDetailPage';
import MenuCategoryPage from '@/domain/menu/pages/MenuCategoryPage';
import AppStorePage from '@/domain/menu/pages/AppStorePage';
import IndexGate from '@/components/common/IndexGate';
import ClientLayout from '@/domain/client-portal/layout/ClientLayout';
import ClientAuthGuard from '@/domain/client-portal/guard/ClientAuthGuard';
import ClientLoginPage from '@/domain/client-portal/pages/ClientLoginPage';
import ClientForgotPasswordPage from '@/domain/client-portal/pages/ClientForgotPasswordPage';
import ClientRegisterPage from '@/domain/client-portal/pages/ClientRegisterPage';
import ClientDashboardPage from '@/domain/client-portal/pages/ClientDashboardPage';
import ClientProjectListPage from '@/domain/client-portal/pages/ClientProjectListPage';
import ClientProjectDetailPage from '@/domain/client-portal/pages/ClientProjectDetailPage';
import ClientIssueListPage from '@/domain/client-portal/pages/ClientIssueListPage';
import ClientIssueDetailPage from '@/domain/client-portal/pages/ClientIssueDetailPage';
import ClientIssueCreatePage from '@/domain/client-portal/pages/ClientIssueCreatePage';
import ClientProfilePage from '@/domain/client-portal/pages/ClientProfilePage';
import ClientChatPage from '@/domain/client-portal/pages/ClientChatPage';
import PartnerLayout from '@/domain/partner-portal/layout/PartnerLayout';
import PartnerAuthGuard from '@/domain/partner-portal/guard/PartnerAuthGuard';
import PartnerLoginPage from '@/domain/partner-portal/pages/PartnerLoginPage';
import PartnerForgotPasswordPage from '@/domain/partner-portal/pages/PartnerForgotPasswordPage';
import PartnerRegisterPage from '@/domain/partner-portal/pages/PartnerRegisterPage';
import PartnerDashboardPage from '@/domain/partner-portal/pages/PartnerDashboardPage';
import PartnerMyPage from '@/domain/partner-portal/pages/PartnerMyPage';
import PartnerAppListPage from '@/domain/partner-portal/pages/PartnerAppListPage';
import { useAuthStore } from '@/domain/auth/store/auth.store';

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.isAdmin);
  if (isAuthenticated) {
    return <Navigate to={isAdmin() ? '/admin' : '/today'} replace />;
  }
  return <>{children}</>;
}

export const router = createBrowserRouter([
  // ── Public routes (no auth) ──
  {
    path: '/invite/:token',
    element: <InviteAcceptPage />,
  },
  {
    path: '/payment/result',
    element: <PaymentResultPage />,
  },
  // ── Index Gate → Auth Guard (handles pending, inactive, mustChangePw) ──
  {
    element: <IndexGate />,
    children: [{
    element: <AuthGuard />,
    children: [
      { path: '/pending', element: <PendingPage /> },
      { path: '/inactive', element: <InactivePage /> },
      { path: '/force-change-password', element: <ForceChangePasswordPage /> },
      { path: '/initial-setup', element: <InitialSetupPage /> },
      { path: '/unauthorized', element: <UnauthorizedPage /> },
      { path: '/select-entity', element: <EntitySelectPage /> },
      { path: '/oauth/consent', element: <OAuthConsentPage /> },
      {
        path: '/',
        element: <MainLayout />,
        children: [
      {
        index: true,
        element: <Navigate to="/today" replace />,
      },
      {
        path: 'menu/work-tools',
        element: <MenuCategoryPage type="workTools" />,
      },
      {
        path: 'menu/work_tools',
        element: <Navigate to="/menu/work-tools" replace />,
      },
      {
        path: 'menu/work-modules',
        element: <MenuCategoryPage type="workModules" />,
      },
      {
        path: 'menu/work_modules',
        element: <Navigate to="/menu/work-modules" replace />,
      },
      {
        path: 'menu/custom-apps',
        element: <MenuCategoryPage type="customApps" />,
      },
      {
        path: 'app-store',
        element: <AppStorePage />,
      },
      {
        path: 'app-store-stg',
        element: <AppStorePage storeUrl="https://stg-apps.amoeba.site" label="App Store 2" />,
      },
      {
        path: 'today',
        element: <MenuGuard menuCode="TODAY"><TodayPage /></MenuGuard>,
      },
      {
        path: 'today/history/:date',
        element: <MenuGuard menuCode="TODAY"><TodayHistoryPage /></MenuGuard>,
      },
      {
        path: 'work-reports',
        element: <MenuGuard menuCode="TODAY"><WorkReportPage /></MenuGuard>,
      },
      {
        path: 'my-page',
        element: <MyPage />,
      },
      {
        path: 'my-leave',
        element: <MyLeavePage />,
      },
      {
        path: 'todos',
        element: <MenuGuard menuCode="TODO"><TodoPage /></MenuGuard>,
      },
      {
        path: 'todos/completed',
        element: <MenuGuard menuCode="TODO"><CompletedTodosPage /></MenuGuard>,
      },
      {
        path: 'issues',
        element: <MenuGuard menuCode="ISSUES"><IssuesPage /></MenuGuard>,
      },
      {
        path: 'issues/external-import',
        element: <MenuGuard menuCode="ISSUES"><ExternalTaskImportPage /></MenuGuard>,
      },
      {
        path: 'issues/redmine-migration',
        element: <MenuGuard menuCode="ISSUES"><EntityRedmineMigrationPage /></MenuGuard>,
      },
      {
        path: 'issues/redmine-imported',
        element: <MenuGuard menuCode="ISSUES"><EntityRedmineImportedPage /></MenuGuard>,
      },
      {
        path: 'work-items',
        element: <MenuGuard menuCode="WORK_ITEMS"><WorkItemsPage /></MenuGuard>,
      },
      {
        path: 'agents',
        element: <MenuGuard menuCode="AGENTS"><AgentsPage /></MenuGuard>,
      },
      {
        path: 'meeting-notes',
        element: <MenuGuard menuCode="MEETING_NOTES"><MeetingNotesPage /></MenuGuard>,
      },
      {
        path: 'meeting-notes/graph',
        element: <MenuGuard menuCode="MEETING_NOTES"><NoteGraphPage /></MenuGuard>,
      },
      {
        path: 'meeting-notes/:id',
        element: <MenuGuard menuCode="MEETING_NOTES"><MeetingNoteDetailPage /></MenuGuard>,
      },
      {
        path: 'amoeba-talk',
        element: <MenuGuard menuCode="AMOEBA_TALK"><AmoebaTalkPage /></MenuGuard>,
      },
      {
        path: 'crew',
        element: <MenuGuard menuCode="AMOEBA_TALK"><CrewPage /></MenuGuard>,
      },
      {
        path: 'amoeba-talk-connect',
        element: <AmoebaTalkServicePage />,
      },
      {
        path: 'attendance',
        element: <AttendancePage />,
      },
      {
        path: 'calendar',
        element: <MenuGuard menuCode="CALENDAR"><CalendarPage /></MenuGuard>,
      },
      {
        path: 'assets',
        element: <MenuGuard menuCode="ASSET_MANAGEMENT"><AssetManagementPage /></MenuGuard>,
      },
      {
        path: 'expense-requests',
        element: <MenuGuard menuCode="EXPENSE_REQUEST"><ExpenseRequestListPage /></MenuGuard>,
      },
      {
        path: 'expense-requests/new',
        element: <MenuGuard menuCode="EXPENSE_REQUEST"><ExpenseRequestFormPage /></MenuGuard>,
      },
      {
        path: 'expense-requests/reports/monthly',
        element: <MenuGuard menuCode="EXPENSE_REQUEST"><MonthlyExpenseReportPage /></MenuGuard>,
      },
      {
        path: 'expense-requests/reports/forecast',
        element: <MenuGuard menuCode="EXPENSE_REQUEST"><ForecastReportPage /></MenuGuard>,
      },
      {
        path: 'expense-requests/:id',
        element: <MenuGuard menuCode="EXPENSE_REQUEST"><ExpenseRequestDetailPage /></MenuGuard>,
      },
      {
        path: 'expense-requests/:id/edit',
        element: <MenuGuard menuCode="EXPENSE_REQUEST"><ExpenseRequestFormPage /></MenuGuard>,
      },
      {
        path: 'notices',
        element: <MenuGuard menuCode="NOTICES"><NoticesPage /></MenuGuard>,
      },
      {
        path: 'notices/:id',
        element: <MenuGuard menuCode="NOTICES"><NoticeDetailPage /></MenuGuard>,
      },
      {
        path: 'contracts',
        element: <MenuGuard menuCode="BILLING"><ContractListStandalonePage /></MenuGuard>,
      },
      {
        path: 'drive',
        element: <MenuGuard menuCode="DRIVE"><DocumentsPage /></MenuGuard>,
      },
      {
        path: 'documents',
        element: <Navigate to="/drive" replace />,
      },
      {
        path: 'accounting',
        element: <MenuGuard menuCode="ACCOUNTING"><AccountingPage /></MenuGuard>,
      },
      {
        path: 'accounting/dashboard',
        element: <MenuGuard menuCode="ACCOUNTING"><AccountingDashboardPage /></MenuGuard>,
      },
      {
        path: 'accounting/:accountId',
        element: <MenuGuard menuCode="ACCOUNTING"><AccountTransactionsPage /></MenuGuard>,
      },
      {
        path: 'hr',
        element: <MenuGuard menuCode="HR"><HrLayout /></MenuGuard>,
        children: [
          { index: true, element: <Navigate to="/hr/employees" replace /> },
          { path: 'employees', element: <EmployeeListPage /> },
          { path: 'employees/new', element: <EmployeeDetailPage /> },
          { path: 'employees/:id', element: <EmployeeDetailPage /> },
          { path: 'freelancers', element: <FreelancerListPage /> },
          { path: 'freelancers/new', element: <FreelancerDetailPage /> },
          { path: 'freelancers/:id', element: <FreelancerDetailPage /> },
          { path: 'business-income', element: <BusinessIncomePage /> },
          { path: 'yearend', element: <YearendAdjustmentPage /> },
          { path: 'timesheet', element: <TimesheetPage /> },
          { path: 'overtime', element: <OvertimePage /> },
          { path: 'leave', element: <LeavePage /> },
          { path: 'leave-requests', element: <LeaveRequestAdminPage /> },
          { path: 'payroll', element: <PayrollListPage /> },
          { path: 'payroll/:periodId', element: <PayrollDetailPage /> },
          { path: 'severance', element: <SeverancePage /> },
          { path: 'reports', element: <HrReportsPage /> },
          { path: 'settings', element: <HrSettingsPage /> },
        ],
      },
      {
        path: 'billing',
        element: <MenuGuard menuCode="BILLING"><BillingLayout /></MenuGuard>,
        children: [
          { index: true, element: <Navigate to="/billing/dashboard" replace /> },
          { path: 'dashboard', element: <BillingDashboardPage /> },
          { path: 'partners', element: <PartnerListPage /> },
          { path: 'partners/new', element: <PartnerDetailPage /> },
          { path: 'partners/:id', element: <PartnerDetailPage /> },
          { path: 'contracts', element: <ContractListPage /> },
          { path: 'contracts/new', element: <ContractDetailPage /> },
          { path: 'contracts/:id', element: <ContractDetailPage /> },
          { path: 'sow', element: <SowListPage /> },
          { path: 'sow/new', element: <SowDetailPage /> },
          { path: 'sow/:id', element: <SowDetailPage /> },
          { path: 'invoices', element: <InvoiceListPage /> },
          { path: 'invoices/new', element: <InvoiceDetailPage /> },
          { path: 'invoices/:id', element: <InvoiceDetailPage /> },
          { path: 'payments', element: <PaymentListPage /> },
        ],
      },
      {
        path: 'project',
        element: <MenuGuard menuCode="PROJECT_MANAGEMENT"><ProjectLayout /></MenuGuard>,
        children: [
          { index: true, element: <Navigate to="/project/projects" replace /> },
          { path: 'proposals', element: <ProposalListPage /> },
          { path: 'proposals/new', element: <ProposalFormPage /> },
          { path: 'proposals/:id', element: <ProposalDetailPage /> },
          { path: 'projects', element: <ProjectListPage /> },
          { path: 'projects/:id', element: <ProjectDetailPage /> },
        ],
      },
      // ── Redirects: old /service/* → /admin/service/* ──
      {
        path: 'service',
        element: <Navigate to="/admin/service/dashboard" replace />,
      },
      {
        path: 'service/*',
        element: <Navigate to="/admin/service/dashboard" replace />,
      },
      // ── Redirects: old /site/* → /admin/site/* ──
      {
        path: 'site',
        element: <Navigate to="/admin/site/menus" replace />,
      },
      {
        path: 'site/*',
        element: <Navigate to="/admin/site/menus" replace />,
      },
      {
        path: 'kms',
        element: <MenuGuard menuCode="KMS"><KmsLayout /></MenuGuard>,
        children: [
          { index: true, element: <Navigate to="/kms/doc-builder" replace /> },
          { path: 'doc-builder', element: <DocBuilderPage /> },
          { path: 'ddd', element: <DddPage /> },
          { path: 'ddd-settings', element: <DddSettingsPage /> },
          { path: 'tag-cloud', element: <TagCloudPage /> },
          { path: 'tags', element: <TagManagementPage /> },
          { path: 'knowledge-graph', element: <KnowledgeGraphPage /> },
          { path: 'amb-graph', element: <AmbKmsGraphPage /> },
        ],
      },
      // ── Redirects: old /settings/* → /admin/* ──
      {
        path: 'settings',
        element: <Navigate to="/admin" replace />,
      },
      {
        path: 'settings/*',
        element: <Navigate to="/admin" replace />,
      },
      {
        path: 'entity-settings',
        element: <EntitySettingsGuard><EntitySettingsPage /></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/members',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_MEMBERS"><EntityMemberPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/permissions',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_PERMISSIONS"><EntityPermissionPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/api-keys',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_API_KEYS"><EntityApiKeyPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/drive',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_DRIVE"><EntityDrivePage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/usage',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_USAGE"><EntityUsagePage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/organization',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_ORGANIZATION"><EntityOrganizationPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/work-statistics',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_WORK_STATISTICS"><EntityWorkStatisticsPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/activity-index',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_ACTIVITY_INDEX"><EntityActivityIndexPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/custom-apps',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_CUSTOM_APPS"><EntityCustomAppsTabPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/app-store',
        element: <EntitySettingsGuard><AppStoreManagementPage /></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/apps',
        element: <EntitySettingsGuard><EntityAppsPage /></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/email-templates',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_EMAIL_TEMPLATE"><EntityEmailTemplatePage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/site-config',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_SITE_CONFIG"><EntitySiteConfigPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/attendance-policy',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_ATTENDANCE_POLICY"><EntityAttendancePolicyPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/clients',
        element: <EntitySettingsGuard><EntityClientManagementPage /></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/external-connect',
        element: <EntitySettingsGuard><EntityExternalConnectPage /></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/external-task-tools',
        element: <EntitySettingsGuard><ExternalTaskToolsPage /></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/slack-integration',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_SLACK_INTEGRATION"><EntitySlackIntegrationPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/asana-integration',
        element: <EntitySettingsGuard><MenuGuard menuCode="ENTITY_EXTERNAL_TASK_TOOLS"><EntityAsanaIntegrationPage /></MenuGuard></EntitySettingsGuard>,
      },
      {
        path: 'entity-settings/subscription',
        element: <EntitySettingsGuard><SubscriptionPage /></EntitySettingsGuard>,
      },
      {
        path: 'apps/:appCode',
        element: <CustomAppHostPage />,
      },
      {
        path: 'chat/:unit',
        element: <ChatMenuGuard><SubMenuLayout /></ChatMenuGuard>,
        children: [
          {
            index: true,
            element: <ChatPage />,
          },
          {
            path: ':conversationId',
            element: <ChatPage />,
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
  // ── HanmamLayout: 한마음 전용 레이아웃 ──
  {
    path: 'hm',
    element: <HanmamLayout />,
    children: [
      { index: true, element: <Navigate to="/hm/main" replace /> },
      // 경영정보
      { path: 'main', element: <MainDashboardPage /> },
      { path: 'meeting', element: <HmMeetingManagementPage /> },
      { path: 'project', element: <HmProjectManagementPage /> },
      { path: 'annual-plan', element: <AnnualPlanPage /> },
      { path: 'performance', element: <PerformanceAnalysisPage /> },
      { path: 'collection-status', element: <CollectionStatusPage /> },
      { path: 'expense-budget', element: <HmExpenseBudgetPage /> },
      { path: 'product', element: <ProductManagementPage /> },
      { path: 'general', element: <GeneralManagementPage /> },
      // 영업업무
      { path: 'client', element: <HmClientManagementPage /> },
      { path: 'contract', element: <HmContractManagementPage /> },
      { path: 'invoice-request', element: <InvoiceRequestPage /> },
      { path: 'external-sales', element: <ExternalSalesPage /> },
      { path: 'internal-sales', element: <InternalSalesPage /> },
      { path: 'internal-purchases', element: <InternalPurchasesPage /> },
      { path: 'collection-analysis', element: <CollectionAnalysisPage /> },
      { path: 'labor-cost', element: <LaborCostPage /> },
      { path: 'expense-budget-mgmt', element: <ExpenseBudgetManagementPage /> },
      { path: 'expense-mgmt', element: <ExpenseManagementPage /> },
      // 서비스업무
      { path: 'consult-receipt', element: <ConsultationReceiptPage /> },
      { path: 'consult-mgmt', element: <ConsultationManagementPage /> },
      { path: 'consult-stats', element: <ConsultationStatsPage /> },
      { path: 'ip-mgmt', element: <IpManagementPage /> },
      // 업무지원
      { path: 'company-life', element: <CompanyLifePage /> },
      { path: 'dev-board', element: <DevBoardPage /> },
      { path: 'company-docs', element: <CompanyDocsPage /> },
      { path: 'design-doc-mgmt', element: <DesignDocManagementPage /> },
      { path: 'design-doc-view', element: <DesignDocViewPage /> },
      { path: 'doc-send-log', element: <DocSendLogPage /> },
      { path: 'doc-receive-log', element: <DocReceiveLogPage /> },
      // 자금업무
      { path: 'invoice-issuance', element: <InvoiceIssuancePage /> },
      { path: 'expense-payment', element: <ExpensePaymentPage /> },
      { path: 'card-usage', element: <CardUsagePage /> },
      { path: 'bank-transaction', element: <BankTransactionPage /> },
      { path: 'pending-expense', element: <PendingExpensePage /> },
      { path: 'pending-collection', element: <PendingCollectionPage /> },
      // 알림게시판
      { path: 'schedule-sharing', element: <ScheduleSharingPage /> },
      { path: 'reservation', element: <ReservationPage /> },
      // LNB 고정
      { path: 'my-work', element: <MyWorkPage /> },
      { path: 'work-contact', element: <WorkContactPage /> },
      { path: 'e-approval', element: <EApprovalPage /> },
      { path: 'message', element: <HmMessagePage /> },
    ],
  },
  // ── AdminLayout: ADMIN_LEVEL 전용 ──
  {
    path: 'admin',
    element: <AdminGuard><AdminLayout /></AdminGuard>,
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'services/:serviceId', element: <AdminServiceDetailPage /> },
      { path: 'api-keys', element: <MenuGuard menuCode="SETTINGS_API_KEYS"><ApiKeyManagementPage /></MenuGuard> },
      { path: 'payment-gateway', element: <MenuGuard menuCode="SETTINGS_PAYMENT_GATEWAY"><PaymentGatewaySettingsPage /></MenuGuard> },
      { path: 'payment-transactions', element: <MenuGuard menuCode="SETTINGS_PAYMENT_TRANSACTION"><PaymentTransactionPage /></MenuGuard> },
      { path: 'members', element: <MenuGuard menuCode="SETTINGS_MEMBERS"><MemberManagementPage /></MenuGuard> },
      { path: 'members/:id', element: <MenuGuard menuCode="SETTINGS_MEMBERS"><MemberDetailPage /></MenuGuard> },
      { path: 'smtp', element: <MenuGuard menuCode="SETTINGS_SMTP"><SmtpSettingsPage /></MenuGuard> },
      { path: 'email-templates', element: <MenuGuard menuCode="SETTINGS_EMAIL_TEMPLATES"><EmailTemplatesPage /></MenuGuard> },
      { path: 'permissions', element: <MenuGuard menuCode="SETTINGS_PERMISSIONS"><MenuPermissionsPage /></MenuGuard> },
      { path: 'drive', element: <MenuGuard menuCode="SETTINGS_DRIVE"><DriveSettingsPage /></MenuGuard> },
      { path: 'entities', element: <MenuGuard menuCode="SETTINGS_ENTITIES"><EntityManagementPage /></MenuGuard> },
      { path: 'conversations', element: <MenuGuard menuCode="SETTINGS_CONVERSATIONS"><ConversationManagementPage /></MenuGuard> },
      { path: 'agents', element: <MenuGuard menuCode="SETTINGS_AGENTS"><AgentSettingsPage /></MenuGuard> },
      { path: 'units', element: <MenuGuard menuCode="UNITS"><UnitManagementPage /></MenuGuard> },
      { path: 'ai-usage', element: <MenuGuard menuCode="SETTINGS_AI_USAGE"><AiUsageManagementPage /></MenuGuard> },
      { path: 'site-settings', element: <MenuGuard menuCode="SETTINGS_SITE"><SiteSettingsPage /></MenuGuard> },
      { path: 'custom-apps', element: <AdminCustomAppsPage /> },
      { path: 'glossary', element: <GlossaryPage /> },
      { path: 'portal-bridge', element: <PortalCustomerPage /> },
      { path: 'total-users', element: <TotalUserManagementPage /> },
      { path: 'user-management', element: <UserManagementPage /> },
      { path: 'user-management/:entityId', element: <UserManagementDetailPage /> },
      { path: 'redmine-migration', element: <RedmineMigrationPage /> },
      { path: 'redmine-imported', element: <RedmineImportedIssuesPage /> },
      { path: 'partners', element: <PartnerManagementPage /> },
      { path: 'partner-apps', element: <AdminPartnerAppsPage /> },
      { path: 'app-store-oauth', element: <AdminAppStoreOAuthPage /> },
      { path: 'admin-users', element: <AdminUsersPage /> },
      { path: 'partner-users', element: <PartnerUsersPage /> },
      { path: 'partner-invitations', element: <PartnerInvitationsPage /> },
      { path: 'site-analytics', element: <AdminSiteAnalyticsPage /> },
      { path: 'site-errors', element: <SiteErrorPage /> },
      {
        path: 'service',
        element: <MenuGuard menuCode="SERVICE_MANAGEMENT"><ServiceLayout /></MenuGuard>,
        children: [
          { index: true, element: <Navigate to="/admin/service/dashboard" replace /> },
          { path: 'dashboard', element: <ServiceDashboardPage /> },
          { path: 'services', element: <ServiceListPage /> },
          { path: 'services/:id', element: <ServiceDetailPage /> },
          { path: 'clients', element: <ClientListPage /> },
          { path: 'clients/:id', element: <ClientDetailPage /> },
          { path: 'subscriptions', element: <SubscriptionListPage /> },
          { path: 'subscriptions/:id', element: <SubscriptionDetailPage /> },
          { path: 'priceplan', element: <PricePlanPage /> },
        ],
      },
      {
        path: 'site',
        element: <MenuGuard menuCode="SITE_MANAGEMENT"><SiteLayout /></MenuGuard>,
        children: [
          { index: true, element: <Navigate to="/admin/site/menus" replace /> },
          { path: 'menus', element: <SiteMenuPage /> },
          { path: 'pages', element: <SitePageListPage /> },
          { path: 'pages/:pageId', element: <SitePageEditorPage /> },
          { path: 'posts', element: <div className="p-6 text-gray-400">Posts (Coming Soon)</div> },
          { path: 'subscribers', element: <div className="p-6 text-gray-400">Subscribers (Coming Soon)</div> },
          { path: 'analytics', element: <SiteAnalyticsPage /> },
          { path: 'ga-settings', element: <SiteGaSettingsPage /> },
        ],
      },
    ],
  },
  ],  // end of AuthGuard children
  }],  // end of IndexGate children
  },
  {
    path: '/site/preview/:token',
    element: <SitePreviewPage />,
  },
  {
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      {
        path: '/user/login',
        element: <LoginPage />,
      },
      {
        path: '/login',
        element: <Navigate to="/user/login" replace />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
  // ── Entity Login (/:entCode/login — 조직 코드 기반 통합 로그인) ──
  {
    path: '/:entCode/login',
    element: <EntityLoginPage />,
  },
  // ── Admin Login (독립 — AuthGuard/AdminGuard 밖) ──
  {
    path: '/admin/login',
    element: (
      <PublicRoute>
        <AdminLoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/admin/forgot-password',
    element: <AdminForgotPasswordPage />,
  },
  // ── Client Portal ──
  {
    path: '/client/login',
    element: <ClientLoginPage />,
  },
  {
    path: '/client/forgot-password',
    element: <ClientForgotPasswordPage />,
  },
  {
    path: '/client/register',
    element: <ClientRegisterPage />,
  },
  {
    element: <ClientAuthGuard />,
    children: [
      {
        path: '/client',
        element: <ClientLayout />,
        children: [
          { index: true, element: <ClientDashboardPage /> },
          { path: 'projects', element: <ClientProjectListPage /> },
          { path: 'projects/:id', element: <ClientProjectDetailPage /> },
          { path: 'issues', element: <ClientIssueListPage /> },
          { path: 'issues/new', element: <ClientIssueCreatePage /> },
          { path: 'issues/:id', element: <ClientIssueDetailPage /> },
          { path: 'profile', element: <ClientProfilePage /> },
          { path: 'chat', element: <ClientChatPage /> },
          { path: 'chat/:channelId', element: <ClientChatPage /> },
        ],
      },
    ],
  },
  // ── Partner Portal ──
  {
    path: '/partner/login',
    element: <PartnerLoginPage />,
  },
  {
    path: '/partner/forgot-password',
    element: <PartnerForgotPasswordPage />,
  },
  {
    path: '/partner/register',
    element: <PartnerRegisterPage />,
  },
  {
    element: <PartnerAuthGuard />,
    children: [
      {
        path: '/partner',
        element: <PartnerLayout />,
        children: [
          { index: true, element: <PartnerDashboardPage /> },
          { path: 'apps', element: <PartnerAppListPage /> },
          { path: 'my-page', element: <PartnerMyPage /> },
        ],
      },
    ],
  },
]);
