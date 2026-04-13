import { apiClient } from '@/lib/api-client';

class HrReportApiService {
  private readonly basePath = '/hr/reports';
  private readonly krBasePath = '/hr/kr-reports';

  // ── VN Reports ──

  downloadPayslip = async (periodId: string, empId: string) => {
    const response = await apiClient.get(
      `${this.basePath}/payslip/${periodId}/${empId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `payslip-${periodId}-${empId}.pdf`, 'application/pdf');
  };

  downloadPayrollRegister = async (periodId: string) => {
    const response = await apiClient.get(
      `${this.basePath}/payroll-register/${periodId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `payroll-register-${periodId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  downloadInsuranceReport = async (periodId: string) => {
    const response = await apiClient.get(
      `${this.basePath}/insurance/${periodId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `insurance-report-${periodId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  downloadPitReport = async (periodId: string) => {
    const response = await apiClient.get(
      `${this.basePath}/pit/${periodId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `pit-report-${periodId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  downloadEmployeeRoster = async () => {
    const response = await apiClient.get(
      `${this.basePath}/employee-roster`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, 'employee-roster.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  // ── KR Reports ──

  downloadKrPayslip = async (periodId: string, empId: string) => {
    const response = await apiClient.get(
      `${this.krBasePath}/payslip/${periodId}/${empId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `kr-payslip-${periodId}-${empId}.pdf`, 'application/pdf');
  };

  downloadKrPayrollRegister = async (periodId: string) => {
    const response = await apiClient.get(
      `${this.krBasePath}/payroll-register/${periodId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `kr-payroll-register-${periodId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  downloadKrInsuranceSummary = async (periodId: string) => {
    const response = await apiClient.get(
      `${this.krBasePath}/insurance-summary/${periodId}`,
      { responseType: 'blob' },
    );
    this.downloadBlob(response.data, `kr-insurance-summary-${periodId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  downloadBusinessIncomeRegister = async (yearMonth: string) => {
    const response = await apiClient.get(
      `${this.krBasePath}/business-income-register`,
      { params: { year_month: yearMonth }, responseType: 'blob' },
    );
    this.downloadBlob(response.data, `business-income-${yearMonth}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  downloadTaxAccountantExcel = async (periodId: string, yearMonth: string) => {
    const response = await apiClient.get(
      `${this.krBasePath}/tax-accountant/${periodId}`,
      { params: { year_month: yearMonth }, responseType: 'blob' },
    );
    this.downloadBlob(response.data, `tax-accountant-${periodId}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  // ── Helper ──

  private downloadBlob(data: Blob, filename: string, type: string) {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const hrReportApiService = new HrReportApiService();
