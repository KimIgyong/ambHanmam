import { apiClient } from '@/lib/api-client';
import { HrSeveranceCalcResponse } from '@amb/types';

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class SeveranceApiService {
  private readonly basePath = '/hr/severance';

  calculateSeverance = (empId: string, endDate?: string) =>
    apiClient
      .get<SingleResponse<HrSeveranceCalcResponse>>(`${this.basePath}/calculate/${empId}`, {
        params: endDate ? { endDate } : {},
      })
      .then((r) => r.data.data);

  confirmSeverance = (empId: string) =>
    apiClient
      .post<SingleResponse<null>>(`${this.basePath}/confirm/${empId}`)
      .then((r) => r.data.data);
}

export const severanceApiService = new SeveranceApiService();
