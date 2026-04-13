import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { PartnerAppEntity } from './partner-app.entity';

@Unique('UQ_partner_app_version', ['papId', 'pavVersion'])
@Entity('amb_partner_app_versions')
export class PartnerAppVersionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pav_id' })
  pavId: string;

  @Column({ name: 'pap_id', type: 'uuid' })
  papId: string;

  @ManyToOne(() => PartnerAppEntity, { nullable: false })
  @JoinColumn({ name: 'pap_id' })
  app: PartnerAppEntity;

  @Column({ name: 'pav_version', length: 20 })
  pavVersion: string;

  @Column({ name: 'pav_url', type: 'varchar', length: 500, nullable: true })
  pavUrl: string | null;

  @Column({ name: 'pav_change_log', type: 'text', nullable: true })
  pavChangeLog: string | null;

  @Column({ name: 'pav_status', length: 20, default: 'DRAFT' })
  pavStatus: string;

  @Column({ name: 'pav_reviewed_by', type: 'uuid', nullable: true, default: null })
  pavReviewedBy: string | null;

  @Column({ name: 'pav_reviewed_at', type: 'timestamp', nullable: true })
  pavReviewedAt: Date | null;

  @CreateDateColumn({ name: 'pav_created_at' })
  pavCreatedAt: Date;
}
