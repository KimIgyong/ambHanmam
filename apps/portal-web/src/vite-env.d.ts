/// <reference types="vite/client" />

// Google Analytics gtag.js
interface Window {
  gtag: (...args: [string, ...unknown[]]) => void;
  dataLayer: unknown[];
}
