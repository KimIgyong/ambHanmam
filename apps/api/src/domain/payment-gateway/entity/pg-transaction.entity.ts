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
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { PgConfigEntity } from './pg-config.entity';

@Entity('amb_pg_transactions')
export class PgTransactionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pgt_id' })
  pgtId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'pgc_id', type: 'uuid' })
  pgcId: string;

  @ManyToOne(() => PgConfigEntity)
  @JoinColumn({ name: 'pgc_id' })
  pgConfig: PgConfigEntity;

  @Index('idx_pgt_invoice_no', { unique: true })
  @Column({ name: 'pgt_invoice_no', type: 'varchar', length: 40 })
  pgtInvoiceNo: string;

  @Column({ name: 'pgt_mer_trx_id', type: 'varchar', length: 50 })
  pgtMerTrxId: string;

  @Column({ name: 'pgt_trx_id', type: 'varchar', length: 30, nullable: true })
  pgtTrxId: string | null;

  @Column({ name: 'pgt_amount', type: 'bigint' })
  pgtAmount: string; // bigint → string in TypeORM

  @Column({ name: 'pgt_currency', type: 'varchar', length: 3, default: 'VND' })
  pgtCurrency: string;

  @Column({ name: 'pgt_pay_type', type: 'varchar', length: 2, nullable: true })
  pgtPayType: string | null;

  @Column({ name: 'pgt_goods_name', type: 'varchar', length: 200 })
  pgtGoodsName: string;

  @Index('idx_pgt_ent_status')
  @Column({ name: 'pgt_status', type: 'varchar', length: 10, default: 'PENDING' })
  pgtStatus: string;

  @Column({ name: 'pgt_result_cd', type: 'varchar', length: 10, nullable: true })
  pgtResultCd: string | null;

  @Column({ name: 'pgt_result_msg', type: 'varchar', length: 512, nullable: true })
  pgtResultMsg: string | null;

  @Column({ name: 'pgt_merchant_token', type: 'varchar', length: 255, nullable: true })
  pgtMerchantToken: string | null;

  @Column({ name: 'pgt_payment_link', type: 'text', nullable: true })
  pgtPaymentLink: string | null;

  @Column({ name: 'pgt_qr_code', type: 'text', nullable: true })
  pgtQrCode: string | null;

  @Column({ name: 'pgt_link_exptime', type: 'timestamp', nullable: true })
  pgtLinkExptime: Date | null;

  @Column({ name: 'pgt_buyer_email', type: 'varchar', length: 40, nullable: true })
  pgtBuyerEmail: string | null;

  @Column({ name: 'pgt_buyer_name', type: 'varchar', length: 60, nullable: true })
  pgtBuyerName: string | null;

  @Column({ name: 'pgt_bank_id', type: 'varchar', length: 10, nullable: true })
  pgtBankId: string | null;

  @Column({ name: 'pgt_card_no', type: 'varchar', length: 20, nullable: true })
  pgtCardNo: string | null;

  @Column({ name: 'pgt_card_type', type: 'varchar', length: 4, nullable: true })
  pgtCardType: string | null;

  @Column({ name: 'pgt_pay_token', type: 'varchar', length: 100, nullable: true })
  pgtPayToken: string | null;

  @Column({ name: 'pgt_user_fee', type: 'bigint', nullable: true })
  pgtUserFee: string | null;

  @Column({ name: 'pgt_trans_dt', type: 'varchar', length: 8, nullable: true })
  pgtTransDt: string | null;

  @Column({ name: 'pgt_trans_tm', type: 'varchar', length: 6, nullable: true })
  pgtTransTm: string | null;

  @Column({ name: 'pgt_callback_data', type: 'jsonb', nullable: true })
  pgtCallbackData: Record<string, unknown> | null;

  @Column({ name: 'pgt_ipn_data', type: 'jsonb', nullable: true })
  pgtIpnData: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'pgt_created_at' })
  pgtCreatedAt: Date;

  @UpdateDateColumn({ name: 'pgt_updated_at' })
  pgtUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pgt_deleted_at' })
  pgtDeletedAt: Date;
}
