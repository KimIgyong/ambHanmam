import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../auth/entity/user.entity';
import { CellEntity } from './entity/cell.entity';
import { UserCellEntity } from './entity/user-cell.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { UserUnitRoleEntity } from '../unit/entity/user-unit-role.entity';
import { UnitEntity } from '../unit/entity/unit.entity';
import { EmployeeEntity } from '../hr/entity/employee.entity';
import { DependentEntity } from '../hr/entity/dependent.entity';
import { SalaryHistoryEntity } from '../hr/entity/salary-history.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { MemberService } from './service/member.service';
import { CellService } from './service/cell.service';
import { CellAccessService } from './service/cell-access.service';
import { EmployeeService } from '../hr/service/employee.service';
import { MemberController } from './controller/member.controller';
import { CellController } from './controller/cell.controller';
import { HrModule } from '../hr/hr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      CellEntity,
      UserCellEntity,
      EntityUserRoleEntity,
      HrEntityEntity,
      UserUnitRoleEntity,
      UnitEntity,
      EmployeeEntity,
      DependentEntity,
      SalaryHistoryEntity,
      SvcClientEntity,
    ]),
    HrModule,
  ],
  controllers: [MemberController, CellController],
  providers: [MemberService, CellService, CellAccessService, EmployeeService],
  exports: [MemberService, CellService, CellAccessService],
})
export class MembersModule {}
