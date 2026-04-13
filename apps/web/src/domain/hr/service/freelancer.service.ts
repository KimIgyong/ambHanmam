import { apiClient } from '@/lib/api-client';
import { HrFreelancerResponse } from '@amb/types';

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

class FreelancerApiService {
  private readonly basePath = '/hr/freelancers';

  getFreelancers = () =>
    apiClient
      .get<ListResponse<HrFreelancerResponse>>(this.basePath)
      .then((r) => r.data.data);

  getFreelancerById = (id: string) =>
    apiClient
      .get<SingleResponse<HrFreelancerResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createFreelancer = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrFreelancerResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateFreelancer = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrFreelancerResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteFreelancer = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const freelancerApiService = new FreelancerApiService();
