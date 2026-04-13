import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('amb_cms_site_config')
@Unique(['cscKey', 'entId'])
export class CmsSiteConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'csc_id' })
  cscId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'csc_key', type: 'varchar', length: 100 })
  cscKey: string;

  @Column({ name: 'csc_value', type: 'jsonb', default: () => "'{}'" })
  cscValue: Record<string, any>;

  @Column({ name: 'csc_version', type: 'int', default: 1 })
  cscVersion: number;

  @Column({ name: 'csc_published_at', type: 'timestamptz', nullable: true })
  cscPublishedAt: Date | null;

  @Column({ name: 'csc_published_by', type: 'uuid', nullable: true })
  cscPublishedBy: string | null;

  @CreateDateColumn({ name: 'csc_created_at', type: 'timestamptz' })
  cscCreatedAt: Date;

  @UpdateDateColumn({ name: 'csc_updated_at', type: 'timestamptz' })
  cscUpdatedAt: Date;

  @Column({ name: 'csc_updated_by', type: 'uuid', nullable: true })
  cscUpdatedBy: string | null;
}
