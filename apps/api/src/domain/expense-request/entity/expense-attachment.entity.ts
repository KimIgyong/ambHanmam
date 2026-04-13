import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn, Index, ManyToOne, JoinColumn,
} from 'typeorm';
import { ExpenseRequestEntity } from './expense-request.entity';

export type AttachmentType = 'FILE' | 'LINK';

@Entity('amb_expense_attachments')
@Index(['exrId'])
export class ExpenseAttachmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eat_id' })
  eatId: string;

  @Column({ name: 'exr_id' })
  exrId: string;

  @Column({ name: 'eat_type', length: 20 })
  eatType: AttachmentType;

  // FILE 타입 전용
  @Column({ name: 'eat_file_name', type: 'varchar', length: 500, nullable: true })
  eatFileName: string | null;

  @Column({ name: 'eat_file_size', type: 'bigint', nullable: true })
  eatFileSize: number | null;

  @Column({ name: 'eat_mime_type', type: 'varchar', length: 100, nullable: true })
  eatMimeType: string | null;

  @Column({ name: 'eat_storage_key', type: 'varchar', length: 1000, nullable: true })
  eatStorageKey: string | null;

  // LINK 타입 전용
  @Column({ name: 'eat_link_url', type: 'text', nullable: true })
  eatLinkUrl: string | null;

  @Column({ name: 'eat_link_title', type: 'varchar', length: 500, nullable: true })
  eatLinkTitle: string | null;

  @Column({ name: 'eat_uploader_id' })
  eatUploaderId: string;

  @CreateDateColumn({ name: 'eat_created_at' })
  eatCreatedAt: Date;

  @DeleteDateColumn({ name: 'eat_deleted_at' })
  eatDeletedAt: Date | null;

  // Relations
  @ManyToOne(() => ExpenseRequestEntity, (req) => req.attachments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exr_id' })
  request: ExpenseRequestEntity;
}
