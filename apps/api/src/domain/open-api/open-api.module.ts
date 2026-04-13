import { Module } from '@nestjs/common';
import { OAuthModule } from '../oauth/oauth.module';
import { AssetModule } from '../asset/asset.module';
import { IssuesModule } from '../issues/issues.module';
import { ProjectModule } from '../project/project.module';
import { UnitModule } from '../unit/unit.module';
import { HrModule } from '../hr/hr.module';
import { MembersModule } from '../members/members.module';
import { OpenAssetController } from './controller/open-asset.controller';
import { OpenIssueController } from './controller/open-issue.controller';
import { OpenProjectController } from './controller/open-project.controller';
import { OpenUnitController } from './controller/open-unit.controller';
import { OpenUserController } from './controller/open-user.controller';
import { OpenEntityController } from './controller/open-entity.controller';
import { OpenApiLogInterceptor } from './interceptor/open-api-log.interceptor';

@Module({
  imports: [
    OAuthModule,
    AssetModule,
    IssuesModule,
    ProjectModule,
    UnitModule,
    HrModule,
    MembersModule,
  ],
  controllers: [
    OpenAssetController,
    OpenIssueController,
    OpenProjectController,
    OpenUnitController,
    OpenUserController,
    OpenEntityController,
  ],
  providers: [OpenApiLogInterceptor],
})
export class OpenApiModule {}
