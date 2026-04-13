import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { BillingDocumentEntity } from '../entity/document.entity';
import { PartnerEntity } from '../entity/partner.entity';
import { GoogleDriveService } from '../../../infrastructure/external/google-drive/google-drive.service';

// refType → Drive 하위 폴더 이름 매핑
const REF_TYPE_FOLDER: Record<string, string> = {
  CONTRACT: 'Contracts',
  SOW: 'SOW',
  INVOICE: 'Invoices',
};

// partner type → Drive 폴더 이름 매핑
const PARTNER_TYPE_FOLDER: Record<string, string> = {
  CLIENT: 'Clients',
  AFFILIATE: 'Affiliates',
  PARTNER: 'Partners',
  OUTSOURCING: 'Outsourcing',
  GENERAL_AFFAIRS: 'General_Affairs',
};

@Injectable()
export class BillingDocumentService {
  private readonly logger = new Logger(BillingDocumentService.name);

  constructor(
    @InjectRepository(BillingDocumentEntity)
    private readonly documentRepo: Repository<BillingDocumentEntity>,
    @InjectRepository(PartnerEntity)
    private readonly partnerRepo: Repository<PartnerEntity>,
    private readonly driveService: GoogleDriveService,
    private readonly configService: ConfigService,
  ) {}

  async getDocuments(entityId: string, refType: string, refId: string) {
    const docs = await this.documentRepo.find({
      where: { entId: entityId, docRefType: refType, docRefId: refId },
      order: { docCreatedAt: 'DESC' },
    });
    return docs.map((d) => this.toResponse(d));
  }

