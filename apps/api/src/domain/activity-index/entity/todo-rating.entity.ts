import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { TodoEntity } from '../../todo/entity/todo.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_todo_ratings')
@Unique(['tdoId', 'usrId'])
@Check('"tdr_rating" >= 1 AND "tdr_rating" <= 5')
export class TodoRatingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tdr_id' })
  tdrId: string;

  @Column({ name: 'tdo_id', type: 'uuid' })
  tdoId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'tdr_rating', type: 'smallint' })
  tdrRating: number;

  @CreateDateColumn({ name: 'tdr_created_at' })
  tdrCreatedAt: Date;

  @UpdateDateColumn({ name: 'tdr_updated_at' })
  tdrUpdatedAt: Date;

  @ManyToOne(() => TodoEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tdo_id' })
  todo: TodoEntity;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
