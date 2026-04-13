// HR Entity (Multi-Entity)
export const HR_ENTITY_COUNTRY = {
  KR: 'KR',
  VN: 'VN',
} as const;
export type HrEntityCountry = (typeof HR_ENTITY_COUNTRY)[keyof typeof HR_ENTITY_COUNTRY];

export const HR_ENTITY_ROLE = {
  SYSTEM_ADMIN: 'SYSTEM_ADMIN',
  HR_ADMIN: 'HR_ADMIN',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  CHAIRMAN: 'CHAIRMAN',
  EMPLOYEE: 'EMPLOYEE',
} as const;
export type HrEntityRole = (typeof HR_ENTITY_ROLE)[keyof typeof HR_ENTITY_ROLE];

export interface HrEntityResponse {
  entityId: string;
  code: string;
  name: string;
  nameEn: string | null;
  country: string;
  currency: string;
  registrationNo: string | null;
  address: string | null;
  representative: string | null;
  payDay: number;
  status: string;
  hasStamp?: boolean;
  // Email branding
  emailDisplayName: string | null;
  emailBrandColor: string | null;
  emailLogoUrl: string | null;
}

export interface HrEntityUserRoleResponse {
  id: string;
  entityId: string;
  userId: string;
  role: string;
  status: string;
}

// KR Employee Extension
export const HR_KR_EMPLOYEE_TYPE = {
  REGULAR: 'REGULAR',
  CONTRACT: 'CONTRACT',
  DAILY: 'DAILY',
  REPRESENTATIVE: 'REPRESENTATIVE',
  INTERN: 'INTERN',
} as const;
export type HrKrEmployeeType = (typeof HR_KR_EMPLOYEE_TYPE)[keyof typeof HR_KR_EMPLOYEE_TYPE];

export interface HrEmployeeKrResponse {
  employeeId: string;
  residentNo: string | null;
  employeeType: string;
  pensionNo: string | null;
  healthInsNo: string | null;
  employInsNo: string | null;
  pensionExempt: boolean;
  healthExempt: boolean;
  employExempt: boolean;
  taxDependents: number;
  withholdingRate: string;
  bankAccount: string | null;
}

// Freelancer
export const HR_FREELANCER_STATUS = {
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
  TERMINATED: 'TERMINATED',
} as const;
export type HrFreelancerStatus = (typeof HR_FREELANCER_STATUS)[keyof typeof HR_FREELANCER_STATUS];

export interface HrFreelancerResponse {
  freelancerId: string;
  entityId: string;
  code: string;
  fullName: string;
  nationality: string | null;
  contractStart: string | null;
  contractEnd: string | null;
  contractAmount: number;
  monthlyAmount: number;
  paymentType: string;
  taxRate: number;
  status: string;
}

// Insurance Params KR
export interface HrInsuranceParamsKrResponse {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  pensionRate: number;
  pensionEmp: number;
  pensionUpper: number;
  pensionLower: number;
  healthRate: number;
  healthEmp: number;
  longtermRate: number;
  employRate: number;
  employEmp: number;
}

// Business Income (Freelancer)
export interface HrBusinessIncomeResponse {
  paymentId: string;
  entityId: string;
  freelancerId: string;
  freelancerCode: string;
  freelancerName: string;
  yearMonth: string;
  paymentDate: string | null;
  grossAmount: number;
  weeklyHoliday: number;
  incentive: number;
  totalAmount: number;
  prepaid: number;
  incomeTax: number;
  localTax: number;
  employIns: number;
  accidentIns: number;
  studentLoan: number;
  deductionTotal: number;
  netAmount: number;
  status: string;
}

// KR Payroll Entry
export interface HrPayrollEntryKrResponse {
  entryId: string;
  periodId: string;
  employeeId: string;
  entityId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  // 지급 항목
  basePay: number;
  otExtend: number;
  otHoliday: number;
  otNight: number;
  otEtc: number;
  annualLeave: number;
  bonus: number;
  // 비과세
  vehicleSub: number;
  mealAllow: number;
  childcare: number;
  // 합계
  taxableTotal: number;
  exemptTotal: number;
  grossTotal: number;
  // 4대보험
  pension: number;
  healthIns: number;
  longtermCare: number;
  employIns: number;
  // 보험 정산
  pensionSettle: number;
  healthSettle: number;
  longtermSettle: number;
  employSettle: number;
  // 세금
  incomeTax: number;
  localTax: number;
  yearendTax: number;
  yearendLocal: number;
  // 기타
  prepaid: number;
  // 최종
  deductionTotal: number;
  netPay: number;
}

