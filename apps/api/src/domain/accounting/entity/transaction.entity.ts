import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BankAccountEntity } from './bank-account.entity';

@Entity('amb_transactions')
@Index('IDX_txn_bac_date', ['bacId', 'txnDate'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'txn_id' })
  txnId: string;

  @Column({ name: 'bac_id', type: 'uuid' })
  bacId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'txn_date', type: 'date' })
  txnDate: string;

  @Column({ name: 'txn_project_name', type: 'varchar', length: 200, nullable: true })
  txnProjectName: string | null;

  @Column({ name: 'txn_net_value', type: 'decimal', precision: 18, scale: 2 })
  txnNetValue: number;

  @Column({ name: 'txn_vat', type: 'decimal', precision: 18, scale: 2, default: 0 })
  txnVat: number;

  @Column({ name: 'txn_bank_charge', type: 'decimal', precision: 18, scale: 2, default: 0 })
  txnBankCharge: number;

  @Column({ name: 'txn_total_value', type: 'decimal', precision: 18, scale: 2 })
  txnTotalValue: number;

  @Column({ name: 'txn_balance', type: 'decimal', precision: 18, scale: 2 })
  txnBalance: number;

  @Column({ name: 'txn_cumulative_balance', type: 'decimal', precision: 18, scale: 2 })
  txnCumulativeBalance: number;

  @Column({ name: 'txn_seq_no', type: 'int', default: 0 })
  txnSeqNo: number;

  @Column({ name: 'txn_vendor', type: 'varchar', length: 300, nullable: true })
  txnVendor: string | null;

  @Column({ name: 'txn_description', type: 'text', nullable: true })
  txnDescription: string | null;

  @CreateDateColumn({ name: 'txn_created_at' })
  txnCreatedAt: Date;

  @UpdateDateColumn({ name: 'txn_updated_at' })
  txnUpdatedAt: Date;

  @DeleteDateColumn({ name: 'txn_deleted_at' })
  txnDeletedAt: Date;

  @ManyToOne(() => BankAccountEntity, (account) => account.transactions)
  @JoinColumn({ name: 'bac_id' })
  bankAccount: BankAccountEntity;
}
