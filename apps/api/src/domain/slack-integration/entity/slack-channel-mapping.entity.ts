import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { SlackWorkspaceConfigEntity } from './slack-workspace-config.entity';

@Entity('amb_slack_channel_mappings')
export class SlackChannelMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'scm_id' })
  scmId: string;

  @Column({ name: 'swc_id', type: 'uuid' })
  swcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'scm_slack_channel_id', type: 'varchar', length: 50 })
  scmSlackChannelId: string;

  @Column({ name: 'scm_slack_channel_name', type: 'varchar', length: 200 })
  scmSlackChannelName: string;

  @Column({ name: 'chn_id', type: 'uuid' })
  chnId: string;

  @Column({ name: 'scm_status', type: 'varchar', length: 20, default: 'ACTIVE' })
  scmStatus: string;

  @Column({ name: 'scm_direction', type: 'varchar', length: 20, default: 'BIDIRECTIONAL' })
  scmDirection: string;

  @CreateDateColumn({ name: 'scm_created_at' })
  scmCreatedAt: Date;

  @UpdateDateColumn({ name: 'scm_updated_at' })
  scmUpdatedAt: Date;

  @DeleteDateColumn({ name: 'scm_deleted_at' })
  scmDeletedAt: Date;

  @ManyToOne(() => SlackWorkspaceConfigEntity, { eager: false })
  @JoinColumn({ name: 'swc_id' })
  workspace?: SlackWorkspaceConfigEntity;
}
