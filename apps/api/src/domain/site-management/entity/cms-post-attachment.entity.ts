import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CmsPostEntity } from './cms-post.entity';

@Entity('amb_cms_post_attachments')
export class CmsPostAttachmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cpa_id' })
  cpaId: string;

  @Column({ name: 'cpt_id', type: 'uuid' })
  cptId: string;

  @Column({ name: 'cpa_file_name', type: 'varchar', length: 300 })
  cpaFileName: string;

  @Column({ name: 'cpa_file_url', type: 'varchar', length: 500 })
  cpaFileUrl: string;

  @Column({ name: 'cpa_file_size', type: 'int' })
  cpaFileSize: number;

  @Column({ name: 'cpa_mime_type', type: 'varchar', length: 100 })
  cpaMimeType: string;

  @CreateDateColumn({ name: 'cpa_created_at', type: 'timestamptz' })
  cpaCreatedAt: Date;

  // Relations
  @ManyToOne(() => CmsPostEntity, (post) => post.attachments)
  @JoinColumn({ name: 'cpt_id' })
  post: CmsPostEntity;
}
