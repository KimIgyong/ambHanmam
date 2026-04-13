import { apiClient } from '@/lib/api-client';
import { SvcServiceResponse, SvcPlanResponse } from '@amb/types';

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

class ServiceCatalogApiService {
  private readonly basePath = '/service/services';

  getServices = (params?: { status?: string; category?: string }) =>
    apiClient.get<ListResponse<SvcServiceResponse>>(this.basePath, { params }).then((r) => r.data.data);

  getServiceById = (id: string) =>
    apiClient.get<SingleResponse<SvcServiceResponse>>(`${this.basePath}/${id}`).then((r) => r.data.data);

  createService = (data: Record<string, unknown>) =>
    apiClient.post<SingleResponse<SvcServiceResponse>>(this.basePath, data).then((r) => r.data.data);

  updateService = (id: string, data: Record<string, unknown>) =>
    apiClient.patch<SingleResponse<SvcServiceResponse>>(`${this.basePath}/${id}`, data).then((r) => r.data.data);

  deleteService = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  getPlans = (serviceId: string) =>
    apiClient.get<ListResponse<SvcPlanResponse>>(`${this.basePath}/${serviceId}/plans`).then((r) => r.data.data);

  createPlan = (serviceId: string, data: Record<string, unknown>) =>
    apiClient.post<SingleResponse<SvcPlanResponse>>(`${this.basePath}/${serviceId}/plans`, data).then((r) => r.data.data);

  updatePlan = (serviceId: string, planId: string, data: Record<string, unknown>) =>
    apiClient.patch<SingleResponse<SvcPlanResponse>>(`${this.basePath}/${serviceId}/plans/${planId}`, data).then((r) => r.data.data);

  deletePlan = (serviceId: string, planId: string) =>
    apiClient.delete(`${this.basePath}/${serviceId}/plans/${planId}`);
}

export const serviceCatalogApiService = new ServiceCatalogApiService();
