import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import {
  ITvanApiService,
  TvanIssueRequest,
  TvanIssueResponse,
  TvanCancelRequest,
  TvanStatusResponse,
} from './tvan-api.interface';

/**
 * 실 TVAN API 연동 구현체
 * TVAN 업체 선정 및 계약 체결 후 구현 예정
 */
@Injectable()
export class TvanRealService implements ITvanApiService {
  private readonly logger = new Logger(TvanRealService.name);

  async issueInvoice(request: TvanIssueRequest): Promise<TvanIssueResponse> {
    this.logger.error('TVAN real service not implemented yet');
    throw new NotImplementedException('TVAN real API integration is not yet implemented. Please set TVAN_PROVIDER=mock');
  }

  async cancelInvoice(request: TvanCancelRequest): Promise<{ success: boolean; error?: string }> {
    throw new NotImplementedException('TVAN real API integration is not yet implemented');
  }

  async getInvoiceStatus(einvNumber: string): Promise<TvanStatusResponse> {
    throw new NotImplementedException('TVAN real API integration is not yet implemented');
  }

  async downloadPdf(einvNumber: string): Promise<Buffer | null> {
    throw new NotImplementedException('TVAN real API integration is not yet implemented');
  }

  async downloadXml(einvNumber: string): Promise<string | null> {
    throw new NotImplementedException('TVAN real API integration is not yet implemented');
  }
}
