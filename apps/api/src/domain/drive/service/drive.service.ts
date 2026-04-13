import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Readable } from 'stream';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { drive_v3 } from 'googleapis';
import { DriveFileResponse, DriveFolderRegistration } from '@amb/types';
import { DriveFolderEntity } from '../entity/drive-folder.entity';
import { GoogleDriveService } from '../../../infrastructure/external/google-drive/google-drive.service';
import { RegisterFolderRequest } from '../dto/request/register-folder.request';
import { DriveMapper } from '../mapper/drive.mapper';
import { ERROR_CODE } from '../../../global/constant/error-code.constant';
import { DriveSettingsService } from '../../settings/service/drive-settings.service';

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);

  constructor(
    @InjectRepository(DriveFolderEntity)
    private readonly folderRepo: Repository<DriveFolderEntity>,
    private readonly googleDrive: GoogleDriveService,
    private readonly driveSettingsService: DriveSettingsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  isConfigured(): boolean {
    return this.googleDrive.isConfigured();
  }

  async listSharedDrives(entityId?: string): Promise<{ id: string; name: string }[]> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    try {
      const sharedDrives = await this.googleDrive.listSharedDrives();
      if (!entityId) {
        return sharedDrives;
      }

      const settings = await this.driveSettingsService.getSettings(entityId);
      // shared-drives는 엔티티의 직접(own) 설정 기준으로만 노출한다.
      if (settings.source !== 'own' || !settings.billingRootFolderId) {
        return [];
      }

      const driveId = await this.googleDrive.getDriveIdByFileId(settings.billingRootFolderId);
      if (!driveId) {
        return [];
      }

      return sharedDrives.filter((drive) => drive.id === driveId);
    } catch (error) {
      throw new BadRequestException(`${ERROR_CODE.DRIVE_API_ERROR.message}: ${error.message}`);
    }
  }

  async getRegisteredFolders(
    entityId?: string,
    ensureOwnSettingFolder = false,
  ): Promise<DriveFolderRegistration[]> {
    const where: any = {};
    if (entityId) {
      where.entId = entityId;
    }
    const entities = await this.folderRepo.find({
      where,
      order: { drfCreatedAt: 'ASC' },
    });
    const folders = entities.map(DriveMapper.toFolderRegistrationResponse);

    // Entity own drive setting should always be visible on /drive root,
    // even if amb_drive_folders registration is missing (e.g. historical constraint conflicts).
    if (entityId && ensureOwnSettingFolder) {
      const settings = await this.driveSettingsService.getSettings(entityId);
      if (settings.source === 'own' && settings.billingRootFolderId) {
        const exists = folders.some((folder) => folder.folderId === settings.billingRootFolderId);
        if (!exists) {
          folders.unshift({
            id: `settings-${entityId}-${settings.billingRootFolderId}`,
            folderId: settings.billingRootFolderId,
            folderName: settings.billingRootFolderName || 'Company Drive Folder',
            driveType: 'shared',
            description: null,
            createdAt: settings.updatedAt || new Date().toISOString(),
          });
        }
      }
    }

    return folders;
  }

  async registerFolder(dto: RegisterFolderRequest, userId: string): Promise<DriveFolderRegistration> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    const existing = await this.folderRepo.findOne({
      where: { drfFolderId: dto.folder_id },
    });
    if (existing) {
      throw new BadRequestException(ERROR_CODE.DRIVE_FOLDER_ALREADY_EXISTS.message);
    }

    // Validate folder exists in Google Drive
    try {
      await this.googleDrive.getFolderInfo(dto.folder_id);
    } catch {
      throw new BadRequestException(ERROR_CODE.DRIVE_FILE_NOT_FOUND.message);
    }

    const entity = this.folderRepo.create({
      drfFolderId: dto.folder_id,
      drfFolderName: dto.folder_name,
      drfDriveType: dto.drive_type,
      drfDescription: dto.description || undefined,
      drfCreatedBy: userId,
    } as DeepPartial<DriveFolderEntity>);

    const saved: DriveFolderEntity = await this.folderRepo.save(entity as DriveFolderEntity);
    return DriveMapper.toFolderRegistrationResponse(saved);
  }

  async unregisterFolder(id: string): Promise<void> {
    const entity = await this.folderRepo.findOne({ where: { drfId: id } });
    if (!entity) {
      throw new NotFoundException(ERROR_CODE.DRIVE_FOLDER_NOT_FOUND.message);
    }
    await this.folderRepo.softRemove(entity);
  }

  async listFiles(
    folderId: string,
    pageToken?: string,
    pageSize?: number,
  ): Promise<{ files: DriveFileResponse[]; nextPageToken?: string }> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    try {
      const result = await this.googleDrive.listFiles(folderId, pageToken, pageSize);
      return {
        files: result.files.map(DriveMapper.toFileResponse),
        nextPageToken: result.nextPageToken,
      };
    } catch (error) {
      throw new BadRequestException(`${ERROR_CODE.DRIVE_API_ERROR.message}: ${error.message}`);
    }
  }

  async getFileDetail(fileId: string): Promise<DriveFileResponse> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    try {
      const file = await this.googleDrive.getFile(fileId);
      return DriveMapper.toFileResponse(file);
    } catch {
      throw new NotFoundException(ERROR_CODE.DRIVE_FILE_NOT_FOUND.message);
    }
  }

  async downloadFile(fileId: string): Promise<{ stream: Readable; metadata: drive_v3.Schema$File }> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    try {
      const metadata = await this.googleDrive.getFile(fileId);
      const stream = await this.googleDrive.downloadFile(fileId);
      return { stream, metadata };
    } catch {
      throw new NotFoundException(ERROR_CODE.DRIVE_FILE_NOT_FOUND.message);
    }
  }

  async uploadFile(
    folderId: string,
    file: Express.Multer.File,
    userId: string,
    folderName?: string,
  ): Promise<{ fileId: string; name: string; mimeType: string; webViewLink: string; size: number }> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    // Multer/busboy decodes the filename parameter as latin1, corrupting UTF-8 Korean chars.
    // Re-decode latin1→UTF-8, then normalize NFD→NFC for macOS compatibility.
    const normalizedName = Buffer.from(file.originalname, 'latin1').toString('utf8').normalize('NFC');

    try {
      const result = await this.googleDrive.uploadFile(
        folderId,
        file.buffer,
        normalizedName,
        file.mimetype,
      );

      // Emit KMS event for auto-tagging
      this.eventEmitter.emit('module.data.created', {
        module: 'drive',
        type: 'DOC',
        refId: result.fileId,
        title: normalizedName,
        content: [normalizedName, folderName, file.mimetype].filter(Boolean).join(' '),
        ownerId: userId,
      });

      return result;
    } catch (error) {
      throw new BadRequestException(`${ERROR_CODE.DRIVE_API_ERROR.message}: ${error.message}`);
    }
  }

  async createSubfolder(
    parentFolderId: string,
    folderName: string,
  ): Promise<{ folderId: string; name: string }> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    try {
      const folderId = await this.googleDrive.createFolder(parentFolderId, folderName);
      return { folderId, name: folderName };
    } catch (error) {
      throw new BadRequestException(`${ERROR_CODE.DRIVE_API_ERROR.message}: ${error.message}`);
    }
  }

  async searchFiles(
    query: string,
    pageToken?: string,
  ): Promise<{ files: DriveFileResponse[]; nextPageToken?: string }> {
    if (!this.googleDrive.isConfigured()) {
      throw new BadRequestException(ERROR_CODE.DRIVE_NOT_CONFIGURED.message);
    }

    const folders = await this.folderRepo.find();
    if (folders.length === 0) {
      return { files: [] };
    }

    const folderIds = folders.map((f) => f.drfFolderId);

    try {
      const result = await this.googleDrive.searchFiles(folderIds, query, pageToken);
      return {
        files: result.files.map(DriveMapper.toFileResponse),
        nextPageToken: result.nextPageToken,
      };
    } catch (error) {
      throw new BadRequestException(`${ERROR_CODE.DRIVE_API_ERROR.message}: ${error.message}`);
    }
  }
}
