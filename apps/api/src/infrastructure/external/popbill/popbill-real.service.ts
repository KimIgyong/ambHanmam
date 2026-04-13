import { Logger, NotImplementedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPopbillService,
  PopbillTaxInvoice,
  PopbillIssueResponse,
  PopbillTaxInvoiceInfo,
} from './popbill.interface';

export class PopbillRealService implements IPopbillService {
  private readonly logger = new Logger('PopbillRealService');

  constructor(private readonly configService: ConfigService) {
    this.logger.log('PopbillRealService initialized (real API)');
  }

  isConfigured(): boolean {
    const linkId = this.configService.get('POPBILL_LINK_ID');
    const secretKey = this.configService.get('POPBILL_SECRET_KEY');
    return !!(linkId && secretKey);
  }

  async registIssue(
    _corpNum: string,
    _taxInvoice: PopbillTaxInvoice,
    _memo?: string,
  ): Promise<PopbillIssueResponse> {
    // TODO: Popbill SDK 연동 후 구현
    throw new NotImplementedException('Popbill real API not yet implemented');
  }

  async registRequest(
    _corpNum: string,
    _taxInvoice: PopbillTaxInvoice,
    _memo?: string,
  ): Promise<PopbillIssueResponse> {
    throw new NotImplementedException('Popbill real API not yet implemented');
  }

  async getInfo(
    _corpNum: string,
    _keyType: string,
    _mgtKey: string,
  ): Promise<PopbillTaxInvoiceInfo> {
    throw new NotImplementedException('Popbill real API not yet implemented');
  }

  async cancelIssue(
    _corpNum: string,
    _keyType: string,
    _mgtKey: string,
    _memo?: string,
  ): Promise<{ code: number; message: string }> {
    throw new NotImplementedException('Popbill real API not yet implemented');
  }
}
