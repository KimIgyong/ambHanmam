import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';

@Entity('amb_cms_post_categories')
export class CmsPostCategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cpg_id' })
  cpgId: string;

  @Column({ name: 'cmp_id', type: 'uuid' })
  cmpId: string;

  @Column({ name: 'cpg_name', type: 'varchar', length: 100 })
  cpgName: string;

  @Column({ name: 'cpg_sort_order', type: 'int', default: 0 })
  cpgSortOrder: number;

  @CreateDateColumn({ name: 'cpg_created_at', type: 'timestamptz' })
  cpgCreatedAt: Date;

  // Relations
  @ManyToOne(() => CmsPageEntity, (page) => page.categories)
  @JoinColumn({ name: 'cmp_id' })
  page: CmsPageEntity;
}
