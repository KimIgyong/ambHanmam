import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '../service/members.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import type { MemberResponse } from '@amb/types';

const memberKeys = {
  all: ['members'] as const,
  list: (entityId?: string) => [...memberKeys.all, 'list', entityId] as const,
  detail: (id: string) => [...memberKeys.all, 'detail', id] as const,
};

function sortMembersByLevel(members: MemberResponse[]): MemberResponse[] {
  const levelOrder: Record<string, number> = {
    ADMIN_LEVEL: 0,
    USER_LEVEL: 0,
    CLIENT_LEVEL: 1,
    PARTNER_LEVEL: 2,
  };
  return [...members].sort((a, b) => {
    const la = levelOrder[a.levelCode || 'USER_LEVEL'] ?? 9;
    const lb = levelOrder[b.levelCode || 'USER_LEVEL'] ?? 9;
    if (la !== lb) return la - lb;
    return (a.name || '').localeCompare(b.name || '');
  });
}

export const useMemberList = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: memberKeys.list(entityId),
    queryFn: () => membersService.getMembers(),
    enabled: !!entityId,
    select: sortMembersByLevel,
  });
};

export const useMemberDetail = (id: string) => {
  return useQuery({
    queryKey: memberKeys.detail(id),
    queryFn: () => membersService.getMember(id),
    enabled: !!id,
  });
};

export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      membersService.updateMemberRole(id, role),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.list() });
    },
  });
};

export const useUpdateMemberLevelCode = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, levelCode }: { id: string; levelCode: string }) =>
      membersService.updateMemberLevelCode(id, levelCode),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.list() });
    },
  });
};

export const useAssignEntityRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, data }: { memberId: string; data: { entity_id: string; role: string } }) =>
      membersService.assignEntityRole(memberId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.memberId) });
    },
  });
};

export const useRemoveEntityRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, eurId }: { memberId: string; eurId: string }) =>
      membersService.removeEntityRole(memberId, eurId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.memberId) });
    },
  });
};

export const useUpdateCompanyEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, companyEmail }: { id: string; companyEmail: string | null }) =>
      membersService.updateCompanyEmail(id, companyEmail),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.list() });
    },
  });
};

export const useAvailableEmployees = (memberId: string) => {
  return useQuery({
    queryKey: [...memberKeys.detail(memberId), 'available-employees'] as const,
    queryFn: () => membersService.getAvailableEmployees(memberId),
    enabled: !!memberId,
  });
};

export const useLinkEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empId, usrId }: { empId: string; usrId: string }) =>
      membersService.linkEmployee(empId, usrId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useUnlinkEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (empId: string) => membersService.unlinkEmployee(empId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useUpdateMemberName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      membersService.updateMemberName(id, name),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: memberKeys.list() });
    },
  });
};

export const useUpdateMemberJobTitle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, jobTitle }: { id: string; jobTitle: string }) =>
      membersService.updateMemberJobTitle(id, jobTitle),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
    },
  });
};

export const useResetMemberPassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newPassword }: { id: string; newPassword: string }) =>
      membersService.resetMemberPassword(id, newPassword),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: memberKeys.detail(variables.id) });
    },
  });
};

export const useUnlockMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.unlockMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useDeleteMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.deleteMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useApproveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.approveMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};

export const useRejectMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.rejectMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.all });
    },
  });
};
