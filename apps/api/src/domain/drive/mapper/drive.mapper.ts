import { drive_v3 } from 'googleapis';
import { DriveFileResponse, DriveFolderRegistration } from '@amb/types';
import { DriveFolderEntity } from '../entity/drive-folder.entity';

const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

export class DriveMapper {
  static toFileResponse(file: drive_v3.Schema$File): DriveFileResponse {
    return {
      id: file.id ?? '',
      name: file.name?.normalize('NFC') ?? '',
      mimeType: file.mimeType ?? '',
      size: file.size || null,
      iconLink: file.iconLink || null,
      thumbnailLink: file.thumbnailLink || null,
      webViewLink: file.webViewLink || null,
      modifiedTime: file.modifiedTime ?? '',
      createdTime: file.createdTime ?? '',
      owners: file.owners?.map((o) => o.displayName || o.emailAddress || '') || [],
      parentId: file.parents?.[0] || null,
      isFolder: file.mimeType === FOLDER_MIME_TYPE,
    };
  }

  static toFolderRegistrationResponse(entity: DriveFolderEntity): DriveFolderRegistration {
    return {
      id: entity.drfId,
      folderId: entity.drfFolderId,
      folderName: entity.drfFolderName,
      driveType: entity.drfDriveType as DriveFolderRegistration['driveType'],
      description: entity.drfDescription || null,
      createdAt: entity.drfCreatedAt.toISOString(),
    };
  }
}
