import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { TalkMessageEntity } from './talk-message.entity';

@Entity('amb_talk_attachments')
export class TalkAttachmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tat_id' })
  tatId: string;

  @Column({ name: 'msg_id', type: 'uuid' })
  msgId: string;

  @Column({ name: 'tat_original_name', length: 255 })
  tatOriginalName: string;

  @Column({ name: 'tat_stored_name', length: 255 })
  tatStoredName: string;

  @Column({ name: 'tat_file_size', type: 'integer' })
  tatFileSize: number;

  @Column({ name: 'tat_mime_type', length: 100 })
  tatMimeType: string;

  @CreateDateColumn({ name: 'tat_created_at' })
  tatCreatedAt: Date;

  @ManyToOne(() => TalkMessageEntity)
  @JoinColumn({ name: 'msg_id' })
  message: TalkMessageEntity;
}
