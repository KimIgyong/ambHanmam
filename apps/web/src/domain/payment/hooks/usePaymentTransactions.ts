import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface PgTransaction {
  transactionId: string;
  entityId: string;
  userId: string;
  invoiceNo: string;
  merTrxId: string;
  trxId: string | null;
  amount: number;
  currency: string;
  payType: string;
  goodsName: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  resultCd: string | null;
  resultMsg: string | null;
  buyerEmail: string;
  buyerName: string;
  createdAt: string;
  updatedAt: string;
}

interface TransactionListResponse {
  items: PgTransaction[];
  total: number;
}

const txKeys = {
  all: ['payment-transactions'] as const,
  list: (params: Record<string, string | undefined>) =>
    ['payment-transactions', 'list', params] as const,
};

export const useAdminTransactions = (params: {
  status?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}) =>
  useQuery({
    queryKey: txKeys.list({
      status: params.status,
      entityId: params.entityId,
      limit: String(params.limit ?? 20),
      offset: String(params.offset ?? 0),
    }),
    queryFn: () => {
      const searchParams = new URLSearchParams();
      if (params.status) searchParams.set('status', params.status);
      if (params.entityId) searchParams.set('entityId', params.entityId);
      if (params.limit) searchParams.set('limit', String(params.limit));
      if (params.offset) searchParams.set('offset', String(params.offset));
      return apiClient
        .get<{ success: boolean; data: TransactionListResponse }>(
          `/payment-gateway/payments/admin/all?${searchParams.toString()}`,
        )
        .then((r) => r.data.data);
    },
  });

export const useRefundTransaction = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient
        .post<{ success: boolean; data: { success: boolean; message: string } }>(
          `/payment-gateway/payments/${id}/refund`,
          { reason },
        )
        .then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: txKeys.all });
    },
  });
};

export const useQueryTransactionStatus = () =>
  useMutation({
    mutationFn: (id: string) =>
      apiClient
        .get<{ success: boolean; data: PgTransaction }>(
          `/payment-gateway/payments/${id}/status`,
        )
        .then((r) => r.data.data),
  });
