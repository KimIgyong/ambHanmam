import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Plus, FileSpreadsheet, ChevronLeft, ChevronRight, ArrowUpDown, BarChart3, List, Sparkles, Loader2, Save, Trash2, FileText, Settings, X, Check, Star } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  useAnalysisReports, useSaveAnalysisReport, useDeleteAnalysisReport,
  useAnalysisPrompts, useCreateAnalysisPrompt, useUpdateAnalysisPrompt, useDeleteAnalysisPrompt,
} from '../hooks/useAnalysis';
import type { AnalysisReportResponse, AnalysisPromptResponse } from '../service/accounting.service';
import { TransactionResponse } from '@amb/types';
import { useAccountById } from '../hooks/useAccounts';
import {
  useTransactionList,
  useCreateTransaction,
  useUpdateTransaction,
  useImportTransactions,
} from '../hooks/useTransactions';
import { useMonthlyStats, useTopVendors } from '../hooks/useAccountStats';
import TransactionTable from '../components/TransactionTable';
import TransactionFormModal from '../components/TransactionFormModal';
import ExcelImportModal from '../components/ExcelImportModal';
import MonthlyChart from '../components/MonthlyChart';
import BalanceTrendChart from '../components/BalanceTrendChart';
import TopVendorsTable from '../components/TopVendorsTable';
import { formatCurrency } from '../components/BalanceSummaryCard';

const PAGE_SIZE_OPTIONS = [20, 50, 100, 200];

interface Filters {
  date_from?: string;
  date_to?: string;
  vendor?: string;
  description?: string;
  flow_type?: 'DEPOSIT' | 'WITHDRAWAL';
  sort_order?: string;
  page?: number;
  size?: number;
}

