import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { DependentEntity } from './dependent.entity';
import { SalaryHistoryEntity } from './salary-history.entity';
import { HrEntityEntity } from './hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_hr_employees')
@Index(['entId', 'empStatus'])
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'emp_id' })
  empId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid', nullable: true })
  usrId: string | null;

  @Column({ name: 'emp_code', length: 20, unique: true })
  empCode: string;

  @Column({ name: 'emp_full_name', length: 100 })
  empFullName: string;

  @Column({ name: 'emp_nationality', length: 20, default: 'VIETNAMESE' })
  empNationality: string;

  @Column({ name: 'emp_cccd_number', length: 20, unique: true })
  empCccdNumber: string;

  @Column({ name: 'emp_tax_code', length: 20, nullable: true })
  empTaxCode: string;

  @Column({ name: 'emp_si_number', length: 20, nullable: true })
  empSiNumber: string;

  @Column({ name: 'emp_hospital_code', length: 100, nullable: true })
  empHospitalCode: string;

  @Column({ name: 'emp_start_date', type: 'date' })
  empStartDate: string;

  @Column({ name: 'emp_end_date', type: 'date', nullable: true })
  empEndDate: string;

  @Column({ name: 'emp_status', length: 20, default: 'PROBATION' })
  empStatus: string;

  @Column({ name: 'emp_contract_type', length: 20, default: 'EMPLOYEE' })
  empContractType: string;

  @Column({ name: 'emp_department', length: 50 })
  empDepartment: string;

  @Column({ name: 'emp_position', length: 50 })
  empPosition: string;

  @Column({ name: 'emp_region', length: 20, default: 'REGION_1' })
  empRegion: string;

  @Column({ name: 'emp_salary_type', length: 10, default: 'GROSS' })
  empSalaryType: string;

  @Column({ name: 'emp_work_schedule', length: 10, default: 'MON_FRI' })
  empWorkSchedule: string;

  @Column({ name: 'emp_memo', type: 'text', nullable: true })
  empMemo: string;

  @CreateDateColumn({ name: 'emp_created_at' })
  empCreatedAt: Date;

  @UpdateDateColumn({ name: 'emp_updated_at' })
  empUpdatedAt: Date;

  @DeleteDateColumn({ name: 'emp_deleted_at' })
  empDeletedAt: Date;

  @OneToMany(() => DependentEntity, (dep) => dep.employee)
  dependents: DependentEntity[];

  @OneToMany(() => SalaryHistoryEntity, (sh) => sh.employee)
  salaryHistory: SalaryHistoryEntity[];

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
