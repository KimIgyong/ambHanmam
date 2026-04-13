import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('amb_migration_user_map')
export class MigrationUserMapEntity {
  @PrimaryColumn({ name: 'redmine_user_id', type: 'int' })
  redmineUserId: number;

  @Column({ name: 'amb_user_id', type: 'uuid' })
  ambUserId: string;

  @Column({ name: 'redmine_login', length: 100, nullable: true })
  redmineLogin: string;

  @Column({ name: 'redmine_email', length: 200, nullable: true })
  redmineEmail: string;

  @Column({ name: 'mapped_at', type: 'timestamptz', default: () => 'NOW()' })
  mappedAt: Date;
}
