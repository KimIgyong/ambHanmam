import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AttendanceEntity } from './attendance.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_attendance_amendments')
export class AttendanceAmendmentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'aam_id' })
  aamId: string;

  @Column({ name: 'att_id', type: 'uuid' })
  attId: string;

  @Column({ name: 'aam_type', type: 'varchar', length: 20 })
  aamType: string;

  @Column({ name: 'aam_start_time', type: 'varchar', length: 5, nullable: true })
  aamStartTime: string | null;

  @Column({ name: 'aam_end_time', type: 'varchar', length: 5, nullable: true })
  aamEndTime: string | null;

  @Column({ name: 'aam_note', type: 'text' })
  aamNote: string;

  @Column({ name: 'aam_amended_by', type: 'uuid' })
  aamAmendedBy: string;

  @CreateDateColumn({ name: 'aam_created_at' })
  aamCreatedAt: Date;

  @ManyToOne(() => AttendanceEntity, (att) => att.amendments)
  @JoinColumn({ name: 'att_id' })
  attendance: AttendanceEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'aam_amended_by' })
  amendedByUser: UserEntity;
}
