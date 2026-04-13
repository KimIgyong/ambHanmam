import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_daily_activity_stats')
@Unique(['entId', 'usrId', 'dasDate'])
export class DailyActivityStatEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'das_id' })
  dasId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'das_date', type: 'date' })
  dasDate: string;

  @Column({ name: 'das_issue_count', type: 'int', default: 0 })
  dasIssueCount: number;

  @Column({ name: 'das_note_count', type: 'int', default: 0 })
  dasNoteCount: number;

  @Column({ name: 'das_comment_count', type: 'int', default: 0 })
  dasCommentCount: number;

  @Column({ name: 'das_todo_count', type: 'int', default: 0 })
  dasTodoCount: number;

  @Column({ name: 'das_chat_count', type: 'int', default: 0 })
  dasChatCount: number;

  @Column({ name: 'das_activity_score', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dasActivityScore: number;

  @Column({ name: 'das_rating_sum', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dasRatingSum: number;

  @Column({ name: 'das_rating_count', type: 'int', default: 0 })
  dasRatingCount: number;

  @Column({ name: 'das_reaction_count', type: 'int', default: 0 })
  dasReactionCount: number;

  @Column({ name: 'das_engagement_score', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dasEngagementScore: number;

  @Column({ name: 'das_total_score', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dasTotalScore: number;

  @CreateDateColumn({ name: 'das_created_at' })
  dasCreatedAt: Date;

  @ManyToOne(() => HrEntityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
