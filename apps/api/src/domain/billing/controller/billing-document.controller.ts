import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { EntityGuard } from '../../hr/guard/entity.guard';
import { BillingDocumentService } from '../service/billing-document.service';

@ApiTags('Billing - Documents')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/documents')
export class BillingDocumentController {
  constructor(private readonly documentService: BillingDocumentService) {}

  @Get()
  @ApiOperation({ summary: 'List documents for a reference (contract/sow/invoice)' })
  async list(
    @Req() req: any,
    @Query('ref_type') refType: string,
    @Query('ref_id') refId: string,
  ) {
    const data = await this.documentService.getDocuments(req.entityId, refType, refId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/preview')
  @ApiOperation({ summary: 'Get document preview info (Drive URL)' })
  async preview(@Param('id') id: string, @Req() req: any) {
    const doc = await this.documentService.getDocumentById(req.entityId, id);
    if (!doc) throw new NotFoundException('Document not found');
    return {
      success: true,
      data: {
        docId: doc.docId,
        filename: doc.filename,
        mimeType: doc.mimeType,
        gdriveFileId: doc.gdriveFileId,
        gdriveUrl: doc.gdriveUrl,
        previewUrl: doc.gdriveFileId
          ? `https://drive.google.com/file/d/${doc.gdriveFileId}/preview`
          : null,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file from Drive' })
  async download(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const { stream, filename, mimeType } = await this.documentService.downloadDocument(req.entityId, id);
    res.setHeader('Content-Type', mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    stream.pipe(res);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document file' })
  async upload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
    @Body('ref_type') refType: string,
    @Body('ref_id') refId: string,
    @Body('doc_type') docType: string,
    @Body('partner_id') partnerId?: string,
  ) {
    const data = await this.documentService.uploadDocument(
      req.entityId,
      refType,
      refId,
      docType || 'OTHER',
      file,
      req.user?.userId || req.user?.sub,
      partnerId || undefined,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('url')
  @ApiOperation({ summary: 'Add a document by URL (Google Drive link fallback)' })
  async addUrl(
    @Req() req: any,
    @Body() body: { ref_type: string; ref_id: string; doc_type: string; filename: string; url: string },
  ) {
    const data = await this.documentService.addUrlDocument(
      req.entityId,
      body.ref_type,
      body.ref_id,
      body.doc_type || 'OTHER',
      body.filename,
      body.url,
      req.user?.userId || req.user?.sub,
    );
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document' })
  async remove(
    @Req() req: any,
    @Param('id') id: string,
  ) {
    await this.documentService.deleteDocument(req.entityId, id);
    return { success: true, data: null, timestamp: new Date().toISOString() };
  }
}