  async uploadDocument(
    entityId: string,
    refType: string,
    refId: string,
    docType: string,
    file: Express.Multer.File,
    uploadedBy: string,
    partnerId?: string,
  ) {
    let gdriveFileId: string | null = null;
    let gdriveUrl: string | null = null;

    // Try uploading to Google Drive — partner 폴더 구조 우선, fallback으로 기존 구조
    const rootFolderId = this.configService.get<string>('BILLING_GDRIVE_ROOT_FOLDER_ID');
    if (this.driveService.isConfigured() && rootFolderId) {
      try {
        let folderId: string | null = null;

        if (partnerId) {
          const subFolder = REF_TYPE_FOLDER[refType] || refType;
          folderId = await this.ensurePartnerFolder(partnerId, entityId, subFolder);
        }

        if (!folderId) {
          folderId = await this.ensureRefFolder(rootFolderId, refType, refId);
        }

        const result = await this.driveService.uploadFile(
          folderId,
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        gdriveFileId = result.fileId;
        gdriveUrl = result.webViewLink;
      } catch (error) {
        this.logger.warn(`Google Drive upload failed, saving record without Drive link: ${error.message}`);
      }
    }

    const doc = this.documentRepo.create({
      entId: entityId,
      docRefType: refType,
      docRefId: refId,
      docType: docType,
      docGdriveFileId: gdriveFileId,
      docGdriveUrl: gdriveUrl,
      docFilename: Buffer.from(file.originalname, 'latin1').toString('utf8').normalize('NFC'),
      docMimeType: file.mimetype,
      docFileSize: file.size,
      docUploadedBy: uploadedBy,
    } as DeepPartial<BillingDocumentEntity>);

    const saved: BillingDocumentEntity = await this.documentRepo.save(doc as BillingDocumentEntity);
    return this.toResponse(saved);
  }

  async addUrlDocument(
    entityId: string,
    refType: string,
    refId: string,
    docType: string,
    filename: string,
    url: string,
    uploadedBy: string,
  ) {
    const doc = this.documentRepo.create({
      entId: entityId,
      docRefType: refType,
      docRefId: refId,
      docType: docType,
      docGdriveFileId: undefined,
      docGdriveUrl: url,
      docFilename: filename,
      docMimeType: undefined,
      docFileSize: undefined,
      docUploadedBy: uploadedBy,
    } as DeepPartial<BillingDocumentEntity>);

    const saved: BillingDocumentEntity = await this.documentRepo.save(doc as BillingDocumentEntity);
    return this.toResponse(saved);
  }

  async deleteDocument(entityId: string, docId: string) {
    const doc = await this.documentRepo.findOne({
      where: { docId, entId: entityId },
    });
    if (!doc) throw new NotFoundException('Document not found');

    // Try deleting from Google Drive
    if (doc.docGdriveFileId && this.driveService.isConfigured()) {
      try {
        await this.driveService.deleteFile(doc.docGdriveFileId);
      } catch (error) {
        this.logger.warn(`Failed to delete Drive file ${doc.docGdriveFileId}: ${error.message}`);
      }
    }

    await this.documentRepo.softRemove(doc);
  }

  async getDocumentById(entityId: string, docId: string) {
    const doc = await this.documentRepo.findOne({ where: { docId, entId: entityId } });
    if (!doc) return null;
    return this.toResponse(doc);
  }

  async downloadDocument(entityId: string, docId: string): Promise<{ stream: any; filename: string; mimeType: string }> {
    const doc = await this.documentRepo.findOne({ where: { docId, entId: entityId } });
    if (!doc) throw new NotFoundException('Document not found');
    if (!doc.docGdriveFileId) throw new NotFoundException('No Drive file associated with this document');

    const stream = await this.driveService.downloadFile(doc.docGdriveFileId);
    return {
      stream,
      filename: doc.docFilename,
      mimeType: doc.docMimeType || 'application/octet-stream',
    };
  }

  async getDocumentCount(entityId: string, refType: string, refId: string): Promise<number> {
    return this.documentRepo.count({
      where: { entId: entityId, docRefType: refType, docRefId: refId },
    });
  }

  /**
   * 거래처별 Drive 폴더 구조를 생성/반환:
   * ROOT / {country} / {partnerType} / {partnerName} / {subFolder}
   * partner.ptn_gdrive_folder_id에 partner 루트 폴더 ID 캐싱
   */
  async ensurePartnerFolder(partnerId: string, entityId: string, subFolder?: string): Promise<string | null> {
    const rootFolderId = this.configService.get<string>('BILLING_GDRIVE_ROOT_FOLDER_ID');
    if (!this.driveService.isConfigured() || !rootFolderId) return null;

    const partner = await this.partnerRepo.findOne({ where: { ptnId: partnerId, entId: entityId } });
    if (!partner) return null;

    // 이미 캐싱된 partner 폴더가 있으면 사용
    let partnerFolderId = partner.ptnGdriveFolderId;

    if (!partnerFolderId) {
      try {
        // ROOT / country / type / companyName
        const country = partner.ptnCountry || 'OTHER';
        const countryFolderId = await this.driveService.ensureFolder(rootFolderId, country);
        const typeFolderName = PARTNER_TYPE_FOLDER[partner.ptnType] || 'Others';
        const typeFolderId = await this.driveService.ensureFolder(countryFolderId, typeFolderName);
        const safeName = (partner.ptnCompanyName || partner.ptnCode).replace(/[/\\]/g, '_');
        partnerFolderId = await this.driveService.ensureFolder(typeFolderId, safeName);

        // 캐싱
        await this.partnerRepo.update(partner.ptnId, { ptnGdriveFolderId: partnerFolderId });

        // 하위 폴더 일괄 생성 (Contracts, SOW, Invoices, Acceptance)
        await Promise.all([
          this.driveService.ensureFolder(partnerFolderId, 'Contracts'),
          this.driveService.ensureFolder(partnerFolderId, 'SOW'),
          this.driveService.ensureFolder(partnerFolderId, 'Invoices'),
          this.driveService.ensureFolder(partnerFolderId, 'Acceptance'),
        ]);
      } catch (error) {
        this.logger.warn(`Failed to create partner folder structure: ${error.message}`);
        return null;
      }
    }

    if (subFolder) {
      try {
        return await this.driveService.ensureFolder(partnerFolderId, subFolder);
      } catch (error) {
        this.logger.warn(`Failed to ensure sub-folder ${subFolder}: ${error.message}`);
        return partnerFolderId;
      }
    }

    return partnerFolderId;
  }

  /**
   * PDF 버퍼를 Drive에 저장하고 document 레코드를 생성
   */
  async savePdfToDrive(
    entityId: string,
    refType: string,
    refId: string,
    partnerId: string,
    buffer: Buffer,
    filename: string,
    uploadedBy?: string,
  ): Promise<{ gdriveFileId: string; gdriveUrl: string } | null> {
    const subFolder = REF_TYPE_FOLDER[refType] || refType;
    const folderId = await this.ensurePartnerFolder(partnerId, entityId, subFolder);
    if (!folderId) return null;

    try {
      const result = await this.driveService.uploadFile(folderId, buffer, filename, 'application/pdf');

      // document 레코드 자동 생성
      const doc = this.documentRepo.create({
        entId: entityId,
        docRefType: refType,
        docRefId: refId,
        docType: 'INVOICE',
        docGdriveFileId: result.fileId,
        docGdriveUrl: result.webViewLink,
        docFilename: filename,
        docMimeType: 'application/pdf',
        docFileSize: buffer.length,
        docUploadedBy: uploadedBy || undefined,
      } as DeepPartial<BillingDocumentEntity>);
      await this.documentRepo.save(doc);

      return { gdriveFileId: result.fileId, gdriveUrl: result.webViewLink };
    } catch (error) {
      this.logger.warn(`Failed to save PDF to Drive: ${error.message}`);
      return null;
    }
  }

  private async ensureRefFolder(rootFolderId: string, refType: string, refId: string): Promise<string> {
    const typeFolderId = await this.driveService.ensureFolder(rootFolderId, refType);
    return this.driveService.ensureFolder(typeFolderId, refId);
  }

  private toResponse(doc: BillingDocumentEntity) {
    return {
      docId: doc.docId,
      refType: doc.docRefType,
      refId: doc.docRefId,
      docType: doc.docType,
      gdriveFileId: doc.docGdriveFileId || null,
      gdriveUrl: doc.docGdriveUrl || null,
      filename: doc.docFilename,
      mimeType: doc.docMimeType || null,
      fileSize: doc.docFileSize ? Number(doc.docFileSize) : null,
      uploadedBy: doc.docUploadedBy || null,
      createdAt: doc.docCreatedAt?.toISOString() || null,
    };
  }
}
