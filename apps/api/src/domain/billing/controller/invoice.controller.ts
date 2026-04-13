import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, Req, Res, UseGuards, HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { InvoiceService } from '../service/invoice.service';
import { InvoicePdfService } from '../service/invoice-pdf.service';
import { InvoiceEmailService } from '../service/invoice-email.service';
import { InvoiceApprovalService } from '../service/invoice-approval.service';
import { EinvoiceService } from '../service/einvoice/einvoice.service';
import { NtsTaxInvoiceService } from '../service/nts-tax-invoice.service';
import { CreateInvoiceRequest } from '../dto/request/create-invoice.request';
import { UpdateInvoiceRequest } from '../dto/request/update-invoice.request';
import { SendInvoiceEmailRequest } from '../dto/request/send-invoice-email.request';
import { EntityGuard } from '../../hr/guard/entity.guard';

@ApiTags('Billing - Invoices')
@ApiBearerAuth()
@UseGuards(EntityGuard)
@Controller('billing/invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly invoicePdfService: InvoicePdfService,
    private readonly invoiceEmailService: InvoiceEmailService,
    private readonly invoiceApprovalService: InvoiceApprovalService,
    private readonly einvoiceService: EinvoiceService,
    private readonly ntsTaxInvoiceService: NtsTaxInvoiceService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Invoice 목록 조회' })
  async findAll(@Req() req: any, @Query() query: any) {
    const result = await this.invoiceService.findAll(req.entityId, query);
    return { success: true, data: result.data, pagination: result.pagination, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Invoice 상세 조회' })
  async findById(@Param('id') id: string, @Req() req: any) {
    const data = await this.invoiceService.findById(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post()
  @ApiOperation({ summary: 'Invoice 등록' })
  async create(@Body() dto: CreateInvoiceRequest, @Req() req: any) {
    const data = await this.invoiceService.create(dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Invoice 수정' })
  async update(@Param('id') id: string, @Body() dto: UpdateInvoiceRequest, @Req() req: any) {
    const data = await this.invoiceService.update(id, dto, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Invoice 삭제' })
  async remove(@Param('id') id: string, @Req() req: any) {
    await this.invoiceService.delete(id, req.entityId);
    return { success: true, timestamp: new Date().toISOString() };
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Invoice PDF 다운로드 (save_to_drive=true 시 Drive에도 저장)' })
  async downloadPdf(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
    @Query('save_to_drive') saveToDrive?: string,
  ) {
    const { buffer, filename, partnerId } = await this.invoicePdfService.generatePdf(id, req.entityId);

    // Drive 자동 저장
    if (saveToDrive === 'true' && partnerId) {
      await this.invoicePdfService.saveToDrive(id, req.entityId, partnerId, buffer, filename, req.user?.userId);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Post(':id/send-email')
  @ApiOperation({ summary: 'Invoice 이메일 발송 (PDF 첨부)' })
  async sendEmail(@Param('id') id: string, @Body() dto: SendInvoiceEmailRequest, @Req() req: any) {
    const data = await this.invoiceEmailService.sendInvoiceEmail(id, req.entityId, dto);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/void-reissue')
  @ApiOperation({ summary: 'Invoice void + re-issue (기존 무효화 + 새 DRAFT 생성)' })
  async voidAndReissue(@Param('id') id: string, @Req() req: any) {
    const data = await this.invoiceService.voidAndReissue(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── Approval Workflow ──

  @Post(':id/submit-review')
  @ApiOperation({ summary: 'Submit invoice for review (DRAFT → PENDING_REVIEW)' })
  async submitForReview(@Param('id') id: string, @Req() req: any) {
    const data = await this.invoiceApprovalService.submitForReview(id, req.entityId, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/approve-review')
  @ApiOperation({ summary: 'Approve review (PENDING_REVIEW → PENDING_APPROVAL)' })
  async approveReview(@Param('id') id: string, @Req() req: any) {
    const data = await this.invoiceApprovalService.approveReview(id, req.entityId, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/approve-manager')
  @ApiOperation({ summary: 'Manager approval (PENDING_APPROVAL → APPROVED_MANAGER)' })
  async approveManager(@Param('id') id: string, @Req() req: any) {
    const data = await this.invoiceApprovalService.approveManager(id, req.entityId, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/approve-admin')
  @ApiOperation({ summary: 'Admin final approval (APPROVED_MANAGER → APPROVED_ADMIN)' })
  async approveAdmin(@Param('id') id: string, @Req() req: any) {
    const data = await this.invoiceApprovalService.approveAdmin(id, req.entityId, req.user.userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject invoice approval' })
  async reject(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const data = await this.invoiceApprovalService.reject(id, req.entityId, req.user.userId, body.reason);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  // ── E-Invoice (Vietnam) ──

  @Post(':id/issue-einvoice')
  @HttpCode(200)
  @ApiOperation({ summary: 'Issue e-invoice (전자세금계산서 발행)' })
  async issueEinvoice(@Param('id') id: string, @Req() req: any) {
    const data = await this.einvoiceService.issueEinvoice(id, req.entityId);
    return { success: true, data: { status: data.invEinvStatus, number: data.invEinvNumber, gdtCode: data.invEinvGdtCode, error: data.invEinvError }, timestamp: new Date().toISOString() };
  }

  @Post(':id/cancel-einvoice')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel e-invoice (전자세금계산서 취소)' })
  async cancelEinvoice(@Param('id') id: string, @Body() body: { reason: string }, @Req() req: any) {
    const data = await this.einvoiceService.cancelEinvoice(id, req.entityId, body.reason);
    return { success: true, data: { status: data.invEinvStatus }, timestamp: new Date().toISOString() };
  }

  @Get(':id/einvoice')
  @ApiOperation({ summary: 'Get e-invoice info (전자세금계산서 정보 조회)' })
  async getEinvoiceInfo(@Param('id') id: string, @Req() req: any) {
    const data = await this.einvoiceService.getEinvoiceInfo(id, req.entityId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':id/einvoice/xml')
  @ApiOperation({ summary: 'Download signed e-invoice XML' })
  async downloadEinvoiceXml(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const result = await this.einvoiceService.downloadXml(id, req.entityId);
    if (!result) {
      res.status(404).json({ success: false, error: 'E-invoice XML not available' });
      return;
    }
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  @Get(':id/einvoice/pdf')
  @ApiOperation({ summary: 'Download signed e-invoice PDF' })
  async downloadEinvoicePdf(@Param('id') id: string, @Req() req: any, @Res() res: Response) {
    const result = await this.einvoiceService.downloadPdf(id, req.entityId);
    if (!result) {
      res.status(404).json({ success: false, error: 'E-invoice PDF not available' });
      return;
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.buffer);
  }

  // ── NTS Tax Invoice (Korea) ──

  @Post(':id/issue-nts')
  @HttpCode(200)
  @ApiOperation({ summary: 'Issue NTS tax invoice (세금계산서 정발행)' })
  async issueNtsTaxInvoice(@Param('id') id: string, @Req() req: any) {
    const data = await this.ntsTaxInvoiceService.issueNtsTaxInvoice(id, req.entityId);
    return { success: true, data: { status: data.invNtsStatus, mgtKey: data.invNtsMgtKey, confirmNum: data.invNtsConfirmNum, error: data.invNtsError }, timestamp: new Date().toISOString() };
  }

  @Post(':id/issue-nts-modified')
  @HttpCode(200)
  @ApiOperation({ summary: 'Issue modified NTS tax invoice (수정세금계산서 발행)' })
  async issueNtsModified(
    @Param('id') id: string,
    @Body() body: { modify_code: string; original_invoice_id: string },
    @Req() req: any,
  ) {
    const data = await this.ntsTaxInvoiceService.issueModifiedNtsTaxInvoice(
      id, req.entityId, body.modify_code, body.original_invoice_id,
    );
    return { success: true, data: { status: data.invNtsStatus, mgtKey: data.invNtsMgtKey, confirmNum: data.invNtsConfirmNum, error: data.invNtsError }, timestamp: new Date().toISOString() };
  }

  @Post(':id/request-nts-reverse')
  @HttpCode(200)
  @ApiOperation({ summary: 'Request NTS reverse issue (역발행 요청)' })
  async requestNtsReverse(@Param('id') id: string, @Req() req: any) {
    const data = await this.ntsTaxInvoiceService.requestReverseIssue(id, req.entityId);
    return { success: true, data: { status: data.invNtsStatus, mgtKey: data.invNtsMgtKey, error: data.invNtsError }, timestamp: new Date().toISOString() };
  }

  @Post(':id/cancel-nts')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cancel NTS tax invoice (세금계산서 취소)' })
  async cancelNtsTaxInvoice(@Param('id') id: string, @Req() req: any) {
    const data = await this.ntsTaxInvoiceService.cancelNtsTaxInvoice(id, req.entityId);
    return { success: true, data: { status: data.invNtsStatus }, timestamp: new Date().toISOString() };
  }

  @Get(':id/nts-status')
  @ApiOperation({ summary: 'Get/sync NTS tax invoice status (상태 조회)' })
  async getNtsStatus(@Param('id') id: string, @Req() req: any) {
    const data = await this.ntsTaxInvoiceService.getNtsStatus(id, req.entityId);
    return {
      success: true,
      data: {
        status: data.invNtsStatus,
        mgtKey: data.invNtsMgtKey,
        confirmNum: data.invNtsConfirmNum,
        issuedAt: data.invNtsIssuedAt?.toISOString() || null,
        error: data.invNtsError,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
