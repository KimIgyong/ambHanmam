import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('amb_drive_folders')
export class DriveFolderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'drf_id' })
  drfId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'drf_folder_id', length: 100 })
  drfFolderId: string;

  @Column({ name: 'drf_folder_name', length: 200 })
  drfFolderName: string;

  @Column({ name: 'drf_drive_type', length: 20 })
  drfDriveType: string;

  @Column({ name: 'drf_description', length: 500, nullable: true })
  drfDescription: string;

  @Column({ name: 'drf_created_by' })
  drfCreatedBy: string;

  @CreateDateColumn({ name: 'drf_created_at' })
  drfCreatedAt: Date;

  @UpdateDateColumn({ name: 'drf_updated_at' })
  drfUpdatedAt: Date;

  @DeleteDateColumn({ name: 'drf_deleted_at' })
  drfDeletedAt: Date;
}
