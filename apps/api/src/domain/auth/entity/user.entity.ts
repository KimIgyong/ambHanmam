import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { PartnerOrganizationEntity } from '../../partner/entity/partner-organization.entity';

@Index('UQ_users_email_company', ['usrEmail', 'usrCompanyId'], {
  unique: true,
  where: '"usr_deleted_at" IS NULL',
})
@Entity('amb_users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'usr_id' })
  usrId: string;

  @Column({ name: 'usr_email', length: 200 })
  usrEmail: string;

  @Column({ name: 'usr_password', length: 200 })
  usrPassword: string;

  @Column({ name: 'usr_name', length: 50 })
  usrName: string;

  @Column({ name: 'usr_unit', length: 30 })
  usrUnit: string;

  @Column({ name: 'usr_role', length: 20, default: 'MEMBER' })
  usrRole: string;

  @Column({ name: 'usr_company_email', length: 200, unique: true, nullable: true })
  usrCompanyEmail: string;

  @Column({ name: 'usr_token_version', type: 'int', default: 0 })
  usrTokenVersion: number;

  @Column({ name: 'usr_signature_image', type: 'bytea', nullable: true })
  usrSignatureImage: Buffer;

  // ── 레벨/역할/상태 ──

  /** 레벨 코드: ADMIN_LEVEL | USER_LEVEL */
  @Column({ name: 'usr_level_code', length: 30, default: 'USER_LEVEL' })
  usrLevelCode: string;

  /** 상태: PENDING | ACTIVE | INACTIVE | SUSPENDED | WITHDRAWN */
  @Column({ name: 'usr_status', length: 20, default: 'PENDING' })
  usrStatus: string;

  /** 최초 로그인 시 비밀번호 변경 강제 여부 */
  @Column({ name: 'usr_must_change_pw', type: 'boolean', default: false })
  usrMustChangePw: boolean;

  /** 가입 경로: SEED | REGISTER | INVITE */
  @Column({ name: 'usr_join_method', type: 'varchar', length: 20, nullable: true })
  usrJoinMethod: string | null;

  // ── 소속 조직 ──

  /** 소속 조직 ID (HQ 소속 = 전체 관리, 하위 법인 소속 = 해당 법인만) */
  @Column({ name: 'usr_company_id', type: 'uuid', nullable: true })
  usrCompanyId: string | null;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'usr_company_id' })
  company: HrEntityEntity;

  // ── 고객사 연결 (고객 포털) ──

  /** 소속 고객사 ID (CLIENT_LEVEL 사용자만 설정) */
  @Column({ name: 'usr_cli_id', type: 'uuid', nullable: true })
  usrCliId: string | null;

  @ManyToOne(() => SvcClientEntity, { nullable: true })
  @JoinColumn({ name: 'usr_cli_id' })
  client: SvcClientEntity;

  // ── 파트너사 연결 (파트너 포털) ──

  /** 소속 파트너사 ID (PARTNER_LEVEL 사용자만 설정) */
  @Column({ name: 'usr_partner_id', type: 'uuid', nullable: true })
  usrPartnerId: string | null;

  @ManyToOne(() => PartnerOrganizationEntity, { nullable: true })
  @JoinColumn({ name: 'usr_partner_id' })
  partner: PartnerOrganizationEntity;

  // ── 승인/초대 ──

  @Column({ name: 'usr_approved_by', type: 'uuid', nullable: true })
  usrApprovedBy: string | null;

  @Column({ name: 'usr_approved_at', type: 'timestamp', nullable: true })
  usrApprovedAt: Date | null;

  @Column({ name: 'usr_invited_by', type: 'uuid', nullable: true })
  usrInvitedBy: string | null;

  @Column({ name: 'usr_job_title', type: 'varchar', length: 100, nullable: true })
  usrJobTitle: string | null;

  @Column({ name: 'usr_phone', type: 'varchar', length: 30, nullable: true })
  usrPhone: string | null;

  @Column({ name: 'usr_profile_image', type: 'bytea', nullable: true })
  usrProfileImage: Buffer | null;

  @Column({ name: 'usr_last_login_at', type: 'timestamp', nullable: true })
  usrLastLoginAt: Date | null;

  @Column({ name: 'usr_failed_login_count', type: 'int', default: 0 })
  usrFailedLoginCount: number;

  @Column({ name: 'usr_locked_until', type: 'timestamp', nullable: true })
  usrLockedUntil: Date | null;

  // ── 번역 설정 ──

  /** 번역 설정: { save_prompt, preferred_view_lang } */
  @Column({
    name: 'usr_translation_prefs',
    type: 'jsonb',
    nullable: true,
    default: () => `'{"save_prompt":"ASK","preferred_view_lang":"original"}'`,
  })
  usrTranslationPrefs: Record<string, any> | null;

  /** 이슈 필터 프리셋: [{ name, filters }] */
  @Column({
    name: 'usr_issue_filter_presets',
    type: 'jsonb',
    nullable: true,
    default: () => `'[]'`,
  })
  usrIssueFilterPresets: Array<{ name: string; filters: Record<string, any> }> | null;

  /** 타임존: Asia/Ho_Chi_Minh | Asia/Seoul | UTC 등 */
  @Column({ name: 'usr_timezone', length: 50, default: 'Asia/Ho_Chi_Minh' })
  usrTimezone: string;

  /** UI 언어: vi | ko | en */
  @Column({ name: 'usr_locale', length: 10, default: 'vi' })
  usrLocale: string;

  @CreateDateColumn({ name: 'usr_created_at' })
  usrCreatedAt: Date;

  @UpdateDateColumn({ name: 'usr_updated_at' })
  usrUpdatedAt: Date;

  @DeleteDateColumn({ name: 'usr_deleted_at' })
  usrDeletedAt: Date;
}
