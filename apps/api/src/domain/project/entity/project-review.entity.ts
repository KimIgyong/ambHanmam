import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('kms_project_reviews')
export class ProjectReviewEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'prv_id' })
  prvId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'prv_reviewer_id', type: 'uuid' })
  prvReviewerId: string;

  @Column({ name: 'prv_step', type: 'int', default: 1 })
  prvStep: number;

  @Column({ name: 'prv_action', length: 20 })
  prvAction: string;

  @Column({ name: 'prv_comment', type: 'text', nullable: true })
  prvComment: string;

  @Column({ name: 'prv_previous_status', length: 20 })
  prvPreviousStatus: string;

  @Column({ name: 'prv_new_status', length: 20 })
  prvNewStatus: string;

  @Column({ name: 'prv_ai_analysis_json', type: 'text', nullable: true })
  prvAiAnalysisJson: string;

  @CreateDateColumn({ name: 'prv_created_at' })
  prvCreatedAt: Date;

  @ManyToOne(() => ProjectEntity, (p) => p.reviews)
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'prv_reviewer_id' })
  reviewer: UserEntity;
}
