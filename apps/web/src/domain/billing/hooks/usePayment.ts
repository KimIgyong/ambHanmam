import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApiService } from '../service/payment.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const paymentKeys = {
  all: ['bil-payments'] as const,
  list: (entityId: string | undefined, params?: Record<string, string>) =>
    [...paymentKeys.all, 'list', entityId, params] as const,
  byInvoice: (invoiceId: string) => [...paymentKeys.all, 'by-invoice', invoiceId] as const,
  outstanding: (entityId: string | undefined) => [...paymentKeys.all, 'outstanding', entityId] as const,
};

const automationKeys = {
  all: ['bil-automation'] as const,
  dueContracts: (entityId: string | undefined, yearMonth: string) =>
    [...automationKeys.all, 'due', entityId, yearMonth] as const,
  billingCalendar: (entityId: string | undefined, yearMonth: string) =>
    [...automationKeys.all, 'calendar', entityId, yearMonth] as const,
  overdueBillings: (entityId: string | undefined) =>
    [...automationKeys.all, 'overdue', entityId] as const,
};

export const usePaymentList = (params?: { invoice_id?: string; direction?: string; search?: string; year_month?: string }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: paymentKeys.list(entityId, params as Record<string, string>),
    queryFn: () => paymentApiService.getPayments(params),
    enabled: !!entityId,
  });
};

export const usePaymentsByInvoice = (invoiceId: string) => {
  return useQuery({
    queryKey: paymentKeys.byInvoice(invoiceId),
    queryFn: () => paymentApiService.getPaymentsByInvoice(invoiceId),
    enabled: !!invoiceId,
  });
};

export const useOutstandingSummary = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: paymentKeys.outstanding(entityId),
    queryFn: () => paymentApiService.getOutstandingSummary(),
    enabled: !!entityId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => paymentApiService.createPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => paymentApiService.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};

export const useDueContracts = (yearMonth: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: automationKeys.dueContracts(entityId, yearMonth),
    queryFn: () => paymentApiService.getDueContracts(yearMonth),
    enabled: !!entityId && !!yearMonth,
  });
};

export const useBillingCalendar = (yearMonth: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: automationKeys.billingCalendar(entityId, yearMonth),
    queryFn: () => paymentApiService.getBillingCalendar(yearMonth),
    enabled: !!entityId && !!yearMonth,
  });
};

export const useOverdueBillings = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: automationKeys.overdueBillings(entityId),
    queryFn: () => paymentApiService.getOverdueBillings(),
    enabled: !!entityId,
  });
};

export const useGenerateInvoices = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (yearMonth: string) => paymentApiService.generateMonthlyInvoices(yearMonth),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: automationKeys.all });
      queryClient.invalidateQueries({ queryKey: ['bil-invoices'] });
    },
  });
};
