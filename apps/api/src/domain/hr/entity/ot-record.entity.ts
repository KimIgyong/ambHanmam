import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_ot_records')
export class OtRecordEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'otr_id' })
  otrId: string;

  @Column({ name: 'emp_id', type: 'uuid' })
  empId: string;

  @Column({ name: 'otr_date', type: 'date' })
  otrDate: string;

  @Column({ name: 'otr_time_start', type: 'time' })
  otrTimeStart: string;

  @Column({ name: 'otr_time_end', type: 'time' })
  otrTimeEnd: string;

  @Column({ name: 'otr_project_description', type: 'text', nullable: true })
  otrProjectDescription: string;

  @Column({ name: 'otr_type', type: 'varchar', length: 30 })
  otrType: string;

  @Column({ name: 'otr_actual_hours', type: 'decimal', precision: 4, scale: 1 })
  otrActualHours: number;

  @Column({ name: 'otr_converted_hours', type: 'decimal', precision: 4, scale: 1 })
  otrConvertedHours: number;

  @Column({ name: 'otr_approval_status', type: 'varchar', length: 20, default: 'PENDING' })
  otrApprovalStatus: string;

  @Column({ name: 'otr_approved_by', type: 'uuid', nullable: true })
  otrApprovedBy: string;

  @CreateDateColumn({ name: 'otr_created_at' })
  otrCreatedAt: Date;

  @UpdateDateColumn({ name: 'otr_updated_at' })
  otrUpdatedAt: Date;

  @DeleteDateColumn({ name: 'otr_deleted_at' })
  otrDeletedAt: Date;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
