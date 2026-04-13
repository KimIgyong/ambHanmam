import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SvcClientEntity } from '../../service-management/entity/client.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_client_invitations')
export class ClientInvitationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'civ_id' })
  civId: string;

  @Column({ name: 'civ_email', length: 200 })
  civEmail: string;

  @Column({ name: 'civ_name', type: 'varchar', length: 100, nullable: true })
  civName: string | null;

  @Column({ name: 'cli_id', type: 'uuid' })
  cliId: string;

  @Column({ name: 'civ_role', length: 20, default: 'CLIENT_MEMBER' })
  civRole: string;

  @Column({ name: 'civ_token', length: 200, unique: true })
  civToken: string;

  @Column({ name: 'civ_token_expires', type: 'timestamp with time zone' })
  civTokenExpires: Date;

  @Column({ name: 'civ_status', length: 20, default: 'PENDING' })
  civStatus: string;

  @Column({ name: 'civ_invited_by', type: 'uuid' })
  civInvitedBy: string;

  @Column({ name: 'civ_accepted_at', type: 'timestamp with time zone', nullable: true })
  civAcceptedAt: Date | null;

  @CreateDateColumn({ name: 'civ_created_at' })
  civCreatedAt: Date;

  @UpdateDateColumn({ name: 'civ_updated_at' })
  civUpdatedAt: Date;

  @ManyToOne(() => SvcClientEntity)
  @JoinColumn({ name: 'cli_id' })
  client: SvcClientEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'civ_invited_by' })
  invitedBy: UserEntity;
}
