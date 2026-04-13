import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';
import App from './App';
import './i18n';
import './styles/globals.css';
import { reportRuntimeError } from '@/global/util/error-reporter';

// PWA: register service worker — auto-reload on new version
const updateSW = registerSW({
  onNeedRefresh() {
    // 새 버전 배포 시 자동으로 서비스워커를 업데이트하여 캐시 문제 방지
    updateSW(true);
  },
  onOfflineReady() {
    toast('앱이 오프라인에서도 사용 가능합니다.');
  },
});

// Sanitize malformed URLs (e.g. multiple slashes, backslashes) before router init
const { pathname, search, hash } = window.location;
const cleaned = pathname.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
if (cleaned !== pathname) {
  window.history.replaceState(null, '', cleaned + search + hash);
}

// Mobile WebView mode: add class to hide header/sidebar
const params = new URLSearchParams(window.location.search);
if (params.get('mobile_token')) {
  document.documentElement.classList.add('mobile-webview');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// 전역 에러 핸들러: JS 런타임 에러 수집
window.onerror = (message, source, lineno, colno, error) => {
  reportRuntimeError({
    message: String(message),
    source: source || undefined,
    lineno: lineno || undefined,
    colno: colno || undefined,
    stack: error?.stack,
  });
};

// 미처리 Promise rejection 수집
window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const error = event.reason;
  reportRuntimeError({
    message: error?.message || String(error),
    stack: error?.stack,
  });
};