// Year-End Adjustment
export interface HrYearendAdjustmentResponse {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  taxYear: number;
  settleTax: number;
  settleLocal: number;
  appliedMonth: string | null;
  status: string;
  note: string | null;
}

// HR Employee
export const HR_NATIONALITY = {
  VIETNAMESE: 'VIETNAMESE',
  FOREIGNER: 'FOREIGNER',
} as const;
export type HrNationality = (typeof HR_NATIONALITY)[keyof typeof HR_NATIONALITY];

export const HR_EMPLOYEE_STATUS = {
  OFFICIAL: 'OFFICIAL',
  PROBATION: 'PROBATION',
  PARENTAL_LEAVE: 'PARENTAL_LEAVE',
  TEMPORARY_LEAVE: 'TEMPORARY_LEAVE',
  RESIGNED: 'RESIGNED',
} as const;
export type HrEmployeeStatus = (typeof HR_EMPLOYEE_STATUS)[keyof typeof HR_EMPLOYEE_STATUS];

export const HR_REGION = {
  REGION_1: 'REGION_1',
  REGION_2: 'REGION_2',
  REGION_3: 'REGION_3',
  REGION_4: 'REGION_4',
} as const;
export type HrRegion = (typeof HR_REGION)[keyof typeof HR_REGION];

export const HR_SALARY_TYPE = {
  GROSS: 'GROSS',
  NET: 'NET',
} as const;
export type HrSalaryType = (typeof HR_SALARY_TYPE)[keyof typeof HR_SALARY_TYPE];

export const HR_WORK_SCHEDULE = {
  MON_FRI: 'MON_FRI',
  MON_SAT: 'MON_SAT',
} as const;
export type HrWorkSchedule = (typeof HR_WORK_SCHEDULE)[keyof typeof HR_WORK_SCHEDULE];

export const HR_CONTRACT_TYPE = {
  EMPLOYEE: 'EMPLOYEE',
  FREELANCER: 'FREELANCER',
} as const;
export type HrContractType = (typeof HR_CONTRACT_TYPE)[keyof typeof HR_CONTRACT_TYPE];

