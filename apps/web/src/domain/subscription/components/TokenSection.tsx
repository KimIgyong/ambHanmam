import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTokenWallets, usePurchaseTokens } from '../hooks/useSubscription';
import { Coins, Plus, TrendingUp, TrendingDown } from 'lucide-react';

export default function TokenSection() {
  const { t } = useTranslation(['subscription']);
  const { data: wallets, isLoading } = useTokenWallets();
  const purchaseMutation = usePurchaseTokens();
  const [purchaseAmount, setPurchaseAmount] = useState(50000);

  const totalBalance = wallets?.reduce((sum, w) => sum + w.balance, 0) ?? 0;

  const handlePurchase = async () => {
    try {
      const result = await purchaseMutation.mutateAsync({
        token_amount: purchaseAmount,
      });
      if (result.checkoutUrl) {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch {
      // handled by mutation error state
    }
  };

  const tokenTypeLabels: Record<string, string> = {
    BASE: t('subscription:token.base'),
    ADDON: t('subscription:token.addon'),
    REFERRAL: t('subscription:token.referral'),
  };

  const tokenTypeColors: Record<string, string> = {
    BASE: 'bg-blue-50 border-blue-200 text-blue-700',
    ADDON: 'bg-purple-50 border-purple-200 text-purple-700',
    REFERRAL: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Balance */}
      <div className="rounded-lg border border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
        <div className="flex items-center gap-3">
          <Coins className="h-8 w-8 text-indigo-500" />
          <div>
            <p className="text-sm text-gray-500">
              {t('subscription:token.totalBalance')}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {totalBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Wallets Breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {wallets?.map((wallet) => (
          <div
            key={wallet.tokenType}
            className={`rounded-lg border p-4 ${
              tokenTypeColors[wallet.tokenType] || 'bg-gray-50 border-gray-200'
            }`}
          >
            <p className="text-xs font-medium opacity-75">
              {tokenTypeLabels[wallet.tokenType] || wallet.tokenType}
            </p>
            <p className="mt-1 text-xl font-bold">
              {wallet.balance.toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-3 text-xs opacity-60">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {wallet.lifetimeGranted.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <TrendingDown className="h-3 w-3" />
                {wallet.lifetimeConsumed.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Purchase */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-3 text-sm font-semibold text-gray-700">
          {t('subscription:token.purchase')}
        </h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-gray-500">
              {t('subscription:token.purchaseAmount')}
            </label>
            <select
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value={10000}>10,000</option>
              <option value={50000}>50,000</option>
              <option value={100000}>100,000</option>
              <option value={500000}>500,000</option>
            </select>
          </div>
          <button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {t('subscription:token.purchase')}
          </button>
        </div>
        {purchaseMutation.isError && (
          <p className="mt-2 text-sm text-red-600">
            {t('subscription:errors.checkoutFailed')}
          </p>
        )}
      </div>
    </div>
  );
}
