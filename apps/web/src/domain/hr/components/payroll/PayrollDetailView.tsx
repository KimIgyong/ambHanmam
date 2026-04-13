import { useTranslation } from 'react-i18next';
import { HrPayrollDetailResponse } from '@amb/types';

interface Props {
  detail: HrPayrollDetailResponse;
}

const formatVnd = (amount: number) => amount.toLocaleString('vi-VN');

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string | number; bold?: boolean }) {
  const formatted = typeof value === 'number' ? formatVnd(value) : value;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${bold ? 'font-semibold text-gray-900' : 'text-gray-800'}`}>
        {formatted}
      </span>
    </div>
  );
}

export default function PayrollDetailView({ detail }: Props) {
  const { t } = useTranslation(['hr', 'common']);

  return (
    <div className="space-y-4">
      {/* Employee info */}
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{detail.employeeName}</p>
          <p className="text-xs text-gray-500">
            {detail.employeeCode} &middot; {detail.department}
          </p>
        </div>
      </div>

      {/* Working days */}
      <SectionCard title={t('hr:payroll.detail.workingDays')}>
        <Row label={t('hr:payroll.detail.standardDays')} value={detail.standardWorkingDays} />
        <Row label={t('hr:payroll.detail.actualDays')} value={detail.actualWorkingDays} />
      </SectionCard>

      {/* Base salary */}
      <SectionCard title={t('hr:payroll.detail.baseSalary')}>
        <Row label={t('hr:payroll.detail.contractSalary')} value={detail.baseSalary} />
        <Row label={t('hr:payroll.detail.actualSalary')} value={detail.actualSalary} bold />
      </SectionCard>

      {/* Allowances */}
      <SectionCard title={t('hr:payroll.detail.allowances')}>
        <Row label={t('hr:payroll.detail.mealAllowance')} value={detail.mealAllowance} />
        <Row label={t('hr:payroll.detail.cskhAllowance')} value={detail.cskhAllowance} />
        <Row label={t('hr:payroll.detail.fuelAllowance')} value={detail.fuelAllowance} />
        <Row label={t('hr:payroll.detail.otherAllowance')} value={detail.otherAllowance} />
        <div className="mt-1 border-t border-gray-100 pt-1">
          <Row label={t('hr:payroll.detail.totalIncome')} value={detail.totalIncome} bold />
        </div>
      </SectionCard>

      {/* Extras */}
      <SectionCard title={t('hr:payroll.detail.extras')}>
        <Row label={t('hr:payroll.detail.overtime')} value={detail.otAmount} />
        <Row label={t('hr:payroll.detail.annualLeave')} value={detail.annualLeaveSalary} />
        <Row label={t('hr:payroll.detail.bonus')} value={detail.bonus} />
        <Row label={t('hr:payroll.detail.adjustment')} value={detail.adjustment} />
      </SectionCard>

      {/* Company insurance */}
      <SectionCard title={t('hr:payroll.detail.companyInsurance')}>
        <Row label={t('hr:payroll.detail.siSickness')} value={detail.companySiSickness} />
        <Row label={t('hr:payroll.detail.siAccident')} value={detail.companySiAccident} />
        <Row label={t('hr:payroll.detail.siRetirement')} value={detail.companySiRetirement} />
        <Row label={t('hr:payroll.detail.hi')} value={detail.companyHi} />
        <Row label={t('hr:payroll.detail.ui')} value={detail.companyUi} />
        <Row label={t('hr:payroll.detail.union')} value={detail.companyUnion} />
        <div className="mt-1 border-t border-gray-100 pt-1">
          <Row label={t('hr:payroll.detail.totalCompanyIns')} value={detail.totalCompanyInsurance} bold />
        </div>
      </SectionCard>

      {/* Employee insurance */}
      <SectionCard title={t('hr:payroll.detail.employeeInsurance')}>
        <Row label={t('hr:payroll.detail.empSi')} value={detail.employeeSi} />
        <Row label={t('hr:payroll.detail.empHi')} value={detail.employeeHi} />
        <Row label={t('hr:payroll.detail.empUi')} value={detail.employeeUi} />
        <div className="mt-1 border-t border-gray-100 pt-1">
          <Row label={t('hr:payroll.detail.totalEmployeeIns')} value={detail.totalEmployeeInsurance} bold />
        </div>
      </SectionCard>

      {/* Tax calculation */}
      <SectionCard title={t('hr:payroll.detail.taxCalculation')}>
        <Row label={t('hr:payroll.detail.selfDeduction')} value={detail.selfDeduction} />
        <Row
          label={t('hr:payroll.detail.dependentDeduction', { count: detail.numDependents })}
          value={detail.dependentDeduction}
        />
        <Row label={t('hr:payroll.detail.taxExemptIncome')} value={detail.taxExemptIncome} />
        <Row label={t('hr:payroll.detail.taxableIncome')} value={detail.taxableIncome} />
        <div className="mt-1 border-t border-gray-100 pt-1">
          <Row label={t('hr:payroll.detail.pit')} value={detail.pitAmount} bold />
        </div>
      </SectionCard>

      {/* Net salary */}
      <div className="rounded-lg border-2 border-teal-200 bg-teal-50 px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">{t('hr:payroll.detail.netSalary')}</span>
          <span className="text-lg font-bold text-teal-700">{formatVnd(detail.netSalaryVnd)}</span>
        </div>
        {detail.netSalaryUsd > 0 && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-xs text-gray-500">USD</span>
            <span className="text-sm font-medium text-gray-600">
              ${detail.netSalaryUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
