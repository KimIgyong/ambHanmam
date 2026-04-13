import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { ProjectEntity } from './project.entity';

@Entity('amb_project_epics')
export class ProjectEpicEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'epc_id' })
  epcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'epc_title', length: 200 })
  epcTitle: string;

  @Column({ name: 'epc_description', type: 'text', nullable: true })
  epcDescription: string | null;

  @Column({ name: 'epc_status', length: 20, default: 'PLANNED' })
  epcStatus: string; // PLANNED | IN_PROGRESS | DONE | CANCELLED

  @Column({ name: 'epc_color', type: 'varchar', length: 7, nullable: true })
  epcColor: string | null;

  @Column({ name: 'epc_start_date', type: 'date', nullable: true })
  epcStartDate: string | null;

  @Column({ name: 'epc_due_date', type: 'date', nullable: true })
  epcDueDate: string | null;

  @Column({ name: 'epc_created_by', type: 'uuid' })
  epcCreatedBy: string;

  @CreateDateColumn({ name: 'epc_created_at' })
  epcCreatedAt: Date;

  @UpdateDateColumn({ name: 'epc_updated_at' })
  epcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'epc_deleted_at' })
  epcDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'epc_created_by' })
  createdByUser: UserEntity;
}
