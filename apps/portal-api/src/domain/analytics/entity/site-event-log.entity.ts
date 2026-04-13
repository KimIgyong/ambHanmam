import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('amb_site_event_logs')
@Index('idx_sel_site_type_created', ['selSite', 'selEventType', 'selCreatedAt'])
export class SiteEventLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sel_id' })
  selId: string;

  @Column({ name: 'sel_site', type: 'varchar', length: 20 })
  selSite: string;

  @Column({ name: 'sel_event_type', type: 'varchar', length: 50 })
  selEventType: string;

  @Column({ name: 'sel_entity_id', type: 'uuid', nullable: true })
  selEntityId: string | null;

  @Column({ name: 'sel_user_id', type: 'uuid', nullable: true })
  selUserId: string | null;

  @Column({ name: 'sel_page_path', type: 'varchar', length: 500, nullable: true })
  selPagePath: string | null;

  @Column({ name: 'sel_referrer', type: 'varchar', length: 500, nullable: true })
  selReferrer: string | null;

  @Column({ name: 'sel_ip_address', type: 'varchar', length: 45, nullable: true })
  selIpAddress: string | null;

  @Column({ name: 'sel_user_agent', type: 'varchar', length: 500, nullable: true })
  selUserAgent: string | null;

  @Column({ name: 'sel_metadata', type: 'jsonb', default: '{}' })
  selMetadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'sel_created_at', type: 'timestamptz' })
  selCreatedAt: Date;
}
