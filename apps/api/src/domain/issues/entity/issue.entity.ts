import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { IssueCommentEntity } from './issue-comment.entity';
import { ProjectEntity } from '../../project/entity/project.entity';
import { ProjectEpicEntity } from '../../project/entity/project-epic.entity';
import { ProjectComponentEntity } from '../../project/entity/project-component.entity';

@Entity('amb_issues')
export class IssueEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'iss_id' })
  issId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'iss_type', length: 20 })
  issType: string;

  @Column({ name: 'iss_title', length: 200 })
  issTitle: string;

  @Column({ name: 'iss_description', type: 'text' })
  issDescription: string;

  @Column({ name: 'iss_severity', length: 20 })
  issSeverity: string;

  @Column({ name: 'iss_status', length: 20, default: 'OPEN' })
  issStatus: string;

  @Column({ name: 'iss_priority', type: 'int', default: 3 })
  issPriority: number;

  @Column({ name: 'iss_reporter_id' })
  issReporterId: string;

  /** @deprecated Use issAssigneeId instead */
  @Column({ name: 'iss_assignee', type: 'varchar', length: 50, nullable: true })
  issAssignee: string | null;

  @Column({ name: 'iss_assignee_id', type: 'uuid', nullable: true })
  issAssigneeId: string | null;

  @Column({ name: 'iss_github_id', type: 'int', nullable: true })
  issGithubId: number | null;

  @Column({ name: 'iss_affected_modules', type: 'text', array: true, nullable: true })
  issAffectedModules: string[] | null;

  @Column({ name: 'iss_visibility', length: 20, default: 'ENTITY' })
  issVisibility: string; // PRIVATE | CELL | ENTITY

  @Column({ name: 'iss_cell_id', type: 'uuid', nullable: true })
  issCellId: string | null;

  @Column({ name: 'pjt_id', type: 'uuid', nullable: true })
  pjtId: string | null;

  @Column({ name: 'epc_id', type: 'uuid', nullable: true })
  epcId: string | null;

  @Column({ name: 'cmp_id', type: 'uuid', nullable: true })
  cmpId: string | null;

  @Column({ name: 'iss_parent_id', type: 'uuid', nullable: true })
  issParentId: string | null;

  @Column({ name: 'iss_google_drive_link', type: 'text', nullable: true })
  issGoogleDriveLink: string | null;

  @Column({ name: 'iss_redmine_id', type: 'int', nullable: true })
  issRedmineId: number | null;

  @Column({ name: 'iss_asana_gid', type: 'varchar', length: 50, nullable: true })
  issAsanaGid: string | null;

  @Column({ name: 'iss_ref_number', type: 'varchar', length: 50, nullable: true })
  issRefNumber: string | null;

  @Column({ name: 'iss_start_date', type: 'date', nullable: true })
  issStartDate: string | null;

  @Column({ name: 'iss_due_date', type: 'date', nullable: true })
  issDueDate: string | null;

  @Column({ name: 'iss_done_ratio', type: 'int', default: 0 })
  issDoneRatio: number;

  @Column({ name: 'iss_original_lang', length: 5, default: 'ko' })
  issOriginalLang: string;

  @Column({ name: 'iss_resolution', type: 'text', nullable: true })
  issResolution: string | null;

  @Column({ name: 'iss_ai_analysis', type: 'text', nullable: true })
  issAiAnalysis: string | null;

  @Column({ name: 'iss_resolved_at', type: 'timestamp', nullable: true })
  issResolvedAt: Date | null;

  @Column({ name: 'iss_created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issCreatedAt: Date;

  @UpdateDateColumn({ name: 'iss_updated_at' })
  issUpdatedAt: Date;

  @DeleteDateColumn({ name: 'iss_deleted_at' })
  issDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'iss_reporter_id' })
  reporter: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'iss_assignee_id' })
  assignee: UserEntity | null;

  @ManyToOne(() => ProjectEntity, { nullable: true })
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => ProjectEpicEntity, { nullable: true })
  @JoinColumn({ name: 'epc_id' })
  epic: ProjectEpicEntity | null;

  @ManyToOne(() => ProjectComponentEntity, { nullable: true })
  @JoinColumn({ name: 'cmp_id' })
  component: ProjectComponentEntity | null;

  @ManyToOne(() => IssueEntity, { nullable: true })
  @JoinColumn({ name: 'iss_parent_id' })
  parentIssue: IssueEntity | null;

  @OneToMany(() => IssueCommentEntity, (c) => c.issue)
  comments: IssueCommentEntity[];
}
