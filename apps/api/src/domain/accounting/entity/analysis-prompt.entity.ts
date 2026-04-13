import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_analysis_prompts')
export class AnalysisPromptEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'anp_id' })
  anpId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'anp_name', type: 'varchar', length: 200 })
  anpName: string;

  @Column({ name: 'anp_system_prompt', type: 'text' })
  anpSystemPrompt: string;

  @Column({ name: 'anp_user_prompt', type: 'text' })
  anpUserPrompt: string;

  @Column({ name: 'anp_is_default', type: 'boolean', default: false })
  anpIsDefault: boolean;

  @Column({ name: 'anp_sort_order', type: 'integer', default: 0 })
  anpSortOrder: number;

  @CreateDateColumn({ name: 'anp_created_at' })
  anpCreatedAt: Date;

  @UpdateDateColumn({ name: 'anp_updated_at' })
  anpUpdatedAt: Date;

  @DeleteDateColumn({ name: 'anp_deleted_at' })
  anpDeletedAt: Date | null;
}
