import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SvcServiceEntity } from '../../shared-entities/service.entity';
import { SvcPlanEntity } from '../../shared-entities/service-plan.entity';
import { PublicCatalogService } from './service/public-catalog.service';
import { PublicCatalogController } from './controller/public-catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SvcServiceEntity, SvcPlanEntity])],
  controllers: [PublicCatalogController],
  providers: [PublicCatalogService],
  exports: [PublicCatalogService],
})
export class CatalogModule {}
