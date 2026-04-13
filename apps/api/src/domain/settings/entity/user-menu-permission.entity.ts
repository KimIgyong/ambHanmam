import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_user_menu_permissions')
@Unique(['umpMenuCode', 'usrId'])
export class UserMenuPermissionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ump_id' })
  umpId: string;

  @Column({ name: 'ump_menu_code', length: 50 })
  umpMenuCode: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ump_accessible' })
  umpAccessible: boolean;

  @Column({ name: 'ump_granted_by', type: 'uuid', nullable: true })
  umpGrantedBy: string | null;

  @CreateDateColumn({ name: 'ump_created_at' })
  umpCreatedAt: Date;

  @UpdateDateColumn({ name: 'ump_updated_at' })
  umpUpdatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'ump_granted_by' })
  grantedByUser: UserEntity;
}
