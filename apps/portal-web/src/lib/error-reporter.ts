/**
 * Portal-web 사이트 에러 로깅 유틸리티
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SITE_ERROR_URL = `${API_BASE_URL}/site-errors`;
const APP_NAME = 'PORTAL_WEB';
const DEBOUNCE_MS = 10_000;

const recentErrors = new Map<string, number>();

const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9._-]+/gi,
  /password["']?\s*[:=]\s*["'][^"']*["']/gi,
  /token["']?\s*[:=]\s*["'][^"']*["']/gi,
  /api[_-]?key["']?\s*[:=]\s*["'][^"']*["']/gi,
];

function sanitize(text: string): string {
  let result = text;
  for (const p of SENSITIVE_PATTERNS) {
    result = result.replace(p, '[REDACTED]');
  }
  return result.substring(0, 5000);
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = recentErrors.get(key);
  if (last && now - last < DEBOUNCE_MS) return true;
  recentErrors.set(key, now);
  if (recentErrors.size > 100) {
    for (const [k, v] of recentErrors) {
      if (now - v > DEBOUNCE_MS) recentErrors.delete(k);
    }
  }
  return false;
}

interface ErrorReport {
  source: string;
  app: string;
  page_url?: string;
  api_endpoint?: string;
  http_method?: string;
  http_status?: number;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
}

function sendReport(report: ErrorReport): void {
  const key = `${report.error_message}|${report.api_endpoint || report.page_url || ''}`;
  if (isDuplicate(key)) return;

  try {
    fetch(SITE_ERROR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      credentials: 'include',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // silent fail
  }
}

export function reportApiError(params: {
  url?: string;
  method?: string;
  status?: number;
  errorCode?: string;
  message: string;
}): void {
  if (params.url?.includes('/site-errors')) return;
  sendReport({
    source: 'FRONTEND',
    app: APP_NAME,
    page_url: window.location.pathname,
    api_endpoint: params.url,
    http_method: params.method?.toUpperCase(),
    http_status: params.status,
    error_code: params.errorCode,
    error_message: sanitize(params.message),
  });
}

export function reportRuntimeError(params: {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
}): void {
  sendReport({
    source: 'FRONTEND',
    app: APP_NAME,
    page_url: window.location.pathname,
    error_message: sanitize(params.message),
    stack_trace: params.stack ? sanitize(params.stack) : params.source ? `${params.source}:${params.lineno}:${params.colno}` : undefined,
  });
}

export function reportComponentError(error: Error, componentStack?: string): void {
  sendReport({
    source: 'FRONTEND',
    app: APP_NAME,
    page_url: window.location.pathname,
    error_message: sanitize(error.message),
    stack_trace: componentStack ? sanitize(componentStack) : error.stack ? sanitize(error.stack) : undefined,
  });
}
