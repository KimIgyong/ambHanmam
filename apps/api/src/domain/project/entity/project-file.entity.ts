import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('kms_project_files')
export class ProjectFileEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pfl_id' })
  pflId: string;

  @Column({ name: 'pjt_id', type: 'uuid' })
  pjtId: string;

  @Column({ name: 'pfl_title', length: 300 })
  pflTitle: string;

  @Column({ name: 'pfl_phase', length: 20, nullable: true })
  pflPhase: string;

  @Column({ name: 'pfl_filename', length: 300 })
  pflFilename: string;

  @Column({ name: 'pfl_mime_type', length: 100, nullable: true })
  pflMimeType: string;

  @Column({ name: 'pfl_file_size', type: 'int', nullable: true })
  pflFileSize: number;

  @Column({ name: 'pfl_gdrive_file_id', length: 100, nullable: true })
  pflGdriveFileId: string;

  @Column({ name: 'pfl_gdrive_url', type: 'text', nullable: true })
  pflGdriveUrl: string;

  @Column({ name: 'pfl_uploaded_by', type: 'uuid', nullable: true })
  pflUploadedBy: string;

  @CreateDateColumn({ name: 'pfl_created_at' })
  pflCreatedAt: Date;

  @ManyToOne(() => ProjectEntity, (p) => p.files)
  @JoinColumn({ name: 'pjt_id' })
  project: ProjectEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'pfl_uploaded_by' })
  uploader: UserEntity;
}
