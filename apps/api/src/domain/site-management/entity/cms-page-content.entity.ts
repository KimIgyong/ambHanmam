import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';

@Entity('amb_cms_page_contents')
@Unique(['cmpId', 'cpcLang'])
export class CmsPageContentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cpc_id' })
  cpcId: string;

  @Column({ name: 'cmp_id', type: 'uuid' })
  cmpId: string;

  @Column({ name: 'cpc_lang', type: 'varchar', length: 5, default: 'en' })
  cpcLang: string;

  @Column({ name: 'cpc_content', type: 'text', nullable: true })
  cpcContent: string | null;

  @Column({ name: 'cpc_sections_json', type: 'jsonb', nullable: true })
  cpcSectionsJson: Record<string, any> | null;

  @UpdateDateColumn({ name: 'cpc_updated_at', type: 'timestamptz' })
  cpcUpdatedAt: Date;

  // Relations
  @ManyToOne(() => CmsPageEntity, (page) => page.contents)
  @JoinColumn({ name: 'cmp_id' })
  page: CmsPageEntity;
}
