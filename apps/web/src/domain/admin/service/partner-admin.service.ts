import { apiClient } from '@/lib/api-client';

export interface PartnerOrg {
  id: string;
  code: string;
  companyName: string;
  companyNameLocal: string | null;
  country: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  taxId: string | null;
  status: string;
  note: string | null;
  createdAt: string;
}

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

class PartnerAdminService {
  private readonly basePath = '/admin/partners';

  getPartners = (search?: string) =>
    apiClient
      .get<ListResponse<PartnerOrg>>(this.basePath, {
        params: search ? { search } : undefined,
      })
      .then((r) => r.data.data);

  getPartner = (id: string) =>
    apiClient
      .get<SingleResponse<PartnerOrg>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createPartner = (data: {
    code: string;
    company_name: string;
    company_name_local?: string;
    country?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    address?: string;
    tax_id?: string;
    note?: string;
  }) =>
    apiClient
      .post<SingleResponse<PartnerOrg>>(this.basePath, data)
      .then((r) => r.data.data);

  updatePartner = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<PartnerOrg>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deletePartner = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);
}

export const partnerAdminService = new PartnerAdminService();
