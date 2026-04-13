import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * 포탈 결제 테이블 읽기 전용 엔티티
 * - 내부 API에서 포탈 결제 정보를 조회/삭제하기 위한 용도
 */
@Entity('amb_svc_portal_payments')
export class PortalPaymentReadonlyEntity {
  @PrimaryColumn({ name: 'ppm_id', type: 'uuid' })
  ppmId: string;

  @Column({ name: 'ppm_customer_id', type: 'uuid' })
  ppmCustomerId: string;

  @Column({ name: 'ppm_cli_id', type: 'uuid', nullable: true })
  ppmCliId: string | null;

  @Column({ name: 'ppm_gateway', length: 30 })
  ppmGateway: string;

  @Column({ name: 'ppm_amount', type: 'decimal', precision: 15, scale: 2 })
  ppmAmount: number;

  @Column({ name: 'ppm_currency', length: 3 })
  ppmCurrency: string;

  @Column({ name: 'ppm_status', length: 20 })
  ppmStatus: string;

  @Column({ name: 'ppm_type', length: 20 })
  ppmType: string;

  @CreateDateColumn({ name: 'ppm_created_at' })
  ppmCreatedAt: Date;

  @UpdateDateColumn({ name: 'ppm_updated_at' })
  ppmUpdatedAt: Date;
}
