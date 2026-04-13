import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';

const FIELDS = 'nextPageToken, files(id, name, mimeType, size, iconLink, thumbnailLink, webViewLink, modifiedTime, createdTime, owners, parents)';
const FILE_FIELDS = 'id, name, mimeType, size, iconLink, thumbnailLink, webViewLink, modifiedTime, createdTime, owners, parents';

export interface DriveUploadResult {
  fileId: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  size: number;
}

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive | null = null;
  private readonly logger = new Logger(GoogleDriveService.name);
  private currentImpersonateEmail: string | null = null;

  constructor(private readonly configService: ConfigService) {
    this.initialize();
  }

  private getAuthConfig(): { keyFile?: string; credentials?: Record<string, unknown> } | null {
    const keyPath = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_PATH');
    if (keyPath) return { keyFile: keyPath };

    const keyJson = this.configService.get<string>('GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
    if (keyJson) {
      try {
        return { credentials: JSON.parse(keyJson) };
      } catch {
        try {
          return { credentials: JSON.parse(Buffer.from(keyJson, 'base64').toString()) };
        } catch {
          this.logger.warn('Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
          return null;
        }
      }
    }
    return null;
  }

  private initialize(): void {
    const authConfig = this.getAuthConfig();
    if (!authConfig) {
      this.logger.warn('Google Drive not configured: Set GOOGLE_SERVICE_ACCOUNT_KEY_PATH or GOOGLE_SERVICE_ACCOUNT_KEY_JSON');
      return;
    }

    try {
      const impersonateEmail = this.configService.get<string>('GOOGLE_DRIVE_IMPERSONATE_EMAIL');
      this.initDriveClient(authConfig, impersonateEmail);
    } catch (error) {
      this.logger.warn(`Google Drive initialization failed: ${error.message}`);
    }
  }

  private initDriveClient(
    authConfig: { keyFile?: string; credentials?: Record<string, unknown> },
    impersonateEmail?: string,
  ): void {
    const auth = new google.auth.GoogleAuth({
      ...authConfig,
      scopes: ['https://www.googleapis.com/auth/drive'],
      ...(impersonateEmail ? { clientOptions: { subject: impersonateEmail } } : {}),
    });
    this.drive = google.drive({ version: 'v3', auth });
    this.currentImpersonateEmail = impersonateEmail || null;
    const mode = impersonateEmail ? `(impersonating ${impersonateEmail})` : '(service account direct)';
    this.logger.log(`Google Drive service initialized successfully ${mode}`);
  }

  reinitialize(impersonateEmail?: string): void {
    const authConfig = this.getAuthConfig();
    if (!authConfig) {
      this.logger.warn('Cannot reinitialize: No Google service account credentials available');
      return;
    }

    try {
      this.initDriveClient(authConfig, impersonateEmail);
    } catch (error) {
      this.logger.warn(`Google Drive reinitialization failed: ${error.message}`);
    }
  }

  getImpersonateEmail(): string | null {
    return this.currentImpersonateEmail;
  }

  isConfigured(): boolean {
    return this.drive !== null;
  }

  async listSharedDrives(): Promise<{ id: string; name: string }[]> {
    const drive = this.ensureConfigured();

    const result: { id: string; name: string }[] = [];
    let pageToken: string | undefined;

    do {
      const res = await drive.drives.list({
        pageSize: 100,
        pageToken,
        fields: 'nextPageToken, drives(id, name)',
      });

      if (res.data.drives) {
        for (const d of res.data.drives) {
          result.push({ id: d.id ?? '', name: d.name ?? '' });
        }
      }
      pageToken = res.data.nextPageToken || undefined;
    } while (pageToken);

    return result;
  }

  async listFiles(
    folderId: string,
    pageToken?: string,
    pageSize = 20,
  ): Promise<{ files: drive_v3.Schema$File[]; nextPageToken?: string }> {
    const drive = this.ensureConfigured();

    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: FIELDS,
      pageSize,
      pageToken: pageToken || undefined,
      orderBy: 'folder, name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return {
      files: res.data.files || [],
      nextPageToken: res.data.nextPageToken || undefined,
    };
  }

  async getFile(fileId: string): Promise<drive_v3.Schema$File> {
    const drive = this.ensureConfigured();

    const res = await drive.files.get({
      fileId,
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });

    return res.data;
  }

  async downloadFile(fileId: string): Promise<Readable> {
    const drive = this.ensureConfigured();

    const res = await drive.files.get(
      { fileId, alt: 'media', supportsAllDrives: true },
      { responseType: 'stream' },
    );

    return res.data as unknown as Readable;
  }

  async searchFiles(
    folderIds: string[],
    query: string,
    pageToken?: string,
    pageSize = 20,
  ): Promise<{ files: drive_v3.Schema$File[]; nextPageToken?: string }> {
    const drive = this.ensureConfigured();

    const parentConditions = folderIds.map((id) => `'${id}' in parents`).join(' or ');
    const q = `fullText contains '${query.replace(/'/g, "\\'")}' and (${parentConditions}) and trashed = false`;

    const res = await drive.files.list({
      q,
      fields: FIELDS,
      pageSize,
      pageToken: pageToken || undefined,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return {
      files: res.data.files || [],
      nextPageToken: res.data.nextPageToken || undefined,
    };
  }

  async getFolderInfo(folderId: string): Promise<drive_v3.Schema$File> {
    const drive = this.ensureConfigured();

    const res = await drive.files.get({
      fileId: folderId,
      fields: FILE_FIELDS,
      supportsAllDrives: true,
    });

    return res.data;
  }

  async getDriveIdByFileId(fileId: string): Promise<string | null> {
    const drive = this.ensureConfigured();

    const res = await drive.files.get({
      fileId,
      fields: 'driveId',
      supportsAllDrives: true,
    });

    return res.data.driveId || null;
  }

  // ── Write Operations (Billing module) ────────────────────────

  async createFolder(parentFolderId: string, folderName: string): Promise<string> {
    const drive = this.ensureConfigured();

    const res = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
      supportsAllDrives: true,
    });

    this.logger.log(`Created folder "${folderName}" (${res.data.id}) in ${parentFolderId}`);
    return res.data.id!;
  }

  async uploadFile(
    folderId: string,
    buffer: Buffer,
    filename: string,
    mimeType: string,
  ): Promise<DriveUploadResult> {
    const drive = this.ensureConfigured();

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    const res = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [folderId],
      },
      media: {
        mimeType,
        body: readable,
      },
      fields: 'id, name, mimeType, webViewLink, size',
      supportsAllDrives: true,
    });

    this.logger.log(`Uploaded file "${filename}" (${res.data.id}) to folder ${folderId}`);
    return {
      fileId: res.data.id ?? '',
      name: res.data.name ?? '',
      mimeType: res.data.mimeType ?? '',
      webViewLink: res.data.webViewLink || '',
      size: Number(res.data.size) || 0,
    };
  }

  async deleteFile(fileId: string): Promise<void> {
    const drive = this.ensureConfigured();

    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });

    this.logger.log(`Deleted file ${fileId}`);
  }

  async findFolder(parentFolderId: string, folderName: string): Promise<string | null> {
    const drive = this.ensureConfigured();

    const res = await drive.files.list({
      q: `'${parentFolderId}' in parents and name = '${folderName.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id)',
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    return res.data.files?.[0]?.id || null;
  }

  async ensureFolder(parentFolderId: string, folderName: string): Promise<string> {
    const existing = await this.findFolder(parentFolderId, folderName);
    if (existing) return existing;
    return this.createFolder(parentFolderId, folderName);
  }

  private ensureConfigured(): drive_v3.Drive {
    if (!this.drive) {
      throw new Error('Google Drive is not configured');
    }
    return this.drive;
  }
}
