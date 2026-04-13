import { apiClient } from '@/lib/api-client';

export interface WorkReportSummary {
  id: string;
  type: 'daily' | 'weekly';
  periodStart: string;
  periodEnd: string;
  aiScore: { productivityScore?: number } | null;
  createdAt: string;
}

export interface WorkReportDetail extends WorkReportSummary {
  rawData: Record<string, any>;
  aiSummary: string | null;
  updatedAt: string;
}

class ReportService {
  private readonly basePath = '/reports/work';

  getReports = (type?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (userId) params.append('userId', userId);
    const qs = params.toString();
    return apiClient
      .get<{ success: boolean; data: WorkReportSummary[] }>(`${this.basePath}${qs ? `?${qs}` : ''}`)
      .then((r) => r.data.data);
  };

  getReportById = (id: string) =>
    apiClient
      .get<{ success: boolean; data: WorkReportDetail }>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  deleteReport = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  getDailyData = (date?: string, userId?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (userId) params.append('userId', userId);
    const qs = params.toString();
    return apiClient
      .get<{ success: boolean; data: any }>(`${this.basePath}/daily/data${qs ? `?${qs}` : ''}`)
      .then((r) => r.data.data);
  };
}

export const reportService = new ReportService();
