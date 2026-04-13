import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_translation_glossary')
export class TranslationGlossaryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'gls_id' })
  glsId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'gls_term_en', type: 'varchar', length: 200 })
  glsTermEn: string;

  @Column({ name: 'gls_term_ko', type: 'varchar', length: 200, nullable: true })
  glsTermKo: string | null;

  @Column({ name: 'gls_term_vi', type: 'varchar', length: 200, nullable: true })
  glsTermVi: string | null;

  @Column({ name: 'gls_category', type: 'varchar', length: 50, nullable: true })
  glsCategory: string | null;

  @Column({ name: 'gls_context', type: 'text', nullable: true })
  glsContext: string | null;

  @Column({ name: 'gls_is_deleted', type: 'boolean', default: false })
  glsIsDeleted: boolean;

  @Column({ name: 'gls_created_by', type: 'uuid' })
  glsCreatedBy: string;

  @CreateDateColumn({ name: 'gls_created_at' })
  glsCreatedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'gls_created_by' })
  createdByUser: UserEntity;
}
