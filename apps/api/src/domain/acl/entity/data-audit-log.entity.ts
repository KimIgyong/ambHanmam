import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

/**
 * 데이터 변경 감사 로그 — UPDATE/DELETE 자동 기록
 * TypeORM EntitySubscriber를 통해 중요 엔티티 변경 시 자동 적재
 */
@Entity('amb_data_audit_log')
export class DataAuditLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'dal_id' })
  dalId: string;

  @Index()
  @Column({ name: 'dal_user_id', type: 'uuid', nullable: true })
  dalUserId: string | null;

  @Column({ name: 'dal_action', length: 20 })
  dalAction: string; // UPDATE | SOFT_DELETE | HARD_DELETE

  @Index()
  @Column({ name: 'dal_entity_name', length: 100 })
  dalEntityName: string; // e.g. 'UserEntity', 'TodoEntity'

  @Column({ name: 'dal_table_name', length: 100 })
  dalTableName: string; // e.g. 'amb_users'

  @Index()
  @Column({ name: 'dal_record_id', type: 'varchar', length: 255 })
  dalRecordId: string;

  @Column({ name: 'dal_changes', type: 'jsonb', nullable: true })
  dalChanges: Record<string, { old: any; new: any }> | null;

  @Column({ name: 'dal_ip', type: 'varchar', length: 50, nullable: true })
  dalIp: string | null;

  @CreateDateColumn({ name: 'dal_created_at' })
  dalCreatedAt: Date;
}
