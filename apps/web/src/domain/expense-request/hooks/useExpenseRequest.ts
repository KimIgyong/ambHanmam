import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  expenseRequestService,
  ExpenseRequestListQuery,
  CreateExpenseRequestBody,
  UpdateExpenseRequestBody,
  ApproveExpenseRequestBody,
  RejectExpenseRequestBody,
} from '../service/expenseRequest.service';
import { useEntityId } from '@/domain/hr/hooks/useEntity';

const KEYS = {
  all: ['expense-requests'] as const,
  list: (q?: ExpenseRequestListQuery) => ['expense-requests', 'list', q] as const,
  stats: () => ['expense-requests', 'stats'] as const,
  detail: (id: string | null) => ['expense-requests', 'detail', id] as const,
};

// ─── List & Stats ─────────────────────────────────────────────────────

export function useExpenseRequestList(query?: ExpenseRequestListQuery) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.list(query),
    queryFn: () => expenseRequestService.getList(query),
    enabled: !!entityId,
    select: (res) => res.data,
  });
}

export function useExpenseStats() {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.stats(),
    queryFn: () => expenseRequestService.getStats(),
    enabled: !!entityId,
    select: (res) => res.data,
  });
}

export function useExpenseRequestDetail(id: string | null) {
  const entityId = useEntityId();
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => expenseRequestService.getById(id!),
    enabled: !!id && !!entityId,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select: (res) => (res.data as any)?.data as import('../service/expenseRequest.service').ExpenseRequest,
  });
}

// ─── CRUD Mutations ───────────────────────────────────────────────────

export function useCreateExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: (data: CreateExpenseRequestBody) => expenseRequestService.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success(t('message.createSuccess'));
    },
  });
}

export function useUpdateExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseRequestBody }) =>
      expenseRequestService.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success(t('message.updateSuccess'));
    },
  });
}

export function useDeleteExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: (id: string) => expenseRequestService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      toast.success(t('message.deleteSuccess'));
    },
  });
}

// ─── Status Actions ───────────────────────────────────────────────────

export function useSubmitExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: (id: string) => expenseRequestService.submit(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success(t('message.submitSuccess'));
    },
  });
}

export function useApproveExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: ApproveExpenseRequestBody }) =>
      expenseRequestService.approve(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success(t('message.approveSuccess'));
    },
  });
}

export function useRejectExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectExpenseRequestBody }) =>
      expenseRequestService.reject(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success(t('message.rejectSuccess'));
    },
  });
}

export function useCancelExpenseRequest() {
  const qc = useQueryClient();
  const { t } = useTranslation('expenseRequest');
  return useMutation({
    mutationFn: (id: string) => expenseRequestService.cancel(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
      toast.success(t('message.cancelSuccess'));
    },
  });
}

// ─── Attachment Mutations ─────────────────────────────────────────────

export function useUploadExpenseAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      expenseRequestService.uploadAttachment(id, file),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useAddLinkAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, url }: { id: string; url: string }) =>
      expenseRequestService.addLinkAttachment(id, url),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeleteAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ expenseId, attachmentId }: { expenseId: string; attachmentId: string }) =>
      expenseRequestService.deleteAttachment(expenseId, attachmentId),
    onSuccess: (_, { expenseId }) => {
      qc.invalidateQueries({ queryKey: KEYS.detail(expenseId) });
    },
  });
}
