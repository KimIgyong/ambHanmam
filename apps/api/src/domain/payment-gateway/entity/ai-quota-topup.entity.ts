import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { PgTransactionEntity } from './pg-transaction.entity';
import { AiQuotaProductEntity } from './ai-quota-product.entity';

export const TOPUP_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  REVERSED: 'REVERSED',
} as const;
export type TopupStatus = (typeof TOPUP_STATUS)[keyof typeof TOPUP_STATUS];

@Entity('amb_ai_quota_topups')
export class AiQuotaTopupEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'aqt_id' })
  aqtId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'pgt_id', type: 'uuid' })
  pgtId: string;

  @ManyToOne(() => PgTransactionEntity)
  @JoinColumn({ name: 'pgt_id' })
  transaction: PgTransactionEntity;

  @Column({ name: 'aqp_id', type: 'uuid', nullable: true })
  aqpId: string | null;

  @ManyToOne(() => AiQuotaProductEntity)
  @JoinColumn({ name: 'aqp_id' })
  product: AiQuotaProductEntity;

  @Column({ name: 'aqt_token_amount', type: 'bigint' })
  aqtTokenAmount: string; // bigint → string in TypeORM

  @Column({ name: 'aqt_price', type: 'bigint' })
  aqtPrice: string;

  @Column({ name: 'aqt_currency', type: 'varchar', length: 3, default: 'VND' })
  aqtCurrency: string;

  @Column({ name: 'aqt_status', type: 'varchar', length: 10, default: 'PENDING' })
  aqtStatus: string;

  @Column({ name: 'aqt_note', type: 'varchar', length: 500, nullable: true })
  aqtNote: string | null;

  @CreateDateColumn({ name: 'aqt_created_at' })
  aqtCreatedAt: Date;

  @UpdateDateColumn({ name: 'aqt_updated_at' })
  aqtUpdatedAt: Date;
}
