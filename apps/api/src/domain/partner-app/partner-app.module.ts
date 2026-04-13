import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerAppEntity } from './entity/partner-app.entity';
import { PartnerAppVersionEntity } from './entity/partner-app-version.entity';
import { PartnerAppInstallEntity } from './entity/partner-app-install.entity';
import { PartnerAppService } from './service/partner-app.service';
import { AdminPartnerAppService } from './service/admin-partner-app.service';
import { PartnerAppController } from './controller/partner-app.controller';
import { AdminPartnerAppController } from './controller/admin-partner-app.controller';
import { EntityPartnerAppController } from './controller/entity-partner-app.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PartnerAppEntity,
      PartnerAppVersionEntity,
      PartnerAppInstallEntity,
    ]),
  ],
  controllers: [PartnerAppController, AdminPartnerAppController, EntityPartnerAppController],
  providers: [PartnerAppService, AdminPartnerAppService],
  exports: [PartnerAppService],
})
export class PartnerAppModule {}
