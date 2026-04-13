import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_kms_tags')
export class KmsTagEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tag_id' })
  tagId: string;

  @Column({ name: 'ent_id' })
  entId: string;

  @Column({ name: 'tag_name', length: 200 })
  tagName: string; // Normalized name (lowercase, trimmed)

  @Column({ name: 'tag_display', length: 200 })
  tagDisplay: string; // Display name (original casing)

  @Column({ name: 'tag_name_local', length: 200, nullable: true })
  tagNameLocal: string;

  @Column({ name: 'tag_level', type: 'int', default: 2 })
  tagLevel: number; // 1=DOMAIN, 2=TOPIC, 3=CONTEXT

  @Column({ name: 'tag_parent_id', type: 'uuid', nullable: true })
  tagParentId: string;

  @Column({ name: 'tag_color', length: 20, nullable: true })
  tagColor: string;

  @Column({ name: 'tag_is_system', default: false })
  tagIsSystem: boolean;

  @Column({ name: 'tag_usage_count', type: 'int', default: 0 })
  tagUsageCount: number;

  @Column({ name: 'tag_embedding', type: 'text', nullable: true })
  tagEmbedding: string; // Stored as text, will be vector(1536) when pgvector is available

  @CreateDateColumn({ name: 'tag_created_at' })
  tagCreatedAt: Date;

  @UpdateDateColumn({ name: 'tag_updated_at' })
  tagUpdatedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => KmsTagEntity, { nullable: true })
  @JoinColumn({ name: 'tag_parent_id' })
  parent: KmsTagEntity;

  @OneToMany(() => KmsTagEntity, (t) => t.parent)
  children: KmsTagEntity[];
}
