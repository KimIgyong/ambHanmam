import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingService } from '../service/accounting.service';

const transactionKeys = {
  all: ['transactions'] as const,
  list: (accountId: string, filters?: Record<string, unknown>) =>
    [...transactionKeys.all, 'list', accountId, filters] as const,
};

export const useTransactionList = (
  accountId: string,
  filters?: {
    date_from?: string;
    date_to?: string;
    vendor?: string;
    description?: string;
    flow_type?: 'DEPOSIT' | 'WITHDRAWAL';
    sort_order?: string;
    page?: number;
    size?: number;
  },
) => {
  return useQuery({
    queryKey: transactionKeys.list(accountId, filters),
    queryFn: () => accountingService.getTransactions(accountId, filters),
    enabled: !!accountId,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      data,
    }: {
      accountId: string;
      data: {
        transaction_date: string;
        project_name?: string;
        net_value: number;
        vat?: number;
        bank_charge?: number;
        vendor?: string;
        description?: string;
      };
    }) => accountingService.createTransaction(accountId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      accountId,
      txnId,
      data,
    }: {
      accountId: string;
      txnId: string;
      data: Record<string, unknown>;
    }) => accountingService.updateTransaction(accountId, txnId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, txnId }: { accountId: string; txnId: string }) =>
      accountingService.deleteTransaction(accountId, txnId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useImportTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, formData }: { accountId: string; formData: FormData }) =>
      accountingService.importTransactions(accountId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};
