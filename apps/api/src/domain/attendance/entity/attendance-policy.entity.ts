import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_attendance_policies')
export class AttendancePolicyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'atp_id' })
  atpId: string;

  @Column({ name: 'ent_id', type: 'uuid', unique: true })
  entId: string;

  @Column({ name: 'atp_remote_default_count', type: 'int', default: 1 })
  atpRemoteDefaultCount: number;

  @Column({ name: 'atp_remote_extra_count', type: 'int', default: 0 })
  atpRemoteExtraCount: number;

  @Column({ name: 'atp_remote_block_on_exceed', type: 'boolean', default: true })
  atpRemoteBlockOnExceed: boolean;

  @Column({ name: 'atp_leave_auto_deduct', type: 'boolean', default: false })
  atpLeaveAutoDeduct: boolean;

  @Column({ name: 'atp_half_leave_auto_deduct', type: 'boolean', default: false })
  atpHalfLeaveAutoDeduct: boolean;

  @CreateDateColumn({ name: 'atp_created_at' })
  atpCreatedAt: Date;

  @UpdateDateColumn({ name: 'atp_updated_at' })
  atpUpdatedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: false })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
