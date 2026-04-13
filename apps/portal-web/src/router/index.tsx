import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '@/pages/public/PublicLayout';
import { LandingPage } from '@/pages/public/LandingPage';
import { PricingPage } from '@/pages/public/PricingPage';
import { ServiceDetailPage } from '@/pages/public/ServiceDetailPage';
import { CmsPage } from '@/pages/public/CmsPage';
import { GuidePage } from '@/pages/public/GuidePage';
import { NotFoundPage } from '@/pages/public/NotFoundPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { VerifyEmailSentPage } from '@/pages/auth/VerifyEmailSentPage';
import { GoogleCallbackPage } from '@/pages/auth/GoogleCallbackPage';
import { GoogleOnboardingPage } from '@/pages/auth/GoogleOnboardingPage';
import { PortalLayout } from '@/pages/portal/PortalLayout';
import { DashboardPage } from '@/pages/portal/DashboardPage';
import { SubscriptionsPage } from '@/pages/portal/SubscriptionsPage';
import { UsagePage } from '@/pages/portal/UsagePage';
import { BillingPage } from '@/pages/portal/BillingPage';
import { SettingsPage } from '@/pages/portal/SettingsPage';
import { PlansPage } from '@/pages/portal/PlansPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'services/:code', element: <ServiceDetailPage /> },
      { path: 'page/:slug', element: <CmsPage /> },
      { path: 'guide/:slug', element: <GuidePage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'verify-email', element: <VerifyEmailPage /> },
      { path: 'verify-email-sent', element: <VerifyEmailSentPage /> },
      { path: 'auth/google/callback', element: <GoogleCallbackPage /> },
      { path: 'auth/google/onboarding', element: <GoogleOnboardingPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    path: '/portal',
    element: <PortalLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'subscriptions', element: <SubscriptionsPage /> },
      { path: 'subscriptions/plans', element: <PlansPage /> },
      { path: 'usage', element: <UsagePage /> },
      { path: 'billing', element: <BillingPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
