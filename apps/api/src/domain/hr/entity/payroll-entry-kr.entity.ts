import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { PayrollPeriodEntity } from './payroll-period.entity';
import { EmployeeEntity } from './employee.entity';
import { HrEntityEntity } from './hr-entity.entity';

@Entity('amb_hr_payroll_entries_kr')
@Unique(['pypId', 'empId'])
export class PayrollEntryKrEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pkr_id' })
  pkrId: string;

  @Column({ name: 'pyp_id', type: 'uuid' })
  pypId: string;

  @Column({ name: 'emp_id', type: 'uuid' })
  empId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  // ── 지급 항목 (Earnings) ──
  @Column({ name: 'pkr_base_pay', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrBasePay: number;

  @Column({ name: 'pkr_ot_extend', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrOtExtend: number;

  @Column({ name: 'pkr_ot_holiday', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrOtHoliday: number;

  @Column({ name: 'pkr_ot_night', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrOtNight: number;

  @Column({ name: 'pkr_ot_etc', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrOtEtc: number;

  @Column({ name: 'pkr_annual_leave', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrAnnualLeave: number;

  @Column({ name: 'pkr_bonus', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrBonus: number;

  // ── 비과세 항목 ──
  @Column({ name: 'pkr_vehicle_sub', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrVehicleSub: number;

  @Column({ name: 'pkr_meal_allow', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrMealAllow: number;

  @Column({ name: 'pkr_childcare', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrChildcare: number;

  // ── 합계 ──
  @Column({ name: 'pkr_taxable_total', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrTaxableTotal: number;

  @Column({ name: 'pkr_exempt_total', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrExemptTotal: number;

  @Column({ name: 'pkr_gross_total', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrGrossTotal: number;

  // ── 4대보험 공제 ──
  @Column({ name: 'pkr_pension', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrPension: number;

  @Column({ name: 'pkr_health_ins', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrHealthIns: number;

  @Column({ name: 'pkr_longterm_care', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrLongtermCare: number;

  @Column({ name: 'pkr_employ_ins', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrEmployIns: number;

  // ── 보험 정산 ──
  @Column({ name: 'pkr_pension_settle', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrPensionSettle: number;

  @Column({ name: 'pkr_health_settle', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrHealthSettle: number;

  @Column({ name: 'pkr_longterm_settle', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrLongtermSettle: number;

  @Column({ name: 'pkr_employ_settle', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrEmploySettle: number;

  // ── 세금 ──
  @Column({ name: 'pkr_income_tax', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrIncomeTax: number;

  @Column({ name: 'pkr_local_tax', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrLocalTax: number;

  @Column({ name: 'pkr_yearend_tax', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrYearendTax: number;

  @Column({ name: 'pkr_yearend_local', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrYearendLocal: number;

  // ── 기타 공제 ──
  @Column({ name: 'pkr_prepaid', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrPrepaid: number;

  // ── 최종 ──
  @Column({ name: 'pkr_deduction_total', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrDeductionTotal: number;

  @Column({ name: 'pkr_net_pay', type: 'decimal', precision: 15, scale: 0, default: 0 })
  pkrNetPay: number;

  @CreateDateColumn({ name: 'pkr_created_at' })
  pkrCreatedAt: Date;

  @UpdateDateColumn({ name: 'pkr_updated_at' })
  pkrUpdatedAt: Date;

  // ── Relations ──
  @ManyToOne(() => PayrollPeriodEntity)
  @JoinColumn({ name: 'pyp_id' })
  period: PayrollPeriodEntity;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
