import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ContractEntity } from './contract.entity';

@Entity('amb_bil_contract_history')
export class ContractHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'hst_id' })
  hstId: string;

  @Column({ name: 'ctr_id', type: 'uuid' })
  ctrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'hst_field', length: 50 })
  hstField: string;

  @Column({ name: 'hst_old_value', type: 'text', nullable: true })
  hstOldValue: string;

  @Column({ name: 'hst_new_value', type: 'text', nullable: true })
  hstNewValue: string;

  @Column({ name: 'hst_changed_by', type: 'uuid', nullable: true })
  hstChangedBy: string;

  @CreateDateColumn({ name: 'hst_changed_at' })
  hstChangedAt: Date;

  @ManyToOne(() => ContractEntity)
  @JoinColumn({ name: 'ctr_id' })
  contract: ContractEntity;
}
