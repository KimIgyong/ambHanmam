import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Unique,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('kms_project_members')
@Unique(['pjtId', 'usrId'])
export class ProjectMemberEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pmb_id' })
  pmbId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'pmb_role', length: 20 })
  pmbRole: string;

  @Column({ name: 'pmb_is_active', type: 'boolean', default: true })
  pmbIsActive: boolean;

  @Column({ name: 'pmb_joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  pmbJoinedAt: Date;

  @Column({ name: 'pmb_left_at', type: 'timestamp', nullable: true })
  pmbLeftAt: Date;

  @CreateDateColumn({ name: 'pmb_created_at' })
  pmbCreatedAt: Date;

  @UpdateDateColumn({ name: 'pmb_updated_at' })
  pmbUpdatedAt: Date;

  @ManyToOne(() => ProjectEntity, (p) => p.members)
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
