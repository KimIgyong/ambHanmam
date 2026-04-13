import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_api_keys')
export class ApiKeyEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'apk_id' })
  apkId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'apk_provider', length: 50 })
  apkProvider: string;

  @Column({ name: 'apk_name', length: 100 })
  apkName: string;

  @Column({ name: 'apk_key_encrypted', type: 'text' })
  apkKeyEncrypted: string;

  @Column({ name: 'apk_key_iv', length: 64 })
  apkKeyIv: string;

  @Column({ name: 'apk_key_tag', length: 64 })
  apkKeyTag: string;

  @Column({ name: 'apk_key_last4', length: 4 })
  apkKeyLast4: string;

  @Column({ name: 'apk_is_active', default: true })
  apkIsActive: boolean;

  @Column({ name: 'apk_created_by', type: 'uuid' })
  apkCreatedBy: string;

  @CreateDateColumn({ name: 'apk_created_at' })
  apkCreatedAt: Date;

  @UpdateDateColumn({ name: 'apk_updated_at' })
  apkUpdatedAt: Date;

  @DeleteDateColumn({ name: 'apk_deleted_at' })
  apkDeletedAt: Date;
}
