/**
 * Server-side event tracking for portal analytics.
 * Sends events to portal-api for storage in amb_site_event_logs.
 * All calls are fire-and-forget (failures do not affect UX).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function trackServerEvent(params: {
  event_type: string;
  page_path?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
}) {
  fetch(`${API_BASE}/analytics/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(() => {});
}
