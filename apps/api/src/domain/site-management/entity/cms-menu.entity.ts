import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';

@Entity('amb_cms_menus')
@Unique(['cmnSlug', 'entId'])
export class CmsMenuEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cmn_id' })
  cmnId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'cmn_parent_id', type: 'uuid', nullable: true })
  cmnParentId: string | null;

  @Column({ name: 'cmn_name_en', type: 'varchar', length: 200 })
  cmnNameEn: string;

  @Column({ name: 'cmn_name_ko', type: 'varchar', length: 200, nullable: true })
  cmnNameKo: string | null;

  @Column({ name: 'cmn_slug', type: 'varchar', length: 200 })
  cmnSlug: string;

  @Column({ name: 'cmn_icon', type: 'varchar', length: 50, nullable: true })
  cmnIcon: string | null;

  @Column({ name: 'cmn_type', type: 'varchar', length: 20, default: 'INTERNAL' })
  cmnType: string;

  @Column({ name: 'cmn_external_url', type: 'varchar', length: 500, nullable: true })
  cmnExternalUrl: string | null;

  @Column({ name: 'cmn_sort_order', type: 'int', default: 0 })
  cmnSortOrder: number;

  @Column({ name: 'cmn_is_visible', type: 'boolean', default: true })
  cmnIsVisible: boolean;

  @CreateDateColumn({ name: 'cmn_created_at', type: 'timestamptz' })
  cmnCreatedAt: Date;

  @UpdateDateColumn({ name: 'cmn_updated_at', type: 'timestamptz' })
  cmnUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cmn_deleted_at', type: 'timestamptz', nullable: true })
  cmnDeletedAt: Date | null;

  // Relations
  @ManyToOne(() => CmsMenuEntity, { nullable: true })
  @JoinColumn({ name: 'cmn_parent_id' })
  parent: CmsMenuEntity | null;

  @OneToMany(() => CmsMenuEntity, (menu) => menu.parent)
  children: CmsMenuEntity[];

  @OneToOne(() => CmsPageEntity, (page) => page.menu)
  page: CmsPageEntity;
}
