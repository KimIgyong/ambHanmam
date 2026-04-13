/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

// Google Analytics gtag.js
interface Window {
  gtag: (...args: [string, ...unknown[]]) => void;
  dataLayer: unknown[];
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_PORT: string;
  readonly VITE_WEB_PORT: string;
  readonly VITE_ENABLE_MOCK: string;
  readonly VITE_APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
