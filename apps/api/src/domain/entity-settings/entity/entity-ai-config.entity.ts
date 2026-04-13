import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('amb_entity_ai_configs')
export class EntityAiConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eac_id' })
  eacId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'eac_provider', type: 'varchar', length: 30, default: 'ANTHROPIC' })
  eacProvider: string;

  @Column({ name: 'eac_use_shared_key', type: 'boolean', default: true })
  eacUseSharedKey: boolean;

  /** AES-256-GCM encrypted API key (null = shared key) */
  @Column({ name: 'eac_api_key', type: 'varchar', length: 500, nullable: true })
  eacApiKey: string | null;

  /** 일일 토큰 사용 한도 (0 = 무제한) */
  @Column({ name: 'eac_daily_token_limit', type: 'bigint', default: 0 })
  eacDailyTokenLimit: number;

  /** 월간 토큰 사용 한도 (0 = 무제한) */
  @Column({ name: 'eac_monthly_token_limit', type: 'bigint', default: 0 })
  eacMonthlyTokenLimit: number;

  @Column({ name: 'eac_is_active', type: 'boolean', default: true })
  eacIsActive: boolean;

  @CreateDateColumn({ name: 'eac_created_at' })
  eacCreatedAt: Date;

  @UpdateDateColumn({ name: 'eac_updated_at' })
  eacUpdatedAt: Date;

  @Column({ name: 'eac_deleted_at', type: 'timestamp', nullable: true })
  eacDeletedAt: Date | null;
}
