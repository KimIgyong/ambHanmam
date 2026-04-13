import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { SvcSubscriptionEntity } from './subscription.entity';

@Entity('amb_svc_subscription_history')
export class SvcSubscriptionHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'sbh_id' })
  sbhId: string;

  @Column({ name: 'sub_id', type: 'uuid' })
  subId: string;

  @Column({ name: 'sbh_action', length: 30 })
  sbhAction: string;

  @Column({ name: 'sbh_field', length: 50, nullable: true })
  sbhField: string;

  @Column({ name: 'sbh_old_value', type: 'text', nullable: true })
  sbhOldValue: string;

  @Column({ name: 'sbh_new_value', type: 'text', nullable: true })
  sbhNewValue: string;

  @Column({ name: 'sbh_changed_by', type: 'uuid', nullable: true })
  sbhChangedBy: string;

  @Column({ name: 'sbh_note', type: 'text', nullable: true })
  sbhNote: string;

  @CreateDateColumn({ name: 'sbh_created_at' })
  sbhCreatedAt: Date;

  @ManyToOne(() => SvcSubscriptionEntity)
  @JoinColumn({ name: 'sub_id' })
  subscription: SvcSubscriptionEntity;
}
