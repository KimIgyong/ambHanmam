/**
 * 사이트 에러 로깅 유틸리티
 * - 프론트엔드에서 발생하는 모든 에러를 서버에 비동기 전송
 * - 디바운싱, 민감정보 제거, fire-and-forget
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const SITE_ERROR_URL = `${API_BASE_URL}/site-errors`;
const APP_NAME = 'WEB';
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

function makeKey(message: string, url?: string): string {
  return `${message}|${url || ''}`;
}

function isDuplicate(key: string): boolean {
  const now = Date.now();
  const last = recentErrors.get(key);
  if (last && now - last < DEBOUNCE_MS) return true;
  recentErrors.set(key, now);
  // 오래된 항목 정리
  if (recentErrors.size > 100) {
    for (const [k, v] of recentErrors) {
      if (now - v > DEBOUNCE_MS) recentErrors.delete(k);
    }
  }
  return false;
}

interface ErrorReport {
  source?: 'FRONTEND' | 'BACKEND';
  app?: string;
  page_url?: string;
  api_endpoint?: string;
  http_method?: string;
  http_status?: number;
  error_code?: string;
  error_message: string;
  stack_trace?: string;
}

function sendReport(report: ErrorReport): void {
  const key = makeKey(report.error_message, report.api_endpoint || report.page_url);
  if (isDuplicate(key)) return;

  const body: ErrorReport = {
    source: report.source || 'FRONTEND',
    app: report.app || APP_NAME,
    page_url: report.page_url || window.location.pathname,
    api_endpoint: report.api_endpoint,
    http_method: report.http_method,
    http_status: report.http_status,
    error_code: report.error_code,
    error_message: sanitize(report.error_message),
    stack_trace: report.stack_trace ? sanitize(report.stack_trace) : undefined,
  };

  // fire-and-forget, 에러 보고 자체가 실패해도 무시
  try {
    fetch(SITE_ERROR_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
      keepalive: true,
    }).catch(() => {});
  } catch {
    // silent fail
  }
}

/** API 에러 보고 (axios interceptor에서 호출) */
export function reportApiError(params: {
  url?: string;
  method?: string;
  status?: number;
  errorCode?: string;
  message: string;
  stack?: string;
}): void {
  // 에러 보고 API 자체의 에러는 무한 루프 방지
  if (params.url?.includes('/site-errors')) return;

  sendReport({
    source: 'FRONTEND',
    api_endpoint: params.url,
    http_method: params.method?.toUpperCase(),
    http_status: params.status,
    error_code: params.errorCode,
    error_message: params.message,
    stack_trace: params.stack,
  });
}

/** JS 런타임 에러 보고 (window.onerror에서 호출) */
export function reportRuntimeError(params: {
  message: string;
  source?: string;
  lineno?: number;
  colno?: number;
  stack?: string;
}): void {
  sendReport({
    source: 'FRONTEND',
    error_message: params.message,
    stack_trace:
      params.stack ||
      (params.source ? `${params.source}:${params.lineno}:${params.colno}` : undefined),
  });
}

/** React ErrorBoundary에서 보고 */
export function reportComponentError(error: Error, componentStack?: string): void {
  sendReport({
    source: 'FRONTEND',
    error_message: error.message,
    stack_trace: componentStack || error.stack,
  });
}
