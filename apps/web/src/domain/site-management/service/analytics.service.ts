import { apiClient } from '@/lib/api-client';

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

// ── Types ──

export interface GaSettings {
  portalGaMeasurementId: string | null;
  appGaMeasurementId: string | null;
}

export interface PortalSummary {
  pageViews: number;
  logins: number;
  registerVisits: number;
  subscriptions: number;
  amaNavigations: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AppTrendPoint {
  date: string;
  loginCount: number;
  visitorCount: number;
}

export interface ReferrerItem {
  referrer: string;
  count: number;
}

export interface TrafficSourceSummaryItem {
  channel: 'direct' | 'search' | 'social' | 'referral';
  count: number;
}

export interface TrafficSourceDetail {
  name: string;
  count: number;
}

export interface TrafficSourcesData {
  summary: TrafficSourceSummaryItem[];
  total: number;
  searchDetails: TrafficSourceDetail[];
  socialDetails: TrafficSourceDetail[];
  referralDetails: TrafficSourceDetail[];
}

export interface PageViewItem {
  pagePath: string;
  count: number;
}

export interface AppSummary {
  totalLogins: number;
  activeEntities: number;
  totalVisitors: number;
}

export interface EntityLoginItem {
  entityId: string;
  entityCode: string;
  entityName: string;
  loginCount: number;
  userCount: number;
  totalUsers: number;
  activeRate: number;
}

export interface HourlyPatternItem {
  hour: number;
  count: number;
}

// ── GA Settings API ──

class AnalyticsSettingsService {
  getSettings = () =>
    apiClient.get<SingleResponse<GaSettings>>('/analytics/settings').then((r) => r.data.data);

  updateSettings = (data: { portal_ga_measurement_id?: string; app_ga_measurement_id?: string }) =>
    apiClient.put<SingleResponse<{ success: boolean }>>('/analytics/settings', data).then((r) => r.data.data);
}

// ── Portal Analytics API ──

class PortalAnalyticsService {
  private params = (start: string, end: string) => ({ params: { start_date: start, end_date: end } });

  getSummary = (start: string, end: string) =>
    apiClient.get<SingleResponse<PortalSummary>>('/analytics/portal/summary', this.params(start, end)).then((r) => r.data.data);

  getVisitorTrend = (start: string, end: string) =>
    apiClient.get<SingleResponse<TrendPoint[]>>('/analytics/portal/visitors', this.params(start, end)).then((r) => r.data.data);

  getReferrers = (start: string, end: string) =>
    apiClient.get<SingleResponse<ReferrerItem[]>>('/analytics/portal/referrers', this.params(start, end)).then((r) => r.data.data);

  getPages = (start: string, end: string) =>
    apiClient.get<SingleResponse<PageViewItem[]>>('/analytics/portal/pages', this.params(start, end)).then((r) => r.data.data);

  getTrafficSources = (start: string, end: string) =>
    apiClient.get<SingleResponse<TrafficSourcesData>>('/analytics/portal/traffic-sources', this.params(start, end)).then((r) => r.data.data);
}

// ── App Analytics API ──

class AppAnalyticsService {
  private params = (start: string, end: string) => ({ params: { start_date: start, end_date: end } });

  getSummary = (start: string, end: string) =>
    apiClient.get<SingleResponse<AppSummary>>('/analytics/app/summary', this.params(start, end)).then((r) => r.data.data);

  getVisitorTrend = (start: string, end: string) =>
    apiClient.get<SingleResponse<AppTrendPoint[]>>('/analytics/app/visitors', this.params(start, end)).then((r) => r.data.data);

  getEntityLogins = (start: string, end: string) =>
    apiClient.get<SingleResponse<EntityLoginItem[]>>('/analytics/app/entity-logins', this.params(start, end)).then((r) => r.data.data);

  getHourlyPattern = (start: string, end: string) =>
    apiClient.get<SingleResponse<HourlyPatternItem[]>>('/analytics/app/hourly-pattern', this.params(start, end)).then((r) => r.data.data);
}

// ── Event Tracking ──

class EventTrackingService {
  track = (data: {
    site: string;
    event_type: string;
    entity_id?: string;
    page_path?: string;
    referrer?: string;
    metadata?: Record<string, unknown>;
  }) => apiClient.post('/analytics/events', data).catch(() => {});
}

export const analyticsSettingsService = new AnalyticsSettingsService();
export const portalAnalyticsService = new PortalAnalyticsService();
export const appAnalyticsService = new AppAnalyticsService();
export const eventTrackingService = new EventTrackingService();
