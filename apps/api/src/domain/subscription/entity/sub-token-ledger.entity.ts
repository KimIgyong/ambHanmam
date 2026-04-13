import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { LedgerDirection, LedgerReason, TokenType } from './subscription.enums';
import { SubTokenWalletEntity } from './sub-token-wallet.entity';

@Entity('amb_sub_token_ledgers')
@Index('idx_amb_sub_token_ledgers_ent_id', ['ent_id'])
@Index('idx_amb_sub_token_ledgers_tkw_id', ['tkw_id'])
@Index('idx_amb_sub_token_ledgers_created_at', ['tkl_created_at'])
export class SubTokenLedgerEntity {
  @PrimaryGeneratedColumn('uuid')
  tkl_id: string;

  @Column({ type: 'uuid' })
  ent_id: string;

  @Column({ type: 'uuid' })
  tkw_id: string;

  @Column({ type: 'varchar', length: 20 })
  tkl_token_type: TokenType;

  @Column({ type: 'varchar', length: 10 })
  tkl_direction: LedgerDirection;

  @Column({ type: 'int' })
  tkl_amount: number;

  @Column({ type: 'int' })
  tkl_balance_after: number;

  @Column({ type: 'varchar', length: 50 })
  tkl_reason: LedgerReason;

  @Column({ type: 'varchar', length: 200, nullable: true })
  tkl_ref_id: string | null;

  @Column({ type: 'jsonb', nullable: true })
  tkl_meta: Record<string, unknown> | null;

  @CreateDateColumn()
  tkl_created_at: Date;

  // ── Relations ─────────────────────────────────────────
  @ManyToOne(() => SubTokenWalletEntity, (w) => w.ledgers)
  @JoinColumn({ name: 'tkw_id' })
  wallet: SubTokenWalletEntity;
}
