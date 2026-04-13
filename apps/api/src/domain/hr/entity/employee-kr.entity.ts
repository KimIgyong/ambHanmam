import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_employees_kr')
export class EmployeeKrEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ekr_id' })
  ekrId: string;

  @Column({ name: 'emp_id', type: 'uuid', unique: true })
  empId: string;

  @Column({ name: 'ekr_resident_no', length: 256, nullable: true })
  ekrResidentNo: string;

  @Column({ name: 'ekr_employee_type', length: 20 })
  ekrEmployeeType: string;

  @Column({ name: 'ekr_pension_no', length: 20, nullable: true })
  ekrPensionNo: string;

  @Column({ name: 'ekr_health_ins_no', length: 20, nullable: true })
  ekrHealthInsNo: string;

  @Column({ name: 'ekr_employ_ins_no', length: 20, nullable: true })
  ekrEmployInsNo: string;

  @Column({ name: 'ekr_pension_exempt', type: 'boolean', default: false })
  ekrPensionExempt: boolean;

  @Column({ name: 'ekr_health_exempt', type: 'boolean', default: false })
  ekrHealthExempt: boolean;

  @Column({ name: 'ekr_employ_exempt', type: 'boolean', default: false })
  ekrEmployExempt: boolean;

  @Column({ name: 'ekr_tax_dependents', type: 'int', default: 1 })
  ekrTaxDependents: number;

  @Column({ name: 'ekr_withholding_rate', length: 5, default: '100' })
  ekrWithholdingRate: string;

  @Column({ name: 'ekr_bank_account', length: 50, nullable: true })
  ekrBankAccount: string;

  @CreateDateColumn({ name: 'ekr_created_at' })
  ekrCreatedAt: Date;

  @UpdateDateColumn({ name: 'ekr_updated_at' })
  ekrUpdatedAt: Date;

  @OneToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
