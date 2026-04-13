import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocCategories, useDocCompleteness, useDocData, useSyncDdd, useSyncBilling, useSyncHr, useSyncStatus, useStaleReport } from '../hooks/useDocBuilder';
import { DocBaseCategoryResponse, DocBaseDataResponse, DocGeneratedResponse } from '../service/doc-builder.service';
import BaseDataEditPanel from '../components/BaseDataEditPanel';
import DocGeneratePanel from '../components/DocGeneratePanel';
import DocumentDetailPanel from '../components/DocumentDetailPanel';
import InitialSetupWizard from '../components/InitialSetupWizard';
import { CheckCircle, Circle, ChevronRight, Database, Lock, Globe, Shield, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useTimezoneStore } from '@/global/store/timezone.store';
import { formatDateTimeInTz } from '@/lib/format-utils';
import { QuotaExceededBanner } from '@/components/common/QuotaExceededBanner';

const CONFIDENTIALITY_ICONS: Record<string, typeof Globe> = {
  PUBLIC: Globe,
  INTERNAL: Shield,
  CONFIDENTIAL: Lock,
};

const CONFIDENTIALITY_COLORS: Record<string, string> = {
  PUBLIC: 'text-green-500',
  INTERNAL: 'text-yellow-500',
  CONFIDENTIAL: 'text-red-500',
};

