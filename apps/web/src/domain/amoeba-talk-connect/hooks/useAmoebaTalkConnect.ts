import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../../lib/api-client';

interface ConnectionStatus {
  linked: boolean;
  linkedAt?: string;
  companyName?: string;
}

const ATK_ORIGIN = import.meta.env.VITE_ATK_ORIGIN || 'http://localhost:3002';

// Module-level cache to prevent flickering across re-renders/re-mounts
let cachedStatus: ConnectionStatus = { linked: false };
let statusChecked = false;

/**
 * Hook for AmoebaTalk account connection flow
 * Uses module-level cache to prevent banner flickering
 */
export function useAmoebaTalkConnect() {
  const [status, setStatus] = useState<ConnectionStatus>(cachedStatus);
  const [loading, setLoading] = useState(false);
  const checkedRef = useRef(false);

  const isLinked = status.linked;

  // Check status once (not on every mount)
  useEffect(() => {
    if (statusChecked || checkedRef.current) return;
    checkedRef.current = true;
    statusChecked = true;

    apiClient.get('/integration/amoeba-talk/status')
      .then((res) => {
        const data = res.data?.data || res.data || { linked: false };
        cachedStatus = data;
        setStatus(data);
      })
      .catch(() => {
        // Not linked or API error — keep default
      });
  }, []);

  // Listen for postMessage from AmoebaTalk
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== ATK_ORIGIN) return;
      if (event.data?.type === 'AMB_CONNECT_SUCCESS') {
        const linked: ConnectionStatus = {
          linked: true,
          companyName: event.data.companyName,
          linkedAt: new Date().toISOString(),
        };
        cachedStatus = linked;
        statusChecked = true;
        setStatus(linked);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleConnect = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/integration/amoeba-talk/connect-token');
      const connectUrl = res.data?.data?.connectUrl || res.data?.connectUrl;
      if (connectUrl) {
        window.open(connectUrl, '_blank');
      }
    } catch (e: any) {
      console.error('Failed to generate connect token:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    status,
    isLinked,
    loading,
    handleConnect,
  };
}
