import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Eye, ArrowUpDown } from 'lucide-react';
import { useAssetList } from '../hooks/useAsset';
import type { Asset, AssetListQuery } from '../service/asset.service';

const CATEGORIES = ['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM', 'VEHICLE'] as const;
const STATUSES = ['IN_USE', 'STORED', 'REPAIRING', 'DISPOSAL_PENDING', 'DISPOSED', 'RESERVED'] as const;

interface Props {
  onViewDetail: (asset: Asset) => void;
}

export default function AssetListTab({ onViewDetail }: Props) {
  const { t } = useTranslation('asset');
  const [query, setQuery] = useState<AssetListQuery>({});
  const [search, setSearch] = useState('');
  const { data: assets, isLoading } = useAssetList(query);

  const handleSearch = () => {
    setQuery((prev) => ({ ...prev, q: search || undefined }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const statusColor = (s: string) => {
    const map: Record<string, string> = {
      IN_USE: 'bg-blue-100 text-blue-700',
      STORED: 'bg-gray-100 text-gray-700',
      REPAIRING: 'bg-yellow-100 text-yellow-700',
      DISPOSAL_PENDING: 'bg-orange-100 text-orange-700',
      DISPOSED: 'bg-red-100 text-red-700',
      RESERVED: 'bg-purple-100 text-purple-700',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('common.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select
          value={query.category || ''}
          onChange={(e) => setQuery((prev) => ({ ...prev, category: e.target.value || undefined }))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('form.category')} - {t('common.all')}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`category.${c}`)}</option>
          ))}
        </select>
        <select
          value={query.status || ''}
          onChange={(e) => setQuery((prev) => ({ ...prev, status: e.target.value || undefined }))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">{t('form.status')} - {t('common.all')}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}`)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
      ) : !assets || assets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">{t('common.noData')}</div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">{t('common.code')} <ArrowUpDown className="w-3 h-3" /></span>
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">{t('form.assetName')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">{t('form.category')}</th>
                <th className="px-3 py-2.5 text-right font-medium text-gray-600 dark:text-gray-400">{t('form.quantity')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">{t('form.status')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">{t('form.location')}</th>
                <th className="px-3 py-2.5 text-left font-medium text-gray-600 dark:text-gray-400">{t('form.department')}</th>
                <th className="px-3 py-2.5 text-center font-medium text-gray-600 dark:text-gray-400">{t('common.detail')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {assets.map((a) => (
                <tr key={a.assetId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-3 py-2 font-mono text-xs text-gray-500">{a.assetCode}</td>
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{a.assetName}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{t(`category.${a.assetCategory}`)}</td>
                  <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{a.quantity ?? 1}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(a.status)}`}>
                      {t(`status.${a.status}`)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{a.location || '-'}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{a.unit || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={() => onViewDetail(a)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
