import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DriveSettingsEntity } from '../entity/drive-settings.entity';
import { DriveFolderEntity } from '../../drive/entity/drive-folder.entity';
import { HrEntityEntity } from '../../hr/entity/hr-entity.entity';
import { UpdateDriveSettingsRequest } from '../dto/request/update-drive-settings.request';
import { GoogleDriveService } from '../../../infrastructure/external/google-drive/google-drive.service';

export type DriveSettingsSource = 'own' | 'inherited' | 'global' | 'none';

export interface DriveSettingsResponse {
  configured: boolean;
  source: DriveSettingsSource;
  sourceEntityCode?: string;
  impersonateEmail: string | null;
  billingRootFolderId: string | null;
  billingRootFolderName: string | null;
  updatedAt: string | null;
}

@Injectable()
export class DriveSettingsService implements OnModuleInit {
  private readonly logger = new Logger(DriveSettingsService.name);

  constructor(
    @InjectRepository(DriveSettingsEntity)
    private readonly driveSettingsRepo: Repository<DriveSettingsEntity>,
    @InjectRepository(DriveFolderEntity)
    private readonly driveFolderRepo: Repository<DriveFolderEntity>,
    @InjectRepository(HrEntityEntity)
    private readonly hrEntityRepo: Repository<HrEntityEntity>,
    private readonly configService: ConfigService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  async onModuleInit() {
    // On startup, if DB has a saved impersonate email, reinitialize GoogleDriveService with it
    try {
      const entity = await this.driveSettingsRepo.findOne({ where: { entId: IsNull() } });
      if (entity?.drsImpersonateEmail) {
        const currentEmail = this.googleDriveService.getImpersonateEmail();
        if (entity.drsImpersonateEmail !== currentEmail) {
          this.googleDriveService.reinitialize(entity.drsImpersonateEmail);
          this.logger.log(`Reinitialized Google Drive with DB-stored email: ${entity.drsImpersonateEmail}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to load DB drive settings on init: ${error.message}`);
    }
  }

  async getSettings(entityId?: string): Promise<DriveSettingsResponse> {
    if (entityId) {
      // 1) 법인 자체 설정 확인
      const own = await this.driveSettingsRepo.findOne({ where: { entId: entityId } });
      if (own?.drsImpersonateEmail) {
        return this.toResponse(own, 'own');
      }

      // 2) 상위 법인(HQ) 설정 fallback
      const hrEntity = await this.hrEntityRepo.findOne({ where: { entId: entityId } });
      if (hrEntity?.entParentId) {
        const parent = await this.driveSettingsRepo.findOne({
          where: { entId: hrEntity.entParentId },
        });
        if (parent?.drsImpersonateEmail) {
          const parentEntity = await this.hrEntityRepo.findOne({ where: { entId: hrEntity.entParentId } });
          return this.toResponse(parent, 'inherited', parentEntity?.entCode);
        }
      }

      // 3) 전역 설정 fallback
      const global = await this.driveSettingsRepo.findOne({ where: { entId: IsNull() } });
      if (global?.drsImpersonateEmail) {
        return this.toResponse(global, 'global');
      }

      return {
        configured: false,
        source: 'none',
        impersonateEmail: null,
        billingRootFolderId: null,
        billingRootFolderName: null,
        updatedAt: null,
      };
    }

    // 전역 설정 조회 (admin용)
    const entity = await this.driveSettingsRepo.findOne({ where: { entId: IsNull() } });
    const fallbackEmail = this.configService.get<string>('GOOGLE_DRIVE_IMPERSONATE_EMAIL') ?? null;
    const fallbackFolderId = this.configService.get<string>('GOOGLE_DRIVE_BILLING_ROOT_FOLDER_ID') ?? null;

    return {
      configured: this.googleDriveService.isConfigured(),
      source: 'own' as const,
      impersonateEmail: entity?.drsImpersonateEmail || fallbackEmail,
      billingRootFolderId: entity?.drsBillingRootFolderId || fallbackFolderId,
      billingRootFolderName: entity?.drsBillingRootFolderName || null,
      updatedAt: entity?.drsUpdatedAt?.toISOString() ?? null,
    };
  }

  /**
   * Entity settings endpoint 전용 조회: own 설정만 반환하고 fallback(inherited/global)은 허용하지 않는다.
   */
  async getEntityOwnSettings(entityId: string): Promise<DriveSettingsResponse> {
    const own = await this.driveSettingsRepo.findOne({ where: { entId: entityId } });
    if (!own) {
      return {
        configured: false,
        source: 'none',
        impersonateEmail: null,
        billingRootFolderId: null,
        billingRootFolderName: null,
        updatedAt: null,
      };
    }

    return this.toResponse(own, 'own');
  }

  private toResponse(
    entity: DriveSettingsEntity,
    source: DriveSettingsSource,
    sourceEntityCode?: string,
  ): DriveSettingsResponse {
    return {
      configured: !!(entity.drsImpersonateEmail && entity.drsBillingRootFolderId),
      source,
      sourceEntityCode,
      impersonateEmail: entity.drsImpersonateEmail ?? null,
      billingRootFolderId: entity.drsBillingRootFolderId ?? null,
      billingRootFolderName: entity.drsBillingRootFolderName ?? null,
      updatedAt: entity.drsUpdatedAt?.toISOString() ?? null,
    };
  }

  async updateSettings(
    dto: UpdateDriveSettingsRequest,
    userId: string,
    entityId?: string,
  ): Promise<DriveSettingsResponse> {
    const where = entityId ? { entId: entityId } : { entId: IsNull() };
    let entity = await this.driveSettingsRepo.findOne({ where });

    if (!entity) {
      entity = this.driveSettingsRepo.create();
      if (entityId) entity.entId = entityId;
    }

    if (dto.impersonate_email !== undefined) {
      entity.drsImpersonateEmail = dto.impersonate_email || (null as any);
    }
    if (dto.billing_root_folder_id !== undefined) {
      entity.drsBillingRootFolderId = dto.billing_root_folder_id || (null as any);
    }
    if (dto.billing_root_folder_name !== undefined) {
      entity.drsBillingRootFolderName = dto.billing_root_folder_name || (null as any);
    }
    entity.drsUpdatedBy = userId;

    const saved = await this.driveSettingsRepo.save(entity);

    // Reinitialize GoogleDriveService (전역 설정일 때만)
    if (!entityId) {
      const impersonateEmail = saved.drsImpersonateEmail
        || this.configService.get<string>('GOOGLE_DRIVE_IMPERSONATE_EMAIL');
      if (impersonateEmail !== this.googleDriveService.getImpersonateEmail()) {
        this.googleDriveService.reinitialize(impersonateEmail);
      }
    }

    // Auto-register company folder to amb_drive_folders
    if (saved.drsBillingRootFolderId && saved.drsBillingRootFolderName) {
      await this.autoRegisterCompanyFolder(
        saved.drsBillingRootFolderId,
        saved.drsBillingRootFolderName,
        userId,
        entityId,
      );
    }

    return {
      configured: entityId
        ? !!(saved.drsImpersonateEmail && saved.drsBillingRootFolderId)
        : this.googleDriveService.isConfigured(),
      source: 'own',
      impersonateEmail: saved.drsImpersonateEmail,
      billingRootFolderId: saved.drsBillingRootFolderId,
      billingRootFolderName: saved.drsBillingRootFolderName,
      updatedAt: saved.drsUpdatedAt?.toISOString() ?? null,
    };
  }

  async testConnection(): Promise<{ success: boolean; message: string; folderName?: string }> {
    if (!this.googleDriveService.isConfigured()) {
      return { success: false, message: 'Google Drive service is not configured. Check GOOGLE_SERVICE_ACCOUNT_KEY_PATH.' };
    }

    const settings = await this.getSettings();

    try {
      // Test basic Drive access
      if (settings.billingRootFolderId) {
        const folder = await this.googleDriveService.getFolderInfo(settings.billingRootFolderId);
        return {
          success: true,
          message: `Connected successfully. Folder: ${folder.name}`,
          folderName: folder.name ?? undefined,
        };
      }

      return { success: true, message: 'Google Drive API connection successful. No billing root folder configured.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Drive connection test failed: ${message}`);
      return { success: false, message: `Connection failed: ${message}` };
    }
  }

  async testConnectionForEntity(entityId: string): Promise<{ success: boolean; message: string; folderName?: string }> {
    if (!this.googleDriveService.isConfigured()) {
      return { success: false, message: 'Google Drive service is not configured.' };
    }

    const settings = await this.getEntityOwnSettings(entityId);
    if (!settings.configured) {
      return { success: false, message: 'Drive settings not configured for this entity.' };
    }

    try {
      if (settings.billingRootFolderId) {
        const folder = await this.googleDriveService.getFolderInfo(settings.billingRootFolderId);
        return {
          success: true,
          message: `Connected successfully. Folder: ${folder.name}`,
          folderName: folder.name ?? undefined,
        };
      }
      return { success: true, message: 'Google Drive API connection successful.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Drive connection test failed for entity ${entityId}: ${message}`);
      return { success: false, message: `Connection failed: ${message}` };
    }
  }

  async deleteEntitySettings(entityId: string): Promise<DriveSettingsResponse> {
    const entity = await this.driveSettingsRepo.findOne({ where: { entId: entityId } });
    if (entity) {
      await this.driveSettingsRepo.remove(entity);
      this.logger.log(`Deleted drive settings for entity ${entityId}`);
    }

    const folders = await this.driveFolderRepo.find({ where: { entId: entityId } });
    if (folders.length > 0) {
      await this.driveFolderRepo.softRemove(folders);
      this.logger.log(`Deleted ${folders.length} drive folder registrations for entity ${entityId}`);
    }

    // Entity endpoint 정책상 own-only를 반환
    return this.getEntityOwnSettings(entityId);
  }

  async listSharedDrives(): Promise<{ id: string; name: string }[]> {
    if (!this.googleDriveService.isConfigured()) {
      throw new Error('Google Drive service is not configured');
    }
    return this.googleDriveService.listSharedDrives();
  }

  async listFolders(parentId: string): Promise<{ id: string; name: string }[]> {
    if (!this.googleDriveService.isConfigured()) {
      throw new Error('Google Drive service is not configured');
    }

    const result = await this.googleDriveService.listFiles(parentId, undefined, 100);
    return result.files
      .filter((f): f is typeof f & { id: string; name: string } =>
        f.mimeType === 'application/vnd.google-apps.folder' && !!f.id && !!f.name)
      .map((f) => ({ id: f.id, name: f.name }));
  }

  async getBillingRootFolderId(): Promise<string | null> {
    const entity = await this.driveSettingsRepo.findOne({ where: { entId: IsNull() } });
    return entity?.drsBillingRootFolderId
      || (this.configService.get<string>('GOOGLE_DRIVE_BILLING_ROOT_FOLDER_ID') ?? null);
  }

  private async autoRegisterCompanyFolder(
    folderId: string,
    folderName: string,
    userId: string,
    entityId?: string,
  ): Promise<void> {
    try {
      // Check if already registered (active) for this entity
      const whereCondition: any = { drfFolderId: folderId, drfDeletedAt: IsNull() };
      if (entityId) whereCondition.entId = entityId;
      else whereCondition.entId = IsNull();

      const existing = await this.driveFolderRepo.findOne({
        where: whereCondition,
      });
      if (existing) return;

      // Check if soft-deleted record exists → restore
      const qb = this.driveFolderRepo
        .createQueryBuilder('f')
        .withDeleted()
        .where('f.drfFolderId = :folderId', { folderId })
        .andWhere('f.drfDeletedAt IS NOT NULL');
      if (entityId) qb.andWhere('f.entId = :entityId', { entityId });
      else qb.andWhere('f.entId IS NULL');

      const deleted = await qb.getOne();

      if (deleted) {
        deleted.drfDeletedAt = null as any;
        deleted.drfFolderName = folderName;
        await this.driveFolderRepo.save(deleted);
        this.logger.log(`Restored company folder registration: ${folderName} (${folderId})`);
        return;
      }

      // New registration
      await this.driveFolderRepo.save(
        this.driveFolderRepo.create({
          drfFolderId: folderId,
          drfFolderName: folderName,
          drfDriveType: 'shared',
          drfCreatedBy: userId,
          entId: entityId || null,
        }),
      );
      this.logger.log(`Auto-registered company folder: ${folderName} (${folderId}) entity=${entityId || 'global'}`);
    } catch (error) {
      this.logger.warn(`Failed to auto-register company folder: ${(error as Error).message}`);
    }
  }
}
