import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { NoticeAttachmentEntity } from './notice-attachment.entity';

@Entity('amb_notices')
@Index(['ntcVisibility', 'ntcCreatedAt'])
export class NoticeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ntc_id' })
  ntcId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id' })
  usrId: string;

  @Column({ name: 'ntc_title', length: 200 })
  ntcTitle: string;

  @Column({ name: 'ntc_content', type: 'text' })
  ntcContent: string;

  @Column({ name: 'ntc_visibility', length: 20, default: 'PUBLIC' })
  ntcVisibility: string;

  @Column({ name: 'ntc_unit', length: 30, nullable: true })
  ntcUnit: string;

  @Column({ name: 'ntc_cell_id', type: 'uuid', nullable: true })
  ntcCellId: string;

  @Column({ name: 'ntc_original_lang', type: 'varchar', length: 5, default: 'ko' })
  ntcOriginalLang: string;

  @Column({ name: 'ntc_is_pinned', type: 'boolean', default: false })
  ntcIsPinned: boolean;

  @Column({ name: 'ntc_view_count', type: 'integer', default: 0 })
  ntcViewCount: number;

  @CreateDateColumn({ name: 'ntc_created_at' })
  ntcCreatedAt: Date;

  @UpdateDateColumn({ name: 'ntc_updated_at' })
  ntcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'ntc_deleted_at' })
  ntcDeletedAt: Date;

  @ManyToOne(() => HrEntityEntity, { nullable: true })
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;

  @OneToMany(() => NoticeAttachmentEntity, (attachment) => attachment.notice, { cascade: true })
  attachments: NoticeAttachmentEntity[];
}
