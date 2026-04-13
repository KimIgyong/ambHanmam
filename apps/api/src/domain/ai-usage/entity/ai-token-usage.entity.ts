import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_ai_token_usage')
export class AiTokenUsageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'atu_id' })
  atuId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  entity: HrEntityEntity;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @Column({ name: 'cvs_id', type: 'uuid', nullable: true })
  cvsId: string;

  @Column({ name: 'atu_source_type', length: 30, default: 'CHAT' })
  atuSourceType: string;

  @Column({ name: 'atu_model', length: 100 })
  atuModel: string;

  @Column({ name: 'atu_input_tokens', type: 'int', default: 0 })
  atuInputTokens: number;

  @Column({ name: 'atu_output_tokens', type: 'int', default: 0 })
  atuOutputTokens: number;

  @Column({ name: 'atu_total_tokens', type: 'int', default: 0 })
  atuTotalTokens: number;

  @Column({ name: 'atu_key_source', length: 20, default: 'SHARED' })
  atuKeySource: string;

  @CreateDateColumn({ name: 'atu_created_at' })
  atuCreatedAt: Date;
}
