import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';
import { ProjectEntity } from '../../project/entity/project.entity';

@Entity('amb_meeting_note_projects')
@Unique(['mtnId', 'pjtId'])
export class MeetingNoteProjectEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mnp_id' })
  mnpId: string;

  @Column({ name: 'mtn_id', type: 'uuid' })
  mtnId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @ManyToOne(() => MeetingNoteEntity, (n) => n.projects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mtn_id' })
  meetingNote: MeetingNoteEntity;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;
}
