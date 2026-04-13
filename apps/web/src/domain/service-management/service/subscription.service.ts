import { apiClient } from '@/lib/api-client';
import { SvcSubscriptionResponse, SvcSubscriptionHistoryResponse } from '@amb/types';

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

class SubscriptionApiService {
  private readonly basePath = '/service/subscriptions';

  getSubscriptions = (params?: { service?: string; status?: string; client?: string; expiring?: string }) =>
    apiClient.get<ListResponse<SvcSubscriptionResponse>>(this.basePath, { params }).then((r) => r.data.data);

  getSubscriptionById = (id: string) =>
    apiClient.get<SingleResponse<SvcSubscriptionResponse>>(`${this.basePath}/${id}`).then((r) => r.data.data);

  createSubscription = (data: Record<string, unknown>) =>
    apiClient.post<SingleResponse<SvcSubscriptionResponse>>(this.basePath, data).then((r) => r.data.data);

  updateSubscription = (id: string, data: Record<string, unknown>) =>
    apiClient.patch<SingleResponse<SvcSubscriptionResponse>>(`${this.basePath}/${id}`, data).then((r) => r.data.data);

  cancelSubscription = (id: string, reason: string) =>
    apiClient.post<SingleResponse<SvcSubscriptionResponse>>(`${this.basePath}/${id}/cancel`, { reason }).then((r) => r.data.data);

  suspendSubscription = (id: string) =>
    apiClient.post<SingleResponse<SvcSubscriptionResponse>>(`${this.basePath}/${id}/suspend`).then((r) => r.data.data);

  resumeSubscription = (id: string) =>
    apiClient.post<SingleResponse<SvcSubscriptionResponse>>(`${this.basePath}/${id}/resume`).then((r) => r.data.data);

  renewSubscription = (id: string) =>
    apiClient.post<SingleResponse<SvcSubscriptionResponse>>(`${this.basePath}/${id}/renew`).then((r) => r.data.data);

  getHistory = (id: string) =>
    apiClient.get<ListResponse<SvcSubscriptionHistoryResponse>>(`${this.basePath}/${id}/history`).then((r) => r.data.data);

  getExpiring = (days?: number) =>
    apiClient.get<ListResponse<SvcSubscriptionResponse>>(`${this.basePath}/expiring`, { params: { days } }).then((r) => r.data.data);
}

export const subscriptionApiService = new SubscriptionApiService();
