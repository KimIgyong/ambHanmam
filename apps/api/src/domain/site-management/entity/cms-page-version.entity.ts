import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';

@Entity('amb_cms_page_versions')
export class CmsPageVersionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cpv_id' })
  cpvId: string;

  @Column({ name: 'cmp_id', type: 'uuid' })
  cmpId: string;

  @Column({ name: 'cpv_version', type: 'int' })
  cpvVersion: number;

  @Column({ name: 'cpv_snapshot', type: 'jsonb' })
  cpvSnapshot: Record<string, any>;

  @Column({ name: 'cpv_published_by', type: 'uuid' })
  cpvPublishedBy: string;

  @CreateDateColumn({ name: 'cpv_published_at', type: 'timestamptz' })
  cpvPublishedAt: Date;

  @Column({ name: 'cpv_note', type: 'varchar', length: 500, nullable: true })
  cpvNote: string | null;

  // Relations
  @ManyToOne(() => CmsPageEntity, (page) => page.versions)
  @JoinColumn({ name: 'cmp_id' })
  page: CmsPageEntity;
}
