import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('amb_translation_usage')
export class TranslationUsageEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'tus_id' })
  tusId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'tus_source_type', type: 'varchar', length: 30 })
  tusSourceType: string;

  @Column({ name: 'tus_source_lang', type: 'varchar', length: 5 })
  tusSourceLang: string;

  @Column({ name: 'tus_target_lang', type: 'varchar', length: 5 })
  tusTargetLang: string;

  @Column({ name: 'tus_input_tokens', type: 'integer', default: 0 })
  tusInputTokens: number;

  @Column({ name: 'tus_output_tokens', type: 'integer', default: 0 })
  tusOutputTokens: number;

  @Column({ name: 'tus_cost_usd', type: 'decimal', precision: 10, scale: 6, default: 0 })
  tusCostUsd: number;

  @CreateDateColumn({ name: 'tus_created_at' })
  tusCreatedAt: Date;
}
