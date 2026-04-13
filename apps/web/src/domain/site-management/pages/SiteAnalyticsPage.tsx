import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PortalAnalyticsTab from '../components/analytics/PortalAnalyticsTab';
import AppAnalyticsTab from '../components/analytics/AppAnalyticsTab';

type TabType = 'portal' | 'app';
type DatePreset = 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'threeMonths' | 'custom';

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
    case 'threeMonths': {
      const m = new Date(now);
      m.setMonth(m.getMonth() - 3);
      return { start: fmt(m), end: fmt(now) };
    }
    default:
      return { start: fmt(now), end: fmt(now) };
  }
}

export default function SiteAnalyticsPage() {
  const { t } = useTranslation(['site']);
  const [activeTab, setActiveTab] = useState<TabType>('app');
  const [datePreset, setDatePreset] = useState<DatePreset>('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(() => {
    if (datePreset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'app', label: t('site:analytics.tabs.app') },
    { key: 'portal', label: t('site:analytics.tabs.portal') },
  ];

  const datePresets: { key: DatePreset; label: string }[] = [
    { key: 'today', label: t('site:analytics.dateFilter.today') },
    { key: 'yesterday', label: t('site:analytics.dateFilter.yesterday') },
    { key: 'thisWeek', label: t('site:analytics.dateFilter.thisWeek') },
    { key: 'thisMonth', label: t('site:analytics.dateFilter.thisMonth') },
    { key: 'threeMonths', label: t('site:analytics.dateFilter.threeMonths') },
    { key: 'custom', label: t('site:analytics.dateFilter.custom') },
  ];

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">{t('site:analytics.title')}</h1>
          <p className="text-sm text-gray-500">{t('site:analytics.description')}</p>
        </div>

        {/* Date Filter */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {datePresets.map((p) => (
            <button
              key={p.key}
              onClick={() => setDatePreset(p.key)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                datePreset === p.key
                  ? 'bg-lime-600 text-white'
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
                    ? 'border-lime-600 text-lime-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'portal' && (
          <PortalAnalyticsTab startDate={dateRange.start} endDate={dateRange.end} />
        )}
        {activeTab === 'app' && (
          <AppAnalyticsTab startDate={dateRange.start} endDate={dateRange.end} />
        )}
      </div>
    </div>
  );
}
