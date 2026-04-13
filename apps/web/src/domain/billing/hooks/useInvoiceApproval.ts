import { useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApiService } from '../service/invoice.service';

export const useSubmitForReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.submitForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};

export const useApproveReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.approveReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};

export const useApproveManager = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.approveManager(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};

export const useApproveAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.approveAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};

export const useRejectInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      invoiceApiService.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};
