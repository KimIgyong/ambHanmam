import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique,
} from 'typeorm';

@Entity('amb_talk_reactions')
@Unique(['msgId', 'usrId', 'reaType'])
export class TalkReactionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'rea_id' })
  reaId: string;

  @Column({ name: 'msg_id', type: 'uuid' })
  msgId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'rea_type', length: 20 })
  reaType: string;

  @CreateDateColumn({ name: 'rea_created_at' })
  reaCreatedAt: Date;
}
