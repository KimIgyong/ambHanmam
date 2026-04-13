import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';

@Entity('amb_cms_sections')
export class CmsSectionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cms_id' })
  cmsId: string;

  @Column({ name: 'cmp_id', type: 'uuid' })
  cmpId: string;

  @Column({ name: 'cms_type', type: 'varchar', length: 30 })
  cmsType: string;

  @Column({ name: 'cms_sort_order', type: 'int', default: 0 })
  cmsSortOrder: number;

  @Column({ name: 'cms_config', type: 'jsonb', default: {} })
  cmsConfig: Record<string, any>;

  @Column({ name: 'cms_content_en', type: 'jsonb', default: {} })
  cmsContentEn: Record<string, any>;

  @Column({ name: 'cms_content_ko', type: 'jsonb', nullable: true, default: {} })
  cmsContentKo: Record<string, any> | null;

  @Column({ name: 'cms_is_visible', type: 'boolean', default: true })
  cmsIsVisible: boolean;

  @CreateDateColumn({ name: 'cms_created_at', type: 'timestamptz' })
  cmsCreatedAt: Date;

  // Relations
  @ManyToOne(() => CmsPageEntity, (page) => page.sections)
  @JoinColumn({ name: 'cmp_id' })
  page: CmsPageEntity;
}
