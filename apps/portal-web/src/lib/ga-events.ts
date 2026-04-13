/**
 * GA4 Custom Events for Registration Funnel
 */

import { trackServerEvent } from './server-events';

function extractDomain(email: string): string {
  return email.split('@')[1] || 'unknown';
}

// ── Landing ──────────────────────────────────
export function trackCtaRegisterClick(location: string) {
  window.gtag?.('event', 'cta_register_click', { location });
}

// ── Register Page ────────────────────────────
export function trackRegisterPageView(step: number | string) {
  window.gtag?.('event', 'register_page_view', { step: String(step) });
  trackServerEvent({ event_type: 'register_visit', page_path: '/register', metadata: { step } });
}

// ── Step 1 ───────────────────────────────────
export function trackEmailCodeSent(email: string) {
  window.gtag?.('event', 'email_code_sent', {
    email_domain: extractDomain(email),
  });
}

export function trackEmailVerified(email: string) {
  window.gtag?.('event', 'email_verified', {
    email_domain: extractDomain(email),
  });
}

export function trackStep1Completed() {
  window.gtag?.('event', 'step1_completed');
}

export function trackGoogleSignupStart() {
  window.gtag?.('event', 'google_signup_start');
}

// ── Step 2 ───────────────────────────────────
export function trackRegisterSubmit(params: {
  method: string;
  company: string;
  country: string;
}) {
  window.gtag?.('event', 'register_submit', params);
}

export function trackRegisterSubmitError(errorCode: string) {
  window.gtag?.('event', 'register_submit_error', { error_code: errorCode });
}

// ── Complete ─────────────────────────────────
export function trackRegisterComplete(method: 'email' | 'google') {
  window.gtag?.('event', 'register_complete', { method });
  trackServerEvent({ event_type: 'registration_complete', page_path: '/register', metadata: { method } });
}

export function trackSignupGoAmaClick() {
  window.gtag?.('event', 'signup_go_ama_click');
  trackServerEvent({ event_type: 'ama_navigation', page_path: '/signup-complete' });
}

// ── Google OAuth Flow ────────────────────────
export function trackGoogleCallbackSuccess() {
  window.gtag?.('event', 'google_callback_success');
}

export function trackGoogleCallbackError(error: string) {
  window.gtag?.('event', 'google_callback_error', { error });
}

export function trackGoogleOnboardingView() {
  window.gtag?.('event', 'google_onboarding_view');
}

export function trackGoogleOnboardingSubmit(params: {
  company: string;
  country: string;
}) {
  window.gtag?.('event', 'google_onboarding_submit', params);
}

export function trackGoogleOnboardingComplete() {
  window.gtag?.('event', 'google_onboarding_complete', { method: 'google' });
}

// ── Newsletter Subscribe ─────────────────────
export function trackNewsletterSubscribeAttempt() {
  window.gtag?.('event', 'newsletter_subscribe_attempt');
}

export function trackNewsletterSubscribeSuccess(email: string) {
  window.gtag?.('event', 'newsletter_subscribe_success', {
    email_domain: extractDomain(email),
  });
  trackServerEvent({ event_type: 'subscription', page_path: '/', metadata: { email_domain: extractDomain(email) } });
}

export function trackNewsletterSubscribeDuplicate() {
  window.gtag?.('event', 'newsletter_subscribe_duplicate');
}
