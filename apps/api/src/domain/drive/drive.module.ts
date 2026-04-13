import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriveFolderEntity } from './entity/drive-folder.entity';
import { DriveController } from './controller/drive.controller';
import { DriveService } from './service/drive.service';
import { SettingsModule } from '../settings/settings.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriveFolderEntity]),
    SettingsModule,
    SubscriptionModule,
  ],
  controllers: [DriveController],
  providers: [DriveService],
})
export class DriveModule {}
