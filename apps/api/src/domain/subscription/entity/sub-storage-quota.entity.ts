import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SubSubscriptionEntity } from './sub-subscription.entity';

@Entity('amb_sub_storage_quotas')
@Index('idx_amb_sub_storage_quotas_ent_id', ['ent_id'])
export class SubStorageQuotaEntity {
  @PrimaryGeneratedColumn('uuid')
  sqt_id: string;

  @Column({ type: 'uuid', unique: true })
  ent_id: string;

  @Column({ type: 'uuid' })
  sbn_id: string;

  @Column({ type: 'int', default: 1 })
  sqt_base_gb: number;

  @Column({ type: 'int', default: 0 })
  sqt_addon_gb: number;

  @Column({ type: 'int', default: 1 })
  sqt_max_gb: number;

  @Column({ type: 'bigint', default: 0 })
  sqt_used_bytes: number;

  @Column({ type: 'boolean', default: false })
  sqt_is_upload_blocked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  sqt_last_checked_at: Date | null;

  @CreateDateColumn()
  sqt_created_at: Date;

  @UpdateDateColumn()
  sqt_updated_at: Date;

  // ── Computed ──────────────────────────────────────────
  get totalGb(): number {
    return this.sqt_base_gb + this.sqt_addon_gb;
  }

  get usedGb(): number {
    return Number(this.sqt_used_bytes) / 1024 ** 3;
  }

  get usedPct(): number {
    if (this.totalGb === 0) return 0;
    return (this.usedGb / this.totalGb) * 100;
  }

  // ── Relations ─────────────────────────────────────────
  @OneToOne(() => SubSubscriptionEntity, (s) => s.storageQuota)
  @JoinColumn({ name: 'sbn_id' })
  subscription: SubSubscriptionEntity;
}
