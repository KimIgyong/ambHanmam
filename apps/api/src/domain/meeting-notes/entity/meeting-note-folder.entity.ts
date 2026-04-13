import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_meeting_note_folders')
export class MeetingNoteFolderEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mnf_id' })
  mnfId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'mnf_name', type: 'varchar', length: 100 })
  mnfName: string;

  @Column({ name: 'mnf_color', type: 'varchar', length: 20, nullable: true })
  mnfColor: string | null;

  @Column({ name: 'mnf_sort_order', type: 'int', default: 0 })
  mnfSortOrder: number;

  @CreateDateColumn({ name: 'mnf_created_at' })
  mnfCreatedAt: Date;

  @UpdateDateColumn({ name: 'mnf_updated_at' })
  mnfUpdatedAt: Date;

  @DeleteDateColumn({ name: 'mnf_deleted_at' })
  mnfDeletedAt: Date;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
