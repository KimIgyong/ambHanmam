import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, OneToMany,
} from 'typeorm';
import { TalkAttachmentEntity } from './talk-attachment.entity';

@Entity('amb_talk_messages')
export class TalkMessageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'msg_id' })
  msgId: string;

  @Column({ name: 'chn_id', type: 'uuid' })
  chnId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'msg_content', type: 'text' })
  msgContent: string;

  @Column({ name: 'msg_type', length: 20, default: 'TEXT' })
  msgType: string;

  @Column({ name: 'msg_parent_id', type: 'uuid', nullable: true })
  msgParentId: string | null;

  @CreateDateColumn({ name: 'msg_created_at' })
  msgCreatedAt: Date;

  @UpdateDateColumn({ name: 'msg_updated_at' })
  msgUpdatedAt: Date;

  @DeleteDateColumn({ name: 'msg_deleted_at' })
  msgDeletedAt: Date;

  @Column({ name: 'msg_is_pinned', type: 'boolean', default: false })
  msgIsPinned: boolean;

  @Column({ name: 'msg_pinned_at', type: 'timestamp', nullable: true })
  msgPinnedAt: Date | null;

  @Column({ name: 'msg_pinned_by', type: 'uuid', nullable: true })
  msgPinnedBy: string | null;

  @OneToMany(() => TalkAttachmentEntity, (att) => att.message, { eager: false })
  attachments?: TalkAttachmentEntity[];
}
