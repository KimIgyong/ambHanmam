import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { ProjectMemberEntity } from './project-member.entity';
import { ProjectReviewEntity } from './project-review.entity';
import { ProjectFileEntity } from './project-file.entity';
import { IssueEntity } from '../../issues/entity/issue.entity';

@Entity('kms_projects')
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pjt_id' })
  pjtId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'pjt_code', length: 50 })
  pjtCode: string;

  @Column({ name: 'pjt_name', length: 300 })
  pjtName: string;

  @Column({ name: 'pjt_title', length: 500, nullable: true })
  pjtTitle: string;

  @Column({ name: 'pjt_purpose', type: 'text', nullable: true })
  pjtPurpose: string;

  @Column({ name: 'pjt_goal', type: 'text', nullable: true })
  pjtGoal: string;

  @Column({ name: 'pjt_summary', type: 'text', nullable: true })
  pjtSummary: string;

  @Column({ name: 'pjt_status', length: 20, default: 'DRAFT' })
  pjtStatus: string;

  @Column({ name: 'pjt_category', length: 30, nullable: true })
  pjtCategory: string;

  @Column({ name: 'pjt_priority', length: 10, default: 'MEDIUM' })
  pjtPriority: string;

  @Column({ name: 'pjt_proposer_id', type: 'uuid' })
  pjtProposerId: string;

  @Column({ name: 'pjt_manager_id', type: 'uuid', nullable: true })
  pjtManagerId: string;

  @Column({ name: 'pjt_sponsor_id', type: 'uuid', nullable: true })
  pjtSponsorId: string;

  @Column({ name: 'pjt_dept_id', type: 'uuid', nullable: true })
  pjtDeptId: string;

  @Column({ name: 'pjt_start_date', type: 'date', nullable: true })
  pjtStartDate: string;

  @Column({ name: 'pjt_end_date', type: 'date', nullable: true })
  pjtEndDate: string;

  @Column({ name: 'pjt_budget', type: 'decimal', precision: 15, scale: 2, nullable: true })
  pjtBudget: number;

  @Column({ name: 'pjt_currency', length: 3, default: 'USD' })
  pjtCurrency: string;

  @Column({ name: 'pjt_contract_id', type: 'uuid', nullable: true })
  pjtContractId: string;

  @Column({ name: 'pjt_gdrive_folder_id', length: 100, nullable: true })
  pjtGdriveFolderId: string;

  @Column({ name: 'pjt_ai_draft_json', type: 'text', nullable: true })
  pjtAiDraftJson: string;

  @Column({ name: 'pjt_ai_analysis_json', type: 'text', nullable: true })
  pjtAiAnalysisJson: string;

  @Column({ name: 'pjt_similar_projects_json', type: 'text', nullable: true })
  pjtSimilarProjectsJson: string;

  @Column({ name: 'pjt_submitted_at', type: 'timestamp', nullable: true })
  pjtSubmittedAt: Date;

  @Column({ name: 'pjt_approved_at', type: 'timestamp', nullable: true })
  pjtApprovedAt: Date;

  @Column({ name: 'pjt_rejected_at', type: 'timestamp', nullable: true })
  pjtRejectedAt: Date;

  @Column({ name: 'pjt_note', type: 'text', nullable: true })
  pjtNote: string;

  @Column({ name: 'pjt_original_lang', length: 5, default: 'ko' })
  pjtOriginalLang: string;

  @Column({ name: 'pjt_wit_id', type: 'uuid', nullable: true })
  pjtWitId: string;

  @Column({ name: 'pjt_redmine_id', type: 'int', nullable: true })
  pjtRedmineId: number | null;

  @Column({ name: 'pjt_parent_id', type: 'uuid', nullable: true })
  pjtParentId: string | null;

  @CreateDateColumn({ name: 'pjt_created_at' })
  pjtCreatedAt: Date;

  @UpdateDateColumn({ name: 'pjt_updated_at' })
  pjtUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pjt_deleted_at' })
  pjtDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'pjt_proposer_id' })
  proposer: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'pjt_manager_id' })
  manager: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'pjt_sponsor_id' })
  sponsor: UserEntity;

  @OneToMany(() => ProjectMemberEntity, (m) => m.project)
  members: ProjectMemberEntity[];

  @OneToMany(() => ProjectReviewEntity, (r) => r.project)
  reviews: ProjectReviewEntity[];

  @OneToMany(() => ProjectFileEntity, (f) => f.project)
  files: ProjectFileEntity[];

  @ManyToOne(() => ProjectEntity, { nullable: true })
  @JoinColumn({ name: 'pjt_parent_id' })
  parent: ProjectEntity;

  @OneToMany(() => ProjectEntity, (p) => p.parent)
  children: ProjectEntity[];

  @OneToMany(() => IssueEntity, (i) => i.project)
  issues: IssueEntity[];
}
