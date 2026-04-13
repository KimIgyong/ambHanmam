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

@Entity('amb_asset_request_logs')
@Index(['asrId', 'arlCreatedAt'])
export class AssetRequestLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'arl_id' })
  arlId: string;

  @Column({ name: 'asr_id', type: 'uuid' })
  asrId: string;

  @Column({ name: 'arl_changed_by', type: 'uuid' })
  arlChangedBy: string;

  @Column({ name: 'arl_from_status', type: 'varchar', length: 30, nullable: true })
  arlFromStatus: string | null;

  @Column({ name: 'arl_to_status', type: 'varchar', length: 30 })
  arlToStatus: string;

  @Column({ name: 'arl_reason', type: 'varchar', length: 300, nullable: true })
  arlReason: string | null;

  @CreateDateColumn({ name: 'arl_created_at' })
  arlCreatedAt: Date;

  @ManyToOne(() => AssetRequestEntity)
  @JoinColumn({ name: 'asr_id' })
  request: AssetRequestEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'arl_changed_by' })
  changedBy: UserEntity;
}
