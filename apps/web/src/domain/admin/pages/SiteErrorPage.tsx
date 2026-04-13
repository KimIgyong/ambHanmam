import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Search,
  Monitor,
  Server,
  X,
  CheckCircle,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  List,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  adminService,
  type SiteErrorItem,
} from '@/domain/admin/service/admin.service';

const SOURCE_OPTIONS = ['', 'FRONTEND', 'BACKEND'] as const;
const APP_OPTIONS = ['', 'WEB', 'PORTAL_WEB', 'API', 'PORTAL_API'] as const;
const STATUS_OPTIONS = ['', 'OPEN', 'RESOLVED', 'IGNORED'] as const;
const LEVEL_OPTIONS = ['', 'ADMIN_LEVEL', 'USER_LEVEL', 'PARTNER_LEVEL', 'CLIENT_LEVEL'] as const;

export default function SiteErrorPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'errors' | 'codes'>('errors');
  const [filters, setFilters] = useState({
    source: '',
    app: '',
    usr_level: '',
    status: '',
    search: '',
    date_from: '',
    date_to: '',
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SiteErrorItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'site-errors', filters, page],
    queryFn: () =>
      adminService.getSiteErrors({
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
        page,
        limit: 50,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin', 'site-errors-stats'],
    queryFn: () => adminService.getSiteErrorStats(),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminService.updateSiteErrorStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-errors'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'site-errors-stats'] });
      toast.success(t('admin:siteErrors.statusUpdated'));
      setSelected(null);
    },
  });

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const sourceBadge = (source: string) => {
    const isF = source === 'FRONTEND';
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${isF ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
        {isF ? <Monitor className="h-3 w-3" /> : <Server className="h-3 w-3" />}
        {isF ? 'FE' : 'BE'}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: 'bg-red-100 text-red-700',
      RESOLVED: 'bg-green-100 text-green-700',
      IGNORED: 'bg-gray-100 text-gray-500',
    };
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-500'}`}>
        {status}
      </span>
    );
  };

  const httpStatusBadge = (code: number | null) => {
    if (!code) return null;
    const color = code >= 500 ? 'bg-red-100 text-red-700' : code >= 400 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';
    return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{code}</span>;
  };

  const fmtDate = (d: string) => {
    const dt = new Date(d);
    return `${(dt.getMonth() + 1).toString().padStart(2, '0')}/${dt.getDate().toString().padStart(2, '0')} ${dt.getHours().toString().padStart(2, '0')}:${dt.getMinutes().toString().padStart(2, '0')}`;
  };

  const feCount = stats?.bySource?.find((s) => s.source === 'FRONTEND')?.count || '0';
  const beCount = stats?.bySource?.find((s) => s.source === 'BACKEND')?.count || '0';

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('admin:siteErrors.title')}</h1>
            <p className="text-sm text-gray-500">{t('admin:siteErrors.subtitle')}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'errors' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List className="h-4 w-4" />
            {t('admin:siteErrors.tabs.errorList')}
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'codes' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <BookOpen className="h-4 w-4" />
            {t('admin:siteErrors.tabs.codeReference')}
          </button>
        </div>

        {activeTab === 'codes' ? (
          <ErrorCodeReference />
        ) : (
        <>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <StatCard label={t('admin:siteErrors.stats.today')} value={stats?.todayCount ?? 0} color="red" />
          <StatCard label={t('admin:siteErrors.stats.week')} value={stats?.weekCount ?? 0} color="orange" />
          <StatCard label={t('admin:siteErrors.stats.open')} value={stats?.openCount ?? 0} color="yellow" />
          <StatCard label={t('admin:siteErrors.stats.frontend')} value={Number(feCount)} color="blue" />
          <StatCard label={t('admin:siteErrors.stats.backend')} value={Number(beCount)} color="purple" />
        </div>

        {/* Filters */}
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <select value={filters.source} onChange={(e) => updateFilter('source', e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">{t('admin:siteErrors.filter.allSource')}</option>
            {SOURCE_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.app} onChange={(e) => updateFilter('app', e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">{t('admin:siteErrors.filter.allApp')}</option>
            {APP_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.usr_level} onChange={(e) => updateFilter('usr_level', e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">{t('admin:siteErrors.filter.allLevel')}</option>
            {LEVEL_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
            <option value="">{t('admin:siteErrors.filter.allStatus')}</option>
            {STATUS_OPTIONS.filter(Boolean).map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <input type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <input type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder={t('admin:siteErrors.filter.search')}
              className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-100 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.time')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.source')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.app')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.user')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.page')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.httpStatus')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.errorCode')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.message')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : !data?.items.length ? (
                  <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">{t('admin:siteErrors.noErrors')}</td></tr>
                ) : (
                  data.items.map((item) => (
                    <tr
                      key={item.selId}
                      onClick={() => setSelected(item)}
                      className="cursor-pointer hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">{fmtDate(item.selCreatedAt)}</td>
                      <td className="px-4 py-3">{sourceBadge(item.selSource)}</td>
                      <td className="px-4 py-3 text-gray-600">{item.selApp}</td>
                      <td className="px-4 py-3 text-gray-600">{item.selUsrEmail || '-'}</td>
                      <td className="max-w-[200px] truncate px-4 py-3 text-gray-600" title={item.selPageUrl || item.selApiEndpoint || ''}>
                        {item.selPageUrl || item.selApiEndpoint || '-'}
                      </td>
                      <td className="px-4 py-3">{httpStatusBadge(item.selHttpStatus)}</td>
                      <td className="px-4 py-3 text-gray-600">{item.selErrorCode || '-'}</td>
                      <td className="max-w-[250px] truncate px-4 py-3 text-gray-700" title={item.selErrorMessage}>
                        {item.selErrorMessage}
                      </td>
                      <td className="px-4 py-3">{statusBadge(item.selStatus)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t('admin:siteErrors.pagination', { page, total: data.totalPages, count: data.total })}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(data.totalPages, 10) }, (_, i) => {
                const p = page <= 5 ? i + 1 : Math.min(page - 5, data.totalPages - 9) + i;
                if (p < 1 || p > data.totalPages) return null;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`rounded-md px-3 py-1.5 text-sm ${p === page ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        </>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setSelected(null)}>
          <div className="mx-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{t('admin:siteErrors.detail.title')}</h2>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <DetailRow label={t('admin:siteErrors.detail.time')} value={new Date(selected.selCreatedAt).toLocaleString()} />
              <DetailRow label={t('admin:siteErrors.detail.source')} value={`${selected.selSource} / ${selected.selApp}`} />
              <DetailRow label={t('admin:siteErrors.detail.user')} value={selected.selUsrEmail || '-'} />
              <DetailRow label={t('admin:siteErrors.detail.userLevel')} value={selected.selUsrLevel || '-'} />
              <DetailRow label={t('admin:siteErrors.detail.page')} value={selected.selPageUrl || '-'} />
              <DetailRow label={t('admin:siteErrors.detail.endpoint')} value={selected.selApiEndpoint ? `${selected.selHttpMethod || ''} ${selected.selApiEndpoint}` : '-'} />
              <DetailRow label={t('admin:siteErrors.detail.httpStatus')} value={selected.selHttpStatus?.toString() || '-'} />
              <DetailRow label={t('admin:siteErrors.detail.errorCode')} value={selected.selErrorCode || '-'} />
              <DetailRow label={t('admin:siteErrors.detail.status')} value={selected.selStatus} />
              <div>
                <p className="mb-1 text-xs font-medium text-gray-500">{t('admin:siteErrors.detail.message')}</p>
                <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{selected.selErrorMessage}</p>
              </div>
              {selected.selStackTrace && (
                <div>
                  <p className="mb-1 text-xs font-medium text-gray-500">{t('admin:siteErrors.detail.stackTrace')}</p>
                  <pre className="max-h-48 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-300">{selected.selStackTrace}</pre>
                </div>
              )}
              <DetailRow label={t('admin:siteErrors.detail.userAgent')} value={selected.selUserAgent || '-'} />
              <DetailRow label={t('admin:siteErrors.detail.ip')} value={selected.selIpAddress || '-'} />
            </div>

            {selected.selStatus === 'OPEN' && (
              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => statusMutation.mutate({ id: selected.selId, status: 'IGNORED' })}
                  disabled={statusMutation.isPending}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  <EyeOff className="h-4 w-4" />
                  {t('admin:siteErrors.action.ignore')}
                </button>
                <button
                  onClick={() => statusMutation.mutate({ id: selected.selId, status: 'RESOLVED' })}
                  disabled={statusMutation.isPending}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  {t('admin:siteErrors.action.resolve')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const bgMap: Record<string, string> = {
    red: 'bg-red-50',
    orange: 'bg-orange-50',
    yellow: 'bg-yellow-50',
    blue: 'bg-blue-50',
    purple: 'bg-purple-50',
  };
  const textMap: Record<string, string> = {
    red: 'text-red-700',
    orange: 'text-orange-700',
    yellow: 'text-yellow-700',
    blue: 'text-blue-700',
    purple: 'text-purple-700',
  };
  return (
    <div className={`rounded-xl ${bgMap[color] || 'bg-gray-50'} p-4`}>
      <p className="text-xs font-medium text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${textMap[color] || 'text-gray-700'}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <p className="w-24 shrink-0 text-xs font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-800 break-all">{value}</p>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  AUTH: { label: '인증/인가', color: 'bg-rose-100 text-rose-700' },
  USER: { label: '사용자', color: 'bg-blue-100 text-blue-700' },
  CONVERSATION: { label: '대화', color: 'bg-sky-100 text-sky-700' },
  AGENT: { label: 'AI 에이전트', color: 'bg-violet-100 text-violet-700' },
  SETTINGS: { label: '설정', color: 'bg-slate-100 text-slate-700' },
  TALK: { label: 'Amoeba Talk', color: 'bg-teal-100 text-teal-700' },
  GROUP: { label: '그룹', color: 'bg-cyan-100 text-cyan-700' },
  SYSTEM: { label: '시스템', color: 'bg-red-100 text-red-700' },
  TODO: { label: 'Todo', color: 'bg-amber-100 text-amber-700' },
  MEETING: { label: '회의록', color: 'bg-indigo-100 text-indigo-700' },
  ATTENDANCE: { label: '근태', color: 'bg-lime-100 text-lime-700' },
  NOTICE: { label: '공지', color: 'bg-yellow-100 text-yellow-700' },
  DRIVE: { label: 'Drive', color: 'bg-emerald-100 text-emerald-700' },
  ACCOUNTING: { label: '회계', color: 'bg-green-100 text-green-700' },
  HR: { label: 'HR', color: 'bg-orange-100 text-orange-700' },
  BILLING: { label: '빌링/계약', color: 'bg-pink-100 text-pink-700' },
  WEBMAIL: { label: '웹메일', color: 'bg-fuchsia-100 text-fuchsia-700' },
  ACL: { label: '접근제어', color: 'bg-stone-100 text-stone-700' },
  KMS: { label: 'KMS', color: 'bg-purple-100 text-purple-700' },
  PROJECT: { label: '프로젝트', color: 'bg-blue-100 text-blue-700' },
  SERVICE: { label: '서비스관리', color: 'bg-cyan-100 text-cyan-700' },
  ISSUE: { label: '이슈', color: 'bg-red-100 text-red-700' },
  TRANSLATION: { label: '번역', color: 'bg-teal-100 text-teal-700' },
  ASSET: { label: '자산', color: 'bg-amber-100 text-amber-700' },
  CALENDAR: { label: '캘린더', color: 'bg-indigo-100 text-indigo-700' },
  CMS: { label: 'CMS', color: 'bg-lime-100 text-lime-700' },
  PAYMENT: { label: '결제', color: 'bg-green-100 text-green-700' },
};

function ErrorCodeReference() {
  const { t } = useTranslation(['admin']);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data: codes, isLoading } = useQuery({
    queryKey: ['admin', 'error-codes'],
    queryFn: () => adminService.getErrorCodeReference(),
    staleTime: 1000 * 60 * 30,
  });

  const categories = codes
    ? [...new Set(codes.map((c) => c.category))].sort()
    : [];

  const filtered = (codes || []).filter((c) => {
    if (categoryFilter && c.category !== categoryFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.code.toLowerCase().includes(q) ||
        c.key.toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const httpStatusColor = (status: number) => {
    if (status >= 500) return 'bg-red-100 text-red-700';
    if (status === 401) return 'bg-orange-100 text-orange-700';
    if (status === 403) return 'bg-yellow-100 text-yellow-700';
    if (status >= 400) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div>
      {/* Filter Bar */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">{t('admin:siteErrors.codeRef.allCategories')}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]?.label || cat} ({(codes || []).filter((c) => c.category === cat).length})
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('admin:siteErrors.codeRef.searchPlaceholder')}
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {t('admin:siteErrors.codeRef.totalCodes', { count: filtered.length })}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.codeRef.colCode')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.codeRef.colKey')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.codeRef.colHttpStatus')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.codeRef.colCategory')}</th>
                <th className="px-4 py-3 font-medium text-gray-500">{t('admin:siteErrors.codeRef.colMessage')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : !filtered.length ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">{t('admin:siteErrors.codeRef.noResults')}</td></tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.code} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-indigo-600">{entry.code}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-500">{entry.key}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${httpStatusColor(entry.httpStatus)}`}>
                        {entry.httpStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_LABELS[entry.category]?.color || 'bg-gray-100 text-gray-600'}`}>
                        {CATEGORY_LABELS[entry.category]?.label || entry.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{entry.message}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
