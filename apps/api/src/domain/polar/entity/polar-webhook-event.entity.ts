import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';

@Entity('amb_pol_webhook_events')
export class PolarWebhookEventEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pwe_id' })
  pweId: string;

  @Index('uq_amb_pol_webhook_events_event_id', { unique: true })
  @Column({ name: 'pwe_event_id', type: 'varchar', length: 128 })
  pweEventId: string;

  @Column({ name: 'pwe_event_type', type: 'varchar', length: 100 })
  pweEventType: string;

  @Column({ name: 'pwe_signature_valid', type: 'boolean', default: false })
  pweSignatureValid: boolean;

  @Column({ name: 'pwe_is_processed', type: 'boolean', default: false })
  pweIsProcessed: boolean;

  @Column({ name: 'pwe_process_status', type: 'varchar', length: 30, default: 'PENDING' })
  pweProcessStatus: string;

  @Column({ name: 'pwe_error_message', type: 'text', nullable: true })
  pweErrorMessage: string | null;

  @Column({ name: 'pwe_payload', type: 'jsonb' })
  pwePayload: Record<string, unknown>;

  @Column({ name: 'pwe_received_at', type: 'timestamp', default: () => 'NOW()' })
  pweReceivedAt: Date;

  @Column({ name: 'pwe_processed_at', type: 'timestamp', nullable: true })
  pweProcessedAt: Date | null;

  @CreateDateColumn({ name: 'pwe_created_at' })
  pweCreatedAt: Date;

  @UpdateDateColumn({ name: 'pwe_updated_at' })
  pweUpdatedAt: Date;

  @DeleteDateColumn({ name: 'pwe_deleted_at' })
  pweDeletedAt: Date | null;
}
