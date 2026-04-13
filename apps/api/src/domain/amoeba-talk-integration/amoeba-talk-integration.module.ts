import { Module } from '@nestjs/common';
import { AmoebaTalkIntegrationController } from './amoeba-talk-integration.controller';
import { AmoebaTalkIntegrationService } from './amoeba-talk-integration.service';

@Module({
  controllers: [AmoebaTalkIntegrationController],
  providers: [AmoebaTalkIntegrationService],
  exports: [AmoebaTalkIntegrationService],
})
export class AmoebaTalkIntegrationModule {}
