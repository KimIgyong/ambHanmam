import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { TransactionEntity } from './transaction.entity';

@Entity('amb_bank_accounts')
export class BankAccountEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'bac_id' })
  bacId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'bac_bank_name', type: 'varchar', length: 100 })
  bacBankName: string;

  @Column({ name: 'bac_branch_name', type: 'varchar', length: 200, nullable: true })
  bacBranchName: string | null;

  @Column({ name: 'bac_account_number', type: 'varchar', length: 50, unique: true })
  bacAccountNumber: string;

  @Column({ name: 'bac_account_alias', type: 'varchar', length: 100, nullable: true })
  bacAccountAlias: string | null;

  @Column({ name: 'bac_currency', type: 'varchar', length: 10, default: 'VND' })
  bacCurrency: string;

  @Column({ name: 'bac_opening_balance', type: 'decimal', precision: 18, scale: 2, default: 0 })
  bacOpeningBalance: number;

  @Column({ name: 'bac_opening_date', type: 'date', nullable: true })
  bacOpeningDate: string | null;

  @Column({ name: 'bac_is_active', type: 'boolean', default: true })
  bacIsActive: boolean;

  @CreateDateColumn({ name: 'bac_created_at' })
  bacCreatedAt: Date;

  @UpdateDateColumn({ name: 'bac_updated_at' })
  bacUpdatedAt: Date;

  @DeleteDateColumn({ name: 'bac_deleted_at' })
  bacDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @OneToMany(() => TransactionEntity, (txn) => txn.bankAccount)
  transactions: TransactionEntity[];
}
