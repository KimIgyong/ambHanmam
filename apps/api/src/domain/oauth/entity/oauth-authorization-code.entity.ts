import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('amb_oauth_authorization_codes')
export class OAuthAuthorizationCodeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'oac_id' })
  oacId: string;

  @Index()
  @Column({ name: 'oac_code', type: 'varchar', length: 255, unique: true })
  oacCode: string;

  @Column({ name: 'pap_id', type: 'uuid' })
  papId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'ent_id', type: 'uuid' })
  entId: string;

  @Column({ name: 'oac_scopes', type: 'text', array: true, default: '{}' })
  oacScopes: string[];

  @Column({ name: 'oac_redirect_uri', type: 'varchar', length: 500 })
  oacRedirectUri: string;

  @Column({ name: 'oac_code_challenge', type: 'varchar', length: 128, nullable: true })
  oacCodeChallenge: string | null;

  @Column({ name: 'oac_code_challenge_method', type: 'varchar', length: 10, default: 'S256' })
  oacCodeChallengeMethod: string;

  @Column({ name: 'oac_state', type: 'varchar', length: 255, nullable: true })
  oacState: string | null;

  @Column({ name: 'oac_expires_at', type: 'timestamptz' })
  oacExpiresAt: Date;

  @Column({ name: 'oac_used_at', type: 'timestamptz', nullable: true })
  oacUsedAt: Date | null;

  @CreateDateColumn({ name: 'oac_created_at' })
  oacCreatedAt: Date;
}
