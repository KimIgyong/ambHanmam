import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { apiClient } from '@/lib/api-client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * PWA Push 알림 구독 훅
 * - 로그인 상태에서 1회 실행
 * - Notification 권한 요청 → Push 구독 → 백엔드 등록
 */
export function usePushSubscription() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const subscribed = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || subscribed.current) return;
    if (!VAPID_PUBLIC_KEY) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    const subscribe = async () => {
      try {
        // Wait for service worker to be ready
        const registration = await navigator.serviceWorker.ready;

        // Check existing subscription
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
          // Request permission
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;

          // Subscribe
          const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
          });
        }

        // Send to backend
        const json = subscription.toJSON();
        await apiClient.post('/push/subscribe', {
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        });

        subscribed.current = true;
      } catch (err) {
        // Silently fail — push is optional
        console.warn('[Push] Subscription failed:', err);
      }
    };

    // Delay to not block initial load
    const timer = setTimeout(subscribe, 3000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);
}
