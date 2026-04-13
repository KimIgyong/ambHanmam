import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { WorkItemEntity } from './work-item.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_work_item_comments')
export class WorkItemCommentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'wic_id' })
  wicId: string;

  @Column({ name: 'wit_id' })
  witId: string;

  @Column({ name: 'wic_parent_id', type: 'uuid', nullable: true })
  wicParentId: string;

  @Column({ name: 'wic_author_id' })
  wicAuthorId: string;

  @Column({ name: 'wic_content', type: 'text' })
  wicContent: string;

  @Column({ name: 'wic_type', length: 20, default: 'COMMENT' })
  wicType: string; // COMMENT | FEEDBACK | APPROVAL | REQUEST | MENTION

  @Column({ name: 'wic_is_private', default: false })
  wicIsPrivate: boolean;

  @Column({ name: 'wic_is_edited', default: false })
  wicIsEdited: boolean;

  @Column({ name: 'wic_is_deleted', default: false })
  wicIsDeleted: boolean;

  @CreateDateColumn({ name: 'wic_created_at' })
  wicCreatedAt: Date;

  @UpdateDateColumn({ name: 'wic_updated_at' })
  wicUpdatedAt: Date;

  @ManyToOne(() => WorkItemEntity)
  @JoinColumn({ name: 'wit_id' })
  workItem: WorkItemEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'wic_author_id' })
  author: UserEntity;

  @ManyToOne(() => WorkItemCommentEntity, { nullable: true })
  @JoinColumn({ name: 'wic_parent_id' })
  parent: WorkItemCommentEntity;

  @OneToMany(() => WorkItemCommentEntity, (c) => c.parent)
  replies: WorkItemCommentEntity[];
}
