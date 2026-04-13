import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TokenType } from './subscription.enums';
import { SubSubscriptionEntity } from './sub-subscription.entity';
import { SubTokenLedgerEntity } from './sub-token-ledger.entity';

@Entity('amb_sub_token_wallets')
@Index('idx_amb_sub_token_wallets_ent_id', ['ent_id'])
export class SubTokenWalletEntity {
  @PrimaryGeneratedColumn('uuid')
  tkw_id: string;

  @Column({ type: 'uuid' })
  ent_id: string;

  @Column({ type: 'uuid' })
  sbn_id: string;

  @Column({ type: 'varchar', length: 20 })
  tkw_token_type: TokenType;

  @Column({ type: 'int', default: 0 })
  tkw_balance: number;

  @Column({ type: 'int', default: 0 })
  tkw_lifetime_granted: number;

  @Column({ type: 'int', default: 0 })
  tkw_lifetime_consumed: number;

  @Column({ type: 'timestamptz', nullable: true })
  tkw_last_reset_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  tkw_next_reset_at: Date | null;

  @CreateDateColumn()
  tkw_created_at: Date;

  @UpdateDateColumn()
  tkw_updated_at: Date;

  // ── Relations ─────────────────────────────────────────
  @ManyToOne(() => SubSubscriptionEntity, (s) => s.tokenWallets)
  @JoinColumn({ name: 'sbn_id' })
  subscription: SubSubscriptionEntity;

  @OneToMany(() => SubTokenLedgerEntity, (l) => l.wallet)
  ledgers: SubTokenLedgerEntity[];
}
