import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PartnerOrganizationEntity } from './entity/partner-organization.entity';
import { PartnerService } from './service/partner.service';
import { PartnerController } from './controller/partner.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PartnerOrganizationEntity])],
  controllers: [PartnerController],
  providers: [PartnerService],
  exports: [PartnerService],
})
export class PartnerModule {}
