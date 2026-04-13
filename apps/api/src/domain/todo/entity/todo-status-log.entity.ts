import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
} from 'typeorm';
import { TodoEntity } from './todo.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_todo_status_logs')
export class TodoStatusLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tsl_id' })
  tslId: string;

  @Column({ name: 'tdo_id' })
  tdoId: string;

  @Column({ name: 'tsl_from_status', length: 20 })
  tslFromStatus: string;

  @Column({ name: 'tsl_to_status', length: 20 })
  tslToStatus: string;

  @Column({ name: 'tsl_changed_by' })
  tslChangedBy: string;

  @Column({ name: 'tsl_changed_at', type: 'timestamp', default: () => 'NOW()' })
  tslChangedAt: Date;

  @Column({ name: 'tsl_note', type: 'text', nullable: true })
  tslNote: string;

  @ManyToOne(() => TodoEntity)
  @JoinColumn({ name: 'tdo_id' })
  todo: TodoEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'tsl_changed_by' })
  changedByUser: UserEntity;
}
