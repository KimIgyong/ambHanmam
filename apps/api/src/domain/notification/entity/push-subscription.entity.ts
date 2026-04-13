import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_push_subscriptions')
export class PushSubscriptionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'psb_id' })
  psbId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'psb_endpoint', type: 'varchar', length: 500 })
  psbEndpoint: string;

  @Column({ name: 'psb_p256dh', type: 'varchar', length: 200 })
  psbP256dh: string;

  @Column({ name: 'psb_auth', type: 'varchar', length: 100 })
  psbAuth: string;

  @Column({ name: 'psb_user_agent', type: 'varchar', length: 300, nullable: true })
  psbUserAgent: string | null;

  @CreateDateColumn({ name: 'psb_created_at', type: 'timestamptz' })
  psbCreatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
