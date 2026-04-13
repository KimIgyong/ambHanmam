import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('amb_daily_missions')
export class DailyMissionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'msn_id' })
  msnId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'msn_date', type: 'date' })
  msnDate: string;

  @Column({ name: 'msn_content', type: 'text', nullable: true })
  msnContent: string | null;

  @Column({ name: 'msn_check_result', type: 'varchar', length: 20, nullable: true })
  msnCheckResult: string | null; // HALF | PARTIAL | ALL_DONE | EXCEED

  @Column({ name: 'msn_check_score', type: 'smallint', nullable: true })
  msnCheckScore: number | null;

  @Column({ name: 'msn_registered_lines', type: 'jsonb', default: '[]' })
  msnRegisteredLines: any[];

  @Column({ name: 'msn_carry_over_text', type: 'text', nullable: true })
  msnCarryOverText: string | null;

  @CreateDateColumn({ name: 'msn_created_at' })
  msnCreatedAt: Date;

  @UpdateDateColumn({ name: 'msn_updated_at' })
  msnUpdatedAt: Date;
}
