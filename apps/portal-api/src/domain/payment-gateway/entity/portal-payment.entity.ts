import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';

@Entity('amb_svc_portal_payments')
export class PortalPaymentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ppm_id' })
  ppmId: string;

  @Index()
  @Column({ name: 'ppm_customer_id', type: 'uuid' })
  ppmCustomerId: string;

  @Column({ name: 'ppm_cli_id', type: 'uuid', nullable: true })
  ppmCliId?: string;

  @Column({ name: 'ppm_sub_id', type: 'uuid', nullable: true })
  ppmSubId?: string;

  @Index()
  @Column({ name: 'ppm_gateway', length: 30 })
  ppmGateway: string; // STRIPE, VNPAY, VNPTEPAY, TOSS

  @Column({ name: 'ppm_gateway_tx_id', length: 100, nullable: true })
  ppmGatewayTxId?: string;

  @Column({ name: 'ppm_gateway_order_id', length: 100, nullable: true })
  ppmGatewayOrderId?: string;

  @Column({ name: 'ppm_amount', type: 'decimal', precision: 15, scale: 2 })
  ppmAmount: number;

  @Column({ name: 'ppm_currency', length: 3 })
  ppmCurrency: string;

  @Column({ name: 'ppm_status', length: 20, default: 'PENDING' })
  ppmStatus: string; // PENDING, PROCESSING, COMPLETED, FAILED, REFUNDED, CANCELLED

  @Column({ name: 'ppm_type', length: 20, default: 'SUBSCRIPTION' })
  ppmType: string; // SUBSCRIPTION, ONE_TIME, OVERAGE

  @Column({ name: 'ppm_method', length: 30, nullable: true })
  ppmMethod?: string; // CARD, BANK_TRANSFER, WALLET, QR

  @Column({ name: 'ppm_description', length: 500, nullable: true })
  ppmDescription?: string;

  @Column({ name: 'ppm_gateway_response', type: 'jsonb', nullable: true })
  ppmGatewayResponse?: Record<string, unknown>;

  @Column({ name: 'ppm_error_code', length: 30, nullable: true })
  ppmErrorCode?: string;

  @Column({ name: 'ppm_error_message', type: 'text', nullable: true })
  ppmErrorMessage?: string;

  @Column({ name: 'ppm_paid_at', type: 'timestamptz', nullable: true })
  ppmPaidAt?: Date;

  @Column({ name: 'ppm_refunded_at', type: 'timestamptz', nullable: true })
  ppmRefundedAt?: Date;

  @Column({ name: 'ppm_ip_address', length: 45, nullable: true })
  ppmIpAddress?: string;

  @Column({ name: 'ppm_country', length: 5, nullable: true })
  ppmCountry?: string;

  @CreateDateColumn({ name: 'ppm_created_at' })
  ppmCreatedAt: Date;

  @UpdateDateColumn({ name: 'ppm_updated_at' })
  ppmUpdatedAt: Date;
}
