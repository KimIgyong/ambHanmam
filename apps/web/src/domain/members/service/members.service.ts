import { apiClient } from '@/lib/api-client';
import {
  MemberResponse,
  MemberDetailResponse,
  MemberEntityRole,
  CellResponse,
  HrEmployeeResponse,
  InvitationResponse,
  InvitationValidationResponse,
  BaseSingleResponse,
} from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

class MembersService {
  // Members
  getMembers = () =>
    apiClient
      .get<ListResponse<MemberResponse>>('/members')
      .then((r) => r.data.data);

  getMember = (id: string) =>
    apiClient
      .get<BaseSingleResponse<MemberDetailResponse>>(`/members/${id}`)
      .then((r) => r.data.data);

  assignEntityRole = (memberId: string, data: { entity_id: string; role: string }) =>
    apiClient
      .post<BaseSingleResponse<MemberEntityRole>>(`/members/${memberId}/entity-roles`, data)
      .then((r) => r.data.data);

  removeEntityRole = (memberId: string, eurId: string) =>
    apiClient.delete(`/members/${memberId}/entity-roles/${eurId}`);

  updateMemberRole = (id: string, role: string) =>
    apiClient
      .patch<BaseSingleResponse<MemberResponse>>(`/members/${id}/role`, { role })
      .then((r) => r.data.data);

  updateMemberLevelCode = (id: string, levelCode: string) =>
    apiClient
      .patch<BaseSingleResponse<{ success: boolean; message: string }>>(`/members/${id}/level-code`, { level_code: levelCode })
      .then((r) => r.data.data);

  // Cells
  getCells = (allEntities?: boolean) =>
    apiClient
      .get<ListResponse<CellResponse>>('/cells', {
        params: allEntities ? { all: 'true' } : {},
      })
      .then((r) => r.data.data);

  createCell = (data: { name: string; description?: string; entity_id?: string }) =>
    apiClient
      .post<BaseSingleResponse<CellResponse>>('/cells', data)
      .then((r) => r.data.data);

  updateCell = (id: string, data: { name?: string; description?: string; entity_id?: string }) =>
    apiClient
      .patch<BaseSingleResponse<CellResponse>>(`/cells/${id}`, data)
      .then((r) => r.data.data);

  deleteCell = (id: string) =>
    apiClient.delete(`/cells/${id}`);

  getCellMembers = (id: string) =>
    apiClient
      .get<ListResponse<MemberResponse>>(`/cells/${id}/members`)
      .then((r) => r.data.data);

  addCellMember = (cellId: string, userId: string) =>
    apiClient
      .post(`/cells/${cellId}/members`, { user_id: userId });

  removeCellMember = (cellId: string, userId: string) =>
    apiClient.delete(`/cells/${cellId}/members/${userId}`);

  // Employee link
  getAvailableEmployees = (memberId: string) =>
    apiClient
      .get<ListResponse<HrEmployeeResponse>>(`/members/${memberId}/available-employees`)
      .then((r) => r.data.data);

  linkEmployee = (empId: string, usrId: string) =>
    apiClient
      .patch<BaseSingleResponse<HrEmployeeResponse>>(`/hr/employees/${empId}/link-user`, { usr_id: usrId })
      .then((r) => r.data.data);

  unlinkEmployee = (empId: string) =>
    apiClient
      .patch<BaseSingleResponse<HrEmployeeResponse>>(`/hr/employees/${empId}/unlink-user`, {})
      .then((r) => r.data.data);

  updateCompanyEmail = (id: string, companyEmail: string | null) =>
    apiClient
      .patch<BaseSingleResponse<{ userId: string; companyEmail: string | null }>>(`/members/${id}/company-email`, { company_email: companyEmail })
      .then((r) => r.data.data);

  // Member name / jobTitle update
  updateMemberName = (id: string, name: string) =>
    apiClient
      .patch<BaseSingleResponse<MemberResponse>>(`/members/${id}/name`, { name })
      .then((r) => r.data.data);

  updateMemberJobTitle = (id: string, jobTitle: string) =>
    apiClient
      .patch<BaseSingleResponse<MemberDetailResponse>>(`/members/${id}/job-title`, { job_title: jobTitle })
      .then((r) => r.data.data);

  resetMemberPassword = (id: string, newPassword: string) =>
    apiClient
      .patch(`/members/${id}/reset-password`, { new_password: newPassword })
      .then((r) => r.data);

  unlockMember = (id: string) =>
    apiClient
      .patch(`/members/${id}/unlock`)
      .then((r) => r.data);

  deleteMember = (id: string) =>
    apiClient.delete(`/members/${id}`).then((r) => r.data);

  // Approval workflow
  getPendingMembers = () =>
    apiClient
      .get<ListResponse<MemberResponse>>('/members/pending/list')
      .then((r) => r.data.data);

  approveMember = (id: string) =>
    apiClient
      .put(`/members/${id}/approve`)
      .then((r) => r.data);

  rejectMember = (id: string) =>
    apiClient
      .put(`/members/${id}/reject`)
      .then((r) => r.data);

  // Invitations
  getInvitations = () =>
    apiClient
      .get<ListResponse<InvitationResponse>>('/invitations')
      .then((r) => r.data.data);

  createInvitation = (data: {
    email: string;
    role: string;
    unit: string;
    cell_id?: string;
  }) =>
    apiClient
      .post<BaseSingleResponse<InvitationResponse>>('/invitations', data)
      .then((r) => r.data.data);

  cancelInvitation = (id: string) =>
    apiClient.patch(`/invitations/${id}/cancel`);

  resendInvitation = (id: string) =>
    apiClient.post(`/invitations/${id}/resend`);

  deleteInvitation = (id: string) =>
    apiClient.delete(`/invitations/${id}`);

  validateInvitation = (token: string) =>
    apiClient
      .get<BaseSingleResponse<InvitationValidationResponse>>(
        `/invitations/validate/${token}`,
      )
      .then((r) => r.data.data);
}

export const membersService = new MembersService();
