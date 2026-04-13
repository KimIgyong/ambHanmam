import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_bil_partners')
@Unique(['entId', 'ptnCode'])
export class PartnerEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ptn_id' })
  ptnId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'ptn_code', length: 20 })
  ptnCode: string;

  @Column({ name: 'ptn_type', length: 20 })
  ptnType: string;

  @Column({ name: 'ptn_company_name', length: 200 })
  ptnCompanyName: string;

  @Column({ name: 'ptn_company_name_local', length: 200, nullable: true })
  ptnCompanyNameLocal: string;

  @Column({ name: 'ptn_country', length: 256, nullable: true })
  ptnCountry: string;

  @Column({ name: 'ptn_contact_name', length: 100, nullable: true })
  ptnContactName: string;

  @Column({ name: 'ptn_contact_email', length: 200, nullable: true })
  ptnContactEmail: string;

  @Column({ name: 'ptn_contact_phone', length: 30, nullable: true })
  ptnContactPhone: string;

  @Column({ name: 'ptn_address', type: 'text', nullable: true })
  ptnAddress: string;

  @Column({ name: 'ptn_tax_id', length: 50, nullable: true })
  ptnTaxId: string;

  @Column({ name: 'ptn_biz_type', length: 100, nullable: true })
  ptnBizType: string;

  @Column({ name: 'ptn_biz_category', length: 100, nullable: true })
  ptnBizCategory: string;

  @Column({ name: 'ptn_ceo_name', length: 100, nullable: true })
  ptnCeoName: string;

  @Column({ name: 'ptn_default_currency', length: 3, default: 'USD' })
  ptnDefaultCurrency: string;

  @Column({ name: 'ptn_payment_terms', type: 'int', default: 30 })
  ptnPaymentTerms: number;

  @Column({ name: 'ptn_status', length: 20, default: 'ACTIVE' })
  ptnStatus: string;

  @Column({ name: 'ptn_cross_entity_ref', type: 'uuid', nullable: true })
  ptnCrossEntityRef: string;

  @Column({ name: 'ptn_gdrive_folder_id', length: 100, nullable: true })
  ptnGdriveFolderId: string;

  @Column({ name: 'ptn_note', type: 'text', nullable: true })
  ptnNote: string;

  @Column({ name: 'ptn_stripe_customer_id', length: 50, nullable: true })
  ptnStripeCustomerId: string;

  @Column({ name: 'ptn_source', length: 20, default: 'MANUAL' })
  ptnSource: string;

  @Column({ name: 'ptn_original_lang', length: 5, default: 'ko' })
  ptnOriginalLang: string;

  @CreateDateColumn({ name: 'ptn_created_at' })
  ptnCreatedAt: Date;

  @UpdateDateColumn({ name: 'ptn_updated_at' })
  ptnUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ptn_deleted_at' })
  ptnDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
