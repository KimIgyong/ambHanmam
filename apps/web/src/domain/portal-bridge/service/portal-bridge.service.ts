import { apiClient } from '@/lib/api-client';

// --- Request types ---

export interface PortalCustomerQuery {
  search?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  mapping_filter?: 'mapped' | 'unmapped' | 'all';
  country?: string;
  sort_by?: 'name' | 'email' | 'company' | 'country' | 'created_at';
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export interface CreateInternalAccountRequest {
  entity_id: string;
  role: 'MASTER' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  department?: string;
  create_company_email?: boolean;
}

// --- Response types ---

export interface PortalCustomerItem {
  pctId: string;
  pctEmail: string;
  pctName: string;
  pctPhone: string | null;
  pctCompanyName: string | null;
  pctCountry: string | null;
  pctEmailVerified: boolean;
  pctStatus: string;
  pctCreatedAt: string;
  isMapped: boolean;
  mappedUserId: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CustomerMapping {
  pumId: string;
  usrId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  mappedAt: string;
}

export interface PortalCustomerDetail extends PortalCustomerItem {
  mapping: CustomerMapping | null;
}

export interface MappingItem {
  pumId: string;
  pumStatus: string;
  pumCreatedAt: string;
  portalCustomer: {
    pctId: string;
    pctEmail: string;
    pctName: string;
    pctCompanyName: string;
  };
  user: {
    usrId: string;
    usrEmail: string;
    usrName: string;
    usrRole: string;
    usrStatus: string;
  };
}

export interface CreateAccountResult {
  userId: string;
  email: string;
  name: string;
  role: string;
  entityId: string;
  entityName: string;
  mappingId: string;
}

// --- Deletion Preview types ---

export interface DeletionPreview {
  customer: {
    pctId: string;
    pctEmail: string;
    pctName: string;
    pctCompanyName: string | null;
    pctStatus: string;
    isSoftDeleted: boolean;
  };
  counts: {
    mappings: number;
    payments: number;
    client: { cliId: string; cliCompanyName: string } | null;
    subscriptions: number;
    usageRecords: number;
  };
  warnings: {
    hasActiveSubscription: boolean;
    hasCompletedPayments: boolean;
  };
}

export interface PermanentDeleteResult {
  pctId: string;
  level: number;
  deleted: {
    mappings: number;
    payments: number;
    usageRecords: number;
    subscriptions: number;
    client: boolean;
  };
}

// --- Service ---

class PortalBridgeService {
  private readonly basePath = '/portal-bridge';

  getCustomers(params: PortalCustomerQuery = {}) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<PortalCustomerItem> }>(
        `${this.basePath}/customers`,
        { params },
      )
      .then((r) => r.data.data);
  }

  getCustomerDetail(pctId: string) {
    return apiClient
      .get<{ success: boolean; data: PortalCustomerDetail }>(
        `${this.basePath}/customers/${pctId}`,
      )
      .then((r) => r.data.data);
  }

  createInternalAccount(pctId: string, data: CreateInternalAccountRequest) {
    return apiClient
      .post<{ success: boolean; data: CreateAccountResult }>(
        `${this.basePath}/customers/${pctId}/create-account`,
        data,
      )
      .then((r) => r.data.data);
  }

  getMappings(page = 1, limit = 20) {
    return apiClient
      .get<{ success: boolean; data: PaginatedResponse<MappingItem> }>(
        `${this.basePath}/mappings`,
        { params: { page, limit } },
      )
      .then((r) => r.data.data);
  }

  revokeMapping(pumId: string) {
    return apiClient
      .patch<{ success: boolean; data: { pumId: string; status: string } }>(
        `${this.basePath}/mappings/${pumId}/revoke`,
      )
      .then((r) => r.data.data);
  }

  getCountries() {
    return apiClient
      .get<{ success: boolean; data: string[] }>(
        `${this.basePath}/customers/countries`,
      )
      .then((r) => r.data.data);
  }

  deleteCustomer(pctId: string) {
    return apiClient
      .delete<{ success: boolean; data: { pctId: string; revokedMappings: number } }>(
        `${this.basePath}/customers/${pctId}`,
      )
      .then((r) => r.data.data);
  }

  getDeletionPreview(pctId: string) {
    return apiClient
      .get<{ success: boolean; data: DeletionPreview }>(
        `${this.basePath}/customers/${pctId}/deletion-preview`,
      )
      .then((r) => r.data.data);
  }

  deleteCustomerPermanent(pctId: string, data: { level: number; confirm_email: string }) {
    return apiClient
      .delete<{ success: boolean; data: PermanentDeleteResult }>(
        `${this.basePath}/customers/${pctId}/permanent`,
        { data },
      )
      .then((r) => r.data.data);
  }
}

export const portalBridgeService = new PortalBridgeService();
