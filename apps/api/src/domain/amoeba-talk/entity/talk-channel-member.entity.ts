import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('amb_talk_channel_members')
export class TalkChannelMemberEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'chm_id' })
  chmId: string;

  @Column({ name: 'chn_id', type: 'uuid' })
  chnId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'chm_role', length: 20, default: 'MEMBER' })
  chmRole: string;

  @CreateDateColumn({ name: 'chm_joined_at' })
  chmJoinedAt: Date;

  @Column({ name: 'chm_left_at', type: 'timestamp', nullable: true })
  chmLeftAt: Date | null;

  @Column({ name: 'chm_pinned', type: 'boolean', default: false })
  chmPinned: boolean;

  @Column({ name: 'chm_muted', type: 'boolean', default: false })
  chmMuted: boolean;
}
