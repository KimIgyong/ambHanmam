import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { AsanaProjectMappingEntity } from './asana-project-mapping.entity';

@Entity('amb_asana_task_mappings')
export class AsanaTaskMappingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'atm_id' })
  atmId: string;

  @Column({ name: 'apm_id', type: 'uuid' })
  apmId: string;

  @Column({ name: 'atm_asana_task_gid', type: 'varchar', length: 50 })
  atmAsanaTaskGid: string;

  @Column({ name: 'iss_id', type: 'uuid' })
  issId: string;

  @CreateDateColumn({ name: 'atm_created_at' })
  atmCreatedAt: Date;

  @ManyToOne(() => AsanaProjectMappingEntity)
  @JoinColumn({ name: 'apm_id' })
  projectMapping: AsanaProjectMappingEntity;
}
