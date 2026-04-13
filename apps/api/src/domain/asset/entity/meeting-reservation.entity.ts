import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { AssetRequestEntity } from './asset-request.entity';

@Entity('amb_meeting_reservations')
@Index(['mtrStartAt', 'mtrEndAt'])
export class MeetingReservationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mtr_id' })
  mtrId: string;

  @Column({ name: 'asr_id', type: 'uuid' })
  asrId: string;

  @Column({ name: 'mtr_title', type: 'varchar', length: 200 })
  mtrTitle: string;

  @Column({ name: 'mtr_attendee_count', type: 'int' })
  mtrAttendeeCount: number;

  @Column({ name: 'mtr_meeting_type', type: 'varchar', length: 30 })
  mtrMeetingType: string;

  @Column({ name: 'mtr_start_at', type: 'timestamptz' })
  mtrStartAt: Date;

  @Column({ name: 'mtr_end_at', type: 'timestamptz' })
  mtrEndAt: Date;

  @Column({ name: 'mtr_required_equipments', type: 'jsonb', nullable: true })
  mtrRequiredEquipments: string[] | null;

  @CreateDateColumn({ name: 'mtr_created_at' })
  mtrCreatedAt: Date;

  @ManyToOne(() => AssetRequestEntity)
  @JoinColumn({ name: 'asr_id' })
  request: AssetRequestEntity;
}
