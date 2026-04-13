import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface QuotaProduct {
  productId: string;
  name: string;
  description: string | null;
  tokenAmount: number;
  price: number;
  currency: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface PurchaseResult {
  transactionId: string;
  invoiceNo: string;
  paymentLink: string;
  qrCode: string | null;
  linkExpTime: string;
}

export interface TopupRecord {
  topupId: string;
  entityId: string;
  userId: string;
  transactionId: string;
  productId: string | null;
  tokenAmount: number;
  price: number;
  currency: string;
  status: string;
  note: string | null;
  createdAt: string;
}

const quotaKeys = {
  products: ['ai-quota', 'products'] as const,
  productsAll: ['ai-quota', 'products', 'all'] as const,
  topups: ['ai-quota', 'topups'] as const,
};

export const useQuotaProducts = () =>
  useQuery({
    queryKey: quotaKeys.products,
    queryFn: () =>
      apiClient
        .get<{ success: boolean; data: QuotaProduct[] }>('/ai-quota/products')
        .then((r) => r.data.data),
  });

export const usePurchaseQuota = () =>
  useMutation({
    mutationFn: (productId: string) =>
      apiClient
        .post<{ success: boolean; data: PurchaseResult }>('/ai-quota/purchase', {
          product_id: productId,
        })
        .then((r) => r.data.data),
  });

export const useTopupHistory = () =>
  useQuery({
    queryKey: quotaKeys.topups,
    queryFn: () =>
      apiClient
        .get<{ success: boolean; data: { items: TopupRecord[]; total: number } }>(
          '/ai-quota/topups',
        )
        .then((r) => r.data.data),
  });
