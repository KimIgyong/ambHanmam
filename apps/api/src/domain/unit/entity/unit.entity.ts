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

@Entity('amb_units')
export class UnitEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'unt_id' })
  untId: string;

  @Column({ name: 'ent_id' })
  entId: string;

  @Column({ name: 'unt_name', length: 100 })
  untName: string;

  @Column({ name: 'unt_name_local', length: 100, nullable: true })
  untNameLocal: string;

  @Column({ name: 'unt_parent_id', type: 'uuid', nullable: true })
  untParentId: string;

  @Column({ name: 'unt_level', type: 'int', default: 1 })
  untLevel: number; // 1=Unit, 2=Team

  @Column({ name: 'unt_is_active', default: true })
  untIsActive: boolean;

  @Column({ name: 'unt_sort_order', type: 'int', default: 0 })
  untSortOrder: number;

  /** 부서장 사용자 ID (hanmam tbl_org.LEADER_NO → UUID 매핑) */
  @Column({ name: 'unt_leader_id', type: 'uuid', nullable: true })
  untLeaderId: string | null;

  /** 부서 설명/비고 (hanmam tbl_org.CONTENTS 매핑) */
  @Column({ name: 'unt_description', type: 'text', nullable: true })
  untDescription: string | null;

  @CreateDateColumn({ name: 'unt_created_at' })
  untCreatedAt: Date;

  @UpdateDateColumn({ name: 'unt_updated_at' })
  untUpdatedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;

  @ManyToOne(() => UnitEntity, { nullable: true })
  @JoinColumn({ name: 'unt_parent_id' })
  parent: UnitEntity;

  @OneToMany(() => UnitEntity, (d) => d.parent)
  children: UnitEntity[];
}
