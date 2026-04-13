import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { UnitEntity } from './unit.entity';

@Entity('amb_user_unit_roles')
export class UserUnitRoleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'uur_id' })
  uurId: string;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Column({ name: 'unt_id' })
  untId: string;

  @Column({ name: 'uur_role', length: 20, default: 'MEMBER' })
  uurRole: string; // MEMBER | TEAM_LEAD | UNIT_HEAD

  @Column({ name: 'uur_is_primary', default: false })
  uurIsPrimary: boolean;

  @Column({ name: 'uur_started_at', type: 'date' })
  uurStartedAt: Date;

  @Column({ name: 'uur_ended_at', type: 'date', nullable: true })
  uurEndedAt: Date;

  @CreateDateColumn({ name: 'uur_created_at' })
  uurCreatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @ManyToOne(() => UnitEntity)
  @JoinColumn({ name: 'unt_id' })
  unit: UnitEntity;
}
