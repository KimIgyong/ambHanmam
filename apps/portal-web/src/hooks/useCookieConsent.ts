import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'amb_cookie_consent';

export interface CookiePreferences {
  essential: boolean; // always true
  analytics: boolean;
  marketing: boolean;
}

interface CookieConsentState {
  consented: boolean;
  preferences: CookiePreferences;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
};

function loadConsent(): CookieConsentState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CookieConsentState;
  } catch {
    return null;
  }
}

function saveConsent(state: CookieConsentState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useCookieConsent() {
  const [state, setState] = useState<CookieConsentState>(() => {
    const saved = loadConsent();
    return saved || { consented: false, preferences: DEFAULT_PREFERENCES };
  });

  const [showBanner, setShowBanner] = useState(!state.consented);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setShowBanner(!state.consented);
  }, [state.consented]);

  const acceptAll = useCallback(() => {
    const newState: CookieConsentState = {
      consented: true,
      preferences: { essential: true, analytics: true, marketing: true },
    };
    saveConsent(newState);
    setState(newState);
    setShowBanner(false);
    setShowSettings(false);
  }, []);

  const rejectAll = useCallback(() => {
    const newState: CookieConsentState = {
      consented: true,
      preferences: { essential: true, analytics: false, marketing: false },
    };
    saveConsent(newState);
    setState(newState);
    setShowBanner(false);
    setShowSettings(false);
  }, []);

  const savePreferences = useCallback((prefs: CookiePreferences) => {
    const newState: CookieConsentState = {
      consented: true,
      preferences: { ...prefs, essential: true },
    };
    saveConsent(newState);
    setState(newState);
    setShowBanner(false);
    setShowSettings(false);
  }, []);

  const openSettings = useCallback(() => {
    setShowSettings(true);
  }, []);

  const closeSettings = useCallback(() => {
    setShowSettings(false);
  }, []);

  return {
    preferences: state.preferences,
    consented: state.consented,
    showBanner,
    showSettings,
    acceptAll,
    rejectAll,
    savePreferences,
    openSettings,
    closeSettings,
  };
}
