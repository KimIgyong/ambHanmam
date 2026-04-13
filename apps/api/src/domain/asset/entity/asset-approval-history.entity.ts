import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { AssetRequestEntity } from './asset-request.entity';

@Entity('amb_asset_approval_histories')
@Index(['asrId', 'aahStep'])
export class AssetApprovalHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'aah_id' })
  aahId: string;

  @Column({ name: 'asr_id', type: 'uuid' })
  asrId: string;

  @Column({ name: 'aah_step', type: 'varchar', length: 30 })
  aahStep: string;

  @Column({ name: 'aah_status', type: 'varchar', length: 30 })
  aahStatus: string;

  @Column({ name: 'aah_approver_id', type: 'uuid' })
  aahApproverId: string;

  @Column({ name: 'aah_comment', type: 'text', nullable: true })
  aahComment: string | null;

  @CreateDateColumn({ name: 'aah_created_at' })
  aahCreatedAt: Date;

  @ManyToOne(() => AssetRequestEntity)
  @JoinColumn({ name: 'asr_id' })
  request: AssetRequestEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'aah_approver_id' })
  approver: UserEntity;
}
