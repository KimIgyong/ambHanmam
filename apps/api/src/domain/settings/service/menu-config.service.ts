import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuConfigEntity } from '../entity/menu-config.entity';
import { UpdateMenuConfigRequest, PatchMenuConfigRequest } from '../dto/request/update-menu-config.request';
import { MenuConfigResponse } from '@amb/types';

const DEFAULT_MENU_CONFIGS: Array<{
  menuCode: string;
  labelKey: string;
  icon: string;
  path: string;
  category: string;
  sortOrder: number;
}> = [
  { menuCode: 'TODAY', labelKey: 'common:sidebar.today', icon: 'CalendarCheck', path: '/today', category: 'WORK_TOOL', sortOrder: 50 },
  { menuCode: 'TODO', labelKey: 'common:sidebar.todos', icon: 'CheckSquare', path: '/todos', category: 'WORK_TOOL', sortOrder: 100 },
  { menuCode: 'AGENTS', labelKey: 'common:sidebar.agents', icon: 'Bot', path: '/agents', category: 'WORK_TOOL', sortOrder: 200 },
  { menuCode: 'MEETING_NOTES', labelKey: 'common:sidebar.meetingNotes', icon: 'FileText', path: '/meeting-notes', category: 'WORK_TOOL', sortOrder: 300 },
  { menuCode: 'AMOEBA_TALK', labelKey: 'common:sidebar.amoebaTalk', icon: 'MessageCircle', path: '/amoeba-talk', category: 'WORK_TOOL', sortOrder: 400 },
  { menuCode: 'NOTICES', labelKey: 'common:sidebar.notices', icon: 'Megaphone', path: '/notices', category: 'WORK_TOOL', sortOrder: 600 },
  { menuCode: 'DRIVE', labelKey: 'common:sidebar.drive', icon: 'HardDrive', path: '/drive', category: 'WORK_TOOL', sortOrder: 700 },
  { menuCode: 'ISSUES', labelKey: 'common:sidebar.issues', icon: 'AlertCircle', path: '/issues', category: 'WORK_TOOL', sortOrder: 740 },
  { menuCode: 'PROJECT_MANAGEMENT', labelKey: 'common:sidebar.project', icon: 'Briefcase', path: '/project', category: 'WORK_TOOL', sortOrder: 750 },
  { menuCode: 'CALENDAR', labelKey: 'common:sidebar.calendar', icon: 'Calendar', path: '/calendar', category: 'WORK_TOOL', sortOrder: 760 },
  { menuCode: 'ATTENDANCE', labelKey: 'common:sidebar.attendance', icon: 'CalendarDays', path: '/attendance', category: 'WORK_TOOL', sortOrder: 770 },
  { menuCode: 'ACCOUNTING', labelKey: 'common:sidebar.accounting', icon: 'Landmark', path: '/accounting', category: 'MODULE', sortOrder: 800 },
  { menuCode: 'HR', labelKey: 'common:sidebar.hr', icon: 'Users', path: '/hr', category: 'MODULE', sortOrder: 900 },
  { menuCode: 'BILLING', labelKey: 'common:sidebar.billing', icon: 'Receipt', path: '/billing', category: 'MODULE', sortOrder: 1000 },
  { menuCode: 'MAIL', labelKey: 'common:sidebar.mail', icon: 'Mail', path: '/mail', category: 'MODULE', sortOrder: 1100 },
  { menuCode: 'KMS', labelKey: 'common:sidebar.kms', icon: 'Tags', path: '/kms', category: 'MODULE', sortOrder: 1300 },
  { menuCode: 'SERVICE_MANAGEMENT', labelKey: 'common:sidebar.serviceManagement', icon: 'Building2', path: '/service', category: 'MODULE', sortOrder: 1400 },
  { menuCode: 'ASSET_MANAGEMENT', labelKey: 'common:sidebar.assetManagement', icon: 'Package', path: '/assets', category: 'MODULE', sortOrder: 1600 },
  { menuCode: 'SITE_MANAGEMENT', labelKey: 'common:sidebar.siteManagement', icon: 'Globe', path: '/site', category: 'MODULE', sortOrder: 1700 },
  // SETTINGS
  { menuCode: 'SETTINGS_MEMBERS', labelKey: 'settings:nav.members', icon: 'Users', path: '/settings/members', category: 'SETTINGS', sortOrder: 2100 },
  { menuCode: 'SETTINGS_API_KEYS', labelKey: 'settings:nav.apiKeys', icon: 'Key', path: '/settings/api-keys', category: 'SETTINGS', sortOrder: 2200 },
  { menuCode: 'SETTINGS_SMTP', labelKey: 'settings:nav.smtp', icon: 'Mail', path: '/settings/smtp', category: 'SETTINGS', sortOrder: 2300 },
  { menuCode: 'SETTINGS_EMAIL_TEMPLATES', labelKey: 'settings:nav.emailTemplates', icon: 'Mail', path: '/admin/email-templates', category: 'SETTINGS', sortOrder: 2350 },
  { menuCode: 'SETTINGS_PERMISSIONS', labelKey: 'settings:nav.permissions', icon: 'Shield', path: '/settings/permissions', category: 'SETTINGS', sortOrder: 2400 },
  { menuCode: 'SETTINGS_DRIVE', labelKey: 'settings:nav.drive', icon: 'HardDrive', path: '/settings/drive', category: 'SETTINGS', sortOrder: 2500 },
  { menuCode: 'SETTINGS_ENTITIES', labelKey: 'settings:nav.entities', icon: 'Building', path: '/settings/entities', category: 'SETTINGS', sortOrder: 2600 },
  { menuCode: 'SETTINGS_CONVERSATIONS', labelKey: 'settings:nav.conversations', icon: 'MessageSquare', path: '/settings/conversations', category: 'SETTINGS', sortOrder: 2700 },
  { menuCode: 'SETTINGS_AGENTS', labelKey: 'settings:nav.agents', icon: 'Bot', path: '/settings/agents', category: 'SETTINGS', sortOrder: 2900 },
  { menuCode: 'SETTINGS_USER_MANAGEMENT', labelKey: 'settings:nav.userManagement', icon: 'Building2', path: '/settings/user-management', category: 'SETTINGS', sortOrder: 2050 },
  { menuCode: 'SETTINGS_AI_USAGE', labelKey: 'settings:nav.aiUsage', icon: 'BarChart3', path: '/settings/ai-usage', category: 'SETTINGS', sortOrder: 2950 },
  { menuCode: 'SETTINGS_SITE', labelKey: 'settings:nav.site', icon: 'Globe', path: '/settings/site-settings', category: 'SETTINGS', sortOrder: 3000 },
  { menuCode: 'SETTINGS_TOTAL_USERS', labelKey: 'settings:nav.totalUsers', icon: 'UsersRound', path: '/settings/total-users', category: 'SETTINGS', sortOrder: 3100 },
  { menuCode: 'SETTINGS_PORTAL_BRIDGE', labelKey: 'settings:nav.portalBridge', icon: 'Globe', path: '/settings/portal-bridge', category: 'SETTINGS', sortOrder: 3200 },
  // ENTITY SETTINGS (MASTER)
  { menuCode: 'ENTITY_MEMBERS', labelKey: 'entitySettings:members.title', icon: 'Users', path: '/entity-settings/members', category: 'ENTITY_SETTINGS', sortOrder: 4000 },
  { menuCode: 'ENTITY_ORGANIZATION', labelKey: 'entitySettings:organization.title', icon: 'Building2', path: '/entity-settings/organization', category: 'ENTITY_SETTINGS', sortOrder: 4050 },
  { menuCode: 'ENTITY_PERMISSIONS', labelKey: 'entitySettings:permissions.title', icon: 'Shield', path: '/entity-settings/permissions', category: 'ENTITY_SETTINGS', sortOrder: 4100 },
  { menuCode: 'ENTITY_API_KEYS', labelKey: 'entitySettings:apiKeys.title', icon: 'Key', path: '/entity-settings/api-keys', category: 'ENTITY_SETTINGS', sortOrder: 4200 },
  { menuCode: 'ENTITY_DRIVE', labelKey: 'entitySettings:drive.title', icon: 'HardDrive', path: '/entity-settings/drive', category: 'ENTITY_SETTINGS', sortOrder: 4300 },
  { menuCode: 'ENTITY_USAGE', labelKey: 'entitySettings:usage.title', icon: 'BarChart3', path: '/entity-settings/usage', category: 'ENTITY_SETTINGS', sortOrder: 4400 },
  { menuCode: 'ENTITY_WORK_STATISTICS', labelKey: 'entitySettings:workStatistics.title', icon: 'Activity', path: '/entity-settings/work-statistics', category: 'ENTITY_SETTINGS', sortOrder: 4500 },
  { menuCode: 'ENTITY_EMAIL_TEMPLATE', labelKey: 'entitySettings:emailTemplate.title', icon: 'Mail', path: '/entity-settings/email-templates', category: 'ENTITY_SETTINGS', sortOrder: 4550 },
  { menuCode: 'ENTITY_CLIENT_MANAGEMENT', labelKey: 'entitySettings:clients.title', icon: 'UserRoundPlus', path: '/entity-settings/clients', category: 'ENTITY_SETTINGS', sortOrder: 4060 },
];

