import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';
import { AssetEntity } from './asset.entity';

@Entity('amb_asset_requests')
@Index(['entId', 'asrStatus'])
@Index(['entId', 'asrRequestType'])
export class AssetRequestEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'asr_id' })
  asrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'asr_request_no', type: 'varchar', length: 50, unique: true })
  asrRequestNo: string;

  @Column({ name: 'asr_requester_id', type: 'uuid' })
  asrRequesterId: string;

  @Column({ name: 'asr_request_type', type: 'varchar', length: 30 })
  asrRequestType: string;

  @Column({ name: 'asr_asset_select_mode', type: 'varchar', length: 30, default: 'SPECIFIC' })
  asrAssetSelectMode: string;

  @Column({ name: 'ast_id', type: 'uuid', nullable: true })
  astId: string | null;

  @Column({ name: 'asr_asset_category', type: 'varchar', length: 30, nullable: true })
  asrAssetCategory: string | null;

  @Column({ name: 'asr_purpose', type: 'text' })
  asrPurpose: string;

  @Column({ name: 'asr_start_at', type: 'timestamptz' })
  asrStartAt: Date;

  @Column({ name: 'asr_end_at', type: 'timestamptz' })
  asrEndAt: Date;

  @Column({ name: 'asr_place', type: 'varchar', length: 300, nullable: true })
  asrPlace: string | null;

  @Column({ name: 'asr_status', type: 'varchar', length: 30, default: 'DRAFT' })
  asrStatus: string;

  @Column({ name: 'asr_final_approver_id', type: 'uuid', nullable: true })
  asrFinalApproverId: string | null;

  @Column({ name: 'asr_returned_at', type: 'timestamptz', nullable: true })
  asrReturnedAt: Date | null;

  @CreateDateColumn({ name: 'asr_created_at' })
  asrCreatedAt: Date;

  @UpdateDateColumn({ name: 'asr_updated_at' })
  asrUpdatedAt: Date;

  @DeleteDateColumn({ name: 'asr_deleted_at' })
  asrDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'asr_requester_id' })
  requester: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'asr_final_approver_id' })
  finalApprover: UserEntity | null;

  @ManyToOne(() => AssetEntity, { nullable: true })
  @JoinColumn({ name: 'ast_id' })
  asset: AssetEntity | null;
}
