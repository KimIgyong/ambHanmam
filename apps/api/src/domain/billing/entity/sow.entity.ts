import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { ContractEntity } from './contract.entity';

@Entity('amb_bil_sow')
export class SowEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sow_id' })
  sowId: string;

  @Column({ name: 'ctr_id', type: 'uuid' })
  ctrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'sow_title', length: 300 })
  sowTitle: string;

  @Column({ name: 'sow_description', type: 'text', nullable: true })
  sowDescription: string;

  @Column({ name: 'sow_period_start', type: 'date' })
  sowPeriodStart: string;

  @Column({ name: 'sow_period_end', type: 'date' })
  sowPeriodEnd: string;

  @Column({ name: 'sow_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  sowAmount: number;

  @Column({ name: 'sow_currency', length: 3, default: 'USD' })
  sowCurrency: string;

  @Column({ name: 'sow_status', length: 20, default: 'DRAFT' })
  sowStatus: string;

  @Column({ name: 'sow_note', type: 'text', nullable: true })
  sowNote: string;

  @CreateDateColumn({ name: 'sow_created_at' })
  sowCreatedAt: Date;

  @UpdateDateColumn({ name: 'sow_updated_at' })
  sowUpdatedAt: Date;

  @DeleteDateColumn({ name: 'sow_deleted_at' })
  sowDeletedAt: Date;

  @ManyToOne(() => ContractEntity)
  @JoinColumn({ name: 'ctr_id' })
  contract: ContractEntity;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
