import { apiClient } from '@/lib/api-client';
import { UnitResponse, UserUnitRoleResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

class UnitService {
  private readonly basePath = '/units';

  getUnitTree = (entityId: string) =>
    apiClient
      .get<ListResponse<UnitResponse>>(`${this.basePath}/tree`, {
        headers: { 'X-Entity-Id': entityId },
      })
      .then((r) => r.data.data);

  getAllUnits = (entityId: string) =>
    apiClient
      .get<ListResponse<UnitResponse>>(this.basePath, {
        headers: { 'X-Entity-Id': entityId },
      })
      .then((r) => r.data.data);

  getUnit = (id: string) =>
    apiClient
      .get<SingleResponse<UnitResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createUnit = (data: {
    name: string;
    name_local?: string;
    parent_id?: string;
    level?: number;
    is_active?: boolean;
    sort_order?: number;
  }, entityId: string) =>
    apiClient
      .post<SingleResponse<UnitResponse>>(this.basePath, data, {
        headers: { 'X-Entity-Id': entityId },
      })
      .then((r) => r.data.data);

  updateUnit = (id: string, data: {
    name?: string;
    name_local?: string;
    parent_id?: string;
    level?: number;
    is_active?: boolean;
    sort_order?: number;
  }) =>
    apiClient
      .put<SingleResponse<UnitResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteUnit = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  getUnitMembers = (id: string) =>
    apiClient
      .get<ListResponse<UserUnitRoleResponse>>(`${this.basePath}/${id}/members`)
      .then((r) => r.data.data);

  assignUserRole = (data: {
    user_id: string;
    unit_id: string;
    role?: string;
    is_primary?: boolean;
    started_at?: string;
    ended_at?: string;
  }) =>
    apiClient
      .post<SingleResponse<UserUnitRoleResponse>>(`${this.basePath}/roles`, data)
      .then((r) => r.data.data);

  updateUserRole = (id: string, role: string) =>
    apiClient
      .put<SingleResponse<UserUnitRoleResponse>>(`${this.basePath}/roles/${id}`, { role })
      .then((r) => r.data.data);

  removeUserRole = (id: string) =>
    apiClient.delete(`${this.basePath}/roles/${id}`);

  getMyRoles = () =>
    apiClient
      .get<ListResponse<UserUnitRoleResponse>>(`${this.basePath}/my/roles`)
      .then((r) => r.data.data);
}

export const unitService = new UnitService();
