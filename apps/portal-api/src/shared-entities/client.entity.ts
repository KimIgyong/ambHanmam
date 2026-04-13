import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_svc_clients')
export class SvcClientEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cli_id' })
  cliId: string;

  @Column({ name: 'cli_code', length: 20, unique: true })
  cliCode: string;

  @Column({ name: 'cli_type', length: 20 })
  cliType: string;

  @Column({ name: 'cli_company_name', length: 300 })
  cliCompanyName: string;

  @Column({ name: 'cli_company_name_local', length: 300, nullable: true })
  cliCompanyNameLocal?: string;

  @Column({ name: 'cli_country', length: 5, nullable: true })
  cliCountry?: string;

  @Column({ name: 'cli_industry', length: 100, nullable: true })
  cliIndustry?: string;

  @Column({ name: 'cli_company_size', length: 20, nullable: true })
  cliCompanySize?: string;

  @Column({ name: 'cli_tax_id', length: 50, nullable: true })
  cliTaxId?: string;

  @Column({ name: 'cli_address', type: 'text', nullable: true })
  cliAddress?: string;

  @Column({ name: 'cli_website', length: 500, nullable: true })
  cliWebsite?: string;

  @Column({ name: 'cli_logo_url', length: 500, nullable: true })
  cliLogoUrl?: string;

  @Column({ name: 'cli_status', length: 20, default: 'ACTIVE' })
  cliStatus: string;

  @Column({ name: 'cli_source', length: 50, nullable: true })
  cliSource?: string;

  @Column({ name: 'cli_referred_by', type: 'uuid', nullable: true })
  cliReferredBy?: string;

  @Column({ name: 'cli_account_manager_id', type: 'uuid', nullable: true })
  cliAccountManagerId?: string;

  @Column({ name: 'cli_bil_partner_id', type: 'uuid', nullable: true })
  cliBilPartnerId?: string;

  @Column({ name: 'cli_note', type: 'text', nullable: true })
  cliNote?: string;

  @Column({ name: 'cli_stripe_customer_id', length: 50, nullable: true })
  cliStripeCustomerId?: string;

  @Column({ name: 'cli_email_verified', type: 'boolean', default: false })
  cliEmailVerified: boolean;

  @Column({ name: 'cli_portal_source', length: 20, default: 'MANUAL' })
  cliPortalSource: string;

  @CreateDateColumn({ name: 'cli_created_at' })
  cliCreatedAt: Date;

  @UpdateDateColumn({ name: 'cli_updated_at' })
  cliUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cli_deleted_at' })
  cliDeletedAt: Date;
}
