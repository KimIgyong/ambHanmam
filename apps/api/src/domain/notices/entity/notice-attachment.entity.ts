import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { NoticeEntity } from './notice.entity';

@Entity('amb_notice_attachments')
export class NoticeAttachmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'nta_id' })
  ntaId: string;

  @Column({ name: 'ntc_id' })
  ntcId: string;

  @Column({ name: 'nta_original_name', length: 255 })
  ntaOriginalName: string;

  @Column({ name: 'nta_stored_name', length: 255 })
  ntaStoredName: string;

  @Column({ name: 'nta_file_size', type: 'integer' })
  ntaFileSize: number;

  @Column({ name: 'nta_mime_type', length: 100 })
  ntaMimeType: string;

  @CreateDateColumn({ name: 'nta_created_at' })
  ntaCreatedAt: Date;

  @ManyToOne(() => NoticeEntity, (notice) => notice.attachments)
  @JoinColumn({ name: 'ntc_id' })
  notice: NoticeEntity;
}