export default function AccountTransactionsPage() {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['accounting', 'common']);

  const { data: account, isLoading: accountLoading } = useAccountById(accountId || '');
  const [activeTab, setActiveTab] = useState<'transactions' | 'stats' | 'analysis'>('transactions');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [vendorFilter, setVendorFilter] = useState('');
  const [descriptionFilter, setDescriptionFilter] = useState('');
  const [flowType, setFlowType] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL'>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [filters, setFilters] = useState<Filters>({ size: 50, sort_order: 'DESC' });

  const { data: txnResult, isLoading: txnLoading } = useTransactionList(accountId || '', filters);

  const [showTxnModal, setShowTxnModal] = useState(false);
  const [editingTxn, setEditingTxn] = useState<TransactionResponse | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState<{
    accountsCreated: number;
    transactionsImported: number;
    sheets: string[];
  } | null>(null);

  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const importTransactions = useImportTransactions();

  const buildFilters = (overrides: Partial<Filters> = {}): Filters => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    vendor: vendorFilter || undefined,
    description: descriptionFilter || undefined,
    flow_type: flowType === 'ALL' ? undefined : flowType,
    sort_order: sortOrder,
    page: 1,
    size: pageSize,
    ...overrides,
  });

  const handleSearch = () => {
    setPage(1);
    setFilters(buildFilters());
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setVendorFilter('');
    setDescriptionFilter('');
    setFlowType('ALL');
    setPage(1);
    setSortOrder('DESC');
    setPageSize(50);
    setFilters({ size: 50, sort_order: 'DESC' });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
    setFilters((prev) => ({ ...prev, size: newSize, page: 1 }));
  };

  const handleSortToggle = () => {
    const newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    setSortOrder(newOrder);
    setPage(1);
    setFilters((prev) => ({ ...prev, sort_order: newOrder, page: 1 }));
  };

  const handleCreateOrUpdate = (data: {
    transaction_date: string;
    project_name?: string;
    net_value: number;
    vat?: number;
    bank_charge?: number;
    vendor?: string;
    description?: string;
  }) => {
    if (editingTxn) {
      updateTransaction.mutate(
        { accountId: accountId!, txnId: editingTxn.transactionId, data },
        { onSuccess: () => { setShowTxnModal(false); setEditingTxn(null); } },
      );
    } else {
      createTransaction.mutate(
        { accountId: accountId!, data },
        { onSuccess: () => { setShowTxnModal(false); } },
      );
    }
  };

  const handleRowClick = (txn: TransactionResponse) => {
    setEditingTxn(txn);
    setShowTxnModal(true);
  };

  const handleImport = async (formData: FormData) => {
    const result = await importTransactions.mutateAsync({ accountId: accountId!, formData });
    setImportResult({
      accountsCreated: 0,
      transactionsImported: result.transactionsImported,
      sheets: [],
    });
  };

  if (accountLoading) {
    return <div className="flex h-full items-center justify-center text-gray-400">{t('common:loading')}</div>;
  }

  if (!account) {
    return <div className="flex h-full items-center justify-center text-gray-400">Account not found</div>;
  }

  const totalCount = txnResult?.pagination?.totalCount ?? 0;
  const totalPages = txnResult?.pagination?.totalPages ?? 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/accounting')}
            className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('accounting:backToAccounts')}
          </button>

          {/* Account Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{account.bankName}</h1>
                {account.branchName && (
                  <p className="text-sm text-gray-500">{account.branchName}</p>
                )}
                <p className="mt-1 font-mono text-sm text-gray-600">{account.accountNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{t('accounting:currentBalance')}</p>
                <p className={`text-2xl font-bold ${account.currentBalance >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                  {formatCurrency(account.currentBalance, account.currency)} {account.currency}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-4 flex gap-1 rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'transactions' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <List className="h-4 w-4" />
              {t('accounting:transactions')}
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'stats' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              {t('accounting:stats.title', { defaultValue: '통계' })}
            </button>
            <button
              onClick={() => setActiveTab('analysis')}
              className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'analysis' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              {t('accounting:analysis.title', { defaultValue: '분석' })}
            </button>
          </div>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && <AccountStatsSection accountId={accountId!} currency={account.currency} />}

        {/* Analysis Tab */}
        {activeTab === 'analysis' && <AccountAnalysisSection accountId={accountId!} currency={account.currency} />}

        {/* Filters (transactions tab only) */}
        {activeTab === 'transactions' && <>
        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:dateFrom')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:dateTo')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:vendor')}</label>
              <input
                type="text"
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder={t('accounting:vendor')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:description')}</label>
              <input
                type="text"
                value={descriptionFilter}
                onChange={(e) => setDescriptionFilter(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
                placeholder={t('accounting:description')}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:inOutFilter')}</label>
              <select
                value={flowType}
                onChange={(e) => setFlowType(e.target.value as 'ALL' | 'DEPOSIT' | 'WITHDRAWAL')}
                className="w-36 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">{t('common:all')}</option>
                <option value="DEPOSIT">{t('accounting:deposit')}</option>
                <option value="WITHDRAWAL">{t('accounting:withdrawal')}</option>
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('accounting:search')}
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              {t('accounting:reset')}
            </button>
          </div>
        </div>

        {/* Actions row */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSortToggle}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {t('accounting:transactionDate')} {sortOrder === 'ASC' ? '↑' : '↓'}
            </button>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-gray-500">{t('accounting:rowsPerPage')}</label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-600 focus:border-indigo-500 focus:outline-none"
              >
                {PAGE_SIZE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              <FileSpreadsheet className="h-4 w-4" />
              {t('accounting:importExcel')}
            </button>
            <button
              onClick={() => {
                setEditingTxn(null);
                setShowTxnModal(true);
              }}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('accounting:addTransaction')}
            </button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="rounded-xl border border-gray-200 bg-white">
          {txnLoading ? (
            <div className="py-12 text-center text-gray-400">{t('common:loading')}</div>
          ) : (
            <TransactionTable
              transactions={txnResult?.data || []}
              currency={account.currency}
              onRowClick={handleRowClick}
            />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {((page - 1) * pageSize + 1).toLocaleString()}–{Math.min(page * pageSize, totalCount).toLocaleString()} / {totalCount.toLocaleString()} {t('accounting:transactions')}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === 'string' ? (
                      <span key={`ellipsis-${idx}`} className="px-1 text-xs text-gray-400">...</span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => handlePageChange(item)}
                        className={`min-w-[28px] rounded px-1.5 py-0.5 text-xs font-medium ${
                          item === page
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page >= totalPages}
                  className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:text-gray-300 disabled:hover:bg-transparent"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        )}
        </>}
      </div>

      {/* Modals */}
      <TransactionFormModal
        isOpen={showTxnModal}
        onClose={() => { setShowTxnModal(false); setEditingTxn(null); }}
        onSubmit={handleCreateOrUpdate}
        editingTransaction={editingTxn}
      />

      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => { setShowImportModal(false); setImportResult(null); }}
        onImport={handleImport}
        isLoading={importTransactions.isPending}
        result={importResult}
      />
    </div>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function AccountAnalysisSection({ accountId }: { accountId: string; currency: string }) {
  const { t } = useTranslation(['accounting', 'common']);
  const [analysisText, setAnalysisText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [showPromptManager, setShowPromptManager] = useState(false);
  const [viewingReport, setViewingReport] = useState<AnalysisReportResponse | null>(null);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const { data: reports = [], isLoading: reportsLoading } = useAnalysisReports(accountId);
  const { data: prompts = [] } = useAnalysisPrompts();
  const saveReport = useSaveAnalysisReport();
  const deleteReport = useDeleteAnalysisReport();

  const handleAnalysis = async () => {
    setIsLoading(true);
    setAnalysisText('');
    setViewingReport(null);

    try {
      const entityId = (await import('@/domain/hr/store/entity.store')).useEntityStore.getState().currentEntity?.entityId;
      const params = new URLSearchParams();
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      if (selectedPromptId) params.set('prompt_id', selectedPromptId);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/accounts/analysis/generate/${accountId}${qs}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(entityId ? { 'X-Entity-Id': entityId } : {}),
        },
        credentials: 'include',
      });

      if (!response.ok || !response.body) throw new Error('AI analysis failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'content' && data.content) {
                accumulated += data.content;
                setAnalysisText(accumulated);
              }
            } catch { /* skip */ }
          }
        }
      }
      setIsLoading(false);
    } catch {
      toast.error(t('common:errors.E9001', { defaultValue: '오류가 발생했습니다' }));
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!analysisText || !saveTitle.trim()) return;
    saveReport.mutate(
      {
        accountId,
        data: {
          title: saveTitle.trim(),
          content: analysisText,
          date_from: dateFrom || undefined,
          date_to: dateTo || undefined,
          prompt_id: selectedPromptId || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('accounting:analysis.saved', { defaultValue: '리포트가 저장되었습니다' }));
          setShowSaveDialog(false);
          setSaveTitle('');
        },
      },
    );
  };

  const handleDeleteReport = (reportId: string) => {
    if (!confirm(t('accounting:analysis.deleteConfirm', { defaultValue: '이 리포트를 삭제하시겠습니까?' }))) return;
    deleteReport.mutate({ accountId, reportId }, {
      onSuccess: () => {
        if (viewingReport?.reportId === reportId) {
          setViewingReport(null);
          setAnalysisText('');
        }
      },
    });
  };

  const handleViewReport = (report: AnalysisReportResponse) => {
    setViewingReport(report);
    setAnalysisText(report.content);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">
            {t('accounting:analysis.title', { defaultValue: 'AI 입출금 분석' })}
          </h3>
          <button
            onClick={() => setShowPromptManager(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
          >
            <Settings className="h-3.5 w-3.5" />
            {t('accounting:analysis.promptManage', { defaultValue: '프롬프트 관리' })}
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500">
          {t('accounting:analysis.description', { defaultValue: '거래 내역을 AI가 분석하여 종합 리포트를 생성합니다.' })}
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:dateFrom')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{t('accounting:dateTo')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none" />
          </div>
          {prompts.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500">
                {t('accounting:analysis.prompt', { defaultValue: '프롬프트' })}
              </label>
              <select value={selectedPromptId} onChange={(e) => setSelectedPromptId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none">
                <option value="">{t('accounting:analysis.defaultPrompt', { defaultValue: '기본 프롬프트' })}</option>
                {prompts.map((p) => (
                  <option key={p.promptId} value={p.promptId}>
                    {p.name}{p.isDefault ? ' *' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button onClick={handleAnalysis} disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {isLoading
              ? t('accounting:analysis.generating', { defaultValue: '분석 중...' })
              : t('accounting:analysis.generate', { defaultValue: '분석 리포트 생성' })}
          </button>
        </div>
      </div>

      {/* Analysis result */}
      {analysisText && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-5">
          {!isLoading && !viewingReport && (
            <div className="mb-3 flex justify-end">
              {showSaveDialog ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)}
                    placeholder={t('accounting:analysis.reportTitle', { defaultValue: '리포트 제목' })}
                    className="rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-indigo-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()} autoFocus />
                  <button onClick={handleSave} disabled={!saveTitle.trim() || saveReport.isPending}
                    className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setShowSaveDialog(false); setSaveTitle(''); }}
                    className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-200">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-white px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50">
                  <Save className="h-3.5 w-3.5" />
                  {t('accounting:analysis.save', { defaultValue: '리포트 저장' })}
                </button>
              )}
            </div>
          )}
          {viewingReport && (
            <div className="mb-3 flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-gray-900">{viewingReport.title}</span>
                <span className="ml-2 text-xs text-gray-500">
                  {new Date(viewingReport.createdAt).toLocaleDateString()}
                  {viewingReport.dateFrom && ` | ${viewingReport.dateFrom} ~ ${viewingReport.dateTo || ''}`}
                </span>
              </div>
              <button onClick={() => { setViewingReport(null); setAnalysisText(''); }}
                className="text-xs text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-li:text-gray-700">
            <ReactMarkdown>{analysisText}</ReactMarkdown>
          </div>
          {isLoading && <span className="mt-2 inline-block h-4 w-1 animate-pulse bg-indigo-500" />}
        </div>
      )}

      {/* Saved reports */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">
          <FileText className="mr-1.5 inline h-4 w-4" />
          {t('accounting:analysis.savedReports', { defaultValue: '저장된 리포트' })}
        </h3>
        {reportsLoading ? (
          <p className="py-4 text-center text-sm text-gray-400">{t('common:loading')}</p>
        ) : reports.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">
            {t('accounting:analysis.noReports', { defaultValue: '저장된 리포트가 없습니다' })}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((report) => (
              <div key={report.reportId}
                className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded cursor-pointer"
                onClick={() => handleViewReport(report)}>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{report.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(report.createdAt).toLocaleDateString()}
                    {report.dateFrom && ` | ${report.dateFrom} ~ ${report.dateTo || ''}`}
                  </p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handleDeleteReport(report.reportId); }}
                  className="ml-2 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prompt Manager Modal */}
      {showPromptManager && (
        <PromptManagerModal onClose={() => setShowPromptManager(false)} />
      )}
    </div>
  );
}

function PromptManagerModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation(['accounting', 'common']);
  const { data: prompts = [], isLoading } = useAnalysisPrompts();
  const createPrompt = useCreateAnalysisPrompt();
  const updatePrompt = useUpdateAnalysisPrompt();
  const deletePrompt = useDeleteAnalysisPrompt();

  const [editing, setEditing] = useState<AnalysisPromptResponse | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState({ name: '', systemPrompt: '', userPrompt: '', isDefault: false });

  const handleNew = () => {
    setIsNew(true);
    setEditing(null);
    setForm({
      name: '',
      systemPrompt: `You are a financial analyst specializing in business account transaction analysis.
Analyze the provided bank account transaction data and generate a comprehensive analysis report.
Write your response in Korean. Use markdown formatting.
Be specific with numbers and percentages. Provide actionable insights.`,
      userPrompt: `다음 은행 계좌의 입출금 내역을 분석하여 리포트를 작성해주세요.

## 계좌 정보
- 은행: {{bank_name}}
- 계좌번호: {{account_number}}
- 통화: {{currency}}
- 분석 기간: {{date_range}}
- 총 거래 건수: {{transaction_count}}건

## 요약
- 총 입금: {{total_deposit}} {{currency}}
- 총 출금: {{total_withdrawal}} {{currency}}
- 순 변동: {{net_change}} {{currency}}

## 월별 입출금
{{monthly_data}}

## 주요 거래처 (금액 기준 상위)
{{top_vendors}}

## 주요 대형 거래 (금액 기준 상위 10건)
{{large_transactions}}

위 데이터를 기반으로 분석 리포트를 작성해주세요.`,
      isDefault: false,
    });
  };

  const handleEdit = (prompt: AnalysisPromptResponse) => {
    setEditing(prompt);
    setIsNew(false);
    setForm({
      name: prompt.name,
      systemPrompt: prompt.systemPrompt,
      userPrompt: prompt.userPrompt,
      isDefault: prompt.isDefault,
    });
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (isNew) {
      createPrompt.mutate(
        { name: form.name, system_prompt: form.systemPrompt, user_prompt: form.userPrompt, is_default: form.isDefault },
        { onSuccess: () => { setIsNew(false); setForm({ name: '', systemPrompt: '', userPrompt: '', isDefault: false }); } },
      );
    } else if (editing) {
      updatePrompt.mutate(
        { promptId: editing.promptId, data: { name: form.name, system_prompt: form.systemPrompt, user_prompt: form.userPrompt, is_default: form.isDefault } },
        { onSuccess: () => { setEditing(null); } },
      );
    }
  };

  const handleDelete = (promptId: string) => {
    if (!confirm(t('accounting:analysis.deletePromptConfirm', { defaultValue: '이 프롬프트를 삭제하시겠습니까?' }))) return;
    deletePrompt.mutate(promptId, {
      onSuccess: () => { if (editing?.promptId === promptId) setEditing(null); },
    });
  };

  const showForm = isNew || editing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="relative mx-4 flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('accounting:analysis.promptManage', { defaultValue: '프롬프트 관리' })}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleNew}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
              <Plus className="h-4 w-4" />
              {t('common:create', { defaultValue: '추가' })}
            </button>
            <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left: prompt list */}
          <div className="w-64 shrink-0 overflow-y-auto border-r border-gray-200 p-4">
            {isLoading ? (
              <p className="py-4 text-center text-sm text-gray-400">{t('common:loading')}</p>
            ) : prompts.length === 0 && !isNew ? (
              <p className="py-4 text-center text-sm text-gray-400">
                {t('accounting:analysis.noPrompts', { defaultValue: '등록된 프롬프트가 없습니다' })}
              </p>
            ) : (
              <div className="space-y-1">
                {prompts.map((p) => (
                  <div key={p.promptId}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm cursor-pointer ${
                      editing?.promptId === p.promptId ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => handleEdit(p)}>
                    <div className="flex items-center gap-1.5 truncate">
                      {p.isDefault && <Star className="h-3 w-3 shrink-0 text-amber-500" />}
                      <span className="truncate">{p.name}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(p.promptId); }}
                      className="shrink-0 rounded p-0.5 text-gray-400 hover:text-red-500">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: form */}
          <div className="flex-1 overflow-y-auto p-5">
            {showForm ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t('accounting:analysis.promptName', { defaultValue: '프롬프트 이름' })}
                  </label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="is-default" checked={form.isDefault}
                    onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="rounded border-gray-300" />
                  <label htmlFor="is-default" className="text-sm text-gray-700">
                    {t('accounting:analysis.setDefault', { defaultValue: '기본 프롬프트로 설정' })}
                  </label>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    {t('accounting:analysis.systemPrompt', { defaultValue: '시스템 프롬프트' })}
                  </label>
                  <textarea value={form.systemPrompt} rows={4}
                    onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-xs font-medium text-gray-500">
                      {t('accounting:analysis.userPrompt', { defaultValue: '사용자 프롬프트' })}
                    </label>
                    <span className="text-[10px] text-gray-400">
                      {'{{bank_name}} {{account_number}} {{currency}} {{date_range}} {{transaction_count}} {{total_deposit}} {{total_withdrawal}} {{net_change}} {{monthly_data}} {{top_vendors}} {{large_transactions}}'}
                    </span>
                  </div>
                  <textarea value={form.userPrompt} rows={12}
                    onChange={(e) => setForm((f) => ({ ...f, userPrompt: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-xs focus:border-indigo-500 focus:outline-none" />
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => { setEditing(null); setIsNew(false); }}
                    className="rounded-lg px-4 py-1.5 text-sm text-gray-500 hover:bg-gray-100">
                    {t('common:cancel', { defaultValue: '취소' })}
                  </button>
                  <button onClick={handleSave} disabled={!form.name.trim() || createPrompt.isPending || updatePrompt.isPending}
                    className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                    {t('common:save', { defaultValue: '저장' })}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-400">
                {t('accounting:analysis.selectPromptHint', { defaultValue: '프롬프트를 선택하거나 새로 추가하세요' })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountStatsSection({ accountId, currency }: { accountId: string; currency: string }) {
  const { t } = useTranslation(['accounting']);

  const now = new Date();
  const endMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const startMonth = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;

  const { data: monthlyStats = [] } = useMonthlyStats(accountId, { start_month: startMonth, end_month: endMonth });
  const { data: topVendors = [] } = useTopVendors(accountId, { start_month: startMonth, end_month: endMonth });

  const totalDeposit = monthlyStats.reduce((s, m) => s + m.deposit, 0);
  const totalWithdrawal = monthlyStats.reduce((s, m) => s + m.withdrawal, 0);
  const totalNet = totalDeposit - totalWithdrawal;

  const fmt = (v: number) => new Intl.NumberFormat().format(v) + ` ${currency}`;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">{t('accounting:stats.totalDeposit', { defaultValue: '총 입금' })}</p>
          <p className="mt-1 text-lg font-bold text-green-600">{fmt(totalDeposit)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">{t('accounting:stats.totalWithdrawal', { defaultValue: '총 출금' })}</p>
          <p className="mt-1 text-lg font-bold text-red-600">{fmt(totalWithdrawal)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-500">{t('accounting:stats.net', { defaultValue: '순이익' })}</p>
          <p className={`mt-1 text-lg font-bold ${totalNet >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
            {fmt(totalNet)}
          </p>
        </div>
      </div>

      {/* Monthly chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">
          {t('accounting:stats.monthly', { defaultValue: '월별 입출금' })}
        </h3>
        {monthlyStats.length > 0 ? (
          <MonthlyChart data={monthlyStats} currency={currency} />
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">{t('accounting:noTransactions')}</p>
        )}
      </div>

      {/* Balance Trend */}
      {monthlyStats.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="mb-3 font-semibold text-gray-900">
            {t('accounting:stats.balanceTrend', { defaultValue: '잔액 추이' })}
          </h3>
          <BalanceTrendChart data={monthlyStats} currency={currency} />
        </div>
      )}

      {/* Top vendors */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-3 font-semibold text-gray-900">
          {t('accounting:stats.topVendors', { defaultValue: '주요 거래처 (출금 기준)' })}
        </h3>
        <TopVendorsTable data={topVendors} currency={currency} />
      </div>
    </div>
  );
}
