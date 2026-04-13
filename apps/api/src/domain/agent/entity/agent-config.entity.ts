import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_agent_configs')
export class AgentConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'agc_id' })
  agcId: string;

  @Column({ name: 'agc_unit_code', type: 'varchar', length: 20, unique: true })
  agcUnitCode: string;

  @Column({ name: 'agc_system_prompt', type: 'text', nullable: true })
  agcSystemPrompt: string | null;

  @Column({ name: 'agc_description', type: 'text', nullable: true })
  agcDescription: string | null;

  @Column({ name: 'agc_is_active', type: 'boolean', default: true })
  agcIsActive: boolean;

  @Column({ name: 'agc_visible_cell_ids', type: 'text', array: true, nullable: true, default: null })
  agcVisibleCellIds: string[] | null;

  @Column({ name: 'agc_updated_by', type: 'uuid', nullable: true })
  agcUpdatedBy: string | null;

  @Column({ name: 'agc_is_deleted', type: 'boolean', default: false })
  agcIsDeleted: boolean;

  @CreateDateColumn({ name: 'agc_created_at' })
  agcCreatedAt: Date;

  @UpdateDateColumn({ name: 'agc_updated_at' })
  agcUpdatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'agc_updated_by' })
  updatedByUser: UserEntity;
}
