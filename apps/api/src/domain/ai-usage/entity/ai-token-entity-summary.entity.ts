import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_ai_token_entity_summary')
@Unique(['entId', 'atsDate'])
export class AiTokenEntitySummaryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ats_id' })
  atsId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'ats_date', type: 'date' })
  atsDate: Date;

  @Column({ name: 'ats_total_tokens', type: 'bigint', default: 0 })
  atsTotalTokens: number;

  @Column({ name: 'ats_input_tokens', type: 'bigint', default: 0 })
  atsInputTokens: number;

  @Column({ name: 'ats_output_tokens', type: 'bigint', default: 0 })
  atsOutputTokens: number;

  @Column({ name: 'ats_request_count', type: 'int', default: 0 })
  atsRequestCount: number;

  @CreateDateColumn({ name: 'ats_created_at' })
  atsCreatedAt: Date;
}
