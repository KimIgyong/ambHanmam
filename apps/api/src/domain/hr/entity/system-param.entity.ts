import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('amb_hr_system_params')
export class SystemParamEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'hsp_id' })
  hspId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @Column({ name: 'hsp_param_key', length: 50 })
  hspParamKey: string;

  @Column({ name: 'hsp_param_value', length: 50 })
  hspParamValue: string;

  @Column({ name: 'hsp_effective_from', type: 'date' })
  hspEffectiveFrom: string;

  @Column({ name: 'hsp_effective_to', type: 'date', nullable: true })
  hspEffectiveTo: string;

  @Column({ name: 'hsp_description', length: 200, nullable: true })
  hspDescription: string;

  @CreateDateColumn({ name: 'hsp_created_at' })
  hspCreatedAt: Date;
}
