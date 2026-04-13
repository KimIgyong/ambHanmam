import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_dependents')
export class DependentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dep_id' })
  depId: string;

  @Column({ name: 'emp_id' })
  empId: string;

  @Column({ name: 'dep_name', length: 100 })
  depName: string;

  @Column({ name: 'dep_relationship', length: 30 })
  depRelationship: string;

  @Column({ name: 'dep_date_of_birth', type: 'date' })
  depDateOfBirth: string;

  @Column({ name: 'dep_cccd_number', length: 20, nullable: true })
  depCccdNumber: string;

  @Column({ name: 'dep_tax_code', length: 20, nullable: true })
  depTaxCode: string;

  @Column({ name: 'dep_effective_from', type: 'date' })
  depEffectiveFrom: string;

  @Column({ name: 'dep_effective_to', type: 'date', nullable: true })
  depEffectiveTo: string;

  @CreateDateColumn({ name: 'dep_created_at' })
  depCreatedAt: Date;

  @UpdateDateColumn({ name: 'dep_updated_at' })
  depUpdatedAt: Date;

  @DeleteDateColumn({ name: 'dep_deleted_at' })
  depDeletedAt: Date;

  @ManyToOne(() => EmployeeEntity, (emp) => emp.dependents)
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
