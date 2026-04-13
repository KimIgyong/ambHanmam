import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrModule } from '../hr/hr.module';
import { TodoModule } from '../todo/todo.module';
import { AssetEntity } from './entity/asset.entity';
import { AssetRequestEntity } from './entity/asset-request.entity';
import { MeetingReservationEntity } from './entity/meeting-reservation.entity';
import { AssetApprovalHistoryEntity } from './entity/asset-approval-history.entity';
import { AssetChangeLogEntity } from './entity/asset-change-log.entity';
import { AssetRequestLogEntity } from './entity/asset-request-log.entity';
import { AssetService } from './service/asset.service';
import { AssetController } from './controller/asset.controller';
import { AssetRequestService } from './service/asset-request.service';
import { AssetAutomationService } from './service/asset-automation.service';
import { AssetRequestController } from './controller/asset-request.controller';
import { UserEntity } from '../auth/entity/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetEntity,
      AssetRequestEntity,
      MeetingReservationEntity,
      AssetApprovalHistoryEntity,
      AssetChangeLogEntity,
      AssetRequestLogEntity,
      UserEntity,
    ]),
    HrModule,
    TodoModule,
  ],
  controllers: [AssetController, AssetRequestController],
  providers: [AssetService, AssetRequestService, AssetAutomationService],
  exports: [AssetService, AssetRequestService],
})
export class AssetModule {}
