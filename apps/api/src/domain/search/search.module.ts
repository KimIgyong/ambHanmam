import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkItemEntity } from '../acl/entity/work-item.entity';
import { KmsWorkItemTagEntity } from '../kms/entity/kms-work-item-tag.entity';
import { KmsTagEntity } from '../kms/entity/kms-tag.entity';
import { SearchService } from './service/search.service';
import { SearchController } from './controller/search.controller';
import { HrModule } from '../hr/hr.module';
import { MembersModule } from '../members/members.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkItemEntity, KmsWorkItemTagEntity, KmsTagEntity]),
    HrModule,
    MembersModule,
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
