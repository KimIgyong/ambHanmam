import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from './hr-entity.entity';

@Entity('amb_hr_leave_requests')
export class LeaveRequestEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'lrq_id' })
  lrqId: string;

  @Column({ name: 'emp_id', type: 'uuid' })
  empId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'lrq_type', type: 'varchar', length: 20 })
  lrqType: string; // ANNUAL | AM_HALF | PM_HALF | SICK | SPECIAL

  @Column({ name: 'lrq_start_date', type: 'date' })
  lrqStartDate: string;

  @Column({ name: 'lrq_end_date', type: 'date' })
  lrqEndDate: string;

  @Column({ name: 'lrq_days', type: 'decimal', precision: 4, scale: 1 })
  lrqDays: number;

  @Column({ name: 'lrq_reason', type: 'text', nullable: true })
  lrqReason: string | null;

  @Column({ name: 'lrq_status', type: 'varchar', length: 20, default: 'PENDING' })
  lrqStatus: string; // PENDING | APPROVED | REJECTED | CANCELLED

  @Column({ name: 'lrq_approved_by', type: 'uuid', nullable: true })
  lrqApprovedBy: string | null;

  @Column({ name: 'lrq_rejected_reason', type: 'text', nullable: true })
  lrqRejectedReason: string | null;

  @CreateDateColumn({ name: 'lrq_created_at' })
  lrqCreatedAt: Date;

  @UpdateDateColumn({ name: 'lrq_updated_at' })
  lrqUpdatedAt: Date;

  @DeleteDateColumn({ name: 'lrq_deleted_at' })
  lrqDeletedAt: Date;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
