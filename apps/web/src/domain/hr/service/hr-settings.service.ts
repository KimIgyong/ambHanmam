import { apiClient } from '@/lib/api-client';
import { HrSystemParamResponse, HrHolidayResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class HrSettingsApiService {
  private readonly basePath = '/hr/settings';

  // System Parameters
  getAllParams = () =>
    apiClient
      .get<ListResponse<HrSystemParamResponse>>(`${this.basePath}/params`)
      .then((r) => r.data.data);

  getCurrentParams = () =>
    apiClient
      .get<ListResponse<HrSystemParamResponse>>(`${this.basePath}/params/current`)
      .then((r) => r.data.data);

  upsertParam = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrSystemParamResponse>>(`${this.basePath}/params`, data)
      .then((r) => r.data.data);

  // Holidays
  getHolidays = (year: number) =>
    apiClient
      .get<ListResponse<HrHolidayResponse>>(`${this.basePath}/holidays`, { params: { year } })
      .then((r) => r.data.data);

  createHoliday = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrHolidayResponse>>(`${this.basePath}/holidays`, data)
      .then((r) => r.data.data);

  deleteHoliday = (id: string) =>
    apiClient.delete(`${this.basePath}/holidays/${id}`);
}

export const hrSettingsApiService = new HrSettingsApiService();
