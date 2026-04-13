import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { HrEntityEntity } from './hr-entity.entity';
import { EmployeeEntity } from './employee.entity';

@Entity('amb_hr_yearend_adjustments')
@Unique(['entId', 'empId', 'yeaTaxYear'])
export class YearendAdjustmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'yea_id' })
  yeaId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'emp_id', type: 'uuid' })
  empId: string;

  @Column({ name: 'yea_tax_year', type: 'int' })
  yeaTaxYear: number;

  @Column({ name: 'yea_settle_tax', type: 'decimal', precision: 15, scale: 0, default: 0 })
  yeaSettleTax: number;

  @Column({ name: 'yea_settle_local', type: 'decimal', precision: 15, scale: 0, default: 0 })
  yeaSettleLocal: number;

  @Column({ name: 'yea_applied_month', type: 'varchar', length: 7, nullable: true })
  yeaAppliedMonth: string | null;

  @Column({ name: 'yea_status', type: 'varchar', length: 10, default: 'PENDING' })
  yeaStatus: string;

  @Column({ name: 'yea_note', type: 'text', nullable: true })
  yeaNote: string | null;

  @CreateDateColumn({ name: 'yea_created_at' })
  yeaCreatedAt: Date;

  @UpdateDateColumn({ name: 'yea_updated_at' })
  yeaUpdatedAt: Date;

  // ── Relations ──
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => EmployeeEntity)
  @JoinColumn({ name: 'emp_id' })
  employee: EmployeeEntity;
}
