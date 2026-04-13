import { Injectable, Logger } from '@nestjs/common';
import {
  ITvanApiService,
  TvanIssueRequest,
  TvanIssueResponse,
  TvanCancelRequest,
  TvanStatusResponse,
} from './tvan-api.interface';

/**
 * Mock TVAN 구현체
 * 실제 TVAN 계약 체결 전까지 사용하는 테스트용 서비스
 */
@Injectable()
export class TvanMockService implements ITvanApiService {
  private readonly logger = new Logger(TvanMockService.name);

  private mockCounter = 1000;

  async issueInvoice(request: TvanIssueRequest): Promise<TvanIssueResponse> {
    this.logger.log(`[MOCK] Issuing e-invoice for: ${request.invoiceData.invoice.invNumber}`);

    // 가상 번호 생성
    const seq = ++this.mockCounter;
    const year = new Date().getFullYear();
    const einvNumber = `MOCK-${year}-${String(seq).padStart(7, '0')}`;
    const gdtCode = `MOCK-GDT-${Date.now()}`;

    return {
      success: true,
      einvNumber,
      gdtCode,
      lookupUrl: `https://tracuuhoadon.gdt.gov.vn/mock?code=${gdtCode}`,
      signedXml: request.xmlContent,
      signedPdfBuffer: undefined,
    };
  }

  async cancelInvoice(request: TvanCancelRequest): Promise<{ success: boolean; error?: string }> {
    this.logger.log(`[MOCK] Cancelling e-invoice: ${request.einvNumber}, reason: ${request.reason}`);
    return { success: true };
  }

  async getInvoiceStatus(einvNumber: string): Promise<TvanStatusResponse> {
    this.logger.log(`[MOCK] Getting status for: ${einvNumber}`);
    return { status: 'ISSUED', einvNumber };
  }

  async downloadPdf(einvNumber: string): Promise<Buffer | null> {
    this.logger.log(`[MOCK] Download PDF for: ${einvNumber} - not available in mock mode`);
    return null;
  }

  async downloadXml(einvNumber: string): Promise<string | null> {
    this.logger.log(`[MOCK] Download XML for: ${einvNumber} - not available in mock mode`);
    return null;
  }
}
