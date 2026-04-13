import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuotaProducts, usePurchaseQuota, type QuotaProduct } from '../hooks/useQuotaPurchase';

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatPrice(n: number, currency: string): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(n);
}

interface QuotaPurchaseModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuotaPurchaseModal({ open, onClose }: QuotaPurchaseModalProps) {
  const { t } = useTranslation(['settings', 'common']);
  const { data: products, isLoading } = useQuotaProducts();
  const purchaseMutation = usePurchaseQuota();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open) return null;

  const handlePurchase = async () => {
    if (!selectedId) return;

    try {
      const result = await purchaseMutation.mutateAsync(selectedId);
      if (result.paymentLink) {
        window.open(result.paymentLink, '_blank');
        onClose();
      }
    } catch {
      toast.error(t('settings:quotaPurchase.purchaseFailed'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('settings:quotaPurchase.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="mb-4 text-sm text-gray-600">
            {t('settings:quotaPurchase.description')}
          </p>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : !products || products.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              {t('settings:quotaPurchase.noProducts')}
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product: QuotaProduct) => (
                <button
                  key={product.productId}
                  onClick={() => setSelectedId(product.productId)}
                  className={`w-full rounded-lg border p-4 text-left transition-all ${
                    selectedId === product.productId
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.description && (
                        <div className="mt-0.5 text-xs text-gray-500">
                          {product.description}
                        </div>
                      )}
                      <div className="mt-1 text-sm text-blue-600">
                        {formatTokens(product.tokenAmount)} tokens
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(product.price, product.currency)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel')}
          </button>
          <button
            onClick={handlePurchase}
            disabled={!selectedId || purchaseMutation.isPending}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {purchaseMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {t('settings:quotaPurchase.purchaseButton')}
          </button>
        </div>
      </div>
    </div>
  );
}
