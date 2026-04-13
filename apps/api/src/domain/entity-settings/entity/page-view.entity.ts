import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('amb_page_views')
export class PageViewEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'pvw_id' })
  pvwId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'pvw_path', length: 200 })
  pvwPath: string;

  @Column({ name: 'pvw_menu_code', length: 50, nullable: true })
  pvwMenuCode: string;

  @CreateDateColumn({ name: 'pvw_created_at', type: 'timestamptz' })
  pvwCreatedAt: Date;
}
