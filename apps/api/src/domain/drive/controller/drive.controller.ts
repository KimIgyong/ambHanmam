import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Res,
  Headers,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { DriveService } from '../service/drive.service';
import { DriveSettingsService } from '../../settings/service/drive-settings.service';
import { StorageQuotaService } from '../../subscription/service/storage-quota.service';
import { RegisterFolderRequest } from '../dto/request/register-folder.request';
import { AdminGuard } from '../../settings/guard/admin.guard';
import { CurrentUser, UserPayload } from '../../../global/decorator/current-user.decorator';

@ApiTags('Drive')
@ApiBearerAuth()
@Controller('drive')
export class DriveController {
  private readonly logger = new Logger(DriveController.name);

  constructor(
    private readonly driveService: DriveService,
    private readonly driveSettingsService: DriveSettingsService,
    private readonly storageQuotaService: StorageQuotaService,
  ) {}

  private resolveEntityIdForDrive(entityIdFromHeader: string | undefined, user?: UserPayload) {
    // USER_LEVEL must always stay within JWT entity scope to prevent cross-entity access.
    if (user?.level === 'USER_LEVEL') {
      return user.entityId;
    }
    return entityIdFromHeader || user?.entityId;
  }

  @Get('status')
  async getStatus(
    @Headers('x-entity-id') entityId?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const effectiveEntityId = this.resolveEntityIdForDrive(entityId, user);

    // USER_LEVEL/엔티티 경로는 own-only 정책을 적용한다.
    if (effectiveEntityId) {
      const settings = await this.driveSettingsService.getEntityOwnSettings(effectiveEntityId);
      return {
        success: true,
        data: { configured: settings.configured },
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: true,
      data: { configured: this.driveService.isConfigured() },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('shared-drives')
  async listSharedDrives(
    @Headers('x-entity-id') entityId?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    const effectiveEntityId = this.resolveEntityIdForDrive(entityId, user);
    const data = await this.driveService.listSharedDrives(effectiveEntityId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('folders')
  async getRegisteredFolders(
    @Headers('x-entity-id') entityId?: string,
    @CurrentUser() user?: UserPayload,
  ) {
    // USER_LEVEL은 JWT entityId 고정, 그 외는 헤더 우선 + JWT fallback
    const effectiveEntityId = this.resolveEntityIdForDrive(entityId, user);
    const data = await this.driveService.getRegisteredFolders(
      effectiveEntityId,
      !!effectiveEntityId,
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('folders')
  @UseGuards(AdminGuard)
  async registerFolder(
    @Body() dto: RegisterFolderRequest,
    @CurrentUser() user: UserPayload,
  ) {
    const data = await this.driveService.registerFolder(dto, user.userId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Delete('folders/:id')
  @UseGuards(AdminGuard)
  async unregisterFolder(@Param('id') id: string) {
    await this.driveService.unregisterFolder(id);
    return {
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('files')
  async listFiles(
    @Query('folderId') folderId: string,
    @Query('pageToken') pageToken?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const data = await this.driveService.listFiles(
      folderId,
      pageToken,
      pageSize ? parseInt(pageSize, 10) : undefined,
    );
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('search')
  async searchFiles(
    @Query('q') query: string,
    @Query('pageToken') pageToken?: string,
  ) {
    const data = await this.driveService.searchFiles(query, pageToken);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('files/:fileId')
  async getFileDetail(@Param('fileId') fileId: string) {
    const data = await this.driveService.getFileDetail(fileId);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 50 * 1024 * 1024 } }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder_id') folderId: string,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') headerEntityId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    if (!folderId) {
      throw new BadRequestException('folder_id is required');
    }

    const entityId = this.resolveEntityIdForDrive(headerEntityId, user);

    // 구독 스토리지 쿼터 검사
    if (entityId) {
      try {
        await this.storageQuotaService.checkUpload(entityId, file.size);
      } catch {
        // 쿼터 레코드 미존재 시 무시 (구독 미가입 상태)
      }
    }

    const folderName = typeof folderId === 'string' ? undefined : undefined;
    const data = await this.driveService.uploadFile(folderId, file, user.userId, folderName);

    // 업로드 성공 후 사용량 기록
    if (entityId) {
      this.storageQuotaService
        .addUsage(entityId, file.size)
        .catch((e) => this.logger.warn(`Storage usage tracking failed: ${(e as Error).message}`));
    }

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('create-folder')
  @UseGuards(AdminGuard)
  async createSubfolder(
    @Body('parent_folder_id') parentFolderId: string,
    @Body('folder_name') folderName: string,
  ) {
    if (!parentFolderId) {
      throw new BadRequestException('parent_folder_id is required');
    }
    if (!folderName || !folderName.trim()) {
      throw new BadRequestException('folder_name is required');
    }
    const data = await this.driveService.createSubfolder(parentFolderId, folderName.trim());
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('files/:fileId/download')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const { stream, metadata } = await this.driveService.downloadFile(fileId);
    const fileName = (metadata.name || 'download').normalize('NFC');
    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    stream.pipe(res);
  }

  @Get('files/:fileId/view')
  async viewFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const { stream, metadata } = await this.driveService.downloadFile(fileId);
    res.setHeader('Content-Type', metadata.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    stream.pipe(res);
  }
}
