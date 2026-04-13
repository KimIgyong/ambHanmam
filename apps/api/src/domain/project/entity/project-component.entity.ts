import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { ProjectEntity } from './project.entity';

@Entity('amb_project_components')
export class ProjectComponentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cmp_id' })
  cmpId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'cmp_title', length: 200 })
  cmpTitle: string;

  @Column({ name: 'cmp_description', type: 'text', nullable: true })
  cmpDescription: string | null;

  @Column({ name: 'cmp_color', type: 'varchar', length: 7, nullable: true })
  cmpColor: string | null;

  @Column({ name: 'cmp_owner_id', type: 'uuid', nullable: true })
  cmpOwnerId: string | null;

  @Column({ name: 'cmp_created_by', type: 'uuid' })
  cmpCreatedBy: string;

  @CreateDateColumn({ name: 'cmp_created_at' })
  cmpCreatedAt: Date;

  @UpdateDateColumn({ name: 'cmp_updated_at' })
  cmpUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cmp_deleted_at' })
  cmpDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'cmp_owner_id' })
  owner: UserEntity | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'cmp_created_by' })
  createdByUser: UserEntity;
}
