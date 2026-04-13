import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ConversationEntity } from './conversation.entity';

@Entity('amb_messages')
@Index(['cvsId', 'msgOrder'])
export class MessageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'msg_id' })
  msgId: string;

  @Column({ name: 'cvs_id' })
  cvsId: string;

  @Column({ name: 'msg_role', length: 20 })
  msgRole: string;

  @Column({ name: 'msg_content', type: 'text' })
  msgContent: string;

  @Column({ name: 'msg_token_count', default: 0 })
  msgTokenCount: number;

  @Column({ name: 'msg_order', default: 0 })
  msgOrder: number;

  @CreateDateColumn({ name: 'msg_created_at' })
  msgCreatedAt: Date;

  @ManyToOne(() => ConversationEntity, (conversation) => conversation.messages)
  @JoinColumn({ name: 'cvs_id' })
  conversation: ConversationEntity;
}
