import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_svc_services')
export class SvcServiceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'svc_id' })
  svcId: string;

  @Column({ name: 'svc_code', length: 30, unique: true })
  svcCode: string;

  @Column({ name: 'svc_name', length: 200 })
  svcName: string;

  @Column({ name: 'svc_name_ko', length: 200, nullable: true })
  svcNameKo: string;

  @Column({ name: 'svc_name_vi', length: 200, nullable: true })
  svcNameVi: string;

  @Column({ name: 'svc_description', type: 'text', nullable: true })
  svcDescription: string;

  @Column({ name: 'svc_category', length: 30 })
  svcCategory: string;

  @Column({ name: 'svc_icon', length: 50, nullable: true })
  svcIcon: string;

  @Column({ name: 'svc_color', length: 10, nullable: true })
  svcColor: string;

  @Column({ name: 'svc_website_url', length: 500, nullable: true })
  svcWebsiteUrl: string;

  @Column({ name: 'svc_status', length: 20, default: 'ACTIVE' })
  svcStatus: string;

  @Column({ name: 'svc_launch_date', type: 'date', nullable: true })
  svcLaunchDate: string;

  @Column({ name: 'svc_sort_order', type: 'int', default: 0 })
  svcSortOrder: number;

  @CreateDateColumn({ name: 'svc_created_at' })
  svcCreatedAt: Date;

  @UpdateDateColumn({ name: 'svc_updated_at' })
  svcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'svc_deleted_at' })
  svcDeletedAt: Date;
}
