import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Pencil } from 'lucide-react';
import { usePageList } from '../hooks/usePages';
import { CmsPageListResponse } from '@amb/types';

const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
const PAGE_TYPES = [
  'STATIC',
  'BOARD',
  'BLOG',
  'SUBSCRIPTION',
  'SERVICE_INFO',
  'SERVICE_APPLY',
  'PAYMENT',
  'LANDING',
] as const;

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
};

const TYPE_BADGE: Record<string, string> = {
  STATIC: 'bg-slate-100 text-slate-700',
  BOARD: 'bg-blue-100 text-blue-700',
  BLOG: 'bg-purple-100 text-purple-700',
  SUBSCRIPTION: 'bg-pink-100 text-pink-700',
  SERVICE_INFO: 'bg-cyan-100 text-cyan-700',
  SERVICE_APPLY: 'bg-teal-100 text-teal-700',
  PAYMENT: 'bg-orange-100 text-orange-700',
  LANDING: 'bg-indigo-100 text-indigo-700',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SitePageListPage() {
  const { t } = useTranslation(['site', 'common']);
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const queryFilters = useMemo(
    () => ({
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      search: searchTerm || undefined,
    }),
    [statusFilter, typeFilter, searchTerm],
  );

  const { data: pages = [], isLoading } = usePageList(queryFilters);

  const handleRowClick = (page: CmsPageListResponse) => {
    navigate(`/site/pages/${page.id}`);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return t('site:page.draft');
      case 'PUBLISHED':
        return t('site:page.published');
      case 'ARCHIVED':
        return t('site:page.archived');
      default:
        return status;
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">{t('site:page.title')}</h1>

        {/* Filter Bar */}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('common:search')}
              className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
          >
            <option value="">{t('site:page.status')}: {t('common:all')}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{getStatusLabel(s)}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-md border border-gray-300 py-2 pl-3 pr-8 text-sm focus:border-lime-500 focus:outline-none focus:ring-1 focus:ring-lime-500"
          >
            <option value="">Type: {t('common:all')}</option>
            {PAGE_TYPES.map((pt) => (
              <option key={pt} value={pt}>{t(`site:pageType.${pt}`)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-lime-600" />
          </div>
        ) : pages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">
              {t('common:search')}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              No pages found. Pages are created via Menu Management.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className="hidden min-w-full divide-y divide-gray-200 md:table">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    {t('site:page.status')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {pages.map((page) => (
                  <tr
                    key={page.id}
                    onClick={() => handleRowClick(page)}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                  >
                    {/* Title / Slug */}
                    <td className="px-6 py-3 text-sm">
                      <div className="font-medium text-gray-900">
                        {page.title || page.slug}
                      </div>
                      {page.title && (
                        <div className="text-xs text-gray-400">/{page.slug}</div>
                      )}
                      {page.menu && (
                        <div className="text-xs text-gray-400">
                          {page.menu.nameEn}
                        </div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td className="whitespace-nowrap px-6 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          TYPE_BADGE[page.type] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {t(`site:pageType.${page.type}`)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="whitespace-nowrap px-6 py-3 text-sm">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          STATUS_BADGE[page.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {getStatusLabel(page.status)}
                      </span>
                    </td>

                    {/* Version */}
                    <td className="whitespace-nowrap px-6 py-3 text-center text-sm text-gray-500">
                      v{page.currentVersion}
                    </td>

                    {/* Updated At */}
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">
                      {formatDate(page.updatedAt)}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-6 py-3 text-right text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/site/pages/${page.id}`);
                        }}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-lime-700 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t('common:edit')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="space-y-3 p-4 md:hidden">
              {pages.map((page) => (
                <button
                  key={page.id}
                  onClick={() => handleRowClick(page)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-lime-300 hover:shadow-sm"
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-gray-900">
                        {page.title || page.slug}
                      </h3>
                      {page.title && (
                        <p className="truncate text-xs text-gray-400">/{page.slug}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        STATUS_BADGE[page.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getStatusLabel(page.status)}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        TYPE_BADGE[page.type] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t(`site:pageType.${page.type}`)}
                    </span>
                    <span className="text-xs text-gray-400">
                      v{page.currentVersion}
                    </span>
                  </div>

                  {/* Footer row */}
                  <div className="mt-2 flex items-center justify-between">
                    {page.menu && (
                      <span className="text-xs text-gray-400">{page.menu.nameEn}</span>
                    )}
                    <span className="ml-auto text-xs text-gray-400">
                      {formatDate(page.updatedAt)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
