import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_login_histories')
export class LoginHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'lgh_id' })
  lghId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @Column({ name: 'lgh_ip', length: 50, nullable: true })
  lghIp: string;

  @Column({ name: 'lgh_user_agent', length: 500, nullable: true })
  lghUserAgent: string;

  @CreateDateColumn({ name: 'lgh_created_at', type: 'timestamptz' })
  lghCreatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
