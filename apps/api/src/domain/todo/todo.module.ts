import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TodoEntity } from './entity/todo.entity';
import { TodoStatusLogEntity } from './entity/todo-status-log.entity';
import { TodoCommentEntity } from './entity/todo-comment.entity';
import { TodoParticipantEntity } from './entity/todo-participant.entity';
import { TodoRatingEntity } from '../activity-index/entity/todo-rating.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { TodoService } from './service/todo.service';
import { TodoController } from './controller/todo.controller';
import { HrModule } from '../hr/hr.module';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoEntity, TodoStatusLogEntity, TodoCommentEntity, TodoParticipantEntity, TodoRatingEntity, UserEntity, UserCellEntity, UserUnitRoleEntity]),
    HrModule,
    TranslationModule,
  ],
  controllers: [TodoController],
  providers: [TodoService],
  exports: [TodoService],
})
export class TodoModule {}
