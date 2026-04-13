import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('amb_menu_cell_permissions')
@Unique(['mcpMenuCode', 'celId'])
export class MenuCellPermissionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'mcp_id' })
  mcpId: string;

  @Column({ name: 'mcp_menu_code', type: 'varchar', length: 50 })
  mcpMenuCode: string;

  @Column({ name: 'cel_id', type: 'uuid' })
  celId: string;

  @Column({ name: 'mcp_accessible', type: 'boolean', default: true })
  mcpAccessible: boolean;

  @CreateDateColumn({ name: 'mcp_created_at' })
  mcpCreatedAt: Date;

  @UpdateDateColumn({ name: 'mcp_updated_at' })
  mcpUpdatedAt: Date;
}
