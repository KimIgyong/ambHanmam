import { useMutation } from '@tanstack/react-query';
import { hrReportApiService } from '../service/hr-report.service';

// ── VN Reports ──

export const useDownloadPayslip = () => {
  return useMutation({
    mutationFn: ({ periodId, empId }: { periodId: string; empId: string }) =>
      hrReportApiService.downloadPayslip(periodId, empId),
  });
};

export const useDownloadPayrollRegister = () => {
  return useMutation({
    mutationFn: (periodId: string) =>
      hrReportApiService.downloadPayrollRegister(periodId),
  });
};

export const useDownloadInsuranceReport = () => {
  return useMutation({
    mutationFn: (periodId: string) =>
      hrReportApiService.downloadInsuranceReport(periodId),
  });
};

export const useDownloadPitReport = () => {
  return useMutation({
    mutationFn: (periodId: string) =>
      hrReportApiService.downloadPitReport(periodId),
  });
};

export const useDownloadEmployeeRoster = () => {
  return useMutation({
    mutationFn: () => hrReportApiService.downloadEmployeeRoster(),
  });
};

// ── KR Reports ──

export const useDownloadKrPayslip = () => {
  return useMutation({
    mutationFn: ({ periodId, empId }: { periodId: string; empId: string }) =>
      hrReportApiService.downloadKrPayslip(periodId, empId),
  });
};

export const useDownloadKrPayrollRegister = () => {
  return useMutation({
    mutationFn: (periodId: string) =>
      hrReportApiService.downloadKrPayrollRegister(periodId),
  });
};

export const useDownloadKrInsuranceSummary = () => {
  return useMutation({
    mutationFn: (periodId: string) =>
      hrReportApiService.downloadKrInsuranceSummary(periodId),
  });
};

export const useDownloadBusinessIncomeRegister = () => {
  return useMutation({
    mutationFn: (yearMonth: string) =>
      hrReportApiService.downloadBusinessIncomeRegister(yearMonth),
  });
};

export const useDownloadTaxAccountantExcel = () => {
  return useMutation({
    mutationFn: ({ periodId, yearMonth }: { periodId: string; yearMonth: string }) =>
      hrReportApiService.downloadTaxAccountantExcel(periodId, yearMonth),
  });
};
