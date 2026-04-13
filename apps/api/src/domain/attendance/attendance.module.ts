import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceEntity } from './entity/attendance.entity';
import { AttendanceAmendmentEntity } from './entity/attendance-amendment.entity';
import { AttendancePolicyEntity } from './entity/attendance-policy.entity';
import { AttendanceService } from './service/attendance.service';
import { AttendancePolicyService } from './service/attendance-policy.service';
import { AttendanceController } from './controller/attendance.controller';
import { HrModule } from '../hr/hr.module';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, AttendanceAmendmentEntity, AttendancePolicyEntity, EntityUserRoleEntity]), HrModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendancePolicyService],
})
export class AttendanceModule {}
