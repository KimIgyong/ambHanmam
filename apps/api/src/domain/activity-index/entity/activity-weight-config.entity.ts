import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_activity_weight_configs')
@Unique(['entId', 'awcCategory'])
export class ActivityWeightConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'awc_id' })
  awcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'awc_category', type: 'varchar', length: 20 })
  awcCategory: string; // ISSUE | MEETING_NOTE | COMMENT | TODO | CHAT_MESSAGE

  @Column({ name: 'awc_weight', type: 'smallint', default: 1 })
  awcWeight: number;

  @Column({ name: 'awc_engagement_weight', type: 'smallint', default: 1 })
  awcEngagementWeight: number;

  @Column({ name: 'awc_daily_cap', type: 'int', nullable: true })
  awcDailyCap: number | null;

  @Column({ name: 'awc_updated_by', type: 'uuid', nullable: true })
  awcUpdatedBy: string | null;

  @CreateDateColumn({ name: 'awc_created_at' })
  awcCreatedAt: Date;

  @UpdateDateColumn({ name: 'awc_updated_at' })
  awcUpdatedAt: Date;

  @ManyToOne(() => HrEntityEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'awc_updated_by' })
  updatedByUser: UserEntity;
}
