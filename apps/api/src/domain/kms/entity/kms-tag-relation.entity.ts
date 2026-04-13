import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KmsTagEntity } from './kms-tag.entity';

@Entity('amb_kms_tag_relations')
export class KmsTagRelationEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'trl_id' })
  trlId: string;

  @Column({ name: 'tag_source_id' })
  tagSourceId: string;

  @Column({ name: 'tag_target_id' })
  tagTargetId: string;

  @Column({ name: 'trl_type', length: 20 })
  trlType: string; // PARENT_CHILD | RELATED | SYNONYM | BROADER | NARROWER

  @Column({ name: 'trl_weight', type: 'decimal', precision: 5, scale: 4, default: 1.0 })
  trlWeight: number;

  @Column({ name: 'trl_co_occur', type: 'int', default: 0 })
  trlCoOccur: number;

  @CreateDateColumn({ name: 'trl_created_at' })
  trlCreatedAt: Date;

  @ManyToOne(() => KmsTagEntity)
  @JoinColumn({ name: 'tag_source_id' })
  sourceTag: KmsTagEntity;

  @ManyToOne(() => KmsTagEntity)
  @JoinColumn({ name: 'tag_target_id' })
  targetTag: KmsTagEntity;
}
