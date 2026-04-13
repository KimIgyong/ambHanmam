import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CmsMenuEntity } from './cms-menu.entity';
import { CmsPageContentEntity } from './cms-page-content.entity';
import { CmsPageVersionEntity } from './cms-page-version.entity';
import { CmsSectionEntity } from './cms-section.entity';
import { CmsPostEntity } from './cms-post.entity';
import { CmsPostCategoryEntity } from './cms-post-category.entity';
import { CmsSubscriberEntity } from './cms-subscriber.entity';

@Entity('amb_cms_pages')
export class CmsPageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cmp_id' })
  cmpId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'cmn_id', type: 'uuid' })
  cmnId: string;

  @Column({ name: 'cmp_type', type: 'varchar', length: 30 })
  cmpType: string;

  @Column({ name: 'cmp_title', type: 'varchar', length: 300 })
  cmpTitle: string;

  @Column({ name: 'cmp_slug', type: 'varchar', length: 300 })
  cmpSlug: string;

  @Column({ name: 'cmp_description', type: 'text', nullable: true })
  cmpDescription: string | null;

  @Column({ name: 'cmp_og_image', type: 'varchar', length: 500, nullable: true })
  cmpOgImage: string | null;

  @Column({ name: 'cmp_seo_keywords', type: 'varchar', length: 500, nullable: true })
  cmpSeoKeywords: string | null;

  @Column({ name: 'cmp_status', type: 'varchar', length: 20, default: 'DRAFT' })
  cmpStatus: string;

  @Column({ name: 'cmp_published_at', type: 'timestamptz', nullable: true })
  cmpPublishedAt: Date | null;

  @Column({ name: 'cmp_published_by', type: 'uuid', nullable: true })
  cmpPublishedBy: string | null;

  @Column({ name: 'cmp_current_version', type: 'int', default: 0 })
  cmpCurrentVersion: number;

  @Column({ name: 'cmp_config', type: 'jsonb', nullable: true, default: {} })
  cmpConfig: Record<string, any>;

  @CreateDateColumn({ name: 'cmp_created_at', type: 'timestamptz' })
  cmpCreatedAt: Date;

  @UpdateDateColumn({ name: 'cmp_updated_at', type: 'timestamptz' })
  cmpUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cmp_deleted_at', type: 'timestamptz', nullable: true })
  cmpDeletedAt: Date | null;

  // Relations
  @OneToOne(() => CmsMenuEntity, (menu) => menu.page)
  @JoinColumn({ name: 'cmn_id' })
  menu: CmsMenuEntity;

  @OneToMany(() => CmsPageContentEntity, (content) => content.page)
  contents: CmsPageContentEntity[];

  @OneToMany(() => CmsPageVersionEntity, (version) => version.page)
  versions: CmsPageVersionEntity[];

  @OneToMany(() => CmsSectionEntity, (section) => section.page)
  sections: CmsSectionEntity[];

  @OneToMany(() => CmsPostEntity, (post) => post.page)
  posts: CmsPostEntity[];

  @OneToMany(() => CmsPostCategoryEntity, (cat) => cat.page)
  categories: CmsPostCategoryEntity[];

  @OneToMany(() => CmsSubscriberEntity, (sub) => sub.page)
  subscribers: CmsSubscriberEntity[];
}
