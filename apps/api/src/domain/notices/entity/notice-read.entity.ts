import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Unique,
} from 'typeorm';

@Entity('amb_notice_reads')
@Unique(['ntcId', 'usrId'])
export class NoticeReadEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ntr_id' })
  ntrId: string;

  @Column({ name: 'ntc_id' })
  ntcId: string;

  @Column({ name: 'usr_id' })
  usrId: string;

  @CreateDateColumn({ name: 'ntr_read_at' })
  ntrReadAt: Date;
}
