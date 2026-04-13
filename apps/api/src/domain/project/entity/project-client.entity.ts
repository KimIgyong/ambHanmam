import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { SvcClientEntity } from '../../service-management/entity/client.entity';

@Entity('kms_project_clients')
@Unique(['pjtId', 'cliId'])
export class ProjectClientEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pcl_id' })
  pclId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'cli_id', type: 'uuid' })
  cliId: string;

  @Column({ name: 'pcl_status', length: 20, default: 'ACTIVE' })
  pclStatus: string;

  @CreateDateColumn({ name: 'pcl_created_at' })
  pclCreatedAt: Date;

  @UpdateDateColumn({ name: 'pcl_updated_at' })
  pclUpdatedAt: Date;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => SvcClientEntity)
  @JoinColumn({ name: 'cli_id' })
  client: SvcClientEntity;
}
