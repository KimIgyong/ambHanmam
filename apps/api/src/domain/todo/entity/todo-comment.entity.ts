import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { TodoEntity } from './todo.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_todo_comments')
export class TodoCommentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tcm_id' })
  tcmId: string;

  @Column({ name: 'tdo_id' })
  tdoId: string;

  @Column({ name: 'tcm_author_id' })
  tcmAuthorId: string;

  @Column({ name: 'tcm_content', type: 'text' })
  tcmContent: string;

  @CreateDateColumn({ name: 'tcm_created_at' })
  tcmCreatedAt: Date;

  @UpdateDateColumn({ name: 'tcm_updated_at' })
  tcmUpdatedAt: Date;

  @DeleteDateColumn({ name: 'tcm_deleted_at' })
  tcmDeletedAt: Date;

  @ManyToOne(() => TodoEntity)
  @JoinColumn({ name: 'tdo_id' })
  todo: TodoEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'tcm_author_id' })
  author: UserEntity;
}