export interface HrEmployeeResponse {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  entityId: string | null;
  entityName: string | null;
  nationality: HrNationality;
  cccdNumber: string;
  taxCode: string | null;
  siNumber: string | null;
  hospitalCode: string | null;
  startDate: string;
  endDate: string | null;
  status: HrEmployeeStatus;
  contractType: HrContractType;
  department: string;
  position: string;
  region: HrRegion;
  salaryType: HrSalaryType;
  workSchedule: HrWorkSchedule;
  memo: string | null;
  dependentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface HrDependentResponse {
  dependentId: string;
  employeeId: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  cccdNumber: string | null;
  taxCode: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HrSalaryHistoryResponse {
  salaryHistoryId: string;
  employeeId: string;
  baseSalaryVnd: number;
  baseSalaryKrw: number;
  baseSalaryUsd: number;
  exchangeRateKrw: number;
  exchangeRateUsd: number;
  mealAllowance: number;
  cskhAllowance: number;
  fuelAllowance: number;
  parkingAllowance: number;
  otherAllowance: number;
  effectiveDate: string;
  createdAt: string;
}

// HR Payroll
export const HR_PAYROLL_STATUS = {
  DRAFT: 'DRAFT',
  CALCULATING: 'CALCULATING',
  CALCULATED: 'CALCULATED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED_L1: 'APPROVED_L1',
  APPROVED_L2: 'APPROVED_L2',
  FINALIZED: 'FINALIZED',
} as const;
export type HrPayrollStatus = (typeof HR_PAYROLL_STATUS)[keyof typeof HR_PAYROLL_STATUS];

export const HR_OT_TYPE = {
  WEEKDAY_150: 'WEEKDAY_150',
  WEEKDAY_NIGHT_200: 'WEEKDAY_NIGHT_200',
  WEEKEND_200: 'WEEKEND_200',
  WEEKEND_NIGHT_210: 'WEEKEND_NIGHT_210',
  HOLIDAY_300: 'HOLIDAY_300',
} as const;
export type HrOtType = (typeof HR_OT_TYPE)[keyof typeof HR_OT_TYPE];

export interface HrSystemParamResponse {
  paramId: string;
  paramKey: string;
  paramValue: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  description: string | null;
  createdAt: string;
}

export interface HrHolidayResponse {
  holidayId: string;
  date: string;
  name: string;
  nameVi: string | null;
  year: number;
  createdAt: string;
}

export interface HrPayrollPeriodResponse {
  periodId: string;
  year: number;
  month: number;
  status: HrPayrollStatus;
  paymentDate: string | null;
  employeeCount: number;
  totalGross: number;
  totalInsurance: number;
  totalPit: number;
  totalNet: number;
  createdAt: string;
  updatedAt: string;
}

export interface HrPayrollDetailResponse {
  detailId: string;
  periodId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  // Base
  baseSalary: number;
  actualSalary: number;
  // Allowances
  mealAllowance: number;
  cskhAllowance: number;
  fuelAllowance: number;
  otherAllowance: number;
  totalIncome: number;
  // Insurance bases
  insuranceBaseSi: number;
  insuranceBaseUi: number;
  // Company insurance
  companySiSickness: number;
  companySiAccident: number;
  companySiRetirement: number;
  companyHi: number;
  companyUi: number;
  companyUnion: number;
  totalCompanyInsurance: number;
  // Employee insurance
  employeeSi: number;
  employeeHi: number;
  employeeUi: number;
  totalEmployeeInsurance: number;
  // Tax
  selfDeduction: number;
  dependentDeduction: number;
  numDependents: number;
  taxExemptIncome: number;
  taxableIncome: number;
  pitAmount: number;
  // Extras
  otAmount: number;
  annualLeaveSalary: number;
  bonus: number;
  adjustment: number;
  // Working days
  standardWorkingDays: number;
  actualWorkingDays: number;
  // Result
  netSalaryVnd: number;
  netSalaryUsd: number;
}

// HR Timesheet
export const HR_ATTENDANCE_CODE = {
  FULL_DAY: '8',
  HALF_DAY: '4',
  ANNUAL_LEAVE: 'AL',
  PAID_LEAVE: 'PL',
  UNPAID_LEAVE: 'UP',
  HOLIDAY: 'H',
  REMOTE: 'RE',
  MATERNITY: 'M',
  SICK_LEAVE: 'SL',
  MENSTRUATION_REST: 'MR',
  ABSENT: 'AB',
} as const;
export type HrAttendanceCode = (typeof HR_ATTENDANCE_CODE)[keyof typeof HR_ATTENDANCE_CODE];

export interface HrTimesheetResponse {
  timesheetId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  periodId: string | null;
  workDate: string;
  attendanceCode: string | null;
  workHours: number;
}

export interface HrTimesheetMonthlyResponse {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  entries: Record<string, { attendanceCode: string | null; workHours: number }>;
  summary: {
    workDays: number;
    leaveDays: number;
    holidays: number;
    absentDays: number;
  };
}

// HR Overtime
export const HR_OT_APPROVAL_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type HrOtApprovalStatus = (typeof HR_OT_APPROVAL_STATUS)[keyof typeof HR_OT_APPROVAL_STATUS];

export interface HrOtRecordResponse {
  otRecordId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  date: string;
  timeStart: string;
  timeEnd: string;
  projectDescription: string | null;
  otType: HrOtType;
  actualHours: number;
  convertedHours: number;
  approvalStatus: HrOtApprovalStatus;
  approvedBy: string | null;
  createdAt: string;
}

export interface HrOtMonthlySummary {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  totalActualHours: number;
  totalConvertedHours: number;
  records: HrOtRecordResponse[];
}

// HR Leave
export interface HrLeaveBalanceResponse {
  leaveBalanceId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  year: number;
  entitlement: number;
  used: number;
  otConverted: number;
  carryForward: number;
  remaining: number;
  startDate: string;
  yearsOfService: number;
}

// HR Leave Request
export type LeaveRequestType = 'ANNUAL' | 'AM_HALF' | 'PM_HALF' | 'SICK' | 'SPECIAL' | 'MENSTRUATION';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface HrLeaveRequestResponse {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  type: LeaveRequestType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: LeaveRequestStatus;
  approvedBy: string | null;
  approverName: string | null;
  rejectedReason: string | null;
  createdAt: string;
}

// HR Severance
export interface HrSeveranceCalcResponse {
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  department: string;
  startDate: string;
  endDate: string | null;
  yearsOfService: number;
  averageSalary6Months: number;
  severanceAmount: number;
  breakdown: {
    month: string;
    salary: number;
  }[];
}