export default function DocBuilderPage() {
  const { t, i18n } = useTranslation('kms');
  const { timezone } = useTimezoneStore();
  const language = i18n.language === 'ko' ? 'ko' : i18n.language === 'vi' ? 'vi' : 'en';

  const [mainTab, setMainTab] = useState<'baseData' | 'generate' | 'sync'>('baseData');
  const [selectedCategory, setSelectedCategory] = useState<DocBaseCategoryResponse | null>(null);
  const [selectedData, setSelectedData] = useState<DocBaseDataResponse | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocGeneratedResponse | null>(null);

  const { data: categories, isLoading: catLoading } = useDocCategories();
  const { data: completeness } = useDocCompleteness(language);
  const { data: allData, refetch: refetchData } = useDocData({ language });
  const { data: syncStatus } = useSyncStatus();
  const { data: staleReport } = useStaleReport();
  const syncDdd = useSyncDdd();
  const syncBilling = useSyncBilling();
  const syncHr = useSyncHr();

  const getCompleteness = (code: string) =>
    completeness?.find((c) => c.categoryCode === code);

  const getDataForCategory = (dbcId: string) =>
    allData?.find((d) => d.dbcId === dbcId);

  const handleCategoryClick = (cat: DocBaseCategoryResponse) => {
    setSelectedCategory(cat);
    const data = getDataForCategory(cat.dbcId);
    setSelectedData(data || null);
  };

  const handleSaved = () => {
    refetchData();
    setSelectedCategory(null);
    setSelectedData(null);
  };

  // Overall completeness
  const overallCompleteness = completeness
    ? Math.round(completeness.reduce((sum, c) => sum + c.completeness, 0) / completeness.length)
    : 0;

  // Show Initial Setup Wizard if no data exists yet
  const isFirstSetup = completeness && completeness.length > 0 && completeness.every((c) => !c.hasData);
  if (isFirstSetup) {
    return <InitialSetupWizard onComplete={() => refetchData()} />;
  }

  if (selectedDocument) {
    return (
      <DocumentDetailPanel
        document={selectedDocument}
        onBack={() => setSelectedDocument(null)}
      />
    );
  }

  if (selectedCategory) {
    return (
      <BaseDataEditPanel
        category={selectedCategory}
        existingData={selectedData}
        language={language}
        onBack={() => { setSelectedCategory(null); setSelectedData(null); }}
        onSaved={handleSaved}
      />
    );
  }

  return (
    <div className="h-full overflow-auto">
      <QuotaExceededBanner />
      {/* Main Tab Bar */}
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white px-6 pt-4">
        <div className="flex gap-6">
          <button
            onClick={() => setMainTab('baseData')}
            className={`pb-3 text-sm font-medium transition-colors ${
              mainTab === 'baseData'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="mr-1.5 inline h-4 w-4" />
            {t('docBuilder.baseDataTab')}
          </button>
          <button
            onClick={() => setMainTab('generate')}
            className={`pb-3 text-sm font-medium transition-colors ${
              mainTab === 'generate'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Sparkles className="mr-1.5 inline h-4 w-4" />
            {t('docBuilder.generateTab')}
          </button>
          <button
            onClick={() => setMainTab('sync')}
            className={`relative pb-3 text-sm font-medium transition-colors ${
              mainTab === 'sync'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <RefreshCw className="mr-1.5 inline h-4 w-4" />
            {t('docBuilder.syncTab')}
            {staleReport && staleReport.staleData.length > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] text-white">
                {staleReport.staleData.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Generate Tab */}
      {mainTab === 'generate' && <DocGeneratePanel onViewDocument={setSelectedDocument} />}

      {/* Sync Tab */}
      {mainTab === 'sync' && (
        <div className="mx-auto max-w-6xl p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('docBuilder.syncTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('docBuilder.syncDesc')}</p>
          </div>

          {/* Sync Module Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* DDD Sync */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-purple-900">5A Matrix</h3>
                  <p className="mt-0.5 text-xs text-purple-600">
                    {syncStatus?.ddd.lastSyncAt
                      ? `${t('docBuilder.lastSync')}: ${formatDateTimeInTz(syncStatus.ddd.lastSyncAt, timezone, 'YYYY-MM-DD HH:mm')}`
                      : t('docBuilder.neverSynced')}
                  </p>
                  {syncStatus?.ddd.categoriesCount ? (
                    <p className="text-xs text-purple-500">{syncStatus.ddd.categoriesCount} {t('docBuilder.categoriesSynced')}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => syncDdd.mutate()}
                  disabled={syncDdd.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncDdd.isPending ? 'animate-spin' : ''}`} />
                  {t('docBuilder.syncNow')}
                </button>
              </div>
            </div>

            {/* Billing Sync */}
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-orange-900">Billing</h3>
                  <p className="mt-0.5 text-xs text-orange-600">
                    {syncStatus?.billing.lastSyncAt
                      ? `${t('docBuilder.lastSync')}: ${formatDateTimeInTz(syncStatus.billing.lastSyncAt, timezone, 'YYYY-MM-DD HH:mm')}`
                      : t('docBuilder.neverSynced')}
                  </p>
                  {syncStatus?.billing.categoriesCount ? (
                    <p className="text-xs text-orange-500">{syncStatus.billing.categoriesCount} {t('docBuilder.categoriesSynced')}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => syncBilling.mutate()}
                  disabled={syncBilling.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncBilling.isPending ? 'animate-spin' : ''}`} />
                  {t('docBuilder.syncNow')}
                </button>
              </div>
            </div>

            {/* HR Sync */}
            <div className="rounded-lg border border-teal-200 bg-teal-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-teal-900">HR</h3>
                  <p className="mt-0.5 text-xs text-teal-600">
                    {syncStatus?.hr.lastSyncAt
                      ? `${t('docBuilder.lastSync')}: ${formatDateTimeInTz(syncStatus.hr.lastSyncAt, timezone, 'YYYY-MM-DD HH:mm')}`
                      : t('docBuilder.neverSynced')}
                  </p>
                  {syncStatus?.hr.categoriesCount ? (
                    <p className="text-xs text-teal-500">{syncStatus.hr.categoriesCount} {t('docBuilder.categoriesSynced')}</p>
                  ) : null}
                </div>
                <button
                  onClick={() => syncHr.mutate()}
                  disabled={syncHr.isPending}
                  className="flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${syncHr.isPending ? 'animate-spin' : ''}`} />
                  {t('docBuilder.syncNow')}
                </button>
              </div>
            </div>
          </div>

          {/* Stale Data Report */}
          {staleReport && staleReport.staleData.length > 0 && (
            <div className="rounded-lg border border-orange-200 bg-white p-5">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <h3 className="text-sm font-semibold text-gray-900">{t('docBuilder.staleDataTitle')}</h3>
                <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                  {staleReport.staleData.length}
                </span>
              </div>
              <div className="space-y-2">
                {staleReport.staleData.map((item) => (
                  <div key={item.dbdId} className="flex items-center justify-between rounded-md bg-orange-50 px-3 py-2">
                    <div>
                      <span className="text-xs font-medium text-gray-700">{item.categoryName}</span>
                      <span className="ml-2 text-xs text-gray-400">({item.categoryCode})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{item.daysSinceUpdate} {t('docBuilder.daysOld')}</span>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5">{item.dataSource}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Affected Documents */}
              {staleReport.affectedDocuments.length > 0 && (
                <div className="mt-4 border-t border-orange-100 pt-3">
                  <p className="mb-2 text-xs font-semibold text-gray-700">{t('docBuilder.affectedDocs')}</p>
                  {staleReport.affectedDocuments.map((doc) => (
                    <div key={doc.dgnId} className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2">
                      <span className="text-xs font-medium text-gray-700">{doc.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{doc.status}</span>
                        <span className="text-xs text-gray-400">{doc.staleCategories.join(', ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {staleReport && staleReport.staleData.length === 0 && (
            <div className="rounded-lg border border-dashed border-green-200 bg-green-50/50 py-8 text-center">
              <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-400" />
              <p className="text-sm text-green-600">{t('docBuilder.allFresh')}</p>
            </div>
          )}
        </div>
      )}

      {/* Base Data Tab */}
      {mainTab === 'baseData' && (
        <div className="mx-auto max-w-6xl p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('docBuilder.title')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('docBuilder.description')}</p>
          </div>

          {/* Overall Progress */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{t('docBuilder.overallProgress')}</p>
                  <p className="text-xs text-gray-500">
                    {completeness?.filter((c) => c.hasData).length || 0} / {completeness?.length || 0} {t('docBuilder.categoriesFilled')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-2 w-48 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${overallCompleteness}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-blue-600">{overallCompleteness}%</span>
              </div>
            </div>
          </div>

          {/* Category Grid */}
          {catLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories?.map((cat) => {
                const comp = getCompleteness(cat.dbcCode);
                const hasData = comp?.hasData ?? false;
                const pct = comp?.completeness ?? 0;
                const ConfIcon = CONFIDENTIALITY_ICONS[cat.dbcConfidentiality] || Globe;
                const confColor = CONFIDENTIALITY_COLORS[cat.dbcConfidentiality] || 'text-gray-400';

                return (
                  <button
                    key={cat.dbcId}
                    onClick={() => handleCategoryClick(cat)}
                    className="group flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {hasData ? (
                            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
                          ) : (
                            <Circle className="h-4 w-4 shrink-0 text-gray-300" />
                          )}
                          <h3 className="truncate text-sm font-semibold text-gray-900">
                            {language === 'ko' ? cat.dbcNameKr : cat.dbcName}
                          </h3>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">{cat.dbcDescription}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-gray-200'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-500">{pct}%</span>
                    </div>

                    {/* Meta */}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <ConfIcon className={`h-3 w-3 ${confColor}`} />
                        {cat.dbcConfidentiality}
                      </span>
                      <span>{comp?.fieldCount || cat.dbcFieldSchema?.length || 0} {t('docBuilder.fields')}</span>
                      {cat.dbcDataSource !== 'MANUAL' && (
                        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-purple-600">
                          {cat.dbcDataSource}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
