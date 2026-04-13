import { apiClient } from '@/lib/api-client';
import { HrEntityResponse, HrEntityUserRoleResponse } from '@amb/types';

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

class EntityApiService {
  private readonly basePath = '/hr/entities';

  getEntities = () =>
    apiClient
      .get<ListResponse<HrEntityResponse>>(this.basePath)
      .then((r) => r.data.data);

  getEntityById = (id: string) =>
    apiClient
      .get<SingleResponse<HrEntityResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createEntity = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<HrEntityResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateEntity = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<HrEntityResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  assignUserRole = (entityId: string, data: { user_id: string; role: string }) =>
    apiClient
      .post<SingleResponse<HrEntityUserRoleResponse>>(`${this.basePath}/${entityId}/users`, data)
      .then((r) => r.data.data);

  getEntityRoles = (entityId: string) =>
    apiClient
      .get<ListResponse<HrEntityUserRoleResponse>>(`${this.basePath}/${entityId}/users`)
      .then((r) => r.data.data);
}

export const entityApiService = new EntityApiService();
