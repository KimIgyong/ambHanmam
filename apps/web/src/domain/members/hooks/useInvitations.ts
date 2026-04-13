import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { membersService } from '../service/members.service';

const invitationKeys = {
  all: ['invitations'] as const,
  list: () => [...invitationKeys.all, 'list'] as const,
};

export const useInvitationList = () => {
  return useQuery({
    queryKey: invitationKeys.list(),
    queryFn: () => membersService.getInvitations(),
  });
};

export const useCreateInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      email: string;
      role: string;
      unit: string;
      cell_id?: string;
    }) => membersService.createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.list() });
    },
  });
};

export const useCancelInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.cancelInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.list() });
    },
  });
};

export const useResendInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.list() });
    },
  });
};

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membersService.deleteInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.list() });
    },
  });
};
