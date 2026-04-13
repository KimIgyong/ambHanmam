import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Unique,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { AttendanceAmendmentEntity } from './attendance-amendment.entity';

@Entity('amb_attendances')
@Unique(['usrId', 'attDate'])
export class AttendanceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'att_id' })
  attId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Column({ name: 'att_date', type: 'date' })
  attDate: Date;

  @Column({ name: 'att_type', length: 20 })
  attType: string;

  @Column({ name: 'att_start_time', type: 'varchar', length: 5, nullable: true })
  attStartTime: string | null;

  @Column({ name: 'att_end_time', type: 'varchar', length: 5, nullable: true })
  attEndTime: string | null;

  @Column({ name: 'att_approval_status', type: 'varchar', length: 20, default: 'APPROVED' })
  attApprovalStatus: string;

  @Column({ name: 'att_approved_by', type: 'uuid', nullable: true })
  attApprovedBy: string | null;

  @Column({ name: 'att_approved_at', type: 'timestamptz', nullable: true })
  attApprovedAt: Date | null;

  @CreateDateColumn({ name: 'att_created_at' })
  attCreatedAt: Date;

  @UpdateDateColumn({ name: 'att_updated_at' })
  attUpdatedAt: Date;

  @DeleteDateColumn({ name: 'att_deleted_at' })
  attDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @OneToMany(() => AttendanceAmendmentEntity, (a) => a.attendance)
  amendments: AttendanceAmendmentEntity[];
}
