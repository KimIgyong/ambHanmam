import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from './entity/notification.entity';
import { PushSubscriptionEntity } from './entity/push-subscription.entity';
import { NotificationService } from './service/notification.service';
import { NotificationSseService } from './service/notification-sse.service';
import { PushService } from './service/push.service';
import { NotificationListener } from './service/notification.listener';
import { NotificationController } from './controller/notification.controller';
import { PushController } from './controller/push.controller';
import { HrModule } from '../hr/hr.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, PushSubscriptionEntity]),
    HrModule,
  ],
  controllers: [NotificationController, PushController],
  providers: [
    NotificationService,
    NotificationSseService,
    PushService,
    NotificationListener,
  ],
  exports: [NotificationService, NotificationSseService, PushService],
})
export class NotificationModule {}
