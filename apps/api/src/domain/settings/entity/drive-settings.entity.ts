import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_drive_settings')
export class DriveSettingsEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'drs_id' })
  drsId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'drs_impersonate_email', length: 200, nullable: true })
  drsImpersonateEmail: string;

  @Column({ name: 'drs_billing_root_folder_id', length: 100, nullable: true })
  drsBillingRootFolderId: string;

  @Column({ name: 'drs_billing_root_folder_name', length: 200, nullable: true })
  drsBillingRootFolderName: string;

  @UpdateDateColumn({ name: 'drs_updated_at' })
  drsUpdatedAt: Date;

  @Column({ name: 'drs_updated_by', type: 'uuid', nullable: true })
  drsUpdatedBy: string;
}
