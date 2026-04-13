import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_today_reports')
export class TodayReportEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tdr_id' })
  tdrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'tdr_title', type: 'varchar', length: 300 })
  tdrTitle: string;

  @Column({ name: 'tdr_content', type: 'text' })
  tdrContent: string;

  @Column({ name: 'tdr_scope', type: 'varchar', length: 20 })
  tdrScope: string; // 'all' | 'team'

  @CreateDateColumn({ name: 'tdr_created_at' })
  tdrCreatedAt: Date;

  @DeleteDateColumn({ name: 'tdr_deleted_at' })
  tdrDeletedAt: Date | null;
}
