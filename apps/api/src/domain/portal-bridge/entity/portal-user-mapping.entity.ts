import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { PortalCustomerReadonlyEntity } from './portal-customer-readonly.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_portal_user_mappings')
export class PortalUserMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pum_id' })
  pumId: string;

  @Column({ name: 'pct_id', type: 'uuid' })
  pctId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'pum_status', length: 20, default: 'ACTIVE' })
  pumStatus: string;

  @Column({ name: 'pum_created_by', type: 'uuid' })
  pumCreatedBy: string;

  @Column({ name: 'pum_revoked_by', type: 'uuid', nullable: true })
  pumRevokedBy: string | null;

  @CreateDateColumn({ name: 'pum_created_at' })
  pumCreatedAt: Date;

  @Column({ name: 'pum_revoked_at', type: 'timestamptz', nullable: true })
  pumRevokedAt: Date | null;

  // ── Relations ──

  @ManyToOne(() => PortalCustomerReadonlyEntity)
  @JoinColumn({ name: 'pct_id' })
  portalCustomer: PortalCustomerReadonlyEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
