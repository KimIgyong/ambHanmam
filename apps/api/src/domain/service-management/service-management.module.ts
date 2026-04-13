import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SvcServiceEntity } from './entity/service.entity';
import { SvcPlanEntity } from './entity/service-plan.entity';
import { SvcClientEntity } from './entity/client.entity';
import { SvcClientContactEntity } from './entity/client-contact.entity';
import { SvcSubscriptionEntity } from './entity/subscription.entity';
import { SvcSubscriptionHistoryEntity } from './entity/subscription-history.entity';
import { SvcClientNoteEntity } from './entity/client-note.entity';
import { ServiceCatalogService } from './service/service-catalog.service';
import { ClientService } from './service/client.service';
import { SubscriptionService } from './service/subscription.service';
import { ServiceCatalogController } from './controller/service-catalog.controller';
import { ClientController } from './controller/client.controller';
import { SubscriptionController } from './controller/subscription.controller';
import { TranslationModule } from '../translation/translation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SvcServiceEntity,
      SvcPlanEntity,
      SvcClientEntity,
      SvcClientContactEntity,
      SvcSubscriptionEntity,
      SvcSubscriptionHistoryEntity,
      SvcClientNoteEntity,
    ]),
    TranslationModule,
  ],
  controllers: [
    ServiceCatalogController,
    ClientController,
    SubscriptionController,
  ],
  providers: [
    ServiceCatalogService,
    ClientService,
    SubscriptionService,
  ],
  exports: [
    ServiceCatalogService,
    ClientService,
    SubscriptionService,
  ],
})
export class ServiceManagementModule {}
