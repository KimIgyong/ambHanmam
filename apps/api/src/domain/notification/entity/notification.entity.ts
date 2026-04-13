import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_notifications')
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ntf_id' })
  ntfId: string;

  @Column({ name: 'ntf_type', type: 'varchar', length: 30 })
  ntfType: string;

  @Column({ name: 'ntf_title', type: 'varchar', length: 500 })
  ntfTitle: string;

  @Column({ name: 'ntf_message', type: 'text', nullable: true })
  ntfMessage: string | null;

  @Column({ name: 'ntf_recipient_id', type: 'uuid' })
  ntfRecipientId: string;

  @Column({ name: 'ntf_sender_id', type: 'uuid' })
  ntfSenderId: string;

  @Column({ name: 'ntf_resource_type', type: 'varchar', length: 30 })
  ntfResourceType: string;

  @Column({ name: 'ntf_resource_id', type: 'uuid' })
  ntfResourceId: string;

  @Column({ name: 'ntf_is_read', type: 'boolean', default: false })
  ntfIsRead: boolean;

  @Column({ name: 'ntf_read_at', type: 'timestamptz', nullable: true })
  ntfReadAt: Date | null;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @CreateDateColumn({ name: 'ntf_created_at', type: 'timestamptz' })
  ntfCreatedAt: Date;

  @DeleteDateColumn({ name: 'ntf_deleted_at', type: 'timestamptz' })
  ntfDeletedAt: Date | null;

  // Relations
  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ntf_recipient_id' })
  recipient: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ntf_sender_id' })
  sender: UserEntity;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;
}
