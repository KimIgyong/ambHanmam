import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('amb_password_resets')
export class PasswordResetEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'prs_id' })
  prsId: string;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Index({ unique: true })
  @Column({ name: 'prs_token', length: 100, unique: true })
  prsToken: string;

  @Column({ name: 'prs_expires_at', type: 'timestamp' })
  prsExpiresAt: Date;

  @Column({ name: 'prs_used_at', type: 'timestamp', nullable: true })
  prsUsedAt: Date | null;

  @CreateDateColumn({ name: 'prs_created_at' })
  prsCreatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
