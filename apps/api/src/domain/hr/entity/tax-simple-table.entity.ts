import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm';
import { HrEntityEntity } from './hr-entity.entity';

@Entity('amb_hr_tax_simple_table')
@Index('idx_tax_simple_lookup', ['entId', 'tstEffectiveYear', 'tstSalaryFrom', 'tstSalaryTo', 'tstDependents'])
export class TaxSimpleTableEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tst_id' })
  tstId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'tst_effective_year', type: 'int' })
  tstEffectiveYear: number;

  @Column({ name: 'tst_salary_from', type: 'decimal', precision: 15, scale: 0 })
  tstSalaryFrom: number;

  @Column({ name: 'tst_salary_to', type: 'decimal', precision: 15, scale: 0 })
  tstSalaryTo: number;

  @Column({ name: 'tst_dependents', type: 'int' })
  tstDependents: number;

  @Column({ name: 'tst_tax_amount', type: 'decimal', precision: 15, scale: 0 })
  tstTaxAmount: number;

  @CreateDateColumn({ name: 'tst_created_at' })
  tstCreatedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
