import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';
import { PayrollPeriodEntity } from './payroll-period.entity';

@Entity('amb_hr_timesheets')
@Unique(['empId', 'tmsWorkDate'])
export class TimesheetEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tms_id' })
  tmsId: string;

  @Column({ name: 'emp_id', type: 'uuid' })
  empId: string;

  @Column({ name: 'pyp_id', type: 'uuid', nullable: true })
  pypId: string;

  @Column({ name: 'tms_work_date', type: 'date' })
  tmsWorkDate: string;

  @Column({ name: 'tms_attendance_code', type: 'varchar', length: 10, nullable: true })
  tmsAttendanceCode: string;

  @Column({ name: 'tms_work_hours', type: 'decimal', precision: 4, scale: 1, default: 0 })
  tmsWorkHours: number;

  @CreateDateColumn({ name: 'tms_created_at' })
  tmsCreatedAt: Date;

  @UpdateDateColumn({ name: 'tms_updated_at' })
  tmsUpdatedAt: Date;

  @ManyToOne(() => EmployeeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;

  @ManyToOne(() => PayrollPeriodEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pyp_id' })
  payrollPeriod: PayrollPeriodEntity;
}
