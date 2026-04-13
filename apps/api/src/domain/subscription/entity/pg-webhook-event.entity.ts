import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WebhookEventStatus } from './subscription.enums';

@Entity('amb_pg_webhook_events')
@Index('idx_amb_pg_webhook_events_status', ['pgw_status'])
@Index('idx_amb_pg_webhook_events_created_at', ['pgw_created_at'])
export class PgWebhookEventEntity {
  @PrimaryGeneratedColumn('uuid')
  pgw_id: string;

  @Column({ type: 'varchar', length: 100 })
  pgw_event_type: string;

  @Column({ type: 'varchar', length: 200, unique: true })
  pgw_polar_event_id: string;

  @Column({ type: 'jsonb' })
  pgw_payload: Record<string, unknown>;

  @Column({ type: 'varchar', length: 20, default: WebhookEventStatus.PENDING })
  pgw_status: WebhookEventStatus;

  @Column({ type: 'timestamptz', nullable: true })
  pgw_processed_at: Date | null;

  @Column({ type: 'text', nullable: true })
  pgw_error_message: string | null;

  @Column({ type: 'int', default: 0 })
  pgw_retry_count: number;

  @CreateDateColumn()
  pgw_created_at: Date;
}
