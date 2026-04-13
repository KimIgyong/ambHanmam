import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkItemEntity } from './entity/work-item.entity';
import { WorkItemShareEntity } from './entity/work-item-share.entity';
import { WorkItemCommentEntity } from './entity/work-item-comment.entity';
import { AccessAuditLogEntity } from './entity/access-audit-log.entity';
import { DataAuditLogEntity } from './entity/data-audit-log.entity';
import { AccessControlService } from './service/access-control.service';
import { WorkItemService } from './service/work-item.service';
import { SharingService } from './service/sharing.service';
import { CommentService } from './service/comment.service';
import { AuditService } from './service/audit.service';
import { DataAuditSubscriber } from './subscriber/data-audit.subscriber';
import { WorkItemController } from './controller/work-item.controller';
import { SharingController } from './controller/sharing.controller';
import { CommentController } from './controller/comment.controller';
import { AccessControlGuard } from './guard/access-control.guard';
import { UnitModule } from '../unit/unit.module';
import { HrModule } from '../hr/hr.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkItemEntity, WorkItemShareEntity, WorkItemCommentEntity, AccessAuditLogEntity, DataAuditLogEntity]),
    UnitModule,
    HrModule,
    MembersModule,
  ],
  controllers: [WorkItemController, SharingController, CommentController],
  providers: [AccessControlService, WorkItemService, SharingService, CommentService, AuditService, DataAuditSubscriber, AccessControlGuard],
  exports: [AccessControlService, WorkItemService, SharingService, CommentService, AuditService],
})
export class AclModule {}