@Injectable()
export class MenuConfigService implements OnModuleInit {
  private readonly logger = new Logger(MenuConfigService.name);

  constructor(
    @InjectRepository(MenuConfigEntity)
    private readonly configRepository: Repository<MenuConfigEntity>,
  ) {}

  async onModuleInit() {
    await this.initDefaults();
  }

  async findAll(): Promise<MenuConfigResponse[]> {
    const entities = await this.configRepository.find({
      order: { mcfSortOrder: 'ASC' },
    });
    return entities.map((e) => this.toResponse(e));
  }

  async findEnabledMenus(): Promise<MenuConfigEntity[]> {
    return this.configRepository.find({
      where: { mcfEnabled: true },
      order: { mcfSortOrder: 'ASC' },
    });
  }

  async bulkUpdate(dto: UpdateMenuConfigRequest, userId: string): Promise<MenuConfigResponse[]> {
    for (const config of dto.configs) {
      const existing = await this.configRepository.findOne({
        where: { mcfMenuCode: config.menu_code },
      });
      if (existing) {
        existing.mcfEnabled = config.enabled;
        existing.mcfSortOrder = config.sort_order;
        existing.mcfUpdatedBy = userId;
        await this.configRepository.save(existing);
      }
    }
    return this.findAll();
  }

