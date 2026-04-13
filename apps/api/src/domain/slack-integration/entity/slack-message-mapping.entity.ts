import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Unique, Index,
} from 'typeorm';

@Entity('amb_slack_message_mappings')
@Unique(['scmId', 'smmSlackTs'])
@Index(['smmSlackThreadTs'])
export class SlackMessageMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'smm_id' })
  smmId: string;

  @Column({ name: 'scm_id', type: 'uuid' })
  scmId: string;

  @Column({ name: 'smm_slack_ts', type: 'varchar', length: 50 })
  smmSlackTs: string;

  @Column({ name: 'smm_slack_thread_ts', type: 'varchar', length: 50, nullable: true })
  smmSlackThreadTs: string | null;

  @Column({ name: 'msg_id', type: 'uuid' })
  msgId: string;

  @Column({ name: 'smm_direction', type: 'varchar', length: 10 })
  smmDirection: string;

  @CreateDateColumn({ name: 'smm_created_at' })
  smmCreatedAt: Date;
}
