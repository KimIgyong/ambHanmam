import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { HrEntityEntity } from './hr-entity.entity';

@Entity('amb_hr_entity_user_roles')
@Unique(['entId', 'usrId'])
export class EntityUserRoleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'eur_id' })
  eurId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'eur_role', length: 20 })
  eurRole: string;

  @Column({ name: 'eur_status', length: 10, default: 'ACTIVE' })
  eurStatus: string;

  @Column({ name: 'eur_hidden_from_today', type: 'boolean', default: false })
  eurHiddenFromToday: boolean;

  @Column({ name: 'eur_hidden_from_attendance', type: 'boolean', default: false })
  eurHiddenFromAttendance: boolean;

  @Column({ name: 'eur_is_owner', type: 'boolean', default: false })
  eurIsOwner: boolean;

  @Column({ name: 'eur_attendance_order', type: 'int', nullable: true })
  eurAttendanceOrder: number | null;

  @CreateDateColumn({ name: 'eur_created_at' })
  eurCreatedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
