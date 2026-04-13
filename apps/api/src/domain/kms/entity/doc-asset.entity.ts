import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_kms_doc_assets')
@Index('idx_das_type', ['entId', 'dasType'], { where: '"das_is_active" = TRUE' })
export class DocAssetEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'das_id' })
  dasId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'das_name', length: 200 })
  dasName: string;

  @Column({ name: 'das_type', length: 30 })
  dasType: string; // 'LOGO' | 'ICON' | 'PHOTO' | 'DIAGRAM' | 'CHART' | 'SCREENSHOT' | 'OTHER'

  @Column({ name: 'das_description', type: 'text', nullable: true })
  dasDescription: string;

  @Column({ name: 'das_drive_file_id', length: 200, nullable: true })
  dasDriveFileId: string;

  @Column({ name: 'das_drive_url', length: 500, nullable: true })
  dasDriveUrl: string;

  @Column({ name: 'das_mime_type', length: 50, nullable: true })
  dasMimeType: string;

  @Column({ name: 'das_dimensions', type: 'jsonb', nullable: true })
  dasDimensions: any; // { width, height }

  @Column({ name: 'das_tags', type: 'jsonb', default: '[]' })
  dasTags: string[]; // ["logo", "brand", "dark-bg"]

  @Column({ name: 'das_used_in_types', type: 'jsonb', default: '[]' })
  dasUsedInTypes: string[]; // ["COMPANY_INTRO", "SERVICE_INTRO"]

  @Column({ name: 'das_is_active', default: true })
  dasIsActive: boolean;

  @CreateDateColumn({ name: 'das_created_at' })
  dasCreatedAt: Date;

  // Relations
  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
