import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, Unique,
} from 'typeorm';
import { PayrollDetailEntity } from './payroll-detail.entity';

@Entity('amb_hr_payroll_periods')
@Unique(['entId', 'pypYear', 'pypMonth'])
export class PayrollPeriodEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pyp_id' })
  pypId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @Column({ name: 'pyp_year', type: 'int' })
  pypYear: number;

  @Column({ name: 'pyp_month', type: 'int' })
  pypMonth: number;

  @Column({ name: 'pyp_status', length: 30, default: 'DRAFT' })
  pypStatus: string;

  @Column({ name: 'pyp_payment_date', type: 'date', nullable: true })
  pypPaymentDate: string;

  @Column({ name: 'pyp_approved_by_l1', type: 'uuid', nullable: true })
  pypApprovedByL1: string;

  @Column({ name: 'pyp_approved_by_l2', type: 'uuid', nullable: true })
  pypApprovedByL2: string;

  @Column({ name: 'pyp_finalized_at', type: 'timestamp', nullable: true })
  pypFinalizedAt: Date;

  @CreateDateColumn({ name: 'pyp_created_at' })
  pypCreatedAt: Date;

  @UpdateDateColumn({ name: 'pyp_updated_at' })
  pypUpdatedAt: Date;

  @OneToMany(() => PayrollDetailEntity, (d) => d.period)
  details: PayrollDetailEntity[];
}
