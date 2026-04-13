import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_project_comments')
export class ProjectCommentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pjc_id' })
  pjcId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'pjc_content', type: 'text' })
  pjcContent: string;

  @CreateDateColumn({ name: 'pjc_created_at' })
  pjcCreatedAt: Date;

  @DeleteDateColumn({ name: 'pjc_deleted_at' })
  pjcDeletedAt: Date;

  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
