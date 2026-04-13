import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { WorkItemEntity } from './work-item.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_work_item_shares')
export class WorkItemShareEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'wis_id' })
  wisId: string;

  @Column({ name: 'wit_id' })
  witId: string;

  @Column({ name: 'wis_target_type', length: 20 })
  wisTargetType: string; // USER | UNIT | TEAM | CELL | ENTITY

  @Column({ name: 'wis_target_id' })
  wisTargetId: string;

  @Column({ name: 'wis_permission', length: 20, default: 'VIEW' })
  wisPermission: string; // VIEW | COMMENT | EDIT | ADMIN

  @Column({ name: 'wis_shared_by' })
  wisSharedBy: string;

  @Column({ name: 'wis_expires_at', type: 'timestamp', nullable: true })
  wisExpiresAt: Date;

  @Column({ name: 'wis_is_active', default: true })
  wisIsActive: boolean;

  @CreateDateColumn({ name: 'wis_created_at' })
  wisCreatedAt: Date;

  @ManyToOne(() => WorkItemEntity)
  @JoinColumn({ name: 'wit_id' })
  workItem: WorkItemEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'wis_shared_by' })
  sharedByUser: UserEntity;
}
