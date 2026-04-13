import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileBarChart, Download, FileText, Sheet, Users, Loader2, DollarSign, Calculator } from 'lucide-react';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useEntityStore } from '../store/entity.store';
import { usePayrollPeriods, usePayrollDetails } from '../hooks/usePayroll';
import {
  useDownloadPayslip,
  useDownloadPayrollRegister,
  useDownloadInsuranceReport,
  useDownloadPitReport,
  useDownloadEmployeeRoster,
  useDownloadKrPayslip,
  useDownloadKrPayrollRegister,
  useDownloadKrInsuranceSummary,
  useDownloadBusinessIncomeRegister,
  useDownloadTaxAccountantExcel,
} from '../hooks/useHrReports';

const currentYearMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function HrReportsPage() {
  const { t } = useTranslation(['hr', 'common']);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const isKrEntity = currentEntity?.country === 'KR';

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [bipYearMonth, setBipYearMonth] = useState(currentYearMonth());

  const { data: periods } = usePayrollPeriods();
  const { data: details } = usePayrollDetails(selectedPeriodId);

  // VN hooks
  const downloadPayslip = useDownloadPayslip();
  const downloadPayrollRegister = useDownloadPayrollRegister();
  const downloadInsurance = useDownloadInsuranceReport();
  const downloadPit = useDownloadPitReport();
  const downloadRoster = useDownloadEmployeeRoster();

  // KR hooks
  const downloadKrPayslip = useDownloadKrPayslip();
  const downloadKrPayrollRegister = useDownloadKrPayrollRegister();
  const downloadKrInsuranceSummary = useDownloadKrInsuranceSummary();
  const downloadBipRegister = useDownloadBusinessIncomeRegister();
  const downloadTaxAccountant = useDownloadTaxAccountantExcel();

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-gray-500">{t('common:noPermission')}</p>
      </div>
    );
  }

  const finalizedPeriods = periods?.filter((p) => p.status === 'FINALIZED') || [];

  // Year-month from selected period for tax accountant
  const selectedPeriod = periods?.find((p) => p.periodId === selectedPeriodId);
  const periodYearMonth = selectedPeriod
    ? `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, '0')}`
    : '';

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <FileBarChart className="h-6 w-6 text-teal-500" />
          <div>
            <h1 className="text-lg font-bold text-gray-900">{t('hr:reports.title')}</h1>
            <p className="text-sm text-gray-500">{t('hr:reports.subtitle')}</p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {t('hr:reports.selectPeriod')}
          </label>
          <select
            value={selectedPeriodId}
            onChange={(e) => {
              setSelectedPeriodId(e.target.value);
              setSelectedEmpId('');
            }}
            className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">{t('hr:reports.selectPeriod')}...</option>
            {finalizedPeriods.map((p) => (
              <option key={p.periodId} value={p.periodId}>
                {String(p.month).padStart(2, '0')}/{p.year}
              </option>
            ))}
          </select>
          {periods && finalizedPeriods.length === 0 && (
            <p className="mt-2 text-xs text-gray-400">{t('hr:reports.noPeriods')}</p>
          )}
        </div>

        {isKrEntity ? (
          <KrReportsSection
            t={t}
            selectedPeriodId={selectedPeriodId}
            selectedEmpId={selectedEmpId}
            setSelectedEmpId={setSelectedEmpId}
            details={details}
            bipYearMonth={bipYearMonth}
            setBipYearMonth={setBipYearMonth}
            periodYearMonth={periodYearMonth}
            downloadKrPayslip={downloadKrPayslip}
            downloadKrPayrollRegister={downloadKrPayrollRegister}
            downloadKrInsuranceSummary={downloadKrInsuranceSummary}
            downloadBipRegister={downloadBipRegister}
            downloadTaxAccountant={downloadTaxAccountant}
            downloadRoster={downloadRoster}
          />
        ) : (
          <VnReportsSection
            t={t}
            selectedPeriodId={selectedPeriodId}
            selectedEmpId={selectedEmpId}
            setSelectedEmpId={setSelectedEmpId}
            details={details}
            downloadPayslip={downloadPayslip}
            downloadPayrollRegister={downloadPayrollRegister}
            downloadInsurance={downloadInsurance}
            downloadPit={downloadPit}
            downloadRoster={downloadRoster}
          />
        )}
      </div>
    </div>
  );
}

