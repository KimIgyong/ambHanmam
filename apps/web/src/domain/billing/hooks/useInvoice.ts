import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApiService } from '../service/invoice.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const invoiceKeys = {
  all: ['bil-invoices'] as const,
  list: (entityId: string | undefined, params?: Record<string, string>) =>
    [...invoiceKeys.all, 'list', entityId, params] as const,
  detail: (id: string) => [...invoiceKeys.all, 'detail', id] as const,
};

export const useInvoiceList = (params?: { status?: string; direction?: string; search?: string; year_month?: string; partner_id?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: invoiceKeys.list(entityId, params as Record<string, string>),
    queryFn: () => invoiceApiService.getInvoices(params),
    enabled: !!entityId,
  });
};

export const useInvoiceDetail = (id: string) => {
  return useQuery({
    queryKey: invoiceKeys.detail(id),
    queryFn: () => invoiceApiService.getInvoiceById(id),
    enabled: !!id,
  });
};

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => invoiceApiService.createInvoice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      invoiceApiService.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useSendInvoiceEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { to: string[]; cc?: string[]; subject?: string; body?: string } }) =>
      invoiceApiService.sendEmail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useVoidAndReissue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.voidAndReissue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

// ── E-Invoice (Vietnam) ──

export const useIssueEinvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.issueEinvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useCancelEinvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      invoiceApiService.cancelEinvoice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

// ── NTS Tax Invoice (Korea) ──

export const useIssueNtsTaxInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.issueNtsTaxInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useIssueNtsModified = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { modify_code: string; original_invoice_id: string } }) =>
      invoiceApiService.issueNtsModified(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useRequestNtsReverse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.requestNtsReverse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};

export const useCancelNtsTaxInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoiceApiService.cancelNtsTaxInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
    },
  });
};
