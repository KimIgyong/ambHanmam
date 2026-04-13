import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from './hr-entity.entity';
import { FreelancerEntity } from './freelancer.entity';

@Entity('amb_hr_business_income_payments')
export class BusinessIncomeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'bip_id' })
  bipId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'frl_id', type: 'uuid' })
  frlId: string;

  @Column({ name: 'bip_year_month', length: 7 })
  bipYearMonth: string;

  @Column({ name: 'bip_payment_date', type: 'date', nullable: true })
  bipPaymentDate: string;

  @Column({ name: 'bip_gross_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipGrossAmount: number;

  @Column({ name: 'bip_weekly_holiday', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipWeeklyHoliday: number;

  @Column({ name: 'bip_incentive', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipIncentive: number;

  @Column({ name: 'bip_total_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipTotalAmount: number;

  @Column({ name: 'bip_prepaid', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipPrepaid: number;

  @Column({ name: 'bip_income_tax', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipIncomeTax: number;

  @Column({ name: 'bip_local_tax', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipLocalTax: number;

  @Column({ name: 'bip_employ_ins', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipEmployIns: number;

  @Column({ name: 'bip_accident_ins', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipAccidentIns: number;

  @Column({ name: 'bip_student_loan', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipStudentLoan: number;

  @Column({ name: 'bip_deduction_total', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipDeductionTotal: number;

  @Column({ name: 'bip_net_amount', type: 'decimal', precision: 15, scale: 0, default: 0 })
  bipNetAmount: number;

  @Column({ name: 'bip_status', length: 15, default: 'DRAFT' })
  bipStatus: string;

  @CreateDateColumn({ name: 'bip_created_at' })
  bipCreatedAt: Date;

  @UpdateDateColumn({ name: 'bip_updated_at' })
  bipUpdatedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => FreelancerEntity)
  @JoinColumn({ name: 'frl_id' })
  freelancer: FreelancerEntity;
}
