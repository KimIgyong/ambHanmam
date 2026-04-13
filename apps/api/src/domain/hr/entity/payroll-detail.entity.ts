import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { PayrollPeriodEntity } from './payroll-period.entity';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_payroll_details')
@Unique(['pypId', 'empId'])
export class PayrollDetailEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pyd_id' })
  pydId: string;

  @Column({ name: 'pyp_id' })
  pypId: string;

  @Column({ name: 'emp_id' })
  empId: string;

  // Base
  @Column({ name: 'pyd_base_salary', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydBaseSalary: number;

  @Column({ name: 'pyd_actual_salary', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydActualSalary: number;

  // Allowances
  @Column({ name: 'pyd_meal_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydMealAllowance: number;

  @Column({ name: 'pyd_cskh_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCskhAllowance: number;

  @Column({ name: 'pyd_fuel_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydFuelAllowance: number;

  @Column({ name: 'pyd_other_allowance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydOtherAllowance: number;

  @Column({ name: 'pyd_total_income', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydTotalIncome: number;

  // Insurance bases
  @Column({ name: 'pyd_insurance_base_si', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydInsuranceBaseSi: number;

  @Column({ name: 'pyd_insurance_base_ui', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydInsuranceBaseUi: number;

  // Company insurance
  @Column({ name: 'pyd_company_si_sickness', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCompanySiSickness: number;

  @Column({ name: 'pyd_company_si_accident', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCompanySiAccident: number;

  @Column({ name: 'pyd_company_si_retirement', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCompanySiRetirement: number;

  @Column({ name: 'pyd_company_hi', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCompanyHi: number;

  @Column({ name: 'pyd_company_ui', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCompanyUi: number;

  @Column({ name: 'pyd_company_union', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydCompanyUnion: number;

  @Column({ name: 'pyd_total_company_insurance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydTotalCompanyInsurance: number;

  // Employee insurance
  @Column({ name: 'pyd_employee_si', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydEmployeeSi: number;

  @Column({ name: 'pyd_employee_hi', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydEmployeeHi: number;

  @Column({ name: 'pyd_employee_ui', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydEmployeeUi: number;

  @Column({ name: 'pyd_total_employee_insurance', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydTotalEmployeeInsurance: number;

  // Tax
  @Column({ name: 'pyd_self_deduction', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydSelfDeduction: number;

  @Column({ name: 'pyd_dependent_deduction', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydDependentDeduction: number;

  @Column({ name: 'pyd_num_dependents', type: 'int', default: 0 })
  pydNumDependents: number;

  @Column({ name: 'pyd_tax_exempt_income', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydTaxExemptIncome: number;

  @Column({ name: 'pyd_taxable_income', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydTaxableIncome: number;

  @Column({ name: 'pyd_pit_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydPitAmount: number;

  // Extras
  @Column({ name: 'pyd_ot_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydOtAmount: number;

  @Column({ name: 'pyd_annual_leave_salary', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydAnnualLeaveSalary: number;

  @Column({ name: 'pyd_bonus', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydBonus: number;

  @Column({ name: 'pyd_adjustment', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydAdjustment: number;

  // Working days
  @Column({ name: 'pyd_standard_working_days', type: 'int', default: 0 })
  pydStandardWorkingDays: number;

  @Column({ name: 'pyd_actual_working_days', type: 'decimal', precision: 4, scale: 1, default: 0 })
  pydActualWorkingDays: number;

  // Result
  @Column({ name: 'pyd_net_salary_vnd', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pydNetSalaryVnd: number;

  @Column({ name: 'pyd_net_salary_usd', type: 'decimal', precision: 15, scale: 2, default: 0 })
  pydNetSalaryUsd: number;

  @CreateDateColumn({ name: 'pyd_created_at' })
  pydCreatedAt: Date;

  @UpdateDateColumn({ name: 'pyd_updated_at' })
  pydUpdatedAt: Date;

  @ManyToOne(() => PayrollPeriodEntity, (p) => p.details)
  @JoinColumn({ name: 'pyp_id' })
  period: PayrollPeriodEntity;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
