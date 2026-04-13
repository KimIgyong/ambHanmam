import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('amb_site_settings')
export class SiteSettingsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sts_id' })
  stsId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'sts_portal_url', type: 'varchar', length: 500, nullable: true })
  stsPortalUrl: string | null;

  @Column({ name: 'sts_portal_domain', type: 'varchar', length: 200, nullable: true })
  stsPortalDomain: string | null;

  @Column({ name: 'sts_allowed_ips', type: 'jsonb', nullable: true, default: '[]' })
  stsAllowedIps: string[];

  @Column({ name: 'sts_allowed_domains', type: 'jsonb', nullable: true, default: '[]' })
  stsAllowedDomains: string[];

  @Column({ name: 'sts_is_public', type: 'boolean', default: false })
  stsIsPublic: boolean;

  @Column({ name: 'sts_logo_url', type: 'varchar', length: 500, nullable: true })
  stsLogoUrl: string | null;

  @Column({ name: 'sts_favicon_url', type: 'varchar', length: 500, nullable: true })
  stsFaviconUrl: string | null;

  @Column({ name: 'sts_ga_measurement_id', type: 'varchar', length: 30, nullable: true })
  stsGaMeasurementId: string | null;

  @Column({ name: 'sts_app_ga_measurement_id', type: 'varchar', length: 30, nullable: true })
  stsAppGaMeasurementId: string | null;

  @Column({ name: 'sts_index_enabled', type: 'boolean', default: false })
  stsIndexEnabled: boolean;

  @Column({ name: 'sts_index_html', type: 'text', nullable: true })
  stsIndexHtml: string | null;

  @UpdateDateColumn({ name: 'sts_updated_at' })
  stsUpdatedAt: Date;

  @Column({ name: 'sts_updated_by', type: 'uuid', nullable: true })
  stsUpdatedBy: string | null;
}
