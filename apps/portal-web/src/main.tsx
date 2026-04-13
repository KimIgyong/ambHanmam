import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './i18n';
import './styles/globals.css';
import { reportRuntimeError } from '@/lib/error-reporter';
import { reportWebVitals } from '@/lib/web-vitals';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

reportWebVitals();

// 전역 JS 런타임 에러 수집
window.onerror = (message, source, lineno, colno, error) => {
  reportRuntimeError({
    message: String(message),
    source: source || undefined,
    lineno: lineno || undefined,
    colno: colno || undefined,
    stack: error?.stack,
  });
};

window.onunhandledrejection = (event: PromiseRejectionEvent) => {
  const error = event.reason;
  reportRuntimeError({
    message: error?.message || String(error),
    stack: error?.stack,
  });
};
