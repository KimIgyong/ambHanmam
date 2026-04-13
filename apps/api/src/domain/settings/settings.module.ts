import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeyEntity } from './entity/api-key.entity';
import { SmtpSettingsEntity } from './entity/smtp-settings.entity';
import { MenuPermissionEntity } from './entity/menu-permission.entity';
import { MenuConfigEntity } from './entity/menu-config.entity';
import { UserMenuPermissionEntity } from './entity/user-menu-permission.entity';
import { DriveSettingsEntity } from './entity/drive-settings.entity';
import { MenuCellPermissionEntity } from './entity/menu-group-permission.entity';
import { MenuUnitPermissionEntity } from './entity/menu-unit-permission.entity';
import { SiteSettingsEntity } from './entity/site-settings.entity';
import { EmailTemplateEntity } from './entity/email-template.entity';
import { HrEntityEntity } from '../hr/entity/hr-entity.entity';
import { DriveFolderEntity } from '../drive/entity/drive-folder.entity';
import { UserCellEntity } from '../members/entity/user-cell.entity';
import { UserEntity } from '../auth/entity/user.entity';
import { EntityMenuConfigEntity } from '../entity-settings/entity/entity-menu-config.entity';
import { ApiKeyService } from './service/api-key.service';
import { CryptoService } from './service/crypto.service';
import { SmtpSettingsService } from './service/smtp-settings.service';
import { MenuPermissionService } from './service/menu-permission.service';
import { MenuConfigService } from './service/menu-config.service';
import { UserMenuPermissionService } from './service/user-menu-permission.service';
import { DriveSettingsService } from './service/drive-settings.service';
import { MenuGroupPermissionService } from './service/menu-group-permission.service';
import { MenuUnitPermissionService } from './service/menu-unit-permission.service';
import { SiteSettingsService } from './service/site-settings.service';
import { EmailTemplateService } from './service/email-template.service';
import { ApiKeyController } from './controller/api-key.controller';
import { SmtpSettingsController } from './controller/smtp-settings.controller';
import { MenuPermissionController } from './controller/menu-permission.controller';
import { MenuConfigController } from './controller/menu-config.controller';
import { DriveSettingsController } from './controller/drive-settings.controller';
import { SiteSettingsController } from './controller/site-settings.controller';
import { SiteIndexPageController } from './controller/site-index-page.controller';
import { EmailTemplateController } from './controller/email-template.controller';
import { AiUsageAdminController } from './controller/ai-usage-admin.controller';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [
    AiUsageModule,
    TypeOrmModule.forFeature([
      ApiKeyEntity,
      SmtpSettingsEntity,
      MenuPermissionEntity,
      MenuConfigEntity,
      UserMenuPermissionEntity,
      DriveSettingsEntity,
      DriveFolderEntity,
      MenuCellPermissionEntity,
      MenuUnitPermissionEntity,
      UserCellEntity,
      UserEntity,
      EntityMenuConfigEntity,
      SiteSettingsEntity,
      HrEntityEntity,
      EmailTemplateEntity,
    ]),
  ],
  controllers: [
    ApiKeyController,
    SmtpSettingsController,
    MenuPermissionController,
    MenuConfigController,
    DriveSettingsController,
    SiteSettingsController,
    SiteIndexPageController,
    EmailTemplateController,
    AiUsageAdminController,
  ],
  providers: [
    ApiKeyService,
    CryptoService,
    SmtpSettingsService,
    MenuConfigService,
    UserMenuPermissionService,
    MenuPermissionService,
    DriveSettingsService,
    MenuGroupPermissionService,
    MenuUnitPermissionService,
    SiteSettingsService,
    EmailTemplateService,
  ],
  exports: [
    ApiKeyService,
    CryptoService,
    SmtpSettingsService,
    MenuPermissionService,
    MenuConfigService,
    UserMenuPermissionService,
    DriveSettingsService,
    MenuGroupPermissionService,
    MenuUnitPermissionService,
    SiteSettingsService,
    EmailTemplateService,
  ],
})
export class SettingsModule {}
