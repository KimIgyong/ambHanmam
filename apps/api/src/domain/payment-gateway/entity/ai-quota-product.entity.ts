import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('amb_ai_quota_products')
export class AiQuotaProductEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'aqp_id' })
  aqpId: string;

  @Column({ name: 'aqp_name', type: 'varchar', length: 100 })
  aqpName: string;

  @Column({ name: 'aqp_description', type: 'varchar', length: 500, nullable: true })
  aqpDescription: string | null;

  @Column({ name: 'aqp_token_amount', type: 'bigint' })
  aqpTokenAmount: string; // bigint → string in TypeORM

  @Column({ name: 'aqp_price', type: 'bigint' })
  aqpPrice: string; // bigint → string (VND)

  @Column({ name: 'aqp_currency', type: 'varchar', length: 3, default: 'VND' })
  aqpCurrency: string;

  @Column({ name: 'aqp_sort_order', type: 'int', default: 0 })
  aqpSortOrder: number;

  @Column({ name: 'aqp_is_active', type: 'boolean', default: true })
  aqpIsActive: boolean;

  @Column({ name: 'aqp_created_by', type: 'uuid', nullable: true })
  aqpCreatedBy: string | null;

  @CreateDateColumn({ name: 'aqp_created_at' })
  aqpCreatedAt: Date;

  @UpdateDateColumn({ name: 'aqp_updated_at' })
  aqpUpdatedAt: Date;

  @Column({ name: 'aqp_deleted_at', type: 'timestamp', nullable: true })
  aqpDeletedAt: Date | null;
}
