import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('amb_entity_site_configs')
export class EntitySiteConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'esc_id' })
  escId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'esc_login_modal_enabled', type: 'boolean', default: false })
  escLoginModalEnabled: boolean;

  @Column({ name: 'esc_login_modal_title', type: 'varchar', length: 200, nullable: true })
  escLoginModalTitle: string | null;

  @Column({ name: 'esc_login_modal_content', type: 'text', nullable: true })
  escLoginModalContent: string | null;

  @CreateDateColumn({ name: 'esc_created_at' })
  escCreatedAt: Date;

  @UpdateDateColumn({ name: 'esc_updated_at' })
  escUpdatedAt: Date;
}
