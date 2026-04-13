import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_talk_channels')
export class TalkChannelEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'chn_id' })
  chnId: string;

  @Column({ name: 'chn_name', length: 100 })
  chnName: string;

  @Column({ name: 'chn_type', length: 20 })
  chnType: string;

  @Column({ name: 'chn_description', type: 'text', nullable: true })
  chnDescription: string | null;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'chn_created_by', type: 'uuid' })
  chnCreatedBy: string;

  @CreateDateColumn({ name: 'chn_created_at' })
  chnCreatedAt: Date;

  @UpdateDateColumn({ name: 'chn_updated_at' })
  chnUpdatedAt: Date;

  @DeleteDateColumn({ name: 'chn_deleted_at' })
  chnDeletedAt: Date;

  @Column({ name: 'chn_archived_at', type: 'timestamp', nullable: true })
  chnArchivedAt: Date | null;

  @Column({ name: 'chn_archived_by', type: 'uuid', nullable: true })
  chnArchivedBy: string | null;
}
