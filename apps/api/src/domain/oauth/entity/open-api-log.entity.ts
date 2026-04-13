import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('amb_open_api_logs')
export class OpenApiLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'oal_id' })
  oalId: string;

  @Column({ name: 'pap_id', type: 'uuid' })
  papId: string;

  @Column({ name: 'usr_id', type: 'uuid', nullable: true })
  usrId: string | null;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'oal_method', type: 'varchar', length: 10 })
  oalMethod: string;

  @Column({ name: 'oal_path', type: 'varchar', length: 500 })
  oalPath: string;

  @Column({ name: 'oal_status_code', type: 'int' })
  oalStatusCode: number;

  @Column({ name: 'oal_ip', type: 'varchar', length: 45, nullable: true })
  oalIp: string | null;

  @Column({ name: 'oal_user_agent', type: 'varchar', length: 500, nullable: true })
  oalUserAgent: string | null;

  @Column({ name: 'oal_duration_ms', type: 'int', nullable: true })
  oalDurationMs: number | null;

  @Index()
  @CreateDateColumn({ name: 'oal_created_at' })
  oalCreatedAt: Date;
}
