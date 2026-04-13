import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('amb_migration_logs')
export class MigrationLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mgl_id' })
  mglId: string;

  @Column({ name: 'mgl_batch_id', type: 'uuid' })
  mglBatchId: string;

  @Column({ name: 'mgl_source', length: 20, default: 'REDMINE' })
  mglSource: string;

  @Column({ name: 'mgl_entity_type', length: 20 })
  mglEntityType: string; // PROJECT | ISSUE | COMMENT | USER

  @Column({ name: 'mgl_source_id', type: 'int' })
  mglSourceId: number;

  @Column({ name: 'mgl_target_id', type: 'uuid', nullable: true })
  mglTargetId: string | null;

  @Column({ name: 'mgl_status', length: 20, default: 'PENDING' })
  mglStatus: string; // PENDING | SUCCESS | FAILED | SKIPPED

  @Column({ name: 'mgl_error_message', type: 'text', nullable: true })
  mglErrorMessage: string | null;

  @CreateDateColumn({ name: 'mgl_created_at' })
  mglCreatedAt: Date;
}
