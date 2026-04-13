import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MessageEntity } from './message.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_conversations')
export class ConversationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cvs_id' })
  cvsId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Column({ name: 'cvs_unit', length: 30 })
  cvsUnit: string;

  @Column({ name: 'cvs_title', length: 200 })
  cvsTitle: string;

  @Column({ name: 'cvs_message_count', default: 0 })
  cvsMessageCount: number;

  @CreateDateColumn({ name: 'cvs_created_at' })
  cvsCreatedAt: Date;

  @UpdateDateColumn({ name: 'cvs_updated_at' })
  cvsUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cvs_deleted_at' })
  cvsDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @OneToMany(() => MessageEntity, (message) => message.conversation)
  messages: MessageEntity[];
}
