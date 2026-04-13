import { apiClient } from '@/lib/api-client';
import { AttendanceResponse, AttendanceAmendmentResponse, AttendancePolicyResponse, BaseSingleResponse } from '@amb/types';

interface AttendanceListResponse {
  success: boolean;
  data: AttendanceResponse[];
  timestamp: string;
}

interface CreateAttendanceData {
  schedules: Array<{
    date: string;
    type: string;
    start_time?: string;
  }>;
}

class AttendanceService {
  private readonly basePath = '/attendances';

  getAttendances = (params: { date_from: string; date_to: string }) =>
    apiClient
      .get<AttendanceListResponse>(this.basePath, { params })
      .then((r) => r.data.data);

  getTeamAttendances = (params: { date_from: string; date_to: string }) =>
    apiClient
      .get<AttendanceListResponse>(`${this.basePath}/team`, { params })
      .then((r) => r.data.data);

  createAttendances = (data: CreateAttendanceData) =>
    apiClient
      .post<{ success: boolean; data: AttendanceResponse[]; timestamp: string }>(
        this.basePath,
        data,
      )
      .then((r) => r.data.data);

  updateAttendance = (id: string, data: { type?: string; start_time?: string }) =>
    apiClient
      .patch<BaseSingleResponse<AttendanceResponse>>(
        `${this.basePath}/${id}`,
        data,
      )
      .then((r) => r.data.data);

  deleteAttendance = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  approveAttendance = (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient
      .patch<{ success: boolean; data: AttendanceResponse }>(
        `${this.basePath}/${id}/approve`,
        { status },
      )
      .then((r) => r.data.data);

  getAttendanceMembers = () =>
    apiClient
      .get<{ success: boolean; data: AttendanceMemberSetting[]; timestamp: string }>(
        `${this.basePath}/members`,
      )
      .then((r) => r.data.data);

  updateAttendanceMembers = (members: Array<{ user_id: string; hidden: boolean; order: number | null }>) =>
    apiClient
      .patch<{ success: boolean; data: AttendanceMemberSetting[]; timestamp: string }>(
        `${this.basePath}/members`,
        { members },
      )
      .then((r) => r.data.data);

  amendAttendance = (id: string, data: { type: string; start_time?: string; note: string }) =>
    apiClient
      .post<{ success: boolean; data: AttendanceAmendmentResponse; timestamp: string }>(
        `${this.basePath}/${id}/amend`,
        data,
      )
      .then((r) => r.data.data);

  getAmendments = (id: string) =>
    apiClient
      .get<{ success: boolean; data: AttendanceAmendmentResponse[]; timestamp: string }>(
        `${this.basePath}/${id}/amendments`,
      )
      .then((r) => r.data.data);

  getPolicy = () =>
    apiClient
      .get<{ success: boolean; data: AttendancePolicyResponse; timestamp: string }>(
        `${this.basePath}/policy`,
      )
      .then((r) => r.data.data);

  updatePolicy = (data: {
    remote_default_count?: number;
    remote_extra_count?: number;
    remote_block_on_exceed?: boolean;
    leave_auto_deduct?: boolean;
    half_leave_auto_deduct?: boolean;
  }) =>
    apiClient
      .patch<{ success: boolean; data: AttendancePolicyResponse; timestamp: string }>(
        `${this.basePath}/policy`,
        data,
      )
      .then((r) => r.data.data);
}

export interface AttendanceMemberSetting {
  userId: string;
  userName: string;
  levelCode?: string;
  hidden: boolean;
  order: number | null;
}

export const attendanceService = new AttendanceService();
