import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('amb_user_cells')
export class UserCellEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'ugr_id' })
  ugrId: string;

  @Column({ name: 'usr_id', type: 'uuid' })
  usrId: string;

  @Column({ name: 'cel_id', type: 'uuid' })
  celId: string;

  @CreateDateColumn({ name: 'ugr_created_at' })
  ugrCreatedAt: Date;
}
