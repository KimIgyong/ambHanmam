import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PortalCustomerReadonlyEntity } from './entity/portal-customer-readonly.entity';
import { PortalUserMappingEntity } from './entity/portal-user-mapping.entity';
import { PortalPaymentReadonlyEntity } from './entity/portal-payment-readonly.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { EntityUserRoleEntity } from '../hr/entity/entity-user-role.entity';
import { EmployeeEntity } from '../hr/entity/employee.entity';
import { SvcClientEntity } from '../service-management/entity/client.entity';
import { SvcSubscriptionEntity } from '../service-management/entity/subscription.entity';
import { PortalBridgeService } from './service/portal-bridge.service';
import { PortalBridgeController } from './controller/portal-bridge.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PortalCustomerReadonlyEntity,
      PortalUserMappingEntity,
      PortalPaymentReadonlyEntity,
      UserEntity,
      HrEntityEntity,
      EntityUserRoleEntity,
      EmployeeEntity,
      SvcClientEntity,
      SvcSubscriptionEntity,
    ]),
    SettingsModule,
    AuthModule,
  ],
  controllers: [PortalBridgeController],
  providers: [PortalBridgeService],
  exports: [PortalBridgeService],
})
export class PortalBridgeModule {}
