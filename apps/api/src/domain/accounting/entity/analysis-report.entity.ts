import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { BankAccountEntity } from './bank-account.entity';

@Entity('amb_analysis_reports')
export class AnalysisReportEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'anr_id' })
  anrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'bac_id', type: 'uuid', nullable: true })
  bacId: string | null;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'anr_title', type: 'varchar', length: 300 })
  anrTitle: string;

  @Column({ name: 'anr_content', type: 'text' })
  anrContent: string;

  @Column({ name: 'anr_date_from', type: 'varchar', length: 10, nullable: true })
  anrDateFrom: string | null;

  @Column({ name: 'anr_date_to', type: 'varchar', length: 10, nullable: true })
  anrDateTo: string | null;

  @Column({ name: 'anr_prompt_id', type: 'uuid', nullable: true })
  anrPromptId: string | null;

  @CreateDateColumn({ name: 'anr_created_at' })
  anrCreatedAt: Date;

  @UpdateDateColumn({ name: 'anr_updated_at' })
  anrUpdatedAt: Date;

  @DeleteDateColumn({ name: 'anr_deleted_at' })
  anrDeletedAt: Date | null;

  @ManyToOne(() => BankAccountEntity)
  @JoinColumn({ name: 'bac_id' })
  bankAccount: BankAccountEntity;
}
