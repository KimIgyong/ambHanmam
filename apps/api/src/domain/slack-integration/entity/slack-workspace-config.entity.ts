import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';

@Entity('amb_slack_workspace_configs')
export class SlackWorkspaceConfigEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'swc_id' })
  swcId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'swc_team_id', type: 'varchar', length: 50 })
  swcTeamId: string;

  @Column({ name: 'swc_team_name', type: 'varchar', length: 200 })
  swcTeamName: string;

  @Column({ name: 'swc_bot_token_enc', type: 'text' })
  swcBotTokenEnc: string;

  @Column({ name: 'swc_bot_token_iv', type: 'varchar', length: 100 })
  swcBotTokenIv: string;

  @Column({ name: 'swc_bot_token_tag', type: 'varchar', length: 100 })
  swcBotTokenTag: string;

  @Column({ name: 'swc_bot_user_id', type: 'varchar', length: 50 })
  swcBotUserId: string;

  @Column({ name: 'swc_app_id', type: 'varchar', length: 50, nullable: true })
  swcAppId: string | null;

  @Column({ name: 'swc_signing_secret_enc', type: 'text' })
  swcSigningSecretEnc: string;

  @Column({ name: 'swc_signing_secret_iv', type: 'varchar', length: 100 })
  swcSigningSecretIv: string;

  @Column({ name: 'swc_signing_secret_tag', type: 'varchar', length: 100 })
  swcSigningSecretTag: string;

  @Column({ name: 'swc_is_active', type: 'boolean', default: true })
  swcIsActive: boolean;

  @Column({ name: 'swc_connected_at', type: 'timestamp' })
  swcConnectedAt: Date;

  @Column({ name: 'swc_connected_by', type: 'uuid' })
  swcConnectedBy: string;

  @CreateDateColumn({ name: 'swc_created_at' })
  swcCreatedAt: Date;

  @UpdateDateColumn({ name: 'swc_updated_at' })
  swcUpdatedAt: Date;

  @DeleteDateColumn({ name: 'swc_deleted_at' })
  swcDeletedAt: Date;
}
