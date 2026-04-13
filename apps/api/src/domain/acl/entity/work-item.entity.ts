import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { CellEntity } from '../../members/entity/cell.entity';

@Entity('amb_work_items')
@Index(['entId', 'witModule'])
export class WorkItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'wit_id' })
  witId: string;

  @Column({ name: 'ent_id' })
  entId: string;

  @Column({ name: 'wit_type', length: 20 })
  witType: string; // DOC | REPORT | TODO | NOTE | EMAIL | ANALYSIS

  @Column({ name: 'wit_title', length: 500 })
  witTitle: string;

  @Column({ name: 'wit_owner_id' })
  witOwnerId: string;

  @Column({ name: 'wit_visibility', length: 20, default: 'PRIVATE' })
  witVisibility: string; // PRIVATE | SHARED | UNIT | CELL | ENTITY | PUBLIC

  @Column({ name: 'wit_module', length: 50, nullable: true })
  witModule: string; // todo | meeting-notes | billing | etc.

  @Column({ name: 'wit_ref_id', type: 'uuid', nullable: true })
  witRefId: string; // Reference to module-specific entity

  @Column({ name: 'wit_content', type: 'text', nullable: true })
  witContent: string;

  @Column({ name: 'wit_cell_id', type: 'uuid', nullable: true })
  witCellId: string;

  @CreateDateColumn({ name: 'wit_created_at' })
  witCreatedAt: Date;

  @UpdateDateColumn({ name: 'wit_updated_at' })
  witUpdatedAt: Date;

  @DeleteDateColumn({ name: 'wit_deleted_at' })
  witDeletedAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'wit_owner_id' })
  owner: UserEntity;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => CellEntity)
  @JoinColumn({ name: 'wit_cell_id' })
  cell: CellEntity;
}
