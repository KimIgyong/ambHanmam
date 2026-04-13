import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { TodoParticipantEntity } from './todo-participant.entity';

@Entity('amb_todos')
export class TodoEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tdo_id' })
  tdoId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Column({ name: 'tdo_title', length: 200 })
  tdoTitle: string;

  @Column({ name: 'tdo_description', type: 'text', nullable: true })
  tdoDescription: string;

  @Column({ name: 'tdo_status', length: 20, default: 'SCHEDULED' })
  tdoStatus: string;

  @Column({ name: 'tdo_start_date', type: 'date', nullable: true })
  tdoStartDate: Date | null;

  @Column({ name: 'tdo_due_date', type: 'date', nullable: true })
  tdoDueDate: Date | null;

  @Column({ name: 'tdo_tags', type: 'text', nullable: true })
  tdoTags: string;

  @Column({ name: 'tdo_visibility', length: 20, default: 'PRIVATE' })
  tdoVisibility: string; // PRIVATE | CELL | ENTITY

  @Column({ name: 'tdo_cell_id', type: 'uuid', nullable: true })
  tdoCellId: string;

  @Column({ name: 'tdo_original_lang', type: 'varchar', length: 5, default: 'ko' })
  tdoOriginalLang: string;

  @Column({ name: 'tdo_recurrence_type', type: 'varchar', length: 20, nullable: true })
  tdoRecurrenceType: string | null;

  @Column({ name: 'tdo_recurrence_day', type: 'smallint', nullable: true })
  tdoRecurrenceDay: number | null;

  @Column({ name: 'tdo_parent_id', type: 'uuid', nullable: true })
  tdoParentId: string | null;

  @Column({ name: 'tdo_completed_at', type: 'timestamp', nullable: true })
  tdoCompletedAt: Date | null;

  @Column({ name: 'tdo_started_at', type: 'timestamp', nullable: true })
  tdoStartedAt: Date | null;

  @CreateDateColumn({ name: 'tdo_created_at' })
  tdoCreatedAt: Date;

  @UpdateDateColumn({ name: 'tdo_updated_at' })
  tdoUpdatedAt: Date;

  @DeleteDateColumn({ name: 'tdo_deleted_at' })
  tdoDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @Column({ name: 'iss_id', type: 'uuid', nullable: true })
  issId: string | null;

  @Column({ name: 'pjt_id', type: 'uuid', nullable: true })
  pjtId: string | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @ManyToOne(() => IssueEntity, { nullable: true })
  @JoinColumn({ name: 'iss_id' })
  issue: IssueEntity;

  @ManyToOne(() => ProjectEntity, { nullable: true })
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => TodoEntity, { nullable: true })
  @JoinColumn({ name: 'tdo_parent_id' })
  parent: TodoEntity;

  @OneToMany(() => TodoParticipantEntity, (p) => p.todo, { cascade: true })
  participants: TodoParticipantEntity[];
}
