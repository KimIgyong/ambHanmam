import { useState, useEffect } from 'react';

/**
 * PWA standalone 모드 감지 훅
 * - CSS display-mode: standalone (Android/Desktop PWA)
 * - navigator.standalone (iOS Safari PWA)
 */
export function usePwaMode(): boolean {
  const [isPwa, setIsPwa] = useState(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (navigator as any).standalone === true;
    return isStandalone || isIosStandalone;
  });

  useEffect(() => {
    const mq = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => setIsPwa(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isPwa;
}
