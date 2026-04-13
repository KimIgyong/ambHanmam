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

@Entity('amb_entity_api_quotas')
export class EntityApiQuotaEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eaq_id' })
  eaqId: string;

  @Column({ name: 'ent_id', type: 'uuid', unique: true })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'eaq_daily_token_limit', type: 'bigint', nullable: true })
  eaqDailyTokenLimit: number;

  @Column({ name: 'eaq_monthly_token_limit', type: 'bigint', nullable: true })
  eaqMonthlyTokenLimit: number;

  @Column({ name: 'eaq_action_on_exceed', length: 10, default: 'WARN' })
  eaqActionOnExceed: string;

  @Column({ name: 'eaq_updated_by', type: 'uuid', nullable: true })
  eaqUpdatedBy: string;

  @CreateDateColumn({ name: 'eaq_created_at' })
  eaqCreatedAt: Date;

  @UpdateDateColumn({ name: 'eaq_updated_at' })
  eaqUpdatedAt: Date;
}
