import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { PartnerOrganizationEntity } from '../../partner/entity/partner-organization.entity';

@Unique('UQ_partner_app_code', ['ptnId', 'papCode'])
@Entity('amb_partner_apps')
export class PartnerAppEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pap_id' })
  papId: string;

  @Column({ name: 'ptn_id', type: 'uuid' })
  ptnId: string;

  @ManyToOne(() => PartnerOrganizationEntity, { nullable: false })
  @JoinColumn({ name: 'ptn_id' })
  partner: PartnerOrganizationEntity;

  @Column({ name: 'pap_code', length: 50 })
  papCode: string;

  @Column({ name: 'pap_name', length: 200 })
  papName: string;

  @Column({ name: 'pap_description', type: 'text', nullable: true })
  papDescription: string | null;

  @Column({ name: 'pap_icon', type: 'varchar', length: 100, nullable: true })
  papIcon: string | null;

  @Column({ name: 'pap_url', length: 500 })
  papUrl: string;

  @Column({ name: 'pap_auth_mode', length: 20, default: 'jwt' })
  papAuthMode: string;

  @Column({ name: 'pap_open_mode', length: 20, default: 'iframe' })
  papOpenMode: string;

  @Column({ name: 'pap_category', length: 100, default: 'GENERAL' })
  papCategory: string;

  @Column({ name: 'pap_status', length: 20, default: 'DRAFT' })
  papStatus: string;

  @Column({ name: 'pap_version', length: 20, default: '1.0.0' })
  papVersion: string;

  @Column({ name: 'pap_review_note', type: 'text', nullable: true, default: null })
  papReviewNote: string | null;

  @Column({ name: 'pap_registered_by', type: 'uuid' })
  papRegisteredBy: string;

  @Column({ name: 'pap_reviewed_by', type: 'uuid', nullable: true, default: null })
  papReviewedBy: string | null;

  @Column({ name: 'pap_reviewed_at', type: 'timestamp', nullable: true })
  papReviewedAt: Date | null;

  @Column({ name: 'pap_published_at', type: 'timestamp', nullable: true })
  papPublishedAt: Date | null;

  // ── OAuth 2.0 Client 필드 ──
  @Column({ name: 'pap_client_id', type: 'varchar', length: 100, nullable: true, unique: true })
  papClientId: string | null;

  @Column({ name: 'pap_client_secret_hash', type: 'varchar', length: 255, nullable: true })
  papClientSecretHash: string | null;

  @Column({ name: 'pap_redirect_uris', type: 'text', array: true, nullable: true })
  papRedirectUris: string[] | null;

  @Column({ name: 'pap_scopes', type: 'text', array: true, default: '{}' })
  papScopes: string[];

  @CreateDateColumn({ name: 'pap_created_at' })
  papCreatedAt: Date;

  @UpdateDateColumn({ name: 'pap_updated_at' })
  papUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pap_deleted_at' })
  papDeletedAt: Date;
}
