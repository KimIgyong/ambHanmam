import { Logger } from '@nestjs/common';
import {
  IPopbillService,
  PopbillTaxInvoice,
  PopbillIssueResponse,
  PopbillTaxInvoiceInfo,
} from './popbill.interface';

export class PopbillMockService implements IPopbillService {
  private readonly logger = new Logger('PopbillMockService');

  isConfigured(): boolean {
    return true;
  }

  async registIssue(
    corpNum: string,
    taxInvoice: PopbillTaxInvoice,
    memo?: string,
  ): Promise<PopbillIssueResponse> {
    this.logger.log(
      `[MOCK] registIssue - corpNum: ${corpNum}, mgtKey: ${taxInvoice.invoicerMgtKey}, amount: ${taxInvoice.totalAmount}, memo: ${memo || ''}`,
    );

    const ntsConfirmNum = `MOCK-${Date.now()}`;

    return {
      code: 1,
      message: '성공',
      ntsConfirmNum,
    };
  }

  async registRequest(
    corpNum: string,
    taxInvoice: PopbillTaxInvoice,
    memo?: string,
  ): Promise<PopbillIssueResponse> {
    this.logger.log(
      `[MOCK] registRequest (역발행) - corpNum: ${corpNum}, mgtKey: ${taxInvoice.invoicerMgtKey}, memo: ${memo || ''}`,
    );

    return {
      code: 1,
      message: '성공',
    };
  }

  async getInfo(
    corpNum: string,
    keyType: string,
    mgtKey: string,
  ): Promise<PopbillTaxInvoiceInfo> {
    this.logger.log(
      `[MOCK] getInfo - corpNum: ${corpNum}, keyType: ${keyType}, mgtKey: ${mgtKey}`,
    );

    return {
      itemKey: `MOCK-ITEM-${mgtKey}`,
      stateCode: 300, // 발행완료
      ntsconfirmNum: `MOCK-${Date.now()}`,
      writeDate: new Date().toISOString().replace(/-/g, '').substring(0, 8),
      issueDT: new Date().toISOString(),
    };
  }

  async cancelIssue(
    corpNum: string,
    keyType: string,
    mgtKey: string,
    memo?: string,
  ): Promise<{ code: number; message: string }> {
    this.logger.log(
      `[MOCK] cancelIssue - corpNum: ${corpNum}, keyType: ${keyType}, mgtKey: ${mgtKey}, memo: ${memo || ''}`,
    );

    return {
      code: 1,
      message: '성공',
    };
  }
}
