import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_pg_configs')
export class PgConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pgc_id' })
  pgcId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'pgc_provider', type: 'varchar', length: 20 })
  pgcProvider: string;

  @Column({ name: 'pgc_merchant_id', type: 'varchar', length: 20 })
  pgcMerchantId: string;

  // ── Encode Key (SHA256 서명용) ──
  @Column({ name: 'pgc_encode_key_encrypted', type: 'text' })
  pgcEncodeKeyEncrypted: string;

  @Column({ name: 'pgc_encode_key_iv', type: 'varchar', length: 64 })
  pgcEncodeKeyIv: string;

  @Column({ name: 'pgc_encode_key_tag', type: 'varchar', length: 64 })
  pgcEncodeKeyTag: string;

  @Column({ name: 'pgc_encode_key_last4', type: 'varchar', length: 4 })
  pgcEncodeKeyLast4: string;

  // ── Hash Key Refund (환불 전용) ──
  @Column({ name: 'pgc_refund_key_encrypted', type: 'text' })
  pgcRefundKeyEncrypted: string;

  @Column({ name: 'pgc_refund_key_iv', type: 'varchar', length: 64 })
  pgcRefundKeyIv: string;

  @Column({ name: 'pgc_refund_key_tag', type: 'varchar', length: 64 })
  pgcRefundKeyTag: string;

  @Column({ name: 'pgc_refund_key_last4', type: 'varchar', length: 4 })
  pgcRefundKeyLast4: string;

  // ── Cancel Password (환불 비밀번호) ──
  @Column({ name: 'pgc_cancel_pw_encrypted', type: 'text' })
  pgcCancelPwEncrypted: string;

  @Column({ name: 'pgc_cancel_pw_iv', type: 'varchar', length: 64 })
  pgcCancelPwIv: string;

  @Column({ name: 'pgc_cancel_pw_tag', type: 'varchar', length: 64 })
  pgcCancelPwTag: string;

  @Column({ name: 'pgc_cancel_pw_last4', type: 'varchar', length: 4 })
  pgcCancelPwLast4: string;

  // ── 환경 설정 ──
  @Column({ name: 'pgc_environment', type: 'varchar', length: 10, default: 'sandbox' })
  pgcEnvironment: string;

  @Column({ name: 'pgc_callback_url', type: 'varchar', length: 500, nullable: true })
  pgcCallbackUrl: string | null;

  @Column({ name: 'pgc_noti_url', type: 'varchar', length: 500, nullable: true })
  pgcNotiUrl: string | null;

  @Column({ name: 'pgc_window_color', type: 'varchar', length: 7, default: '#ef5459' })
  pgcWindowColor: string;

  @Column({ name: 'pgc_currency', type: 'varchar', length: 3, default: 'VND' })
  pgcCurrency: string;

  @Column({ name: 'pgc_is_active', type: 'boolean', default: true })
  pgcIsActive: boolean;

  @Column({ name: 'pgc_created_by', type: 'uuid' })
  pgcCreatedBy: string;

  @CreateDateColumn({ name: 'pgc_created_at' })
  pgcCreatedAt: Date;

  @UpdateDateColumn({ name: 'pgc_updated_at' })
  pgcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pgc_deleted_at' })
  pgcDeletedAt: Date;
}
