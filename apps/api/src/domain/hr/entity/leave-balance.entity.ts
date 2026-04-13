import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_leave_balances')
@Unique(['empId', 'lvbYear'])
export class LeaveBalanceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'lvb_id' })
  lvbId: string;

  @Column({ name: 'emp_id', type: 'uuid' })
  empId: string;

  @Column({ name: 'lvb_year', type: 'int' })
  lvbYear: number;

  @Column({ name: 'lvb_entitlement', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lvbEntitlement: number;

  @Column({ name: 'lvb_used', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lvbUsed: number;

  @Column({ name: 'lvb_ot_converted', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lvbOtConverted: number;

  @Column({ name: 'lvb_carry_forward', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lvbCarryForward: number;

  @Column({ name: 'lvb_remaining', type: 'decimal', precision: 5, scale: 1, default: 0 })
  lvbRemaining: number;

  @CreateDateColumn({ name: 'lvb_created_at' })
  lvbCreatedAt: Date;

  @UpdateDateColumn({ name: 'lvb_updated_at' })
  lvbUpdatedAt: Date;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
