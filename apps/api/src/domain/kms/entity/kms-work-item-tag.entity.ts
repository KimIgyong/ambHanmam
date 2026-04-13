import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkItemEntity } from '../../acl/entity/work-item.entity';
import { KmsTagEntity } from './kms-tag.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_kms_work_item_tags')
export class KmsWorkItemTagEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'wit_tag_id' })
  witTagId: string;

  @Column({ name: 'wit_id' })
  witId: string;

  @Column({ name: 'tag_id' })
  tagId: string;

  @Column({ name: 'wtt_source', length: 20, default: 'USER_MANUAL' })
  wttSource: string; // AI_EXTRACTED | USER_MANUAL | USER_CONFIRMED | USER_REJECTED | SYSTEM

  @Column({ name: 'wtt_confidence', type: 'decimal', precision: 5, scale: 4, nullable: true })
  wttConfidence: number;

  @Column({ name: 'wtt_weight', type: 'decimal', precision: 5, scale: 4, default: 1.0 })
  wttWeight: number;

  @Column({ name: 'wtt_assigned_by', type: 'uuid', nullable: true })
  wttAssignedBy: string;

  @CreateDateColumn({ name: 'wtt_created_at' })
  wttCreatedAt: Date;

  @ManyToOne(() => WorkItemEntity)
  @JoinColumn({ name: 'wit_id' })
  workItem: WorkItemEntity;

  @ManyToOne(() => KmsTagEntity)
  @JoinColumn({ name: 'tag_id' })
  tag: KmsTagEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'wtt_assigned_by' })
  assignedByUser: UserEntity;
}
