import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { ContractEntity } from './contract.entity';

@Entity('amb_bil_contract_milestones')
export class ContractMilestoneEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mst_id' })
  mstId: string;

  @Column({ name: 'ctr_id', type: 'uuid' })
  ctrId: string;

  @Column({ name: 'mst_seq', type: 'int' })
  mstSeq: number;

  @Column({ name: 'mst_label', length: 100 })
  mstLabel: string;

  @Column({ name: 'mst_percentage', type: 'decimal', precision: 5, scale: 2 })
  mstPercentage: number;

  @Column({ name: 'mst_amount', type: 'decimal', precision: 15, scale: 2 })
  mstAmount: number;

  @Column({ name: 'mst_due_date', type: 'date', nullable: true })
  mstDueDate: string;

  @Column({ name: 'mst_status', length: 20, default: 'PENDING' })
  mstStatus: string;

  @ManyToOne(() => ContractEntity, (c) => c.milestones)
  @JoinColumn({ name: 'ctr_id' })
  contract: ContractEntity;
}
