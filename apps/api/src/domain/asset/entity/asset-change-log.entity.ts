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
import { AssetEntity } from './asset.entity';

@Entity('amb_asset_change_logs')
@Index(['astId', 'aclCreatedAt'])
export class AssetChangeLogEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'acl_id' })
  aclId: string;

  @Column({ name: 'ast_id', type: 'uuid' })
  astId: string;

  @Column({ name: 'acl_changed_by', type: 'uuid' })
  aclChangedBy: string;

  @Column({ name: 'acl_field', type: 'varchar', length: 100 })
  aclField: string;

  @Column({ name: 'acl_before_value', type: 'text', nullable: true })
  aclBeforeValue: string | null;

  @Column({ name: 'acl_after_value', type: 'text', nullable: true })
  aclAfterValue: string | null;

  @Column({ name: 'acl_reason', type: 'varchar', length: 300, nullable: true })
  aclReason: string | null;

  @CreateDateColumn({ name: 'acl_created_at' })
  aclCreatedAt: Date;

  @ManyToOne(() => AssetEntity)
  @JoinColumn({ name: 'ast_id' })
  asset: AssetEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'acl_changed_by' })
  changedBy: UserEntity;
}
