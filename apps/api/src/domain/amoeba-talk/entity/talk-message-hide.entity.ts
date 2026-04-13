import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique,
} from 'typeorm';

@Entity('amb_talk_message_hides')
@Unique(['msgId', 'usrId'])
export class TalkMessageHideEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tmh_id' })
  tmhId: string;

  @Column({ name: 'msg_id', type: 'uuid' })
  msgId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @CreateDateColumn({ name: 'tmh_hidden_at' })
  tmhHiddenAt: Date;
}
