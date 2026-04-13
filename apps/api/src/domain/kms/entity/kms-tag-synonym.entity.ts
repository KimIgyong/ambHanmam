import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { KmsTagEntity } from './kms-tag.entity';

@Entity('amb_kms_tag_synonyms')
export class KmsTagSynonymEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tsy_id' })
  tsyId: string;

  @Column({ name: 'tag_id' })
  tagId: string;

  @Column({ name: 'tsy_synonym', length: 200 })
  tsySynonym: string;

  @Column({ name: 'tsy_language', length: 10, nullable: true })
  tsyLanguage: string; // en | ko | vi

  @CreateDateColumn({ name: 'tsy_created_at' })
  tsyCreatedAt: Date;

  @ManyToOne(() => KmsTagEntity)
  @JoinColumn({ name: 'tag_id' })
  tag: KmsTagEntity;
}
