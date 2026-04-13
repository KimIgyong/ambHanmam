import { onCLS, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Send Web Vitals to GA4 as custom events.
 * Called once on app mount.
 */
function sendToGA4(metric: Metric) {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.delta * 1000 : metric.delta),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}

export function reportWebVitals(): void {
  onCLS(sendToGA4);
  onFCP(sendToGA4);
  onLCP(sendToGA4);
  onTTFB(sendToGA4);
}
