import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';

@Entity('amb_cells')
export class CellEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cel_id' })
  celId: string;

  @Column({ name: 'cel_name', length: 100 })
  celName: string;

  @Column({ name: 'cel_description', type: 'varchar', length: 500, nullable: true })
  celDescription: string | null;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string | null;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @CreateDateColumn({ name: 'cel_created_at' })
  celCreatedAt: Date;

  @UpdateDateColumn({ name: 'cel_updated_at' })
  celUpdatedAt: Date;

  @DeleteDateColumn({ name: 'cel_deleted_at' })
  celDeletedAt: Date;
}
