import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_access_audit_log')
export class AccessAuditLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'aal_id' })
  aalId: string;

  @Column({ name: 'aal_user_id' })
  aalUserId: string;

  @Column({ name: 'aal_action', length: 20 })
  aalAction: string; // VIEW | CREATE | EDIT | DELETE | SHARE | ACCESS_DENIED

  @Column({ name: 'aal_target_type', length: 50 })
  aalTargetType: string; // WORK_ITEM | UNIT | TAG | etc.

  @Column({ name: 'aal_target_id', type: 'uuid' })
  aalTargetId: string;

  @Column({ name: 'aal_access_path', length: 200, nullable: true })
  aalAccessPath: string; // How access was granted (owner/manager/share/visibility)

  @Column({ name: 'aal_details', type: 'jsonb', nullable: true })
  aalDetails: Record<string, any>;

  @CreateDateColumn({ name: 'aal_created_at' })
  aalCreatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'aal_user_id' })
  user: UserEntity;
}
