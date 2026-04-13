import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';
import { CmsPostCategoryEntity } from './cms-post-category.entity';
import { CmsPostAttachmentEntity } from './cms-post-attachment.entity';

@Entity('amb_cms_posts')
export class CmsPostEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cpt_id' })
  cptId: string;

  @Column({ name: 'cmp_id', type: 'uuid' })
  cmpId: string;

  @Column({ name: 'cpg_id', type: 'uuid', nullable: true })
  cpgId: string | null;

  @Column({ name: 'cpt_title', type: 'varchar', length: 500 })
  cptTitle: string;

  @Column({ name: 'cpt_content', type: 'text' })
  cptContent: string;

  @Column({ name: 'cpt_author_id', type: 'uuid' })
  cptAuthorId: string;

  @Column({ name: 'cpt_is_pinned', type: 'boolean', default: false })
  cptIsPinned: boolean;

  @Column({ name: 'cpt_view_count', type: 'int', default: 0 })
  cptViewCount: number;

  @Column({ name: 'cpt_featured_image', type: 'varchar', length: 500, nullable: true })
  cptFeaturedImage: string | null;

  @Column({ name: 'cpt_tags', type: 'varchar', length: 500, nullable: true })
  cptTags: string | null;

  @Column({ name: 'cpt_status', type: 'varchar', length: 20, default: 'PUBLISHED' })
  cptStatus: string;

  @Column({ name: 'cpt_published_at', type: 'timestamptz', nullable: true })
  cptPublishedAt: Date | null;

  @CreateDateColumn({ name: 'cpt_created_at', type: 'timestamptz' })
  cptCreatedAt: Date;

  @UpdateDateColumn({ name: 'cpt_updated_at', type: 'timestamptz' })
  cptUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cpt_deleted_at', type: 'timestamptz', nullable: true })
  cptDeletedAt: Date | null;

  // Relations
  @ManyToOne(() => CmsPageEntity, (page) => page.posts)
  @JoinColumn({ name: 'cmp_id' })
  page: CmsPageEntity;

  @ManyToOne(() => CmsPostCategoryEntity, { nullable: true })
  @JoinColumn({ name: 'cpg_id' })
  category: CmsPostCategoryEntity | null;

  @OneToMany(() => CmsPostAttachmentEntity, (att) => att.post)
  attachments: CmsPostAttachmentEntity[];
}
