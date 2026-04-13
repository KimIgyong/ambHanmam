import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolarController } from './controller/polar.controller';
import { PolarService } from './service/polar.service';
import { PolarWebhookEventEntity } from './entity/polar-webhook-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PolarWebhookEventEntity])],
  controllers: [PolarController],
  providers: [PolarService],
  exports: [PolarService],
})
export class PolarModule {}