// ── VN Reports Section ──
function VnReportsSection({
  t, selectedPeriodId, selectedEmpId, setSelectedEmpId, details,
  downloadPayslip, downloadPayrollRegister, downloadInsurance, downloadPit, downloadRoster,
}: {
  t: (key: string) => string;
  selectedPeriodId: string;
  selectedEmpId: string;
  setSelectedEmpId: (id: string) => void;
  details: { employeeId: string; employeeCode: string; employeeName: string }[] | undefined;
  downloadPayslip: ReturnType<typeof useDownloadPayslip>;
  downloadPayrollRegister: ReturnType<typeof useDownloadPayrollRegister>;
  downloadInsurance: ReturnType<typeof useDownloadInsuranceReport>;
  downloadPit: ReturnType<typeof useDownloadPitReport>;
  downloadRoster: ReturnType<typeof useDownloadEmployeeRoster>;
}) {
  return (
    <>
      {/* Period Reports */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('hr:reports.periodReports')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Payslip */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">{t('hr:reports.payslip')}</h3>
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">PDF</span>
            </div>
            <p className="mb-3 text-xs text-gray-500">{t('hr:reports.payslipDesc')}</p>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              disabled={!selectedPeriodId}
              className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{t('hr:reports.selectEmployeePlaceholder')}</option>
              {details?.map((d) => (
                <option key={d.employeeId} value={d.employeeId}>
                  {d.employeeCode} - {d.employeeName}
                </option>
              ))}
            </select>
            <button
              onClick={() => downloadPayslip.mutate({ periodId: selectedPeriodId, empId: selectedEmpId })}
              disabled={!selectedPeriodId || !selectedEmpId || downloadPayslip.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {downloadPayslip.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloadPayslip.isPending ? t('hr:reports.downloading') : t('hr:reports.download')}
            </button>
          </div>

          <ReportCard
            icon={<Sheet className="h-5 w-5 text-green-600" />}
            title={t('hr:reports.payrollRegister')}
            description={t('hr:reports.payrollRegisterDesc')}
            format="XLSX" formatColor="green"
            disabled={!selectedPeriodId}
            loading={downloadPayrollRegister.isPending}
            onDownload={() => downloadPayrollRegister.mutate(selectedPeriodId)}
            t={t}
          />
          <ReportCard
            icon={<Sheet className="h-5 w-5 text-blue-600" />}
            title={t('hr:reports.insuranceReport')}
            description={t('hr:reports.insuranceReportDesc')}
            format="XLSX" formatColor="blue"
            disabled={!selectedPeriodId}
            loading={downloadInsurance.isPending}
            onDownload={() => downloadInsurance.mutate(selectedPeriodId)}
            t={t}
          />
          <ReportCard
            icon={<Sheet className="h-5 w-5 text-orange-600" />}
            title={t('hr:reports.pitReport')}
            description={t('hr:reports.pitReportDesc')}
            format="XLSX" formatColor="orange"
            disabled={!selectedPeriodId}
            loading={downloadPit.isPending}
            onDownload={() => downloadPit.mutate(selectedPeriodId)}
            t={t}
          />
        </div>
      </div>

      {/* General Reports */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('hr:reports.generalReports')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReportCard
            icon={<Users className="h-5 w-5 text-teal-600" />}
            title={t('hr:reports.employeeRoster')}
            description={t('hr:reports.employeeRosterDesc')}
            format="XLSX" formatColor="teal"
            disabled={false}
            loading={downloadRoster.isPending}
            onDownload={() => downloadRoster.mutate()}
            t={t}
          />
        </div>
      </div>
    </>
  );
}

// ── KR Reports Section ──
function KrReportsSection({
  t, selectedPeriodId, selectedEmpId, setSelectedEmpId, details,
  bipYearMonth, setBipYearMonth, periodYearMonth,
  downloadKrPayslip, downloadKrPayrollRegister, downloadKrInsuranceSummary,
  downloadBipRegister, downloadTaxAccountant, downloadRoster,
}: {
  t: (key: string) => string;
  selectedPeriodId: string;
  selectedEmpId: string;
  setSelectedEmpId: (id: string) => void;
  details: { employeeId: string; employeeCode: string; employeeName: string }[] | undefined;
  bipYearMonth: string;
  setBipYearMonth: (ym: string) => void;
  periodYearMonth: string;
  downloadKrPayslip: ReturnType<typeof useDownloadKrPayslip>;
  downloadKrPayrollRegister: ReturnType<typeof useDownloadKrPayrollRegister>;
  downloadKrInsuranceSummary: ReturnType<typeof useDownloadKrInsuranceSummary>;
  downloadBipRegister: ReturnType<typeof useDownloadBusinessIncomeRegister>;
  downloadTaxAccountant: ReturnType<typeof useDownloadTaxAccountantExcel>;
  downloadRoster: ReturnType<typeof useDownloadEmployeeRoster>;
}) {
  return (
    <>
      {/* Period Reports */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('hr:reports.periodReports')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* KR Payslip */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">{t('hr:reports.krPayslip')}</h3>
              <span className="rounded bg-red-50 px-1.5 py-0.5 text-xs text-red-600">PDF</span>
            </div>
            <p className="mb-3 text-xs text-gray-500">{t('hr:reports.krPayslipDesc')}</p>
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              disabled={!selectedPeriodId}
              className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">{t('hr:reports.selectEmployeePlaceholder')}</option>
              {details?.map((d) => (
                <option key={d.employeeId} value={d.employeeId}>
                  {d.employeeCode} - {d.employeeName}
                </option>
              ))}
            </select>
            <button
              onClick={() => downloadKrPayslip.mutate({ periodId: selectedPeriodId, empId: selectedEmpId })}
              disabled={!selectedPeriodId || !selectedEmpId || downloadKrPayslip.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {downloadKrPayslip.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloadKrPayslip.isPending ? t('hr:reports.downloading') : t('hr:reports.download')}
            </button>
          </div>

          {/* KR Payroll Register */}
          <ReportCard
            icon={<Sheet className="h-5 w-5 text-green-600" />}
            title={t('hr:reports.krPayrollRegister')}
            description={t('hr:reports.krPayrollRegisterDesc')}
            format="XLSX" formatColor="green"
            disabled={!selectedPeriodId}
            loading={downloadKrPayrollRegister.isPending}
            onDownload={() => downloadKrPayrollRegister.mutate(selectedPeriodId)}
            t={t}
          />

          {/* 4대보험 집계표 */}
          <ReportCard
            icon={<Sheet className="h-5 w-5 text-blue-600" />}
            title={t('hr:reports.krInsuranceSummary')}
            description={t('hr:reports.krInsuranceSummaryDesc')}
            format="XLSX" formatColor="blue"
            disabled={!selectedPeriodId}
            loading={downloadKrInsuranceSummary.isPending}
            onDownload={() => downloadKrInsuranceSummary.mutate(selectedPeriodId)}
            t={t}
          />

          {/* 세무사 연동 Excel */}
          <ReportCard
            icon={<Calculator className="h-5 w-5 text-orange-600" />}
            title={t('hr:reports.taxAccountant')}
            description={t('hr:reports.taxAccountantDesc')}
            format="XLSX" formatColor="orange"
            disabled={!selectedPeriodId}
            loading={downloadTaxAccountant.isPending}
            onDownload={() => downloadTaxAccountant.mutate({ periodId: selectedPeriodId, yearMonth: periodYearMonth })}
            t={t}
          />
        </div>
      </div>

      {/* Business Income Report */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('hr:reports.bipReports')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">{t('hr:reports.bipRegister')}</h3>
              <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600">XLSX</span>
            </div>
            <p className="mb-3 text-xs text-gray-500">{t('hr:reports.bipRegisterDesc')}</p>
            <input
              type="month"
              value={bipYearMonth}
              onChange={(e) => setBipYearMonth(e.target.value)}
              className="mb-3 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
            />
            <button
              onClick={() => downloadBipRegister.mutate(bipYearMonth)}
              disabled={!bipYearMonth || downloadBipRegister.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              {downloadBipRegister.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloadBipRegister.isPending ? t('hr:reports.downloading') : t('hr:reports.download')}
            </button>
          </div>
        </div>
      </div>

      {/* General Reports */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-gray-700">
          {t('hr:reports.generalReports')}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ReportCard
            icon={<Users className="h-5 w-5 text-teal-600" />}
            title={t('hr:reports.employeeRoster')}
            description={t('hr:reports.employeeRosterDesc')}
            format="XLSX" formatColor="teal"
            disabled={false}
            loading={downloadRoster.isPending}
            onDownload={() => downloadRoster.mutate()}
            t={t}
          />
        </div>
      </div>
    </>
  );
}

// ── Reusable Report Card ──
function ReportCard({
  icon, title, description, format, formatColor,
  disabled, loading, onDownload, t,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  format: string;
  formatColor: string;
  disabled: boolean;
  loading: boolean;
  onDownload: () => void;
  t: (key: string) => string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    teal: 'bg-teal-50 text-teal-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <span className={`rounded px-1.5 py-0.5 text-xs ${colorMap[formatColor] || ''}`}>
          {format}
        </span>
      </div>
      <p className="mb-3 text-xs text-gray-500">{description}</p>
      <button
        onClick={onDownload}
        disabled={disabled || loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-700 disabled:bg-gray-300 disabled:text-gray-500"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        {loading ? t('hr:reports.downloading') : t('hr:reports.download')}
      </button>
    </div>
  );
}
