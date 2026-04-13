import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { TodoEntity } from './todo.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_todo_participants')
@Unique(['tdoId', 'usrId'])
export class TodoParticipantEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tpt_id' })
  tptId: string;

  @Column({ name: 'tdo_id' })
  tdoId: string;

  @Column({ name: 'usr_id' })
  usrId: string;

  @CreateDateColumn({ name: 'tpt_created_at' })
  tptCreatedAt: Date;

  @ManyToOne(() => TodoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tdo_id' })
  todo: TodoEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
