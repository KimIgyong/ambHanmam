import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { PartnerEntity } from './partner.entity';
import { ContractEntity } from './contract.entity';
import { InvoiceItemEntity } from './invoice-item.entity';

@Entity('amb_bil_invoices')
@Index(['entId', 'invStatus'])
@Index(['invDate'])
export class InvoiceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'inv_id' })
  invId: string;

  @Column({ name: 'ent_id' })
  entId: string;

  @Column({ name: 'ptn_id' })
  ptnId: string;

  @Column({ name: 'ctr_id', nullable: true })
  ctrId: string;

  @Column({ name: 'sow_id', type: 'uuid', nullable: true })
  sowId: string;

  @Column({ name: 'inv_number', length: 50 })
  invNumber: string;

  @Column({ name: 'inv_direction', length: 20 })
  invDirection: string; // RECEIVABLE | PAYABLE

  @Column({ name: 'inv_date', type: 'date' })
  invDate: string;

  @Column({ name: 'inv_due_date', type: 'date', nullable: true })
  invDueDate: string;

  @Column({ name: 'inv_service_period_start', type: 'date', nullable: true })
  invServicePeriodStart: string;

  @Column({ name: 'inv_service_period_end', type: 'date', nullable: true })
  invServicePeriodEnd: string;

  @Column({ name: 'inv_subtotal', type: 'decimal', precision: 15, scale: 2, default: 0 })
  invSubtotal: number;

  @Column({ name: 'inv_tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  invTaxRate: number;

  @Column({ name: 'inv_tax_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  invTaxAmount: number;

  @Column({ name: 'inv_total', type: 'decimal', precision: 15, scale: 2, default: 0 })
  invTotal: number;

  @Column({ name: 'inv_currency', length: 3 })
  invCurrency: string;

  @Column({ name: 'inv_status', length: 20, default: 'DRAFT' })
  invStatus: string; // DRAFT | ISSUED | SENT | PAID | OVERDUE | CANCELLED | VOID

  @Column({ name: 'inv_paid_amount', type: 'decimal', precision: 15, scale: 2, default: 0 })
  invPaidAmount: number;

  @Column({ name: 'inv_paid_date', type: 'date', nullable: true })
  invPaidDate: string;

  @Column({ name: 'inv_internal_code', length: 50, nullable: true })
  invInternalCode: string;

  @Column({ name: 'inv_note', type: 'text', nullable: true })
  invNote: string;

  @Column({ name: 'inv_tax_invoice_type', length: 20, nullable: true })
  invTaxInvoiceType: string; // HOMETAX | SYSTEM

  // ── Approval workflow ──
  @Column({ name: 'inv_approval_status', length: 30, default: 'NONE' })
  invApprovalStatus: string; // NONE | PENDING_REVIEW | PENDING_APPROVAL | APPROVED_MANAGER | APPROVED_ADMIN | REJECTED

  @Column({ name: 'inv_reviewer_id', type: 'uuid', nullable: true })
  invReviewerId: string;

  @Column({ name: 'inv_reviewed_at', type: 'timestamp', nullable: true })
  invReviewedAt: Date;

  @Column({ name: 'inv_approver_manager_id', type: 'uuid', nullable: true })
  invApproverManagerId: string;

  @Column({ name: 'inv_approved_manager_at', type: 'timestamp', nullable: true })
  invApprovedManagerAt: Date;

  @Column({ name: 'inv_approver_admin_id', type: 'uuid', nullable: true })
  invApproverAdminId: string;

  @Column({ name: 'inv_approved_admin_at', type: 'timestamp', nullable: true })
  invApprovedAdminAt: Date;

  @Column({ name: 'inv_rejection_reason', type: 'text', nullable: true })
  invRejectionReason: string;

  @Column({ name: 'inv_gsheet_url', type: 'text', nullable: true })
  invGsheetUrl: string;

  // ── E-Invoice (Vietnam) ──
  @Column({ name: 'inv_einv_status', length: 20, default: 'NONE' })
  invEinvStatus: string; // NONE | PENDING | ISSUED | FAILED | CANCELLED

  @Column({ name: 'inv_einv_number', length: 50, nullable: true })
  invEinvNumber: string;

  @Column({ name: 'inv_einv_form_number', length: 5, nullable: true })
  invEinvFormNumber: string;

  @Column({ name: 'inv_einv_reference_code', length: 10, nullable: true })
  invEinvReferenceCode: string;

  @Column({ name: 'inv_einv_gdt_code', length: 100, nullable: true })
  invEinvGdtCode: string;

  @Column({ name: 'inv_einv_issued_at', type: 'timestamptz', nullable: true })
  invEinvIssuedAt: Date;

  @Column({ name: 'inv_einv_xml_path', length: 500, nullable: true })
  invEinvXmlPath: string;

  @Column({ name: 'inv_einv_pdf_path', length: 500, nullable: true })
  invEinvPdfPath: string;

  @Column({ name: 'inv_einv_lookup_url', length: 500, nullable: true })
  invEinvLookupUrl: string;

  @Column({ name: 'inv_einv_error', type: 'text', nullable: true })
  invEinvError: string;

  // ── NTS Tax Invoice (Korea) ──
  @Column({ name: 'inv_nts_mgt_key', length: 24, nullable: true })
  invNtsMgtKey: string;

  @Column({ name: 'inv_nts_confirm_num', length: 30, nullable: true })
  invNtsConfirmNum: string;

  @Column({ name: 'inv_nts_status', length: 20, default: 'NONE' })
  invNtsStatus: string; // NONE | PENDING | ISSUED | ACCEPTED | REJECTED | FAILED | CANCELLED

  @Column({ name: 'inv_nts_issued_at', type: 'timestamptz', nullable: true })
  invNtsIssuedAt: Date;

  @Column({ name: 'inv_nts_sent_at', type: 'timestamptz', nullable: true })
  invNtsSentAt: Date;

  @Column({ name: 'inv_nts_result_code', length: 10, nullable: true })
  invNtsResultCode: string;

  @Column({ name: 'inv_nts_error', type: 'text', nullable: true })
  invNtsError: string;

  @Column({ name: 'inv_nts_modify_code', length: 2, nullable: true })
  invNtsModifyCode: string;

  @Column({ name: 'inv_nts_original_key', length: 24, nullable: true })
  invNtsOriginalKey: string;

  @Column({ name: 'inv_stripe_invoice_id', length: 50, nullable: true })
  invStripeInvoiceId: string;

  @Column({ name: 'inv_stripe_payment_intent_id', length: 50, nullable: true })
  invStripePaymentIntentId: string;

  @CreateDateColumn({ name: 'inv_created_at' })
  invCreatedAt: Date;

  @UpdateDateColumn({ name: 'inv_updated_at' })
  invUpdatedAt: Date;

  @DeleteDateColumn({ name: 'inv_deleted_at' })
  invDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => PartnerEntity)
  @JoinColumn({ name: 'ptn_id' })
  partner: PartnerEntity;

  @ManyToOne(() => ContractEntity)
  @JoinColumn({ name: 'ctr_id' })
  contract: ContractEntity;

  @OneToMany(() => InvoiceItemEntity, (item) => item.invoice, { cascade: true })
  items: InvoiceItemEntity[];
}
