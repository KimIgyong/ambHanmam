import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { CmsPageEntity } from './cms-page.entity';

@Entity('amb_cms_subscribers')
@Unique(['cmpId', 'csbEmail'])
export class CmsSubscriberEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'csb_id' })
  csbId: string;

  @Column({ name: 'cmp_id', type: 'uuid' })
  cmpId: string;

  @Column({ name: 'csb_email', type: 'varchar', length: 255 })
  csbEmail: string;

  @Column({ name: 'csb_name', type: 'varchar', length: 200, nullable: true })
  csbName: string | null;

  @Column({ name: 'csb_is_verified', type: 'boolean', default: false })
  csbIsVerified: boolean;

  @CreateDateColumn({ name: 'csb_subscribed_at', type: 'timestamptz' })
  csbSubscribedAt: Date;

  @Column({ name: 'csb_unsubscribed_at', type: 'timestamptz', nullable: true })
  csbUnsubscribedAt: Date | null;

  // Relations
  @ManyToOne(() => CmsPageEntity, (page) => page.subscribers)
  @JoinColumn({ name: 'cmp_id' })
  page: CmsPageEntity;
}
