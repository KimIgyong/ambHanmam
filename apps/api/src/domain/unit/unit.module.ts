import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnitEntity } from './entity/unit.entity';
import { UserUnitRoleEntity } from './entity/user-unit-role.entity';
import { UnitService } from './service/unit.service';
import { UserUnitRoleService } from './service/user-unit-role.service';
import { HierarchyService } from './service/hierarchy.service';
import { UnitController } from './controller/unit.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UnitEntity, UserUnitRoleEntity])],
  controllers: [UnitController],
  providers: [UnitService, UserUnitRoleService, HierarchyService],
  exports: [UnitService, UserUnitRoleService, HierarchyService],
})
export class UnitModule {}
