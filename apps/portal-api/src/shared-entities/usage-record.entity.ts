import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('amb_svc_usage_records')
export class SvcUsageRecordEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'usr_id' })
  usrId: string;

  @Index()
  @Column({ name: 'sub_id', type: 'uuid' })
  subId: string;

  @Column({ name: 'cli_id', type: 'uuid' })
  cliId: string;

  @Column({ name: 'svc_id', type: 'uuid' })
  svcId: string;

  @Index()
  @Column({ name: 'usr_metric', length: 50 })
  usrMetric: string; // e.g., 'api_calls', 'storage_gb', 'messages', 'orders'

  @Column({ name: 'usr_quantity', type: 'decimal', precision: 15, scale: 4 })
  usrQuantity: number;

  @Column({ name: 'usr_unit_price', type: 'decimal', precision: 10, scale: 4, nullable: true })
  usrUnitPrice?: number;

  @Column({ name: 'usr_total_amount', type: 'decimal', precision: 15, scale: 2, nullable: true })
  usrTotalAmount?: number;

  @Column({ name: 'usr_currency', length: 3, default: 'USD' })
  usrCurrency: string;

  @Index()
  @Column({ name: 'usr_period_start', type: 'timestamptz' })
  usrPeriodStart: Date;

  @Column({ name: 'usr_period_end', type: 'timestamptz' })
  usrPeriodEnd: Date;

  @Column({ name: 'usr_stripe_usage_record_id', length: 50, nullable: true })
  usrStripeUsageRecordId?: string;

  @Column({ name: 'usr_reported_to_stripe', type: 'boolean', default: false })
  usrReportedToStripe: boolean;

  @Column({ name: 'usr_source', length: 30, default: 'SYSTEM' })
  usrSource: string; // SYSTEM, API, MANUAL

  @Column({ name: 'usr_metadata', type: 'jsonb', nullable: true })
  usrMetadata?: Record<string, unknown>;

  @CreateDateColumn({ name: 'usr_created_at' })
  usrCreatedAt: Date;
}
