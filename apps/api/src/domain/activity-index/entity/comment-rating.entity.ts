import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Check,
} from 'typeorm';
import { UserEntity } from '../../auth/entity/user.entity';

@Entity('amb_comment_ratings')
@Unique(['cmrTargetType', 'cmrTargetId', 'usrId'])
@Check('"cmr_rating" >= 1 AND "cmr_rating" <= 5')
export class CommentRatingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'cmr_id' })
  cmrId: string;

  @Column({ name: 'cmr_target_type', type: 'varchar', length: 20 })
  cmrTargetType: string; // ISSUE_COMMENT | TODO_COMMENT | NOTE_COMMENT

  @Column({ name: 'cmr_target_id', type: 'uuid' })
  cmrTargetId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'cmr_rating', type: 'smallint' })
  cmrRating: number;

  @CreateDateColumn({ name: 'cmr_created_at' })
  cmrCreatedAt: Date;

  @UpdateDateColumn({ name: 'cmr_updated_at' })
  cmrUpdatedAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usr_id' })
  user: UserEntity;
}
