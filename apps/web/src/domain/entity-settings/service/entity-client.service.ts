import { apiClient } from '@/lib/api-client';

interface ClientListItem {
  id: string;
  code: string;
  partnerCode: string;
  companyName: string;
  companyNameLocal: string | null;
  type: string;
  country: string | null;
  industry: string | null;
  status: string;
  userCount: number;
  invitationCount: number;
  createdAt: string;
}

interface ClientDetail extends ClientListItem {
  note: string | null;
  website: string | null;
  taxId: string | null;
  address: string | null;
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    lastLoginAt: string | null;
  }>;
  invitations: Array<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    status: string;
    invitedBy: string | null;
    expiresAt: string;
    createdAt: string;
  }>;
}

class EntityClientApiService {
  private readonly basePath = '/entity-settings/clients';

  getClients = (entityId?: string) =>
    apiClient.get<{ data: ClientListItem[] }>(this.basePath, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  getClientDetail = (cliId: string, entityId?: string) =>
    apiClient.get<{ data: ClientDetail }>(`${this.basePath}/${cliId}`, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  createClient = (data: { company_name: string; code: string; type?: string; country?: string; industry?: string; note?: string }, entityId?: string) =>
    apiClient.post(this.basePath, data, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  updateClient = (cliId: string, data: Record<string, unknown>, entityId?: string) =>
    apiClient.patch(`${this.basePath}/${cliId}`, data, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  deleteClient = (cliId: string, entityId?: string) =>
    apiClient.delete(`${this.basePath}/${cliId}`, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  inviteClient = (cliId: string, data: { email: string; name?: string; role?: string }, entityId?: string) =>
    apiClient.post(`${this.basePath}/${cliId}/invite`, data, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  resendInvitation = (cliId: string, civId: string, entityId?: string) =>
    apiClient.post(`${this.basePath}/${cliId}/invitations/${civId}/resend`, {}, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);

  cancelInvitation = (cliId: string, civId: string, entityId?: string) =>
    apiClient.delete(`${this.basePath}/${cliId}/invitations/${civId}`, {
      params: entityId ? { entity_id: entityId } : undefined,
    }).then((r) => r.data.data);
}

export const entityClientApiService = new EntityClientApiService();
export type { ClientListItem, ClientDetail };
