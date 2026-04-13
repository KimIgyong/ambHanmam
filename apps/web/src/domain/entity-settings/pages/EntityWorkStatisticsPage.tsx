import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, LogIn, CheckSquare, AlertCircle, FileText, Bot, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useWorkStatsOverview,
  useWorkStatsMembers,
  useWorkStatsLoginHistory,
  useWorkStatsApiUsage,
  useWorkStatsMenuUsage,
} from '../hooks/useWorkStatistics';
import { formatDateTimeInTz } from '@/lib/format-utils';
import { useTimezoneStore } from '@/global/store/timezone.store';
import type { WorkStatsMember } from '../service/entity-settings.service';

type TabType = 'overview' | 'members' | 'apiUsage' | 'menuUsage';
type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'custom';

function getDateRange(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  switch (preset) {
    case 'today':
      return { start: fmt(now), end: fmt(now) };
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      return { start: fmt(y), end: fmt(y) };
    }
    case 'thisWeek': {
      const d = new Date(now);
      const day = d.getDay();
      d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
      return { start: fmt(d), end: fmt(now) };
    }
    case 'thisMonth': {
      const m = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: fmt(m), end: fmt(now) };
    }
    default:
      return { start: fmt(now), end: fmt(now) };
  }
}

type SortKey = keyof WorkStatsMember;

