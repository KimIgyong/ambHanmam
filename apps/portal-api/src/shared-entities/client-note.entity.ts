import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { SvcClientEntity } from './client.entity';
import { SvcSubscriptionEntity } from './subscription.entity';

@Entity('amb_svc_client_notes')
export class SvcClientNoteEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cnt_id' })
  cntId: string;

  @Column({ name: 'cli_id', type: 'uuid' })
  cliId: string;

  @Column({ name: 'sub_id', type: 'uuid', nullable: true })
  subId: string;

  @Column({ name: 'cnt_type', length: 20 })
  cntType: string;

  @Column({ name: 'cnt_title', length: 300, nullable: true })
  cntTitle: string;

  @Column({ name: 'cnt_content', type: 'text' })
  cntContent: string;

  @Column({ name: 'cnt_author_id', type: 'uuid' })
  cntAuthorId: string;

  @CreateDateColumn({ name: 'cnt_created_at' })
  cntCreatedAt: Date;

  @UpdateDateColumn({ name: 'cnt_updated_at' })
  cntUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cnt_deleted_at' })
  cntDeletedAt: Date;

  @ManyToOne(() => SvcClientEntity)
  @JoinColumn({ name: 'cli_id' })
  client: SvcClientEntity;

  @ManyToOne(() => SvcSubscriptionEntity)
  @JoinColumn({ name: 'sub_id' })
  subscription: SvcSubscriptionEntity;
}
