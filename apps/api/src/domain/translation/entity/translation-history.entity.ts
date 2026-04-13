import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { ContentTranslationEntity } from './content-translation.entity';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_content_translation_history')
export class TranslationHistoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'thi_id' })
  thiId: string;

  @Column({ name: 'trn_id', type: 'uuid' })
  trnId: string;

  @Column({ name: 'thi_content', type: 'text' })
  thiContent: string;

  @Column({ name: 'thi_method', type: 'varchar', length: 20 })
  thiMethod: string;

  @Column({ name: 'thi_version', type: 'integer' })
  thiVersion: number;

  @Column({ name: 'thi_edited_by', type: 'uuid' })
  thiEditedBy: string;

  @Column({ name: 'thi_change_reason', type: 'varchar', length: 200, nullable: true })
  thiChangeReason: string | null;

  @CreateDateColumn({ name: 'thi_created_at' })
  thiCreatedAt: Date;

  @ManyToOne(() => ContentTranslationEntity)
  @JoinColumn({ name: 'trn_id' })
  translation: ContentTranslationEntity;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'thi_edited_by' })
  editedByUser: UserEntity;
}
