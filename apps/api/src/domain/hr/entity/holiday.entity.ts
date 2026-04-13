import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
} from 'typeorm';

@Entity('amb_hr_holidays')
export class HolidayEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'hol_id' })
  holId: string;

  @Column({ name: 'ent_id', type: 'uuid', nullable: true })
  entId: string;

  @Column({ name: 'hol_date', type: 'date', unique: true })
  holDate: string;

  @Column({ name: 'hol_name', length: 100 })
  holName: string;

  @Column({ name: 'hol_name_vi', length: 100, nullable: true })
  holNameVi: string;

  @Column({ name: 'hol_year', type: 'int' })
  holYear: number;

  @CreateDateColumn({ name: 'hol_created_at' })
  holCreatedAt: Date;
}