export default function EntityWorkStatisticsPage() {
  const { t } = useTranslation(['entitySettings']);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const { timezone } = useTimezoneStore();
  const { data: overview, isLoading: loadingOverview } = useWorkStatsOverview(dateRange.start, dateRange.end);
  const { data: members, isLoading: loadingMembers } = useWorkStatsMembers(dateRange.start, dateRange.end);
  const { data: loginHistory, isLoading: loadingLogin } = useWorkStatsLoginHistory(dateRange.start, dateRange.end);
  const { data: apiUsage, isLoading: loadingApi } = useWorkStatsApiUsage(dateRange.start, dateRange.end);
  const { data: menuUsage, isLoading: loadingMenu } = useWorkStatsMenuUsage(dateRange.start, dateRange.end);

  // Member sorting
  const [sortKey, setSortKey] = useState<SortKey>('loginCount');
  const [sortAsc, setSortAsc] = useState(false);

  const sortedMembers = useMemo(() => {
    if (!members) return [];
    return [...members].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [members, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: t('entitySettings:workStatistics.tabs.overview') },
    { key: 'members', label: t('entitySettings:workStatistics.tabs.members') },
    { key: 'apiUsage', label: t('entitySettings:workStatistics.tabs.apiUsage') },
    { key: 'menuUsage', label: t('entitySettings:workStatistics.tabs.menuUsage') },
  ];

  const datePresets: { key: DatePreset; label: string }[] = [
    { key: 'today', label: t('entitySettings:workStatistics.dateFilter.today') },
    { key: 'yesterday', label: t('entitySettings:workStatistics.dateFilter.yesterday') },
    { key: 'thisWeek', label: t('entitySettings:workStatistics.dateFilter.thisWeek') },
    { key: 'thisMonth', label: t('entitySettings:workStatistics.dateFilter.thisMonth') },
    { key: 'custom', label: t('entitySettings:workStatistics.dateFilter.custom') },
  ];

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/entity-settings')} className="rounded p-1 hover:bg-gray-100">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('entitySettings:workStatistics.title')}</h1>
          <p className="text-sm text-gray-500">{t('entitySettings:workStatistics.description')}</p>
        </div>
      </div>

      {/* Date Filter */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {datePresets.map((p) => (
          <button
            key={p.key}
            onClick={() => setDatePreset(p.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              datePreset === p.key
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded border px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`border-b-2 px-1 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab
          overview={overview}
          loginHistory={loginHistory}
          loading={loadingOverview || loadingLogin}
          t={t}
          timezone={timezone}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab
          members={sortedMembers}
          loading={loadingMembers}
          sortKey={sortKey}
          sortAsc={sortAsc}
          onSort={handleSort}
          t={t}
        />
      )}
      {activeTab === 'apiUsage' && (
        <ApiUsageTab data={apiUsage} loading={loadingApi} t={t} />
      )}
      {activeTab === 'menuUsage' && (
        <MenuUsageTab data={menuUsage} loading={loadingMenu} t={t} />
      )}
    </div>
    </div>
  );
}

/* ── Overview Tab ── */
function OverviewTab({ overview, loginHistory, loading, t, timezone }: any) {
  if (loading) return <LoadingSkeleton />;

  const kpis = overview
    ? [
        { icon: LogIn, label: t('entitySettings:workStatistics.overview.loginCount'), value: overview.loginCount },
        { icon: CheckSquare, label: t('entitySettings:workStatistics.overview.todosCreated'), value: overview.todosCreated, sub: `${t('entitySettings:workStatistics.overview.todosCompleted')}: ${overview.todosCompleted}` },
        { icon: AlertCircle, label: t('entitySettings:workStatistics.overview.issuesCreated'), value: overview.issuesCreated, sub: `${t('entitySettings:workStatistics.overview.issuesResolved')}: ${overview.issuesResolved}` },
        { icon: FileText, label: t('entitySettings:workStatistics.overview.meetingNotes'), value: overview.meetingNotesCreated, sub: `${t('entitySettings:workStatistics.overview.comments')}: ${overview.commentsCount}` },
        { icon: Bot, label: t('entitySettings:workStatistics.overview.aiRequests'), value: overview.aiRequests, sub: `${overview.aiTokens.toLocaleString()} tokens` },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium">{kpi.label}</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">{kpi.value}</p>
              {kpi.sub && <p className="mt-1 text-xs text-gray-400">{kpi.sub}</p>}
            </div>
          );
        })}
      </div>

      {overview && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">
            {t('entitySettings:workStatistics.overview.loginCount')}: <span className="font-semibold text-gray-900">{overview.totalMembers}</span> {t('entitySettings:workStatistics.members.name')}
          </p>
        </div>
      )}

      {/* Recent Logins */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-700">{t('entitySettings:workStatistics.recentLogins')}</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {(!loginHistory || loginHistory.length === 0) ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">{t('entitySettings:workStatistics.noLogins')}</p>
          ) : (
            loginHistory.slice(0, 10).map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between px-4 py-2">
                <div>
                  <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{entry.email}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500">{formatDateTimeInTz(entry.createdAt, timezone)}</span>
                  {entry.ip && <span className="ml-2 text-xs text-gray-400">{entry.ip}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Members Tab ── */
function MembersTab({ members, loading, sortKey, sortAsc, onSort, t }: any) {
  if (loading) return <LoadingSkeleton />;
  if (!members || members.length === 0) {
    return <EmptyState message={t('entitySettings:workStatistics.members.noData')} />;
  }

  const maxValues = {
    loginCount: Math.max(...members.map((m: WorkStatsMember) => m.loginCount), 1),
    todosCreated: Math.max(...members.map((m: WorkStatsMember) => m.todosCreated), 1),
    issuesCreated: Math.max(...members.map((m: WorkStatsMember) => m.issuesCreated), 1),
    meetingNotesCreated: Math.max(...members.map((m: WorkStatsMember) => m.meetingNotesCreated), 1),
    commentsCount: Math.max(...members.map((m: WorkStatsMember) => m.commentsCount), 1),
    talkMessages: Math.max(...members.map((m: WorkStatsMember) => m.talkMessages), 1),
    aiTokens: Math.max(...members.map((m: WorkStatsMember) => m.aiTokens), 1),
  };

  const cols: { key: SortKey; label: string }[] = [
    { key: 'name', label: t('entitySettings:workStatistics.members.name') },
    { key: 'unit', label: t('entitySettings:workStatistics.members.unit') },
    { key: 'loginCount', label: t('entitySettings:workStatistics.members.loginCount') },
    { key: 'todosCreated', label: t('entitySettings:workStatistics.members.todos') },
    { key: 'issuesCreated', label: t('entitySettings:workStatistics.members.issues') },
    { key: 'meetingNotesCreated', label: t('entitySettings:workStatistics.members.meetings') },
    { key: 'commentsCount', label: t('entitySettings:workStatistics.members.comments') },
    { key: 'talkMessages', label: t('entitySettings:workStatistics.members.talk') },
    { key: 'aiTokens', label: t('entitySettings:workStatistics.members.ai') },
  ];

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className="cursor-pointer whitespace-nowrap px-3 py-2 hover:bg-gray-100"
              >
                {col.label}
                {sortKey === col.key && <span className="ml-1">{sortAsc ? '\u25B2' : '\u25BC'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {members.map((m: WorkStatsMember) => (
            <tr key={m.userId} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-700">{m.name}</td>
              <td className="whitespace-nowrap px-3 py-2 text-gray-500">{m.unit}</td>
              <td className="px-3 py-2"><BarCell value={m.loginCount} max={maxValues.loginCount} /></td>
              <td className="px-3 py-2"><BarCell value={m.todosCreated} max={maxValues.todosCreated} color="bg-green-400" /></td>
              <td className="px-3 py-2"><BarCell value={m.issuesCreated} max={maxValues.issuesCreated} color="bg-orange-400" /></td>
              <td className="px-3 py-2"><BarCell value={m.meetingNotesCreated} max={maxValues.meetingNotesCreated} color="bg-blue-400" /></td>
              <td className="px-3 py-2"><BarCell value={m.commentsCount} max={maxValues.commentsCount} color="bg-purple-400" /></td>
              <td className="px-3 py-2"><BarCell value={m.talkMessages} max={maxValues.talkMessages} color="bg-pink-400" /></td>
              <td className="px-3 py-2"><BarCell value={m.aiTokens} max={maxValues.aiTokens} color="bg-amber-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── API Usage Tab ── */
function ApiUsageTab({ data, loading, t }: any) {
  if (loading) return <LoadingSkeleton />;
  if (!data || data.length === 0) {
    return <EmptyState message={t('entitySettings:workStatistics.apiUsage.noData')} />;
  }

  const maxTokens = Math.max(...data.map((d: any) => d.totalTokens), 1);

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('entitySettings:workStatistics.apiUsage.totalTokens')}</h3>
        <div className="space-y-3">
          {data.map((item: any) => (
            <div key={item.userId} className="flex items-center gap-3">
              <span className="w-24 truncate text-xs font-medium text-gray-600">{item.name}</span>
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded bg-indigo-500 transition-all"
                    style={{ width: `${(item.totalTokens / maxTokens) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-20 text-right text-xs text-gray-500">{item.totalTokens.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">{t('entitySettings:workStatistics.members.name')}</th>
              <th className="px-4 py-2 text-right">{t('entitySettings:workStatistics.apiUsage.requests')}</th>
              <th className="px-4 py-2 text-right">{t('entitySettings:workStatistics.apiUsage.inputTokens')}</th>
              <th className="px-4 py-2 text-right">{t('entitySettings:workStatistics.apiUsage.outputTokens')}</th>
              <th className="px-4 py-2 text-right">{t('entitySettings:workStatistics.apiUsage.totalTokens')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item: any) => (
              <tr key={item.userId} className="hover:bg-gray-50">
                <td className="px-4 py-2">
                  <span className="font-medium text-gray-700">{item.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{item.email}</span>
                </td>
                <td className="px-4 py-2 text-right text-gray-600">{item.requests.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-gray-600">{item.inputTokens.toLocaleString()}</td>
                <td className="px-4 py-2 text-right text-gray-600">{item.outputTokens.toLocaleString()}</td>
                <td className="px-4 py-2 text-right font-medium text-gray-900">{item.totalTokens.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-200 bg-gray-50">
            <tr>
              <td className="px-4 py-2 text-sm font-semibold text-gray-900">{t('entitySettings:workStatistics.apiUsage.total')}</td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                {data.reduce((s: number, d: any) => s + d.requests, 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                {data.reduce((s: number, d: any) => s + d.inputTokens, 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-sm font-semibold text-gray-900">
                {data.reduce((s: number, d: any) => s + d.outputTokens, 0).toLocaleString()}
              </td>
              <td className="px-4 py-2 text-right text-sm font-bold text-indigo-700">
                {data.reduce((s: number, d: any) => s + d.totalTokens, 0).toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Menu Usage Tab ── */
function MenuUsageTab({ data, loading, t }: any) {
  if (loading) return <LoadingSkeleton />;
  if (!data || data.length === 0) {
    return <EmptyState message={t('entitySettings:workStatistics.menuUsage.noData')} />;
  }

  const maxVisits = Math.max(...data.map((d: any) => d.visits), 1);

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="mb-4 text-sm font-semibold text-gray-700">{t('entitySettings:workStatistics.menuUsage.visits')}</h3>
        <div className="space-y-3">
          {data.map((item: any) => (
            <div key={item.menuCode} className="flex items-center gap-3">
              <span className="w-32 truncate text-xs font-medium text-gray-600">{item.menuCode}</span>
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded bg-gray-100">
                  <div
                    className="h-full rounded bg-emerald-500 transition-all"
                    style={{ width: `${(item.visits / maxVisits) * 100}%` }}
                  />
                </div>
              </div>
              <span className="w-16 text-right text-xs text-gray-500">{item.visits}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">{t('entitySettings:workStatistics.menuUsage.menu')}</th>
              <th className="px-4 py-2 text-right">{t('entitySettings:workStatistics.menuUsage.visits')}</th>
              <th className="px-4 py-2 text-right">{t('entitySettings:workStatistics.menuUsage.uniqueUsers')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {data.map((item: any) => (
              <tr key={item.menuCode} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-medium text-gray-700">{item.menuCode}</td>
                <td className="px-4 py-2 text-right text-gray-600">{item.visits}</td>
                <td className="px-4 py-2 text-right text-gray-600">{item.uniqueUsers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Shared Components ── */
function BarCell({ value, max, color = 'bg-indigo-400' }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 w-16 overflow-hidden rounded bg-gray-100">
        <div className={`h-full rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600">{value}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 bg-white py-16">
      <Monitor className="mb-3 h-10 w-10 text-gray-300" />
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}
