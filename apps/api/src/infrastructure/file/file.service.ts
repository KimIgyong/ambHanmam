import {
  Injectable,
  OnModuleInit,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { join } from 'path';
import { existsSync, mkdirSync, unlinkSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { ERROR_CODE } from '../../global/constant/error-code.constant';

export interface SavedFileInfo {
  storedName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
}

const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Archives & text
  'application/zip',
  'application/x-zip-compressed',
  'text/plain',
  'text/csv',
  'text/markdown',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable()
export class FileService implements OnModuleInit {
  private readonly uploadsDir = join(process.cwd(), 'uploads');
  private readonly logger = new Logger(FileService.name);

  onModuleInit(): void {
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File): Promise<SavedFileInfo> {
    // Multer/busboy decodes filename as latin1, corrupting UTF-8 chars (Korean, Vietnamese, etc.)
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8').normalize('NFC');

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(ERROR_CODE.NOTICE_FILE_TOO_LARGE.message);
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(ERROR_CODE.NOTICE_FILE_TYPE_NOT_ALLOWED.message);
    }

    // Magic byte validation — verify actual file content matches claimed MIME type
    try {
      const ftModule = await (Function('return import("file-type")')() as Promise<{ fileTypeFromBuffer: (buf: Buffer) => Promise<{ ext: string; mime: string } | undefined> }>);
      const detected = await ftModule.fileTypeFromBuffer(file.buffer);
      if (detected && !ALLOWED_MIME_TYPES.includes(detected.mime)) {
        this.logger.warn(`File magic byte mismatch: claimed=${file.mimetype}, detected=${detected.mime}, name=${originalName}`);
        throw new BadRequestException('File content does not match allowed types');
      }
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      // file-type may not detect text/csv/markdown — allow through
    }

    const ext = extname(originalName);
    const storedName = `${uuidv4()}${ext}`;
    const filePath = join(this.uploadsDir, storedName);

    await writeFile(filePath, file.buffer);

    return {
      storedName,
      originalName,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  deleteFile(storedName: string): void {
    const filePath = join(this.uploadsDir, storedName);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  }

  getFilePath(storedName: string): string {
    return join(this.uploadsDir, storedName);
  }
}
