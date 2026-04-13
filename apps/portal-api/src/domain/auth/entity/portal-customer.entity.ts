import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, Index,
} from 'typeorm';

@Entity('amb_svc_portal_customers')
export class PortalCustomerEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pct_id' })
  pctId: string;

  @Index()
  @Column({ name: 'pct_email', length: 200, unique: true })
  pctEmail: string;

  @Column({ name: 'pct_password', length: 200 })
  pctPassword: string;

  @Column({ name: 'pct_name', length: 100 })
  pctName: string;

  @Column({ name: 'pct_phone', length: 30, nullable: true })
  pctPhone?: string;

  @Column({ name: 'pct_company_name', length: 300, nullable: true })
  pctCompanyName?: string;

  @Column({ name: 'pct_country', length: 5, nullable: true })
  pctCountry?: string;

  @Column({ name: 'pct_email_verified', type: 'boolean', default: false })
  pctEmailVerified: boolean;

  @Column({ name: 'pct_email_verify_token', length: 200, nullable: true })
  pctEmailVerifyToken?: string;

  @Column({ name: 'pct_email_verify_expires', type: 'timestamptz', nullable: true })
  pctEmailVerifyExpires?: Date;

  @Column({ name: 'pct_password_reset_token', length: 200, nullable: true })
  pctPasswordResetToken?: string;

  @Column({ name: 'pct_password_reset_expires', type: 'timestamptz', nullable: true })
  pctPasswordResetExpires?: Date;

  @Column({ name: 'pct_cli_id', type: 'uuid', nullable: true })
  pctCliId?: string;

  @Column({ name: 'pct_stripe_customer_id', length: 50, nullable: true })
  pctStripeCustomerId?: string;

  @Column({ name: 'pct_auth_provider', length: 20, default: 'EMAIL' })
  pctAuthProvider: string;

  @Column({ name: 'pct_status', length: 20, default: 'ACTIVE' })
  pctStatus: string;

  @Column({ name: 'pct_last_login_at', type: 'timestamptz', nullable: true })
  pctLastLoginAt?: Date;

  @Column({ name: 'pct_terms_agreed_at', type: 'timestamptz', nullable: true })
  pctTermsAgreedAt?: Date;

  @Column({ name: 'pct_privacy_agreed_at', type: 'timestamptz', nullable: true })
  pctPrivacyAgreedAt?: Date;

  @Column({ name: 'pct_marketing_agreed_at', type: 'timestamptz', nullable: true })
  pctMarketingAgreedAt?: Date;

  @Column({ name: 'pct_terms_version', type: 'varchar', length: 20, nullable: true })
  pctTermsVersion?: string;

  @Column({ name: 'pct_privacy_version', type: 'varchar', length: 20, nullable: true })
  pctPrivacyVersion?: string;

  @CreateDateColumn({ name: 'pct_created_at' })
  pctCreatedAt: Date;

  @UpdateDateColumn({ name: 'pct_updated_at' })
  pctUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pct_deleted_at' })
  pctDeletedAt: Date;
}
