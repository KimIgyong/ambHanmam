import { apiClient } from '@/lib/api-client';
import { BilContractResponse } from '@amb/types';

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

class ContractApiService {
  private readonly basePath = '/billing/contracts';

  getContracts = (params?: { direction?: string; category?: string; type?: string; status?: string; partner_id?: string; search?: string }) =>
    apiClient
      .get<ListResponse<BilContractResponse>>(this.basePath, { params })
      .then((r) => r.data.data);

  getContractById = (id: string) =>
    apiClient
      .get<SingleResponse<BilContractResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createContract = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<BilContractResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateContract = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<BilContractResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteContract = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  renewContract = (id: string) =>
    apiClient
      .post<SingleResponse<BilContractResponse>>(`${this.basePath}/${id}/renew`)
      .then((r) => r.data.data);

  getContractHistory = (id: string) =>
    apiClient
      .get<ListResponse<ContractHistoryItem>>(`${this.basePath}/${id}/history`)
      .then((r) => r.data.data);

  getExpiringContracts = (days?: number) =>
    apiClient
      .get<ListResponse<ExpiringContract>>(`${this.basePath}/expiring`, { params: days ? { days } : undefined })
      .then((r) => r.data.data);
}

export interface ContractHistoryItem {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string | null;
  changedAt: string;
}

export interface ExpiringContract {
  contractId: string;
  title: string;
  partnerName: string;
  partnerCode: string;
  direction: string;
  endDate: string;
  amount: number;
  currency: string;
  autoRenew: boolean;
  daysRemaining: number;
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export const contractApiService = new ContractApiService();
