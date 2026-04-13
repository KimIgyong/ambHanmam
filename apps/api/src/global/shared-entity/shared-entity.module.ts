import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrEntityEntity } from '../../domain/hr/entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../../domain/hr/entity/entity-user-role.entity';
import { UserEntity } from '../../domain/auth/entity/user.entity';
import { InvitationEntity } from '../../domain/invitation/entity/invitation.entity';
import { EntityService } from '../../domain/hr/service/entity.service';
import { EntityGuard } from '../../domain/hr/guard/entity.guard';

/**
 * EntityGuard / EntityService 를 전역으로 제공하는 모듈.
 * 각 도메인 모듈이 EntityGuard 사용을 위해 HrModule을 import할 필요 없음.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      HrEntityEntity,
      EntityUserRoleEntity,
      UserEntity,
      InvitationEntity,
    ]),
  ],
  providers: [EntityService, EntityGuard],
  exports: [EntityService, EntityGuard],
})
export class SharedEntityModule {}
