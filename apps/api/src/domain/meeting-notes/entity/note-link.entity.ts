import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { MeetingNoteEntity } from './meeting-note.entity';

@Entity('amb_note_links')
@Unique(['nlkSourceNoteId', 'nlkLinkText', 'nlkTargetType'])
export class NoteLinkEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'nlk_id' })
  nlkId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'nlk_source_note_id', type: 'uuid' })
  nlkSourceNoteId: string;

  @Column({ name: 'nlk_target_note_id', type: 'uuid', nullable: true })
  nlkTargetNoteId: string | null;

  @Column({ name: 'nlk_link_text', type: 'varchar', length: 500 })
  nlkLinkText: string;

  /** NOTE | MISSION | TASK | ISSUE | PROJECT */
  @Column({ name: 'nlk_target_type', type: 'varchar', length: 20, default: 'NOTE' })
  nlkTargetType: string;

  @Column({ name: 'nlk_target_ref_id', type: 'uuid', nullable: true })
  nlkTargetRefId: string | null;

  @Column({ name: 'nlk_context', type: 'text', nullable: true })
  nlkContext: string | null;

  @CreateDateColumn({ name: 'nlk_created_at' })
  nlkCreatedAt: Date;

  @ManyToOne(() => MeetingNoteEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nlk_source_note_id' })
  sourceNote: MeetingNoteEntity;

  @ManyToOne(() => MeetingNoteEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'nlk_target_note_id' })
  targetNote: MeetingNoteEntity | null;
}
