import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { HrEntityEntity } from './hr-entity.entity';

@Entity('amb_hr_insurance_params_kr')
export class InsuranceParamsKrEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ikr_id' })
  ikrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'ikr_effective_from', type: 'date' })
  ikrEffectiveFrom: string;

  @Column({ name: 'ikr_effective_to', type: 'date', nullable: true })
  ikrEffectiveTo: string;

  @Column({ name: 'ikr_pension_rate', type: 'decimal', precision: 5, scale: 3 })
  ikrPensionRate: number;

  @Column({ name: 'ikr_pension_emp', type: 'decimal', precision: 5, scale: 3 })
  ikrPensionEmp: number;

  @Column({ name: 'ikr_pension_upper', type: 'decimal', precision: 15, scale: 0 })
  ikrPensionUpper: number;

  @Column({ name: 'ikr_pension_lower', type: 'decimal', precision: 15, scale: 0 })
  ikrPensionLower: number;

  @Column({ name: 'ikr_health_rate', type: 'decimal', precision: 5, scale: 3 })
  ikrHealthRate: number;

  @Column({ name: 'ikr_health_emp', type: 'decimal', precision: 5, scale: 3 })
  ikrHealthEmp: number;

  @Column({ name: 'ikr_longterm_rate', type: 'decimal', precision: 6, scale: 3 })
  ikrLongtermRate: number;

  @Column({ name: 'ikr_employ_rate', type: 'decimal', precision: 5, scale: 3 })
  ikrEmployRate: number;

  @Column({ name: 'ikr_employ_emp', type: 'decimal', precision: 5, scale: 3 })
  ikrEmployEmp: number;

  @CreateDateColumn({ name: 'ikr_created_at' })
  ikrCreatedAt: Date;

  @ManyToOne(() => HrEntityEntity)
  @JoinColumn({ name: 'ent_id' })
  hrEntity: HrEntityEntity;
}
