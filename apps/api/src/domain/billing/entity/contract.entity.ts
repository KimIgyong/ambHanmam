import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { PartnerEntity } from './partner.entity';
import { ContractMilestoneEntity } from './contract-milestone.entity';
import { PaymentScheduleEntity } from './payment-schedule.entity';

@Entity('amb_bil_contracts')
@Index(['entId', 'ctrStatus'])
export class ContractEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ctr_id' })
  ctrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'ptn_id', type: 'uuid' })
  ptnId: string;

  @Column({ name: 'ctr_direction', length: 20 })
  ctrDirection: string;

  @Column({ name: 'ctr_category', length: 20 })
  ctrCategory: string;

  @Column({ name: 'ctr_type', length: 20 })
  ctrType: string;

  @Column({ name: 'ctr_title', length: 300 })
  ctrTitle: string;

  @Column({ name: 'ctr_description', type: 'text', nullable: true })
  ctrDescription: string;

  @Column({ name: 'ctr_start_date', type: 'date' })
  ctrStartDate: string;

  @Column({ name: 'ctr_end_date', type: 'date', nullable: true })
  ctrEndDate: string;

  @Column({ name: 'ctr_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  ctrAmount: number;

  @Column({ name: 'ctr_currency', length: 3, default: 'USD' })
  ctrCurrency: string;

  @Column({ name: 'ctr_status', length: 20, default: 'DRAFT' })
  ctrStatus: string;

  @Column({ name: 'ctr_auto_renew', type: 'boolean', default: false })
  ctrAutoRenew: boolean;

  @Column({ name: 'ctr_billing_day', type: 'int', nullable: true })
  ctrBillingDay: number;

  @Column({ name: 'ctr_billing_period', length: 20, nullable: true })
  ctrBillingPeriod: string;

  @Column({ name: 'ctr_auto_generate', type: 'boolean', default: false })
  ctrAutoGenerate: boolean;

  @Column({ name: 'ctr_payment_type', length: 20, nullable: true })
  ctrPaymentType: string;

  @Column({ name: 'ctr_billing_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  ctrBillingAmount: number;

  @Column({ name: 'ctr_unit_price', type: 'decimal', precision: 15, scale: 2, nullable: true })
  ctrUnitPrice: number;

  @Column({ name: 'ctr_unit_desc', length: 200, nullable: true })
  ctrUnitDesc: string;

  @Column({ name: 'ctr_predecessor_id', type: 'uuid', nullable: true })
  ctrPredecessorId: string;

  @Column({ name: 'ctr_gdrive_folder_id', length: 100, nullable: true })
  ctrGdriveFolderId: string;

  @Column({ name: 'ctr_note', type: 'text', nullable: true })
  ctrNote: string;

  @Column({ name: 'ctr_gsheet_url', type: 'text', nullable: true })
  ctrGsheetUrl: string;

  @Column({ name: 'ctr_gsheet_tab_pattern', length: 100, nullable: true })
  ctrGsheetTabPattern: string; // e.g. "YYYY-MM", "YYYY.MM", or fixed tab name

  @Column({ name: 'ctr_assigned_user_id', type: 'uuid', nullable: true })
  ctrAssignedUserId: string;

  @Column({ name: 'ctr_stripe_subscription_id', length: 50, nullable: true })
  ctrStripeSubscriptionId: string;

  @Column({ name: 'ctr_original_lang', length: 5, default: 'ko' })
  ctrOriginalLang: string;

  @CreateDateColumn({ name: 'ctr_created_at' })
  ctrCreatedAt: Date;

  @UpdateDateColumn({ name: 'ctr_updated_at' })
  ctrUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ctr_deleted_at' })
  ctrDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => PartnerEntity)
  @JoinColumn({ name: 'ptn_id' })
  partner: PartnerEntity;

  @OneToMany(() => ContractMilestoneEntity, (m) => m.contract, { cascade: true })
  milestones: ContractMilestoneEntity[];

  @OneToMany(() => PaymentScheduleEntity, (s) => s.contract, { cascade: true })
  paymentSchedules: PaymentScheduleEntity[];
}
