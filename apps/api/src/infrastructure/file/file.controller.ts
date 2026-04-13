import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Headers,
  Res,
  NotFoundException,
  BadRequestException,
  UploadedFile,
  UseInterceptors,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { existsSync } from 'fs';
import { extname } from 'path';
import { FileService } from './file.service';
import { StorageQuotaService } from '../../domain/subscription/service/storage-quota.service';
import { CurrentUser, UserPayload } from '../../global/decorator/current-user.decorator';
import { Public } from '../../global/decorator/public.decorator';

function isImageFilename(filename: string): boolean {
  return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(
    extname(filename).toLowerCase(),
  );
}

function buildMissingImagePlaceholder(filename: string): string {
  const label = extname(filename).replace('.', '').toUpperCase() || 'FILE';
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240" role="img" aria-label="Image unavailable">
      <rect width="320" height="240" fill="#f3f4f6"/>
      <rect x="24" y="24" width="272" height="192" rx="16" fill="#e5e7eb" stroke="#d1d5db"/>
      <circle cx="110" cy="98" r="18" fill="#cbd5e1"/>
      <path d="M72 176l42-42 28 28 38-46 68 60H72z" fill="#94a3b8"/>
      <text x="160" y="204" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#6b7280">Image unavailable</text>
      <text x="160" y="224" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#9ca3af">${label}</text>
    </svg>
  `.trim();
}

/** URL 인코딩 우회를 포함한 파일명 검증 */
function validateFilename(filename: string): string {
  // URL 인코딩 디코딩 후 재검증 (%2e%2e, %2f 등 우회 방어)
  let decoded: string;
  try {
    decoded = decodeURIComponent(filename);
  } catch {
    throw new BadRequestException('Invalid filename encoding.');
  }
  // null byte 차단
  if (decoded.includes('\0') || filename.includes('\0')) {
    throw new BadRequestException('Invalid filename.');
  }
  // 경로 순회 차단 (디코딩 전후 모두)
  for (const name of [filename, decoded]) {
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
      throw new BadRequestException('Invalid filename.');
    }
  }
  return decoded;
}

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FileController {
  private readonly logger = new Logger(FileController.name);

  constructor(
    private readonly fileService: FileService,
    private readonly storageQuotaService: StorageQuotaService,
  ) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: UserPayload,
    @Headers('x-entity-id') headerEntityId?: string,
  ) {
    const entityId = headerEntityId ?? user?.entityId;

    // 구독 스토리지 쿼터 검사 (entId가 있는 경우만)
    if (entityId) {
      try {
        await this.storageQuotaService.checkUpload(entityId, file.size);
      } catch {
        // 쿼터 레코드가 아직 없으면 무시 (FREE 플랜 미가입 상태)
      }
    }

    const saved = await this.fileService.saveFile(file);

    // 업로드 성공 후 사용량 기록
    if (entityId) {
      this.storageQuotaService
        .addUsage(entityId, file.size)
        .catch((e) => this.logger.warn(`Storage usage tracking failed: ${e.message}`));
    }

    return {
      success: true,
      data: saved,
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':filename/download')
  downloadFile(
    @Param('filename') filename: string,
    @Query('name') originalName: string | undefined,
    @Res() res: Response,
  ): void {
    const safeFilename = validateFilename(filename);

    const filePath = this.fileService.getFilePath(safeFilename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('File not found.');
    }

    // originalName도 경로 문자 제거
    const downloadName = originalName
      ? originalName.replace(/[/\\]/g, '_')
      : safeFilename;
    res.download(filePath, downloadName);
  }

  @Public()
  @Get(':filename')
  serveFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): void {
    const safeFilename = validateFilename(filename);

    const filePath = this.fileService.getFilePath(safeFilename);

    if (!existsSync(filePath)) {
      if (isImageFilename(safeFilename)) {
        res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
        res.setHeader('Cache-Control', 'public, max-age=300');
        res.status(200).send(buildMissingImagePlaceholder(safeFilename));
        return;
      }
      throw new NotFoundException('File not found.');
    }

    res.sendFile(filePath);
  }
}
