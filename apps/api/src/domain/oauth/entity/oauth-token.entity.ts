import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('amb_oauth_tokens')
export class OAuthTokenEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'oat_id' })
  oatId: string;

  @Column({ name: 'pap_id', type: 'uuid' })
  papId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Index()
  @Column({ name: 'oat_access_token_hash', type: 'varchar', length: 64 })
  oatAccessTokenHash: string;

  @Index()
  @Column({ name: 'oat_refresh_token_hash', type: 'varchar', length: 64, nullable: true })
  oatRefreshTokenHash: string | null;

  @Column({ name: 'oat_scopes', type: 'text', array: true, default: '{}' })
  oatScopes: string[];

  @Column({ name: 'oat_expires_at', type: 'timestamptz' })
  oatExpiresAt: Date;

  @Column({ name: 'oat_refresh_expires_at', type: 'timestamptz', nullable: true })
  oatRefreshExpiresAt: Date | null;

  @Column({ name: 'oat_revoked_at', type: 'timestamptz', nullable: true })
  oatRevokedAt: Date | null;

  @CreateDateColumn({ name: 'oat_created_at' })
  oatCreatedAt: Date;
}
