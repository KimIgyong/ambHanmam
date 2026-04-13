import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('amb_site_error_logs')
@Index('idx_sel_created_at', ['selCreatedAt'])
@Index('idx_sel_source_app', ['selSource', 'selApp'])
@Index('idx_sel_usr_level', ['selUsrLevel'])
@Index('idx_sel_error_code', ['selErrorCode'])
@Index('idx_sel_status', ['selStatus'])
export class SiteErrorLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sel_id' })
  selId: string;

  @Column({ name: 'sel_source', type: 'varchar', length: 20 })
  selSource: string; // FRONTEND | BACKEND

  @Column({ name: 'sel_app', type: 'varchar', length: 30 })
  selApp: string; // WEB | PORTAL_WEB | API | PORTAL_API

  @Column({ name: 'sel_usr_id', type: 'uuid', nullable: true })
  selUsrId: string | null;

  @Column({ name: 'sel_usr_email', type: 'varchar', length: 200, nullable: true })
  selUsrEmail: string | null;

  @Column({ name: 'sel_usr_level', type: 'varchar', length: 30, nullable: true })
  selUsrLevel: string | null;

  @Column({ name: 'sel_ent_id', type: 'uuid', nullable: true })
  selEntId: string | null;

  @Column({ name: 'sel_page_url', type: 'varchar', length: 500, nullable: true })
  selPageUrl: string | null;

  @Column({ name: 'sel_api_endpoint', type: 'varchar', length: 300, nullable: true })
  selApiEndpoint: string | null;

  @Column({ name: 'sel_http_method', type: 'varchar', length: 10, nullable: true })
  selHttpMethod: string | null;

  @Column({ name: 'sel_http_status', type: 'int', nullable: true })
  selHttpStatus: number | null;

  @Column({ name: 'sel_error_code', type: 'varchar', length: 20, nullable: true })
  selErrorCode: string | null;

  @Column({ name: 'sel_error_message', type: 'text' })
  selErrorMessage: string;

  @Column({ name: 'sel_stack_trace', type: 'text', nullable: true })
  selStackTrace: string | null;

  @Column({ name: 'sel_user_agent', type: 'varchar', length: 500, nullable: true })
  selUserAgent: string | null;

  @Column({ name: 'sel_ip_address', type: 'varchar', length: 45, nullable: true })
  selIpAddress: string | null;

  @Column({ name: 'sel_status', type: 'varchar', length: 20, default: 'OPEN' })
  selStatus: string; // OPEN | RESOLVED | IGNORED

  @Column({ name: 'sel_resolved_by', type: 'uuid', nullable: true })
  selResolvedBy: string | null;

  @Column({ name: 'sel_resolved_at', type: 'timestamp', nullable: true })
  selResolvedAt: Date | null;

  @CreateDateColumn({ name: 'sel_created_at' })
  selCreatedAt: Date;
}
