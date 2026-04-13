import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_work_reports')
export class WorkReportEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'wkr_id' })
  wkrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'wkr_type', type: 'varchar', length: 20 })
  wkrType: string; // 'daily' | 'weekly'

  @Column({ name: 'wkr_period_start', type: 'date' })
  wkrPeriodStart: string;

  @Column({ name: 'wkr_period_end', type: 'date' })
  wkrPeriodEnd: string;

  @Column({ name: 'wkr_raw_data', type: 'jsonb', default: '{}' })
  wkrRawData: Record<string, any>;

  @Column({ name: 'wkr_ai_summary', type: 'text', nullable: true })
  wkrAiSummary: string | null;

  @Column({ name: 'wkr_ai_score', type: 'jsonb', nullable: true })
  wkrAiScore: Record<string, any> | null;

  @CreateDateColumn({ name: 'wkr_created_at' })
  wkrCreatedAt: Date;

  @UpdateDateColumn({ name: 'wkr_updated_at' })
  wkrUpdatedAt: Date;

  @DeleteDateColumn({ name: 'wkr_deleted_at' })
  wkrDeletedAt: Date | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