  async patchOne(menuCode: string, dto: PatchMenuConfigRequest, userId: string): Promise<MenuConfigResponse | null> {
    const existing = await this.configRepository.findOne({
      where: { mcfMenuCode: menuCode },
    });
    if (!existing) return null;

    if (dto.enabled !== undefined) existing.mcfEnabled = dto.enabled;
    if (dto.sort_order !== undefined) existing.mcfSortOrder = dto.sort_order;
    existing.mcfUpdatedBy = userId;
    await this.configRepository.save(existing);
    return this.toResponse(existing);
  }

  private toResponse(e: MenuConfigEntity): MenuConfigResponse {
    return {
      id: e.mcfId,
      menuCode: e.mcfMenuCode,
      labelKey: e.mcfLabelKey,
      icon: e.mcfIcon,
      path: e.mcfPath,
      category: e.mcfCategory,
      enabled: e.mcfEnabled,
      sortOrder: e.mcfSortOrder,
      updatedAt: e.mcfUpdatedAt?.toISOString() || '',
    };
  }

  private async initDefaults(): Promise<void> {
    this.logger.log('Checking default menu configs...');
    let insertedCount = 0;

    for (const config of DEFAULT_MENU_CONFIGS) {
      const existing = await this.configRepository.findOne({
        where: { mcfMenuCode: config.menuCode },
      });
      if (!existing) {
        const entity = this.configRepository.create({
          mcfMenuCode: config.menuCode,
          mcfLabelKey: config.labelKey,
          mcfIcon: config.icon,
          mcfPath: config.path,
          mcfCategory: config.category,
          mcfEnabled: true,
          mcfSortOrder: config.sortOrder,
        });
        await this.configRepository.save(entity);
        insertedCount++;
      }
    }

    if (insertedCount > 0) {
      this.logger.log(`Inserted ${insertedCount} new default menu configs.`);
    }
  }
}
