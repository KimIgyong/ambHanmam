import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { PartnerOrganizationEntity } from '../../partner/entity/partner-organization.entity';

@Entity('amb_invitations')
export class InvitationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'inv_id' })
  invId: string;

  @Column({ name: 'inv_email', length: 200 })
  invEmail: string;

  @Column({ name: 'inv_token', length: 100, unique: true })
  invToken: string;

  @Column({ name: 'inv_role', length: 20 })
  invRole: string;

  @Column({ name: 'inv_unit', length: 30 })
  invUnit: string;

  @Column({ name: 'inv_cell_id', type: 'uuid', nullable: true })
  invCellId: string | null;

  @Column({ name: 'inv_status', length: 20, default: 'PENDING' })
  invStatus: string;

  @Column({ name: 'inv_invited_by', type: 'uuid' })
  invInvitedBy: string;

  @Column({ name: 'inv_expires_at', type: 'timestamp' })
  invExpiresAt: Date;

  @Column({ name: 'inv_accepted_at', type: 'timestamp', nullable: true })
  invAcceptedAt: Date | null;

  // ── 레벨/조직 확장 ──

  /** 레벨 코드: ADMIN_LEVEL | USER_LEVEL */
  @Column({ name: 'inv_level_code', type: 'varchar', length: 30, nullable: true })
  invLevelCode: string | null;

  /** 지정 소속 회사 */
  @Column({ name: 'inv_company_id', type: 'uuid', nullable: true })
  invCompanyId: string | null;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'inv_company_id' })
  company: HrEntityEntity;

  /** 지정 파트너사 (PARTNER_LEVEL 초대 시) */
  @Column({ name: 'inv_partner_id', type: 'uuid', nullable: true })
  invPartnerId: string | null;

  @ManyToOne(() => PartnerOrganizationEntity, { nullable: true })
  @JoinColumn({ name: 'inv_partner_id' })
  partnerOrg: PartnerOrganizationEntity;

  /** 초대 수락 시 자동 승인 여부 */
  @Column({ name: 'inv_auto_approve', type: 'boolean', default: false })
  invAutoApprove: boolean;

  // ── 메일 발송 로그 ──

  /** 마지막 발송 시각 */
  @Column({ name: 'inv_last_sent_at', type: 'timestamp', nullable: true })
  invLastSentAt: Date | null;

  /** 발송 횟수 (최초 발송 포함) */
  @Column({ name: 'inv_send_count', type: 'int', default: 0 })
  invSendCount: number;

  @CreateDateColumn({ name: 'inv_created_at' })
  invCreatedAt: Date;

  @UpdateDateColumn({ name: 'inv_updated_at' })
  invUpdatedAt: Date;
}
