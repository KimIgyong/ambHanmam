import {
  Entity, PrimaryGeneratedColumn, Column, Unique,
} from 'typeorm';

@Entity('amb_talk_read_status')
@Unique(['chnId', 'usrId'])
export class TalkReadStatusEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'trs_id' })
  trsId: string;

  @Column({ name: 'chn_id', type: 'uuid' })
  chnId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'trs_last_read_at', type: 'timestamp' })
  trsLastReadAt: Date;

  @Column({ name: 'trs_last_msg_id', type: 'uuid', nullable: true })
  trsLastMsgId: string | null;
}
