import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * 포탈 고객 테이블 읽기 전용 엔티티
 * - 내부 API에서 포탈 고객 정보를 조회하기 위한 용도
 * - INSERT/UPDATE/DELETE 없이 SELECT만 사용
 */
@Entity('amb_svc_portal_customers')
export class PortalCustomerReadonlyEntity {
  @PrimaryColumn({ name: 'pct_id', type: 'uuid' })
  pctId: string;

  @Column({ name: 'pct_email', length: 200 })
  pctEmail: string;

  @Column({ name: 'pct_name', length: 100 })
  pctName: string;

  @Column({ name: 'pct_phone', type: 'varchar', length: 30, nullable: true })
  pctPhone: string | null;

  @Column({ name: 'pct_company_name', type: 'varchar', length: 300, nullable: true })
  pctCompanyName: string | null;

  @Column({ name: 'pct_country', type: 'varchar', length: 5, nullable: true })
  pctCountry: string | null;

  @Column({ name: 'pct_email_verified', type: 'boolean', default: false })
  pctEmailVerified: boolean;

  @Column({ name: 'pct_cli_id', type: 'uuid', nullable: true })
  pctCliId: string | null;

  @Column({ name: 'pct_status', length: 20 })
  pctStatus: string;

  @CreateDateColumn({ name: 'pct_created_at' })
  pctCreatedAt: Date;

  @Column({ name: 'pct_deleted_at', type: 'timestamptz', nullable: true, select: false })
  pctDeletedAt: Date | null;
}
