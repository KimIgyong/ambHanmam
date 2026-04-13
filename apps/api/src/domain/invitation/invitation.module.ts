import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvitationEntity } from './entity/invitation.entity';
import { InvitationService } from './service/invitation.service';
import { InvitationController } from './controller/invitation.controller';
import { UserEntity } from '../auth/entity/user.entity';
import { CellEntity } from '../members/entity/cell.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvitationEntity, UserEntity, CellEntity,
      EntityUserRoleEntity, UnitEntity, UserUnitRoleEntity, HrEntityEntity,
    ]),
    SettingsModule,
  ],
  controllers: [InvitationController],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
