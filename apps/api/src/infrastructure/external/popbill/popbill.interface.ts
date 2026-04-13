export interface PopbillTaxInvoice {
  writeDate: string; // yyyyMMdd
  issueType: string; // '정발행'|'역발행'
  taxType: string; // '과세'|'영세'|'면세'
  chargeDirection: string; // '정과금'
  purposeType: string; // '영수'|'청구'
  // 공급자 정보
  invoicerCorpNum: string;
  invoicerCorpName: string;
  invoicerCEOName: string;
  invoicerMgtKey: string;
  invoicerAddr?: string;
  invoicerBizType?: string;
  invoicerBizClass?: string;
  invoicerEmail?: string;
  // 공급받는자 정보
  invoiceeType: string; // '사업자'|'개인'|'외국인'
  invoiceeCorpNum: string;
  invoiceeCorpName: string;
  invoiceeCEOName: string;
  invoiceeMgtKey?: string;
  invoiceeAddr?: string;
  invoiceeBizType?: string;
  invoiceeBizClass?: string;
  invoiceeEmail1?: string;
  // 금액
  supplyCostTotal: string;
  taxTotal: string;
  totalAmount: string;
  // 품목
  detailList: PopbillTaxInvoiceDetail[];
  // 수정세금계산서
  modifyCode?: number;
  orgNTSConfirmNum?: string;
}

export interface PopbillTaxInvoiceDetail {
  serialNum: number;
  purchaseDT?: string;
  itemName?: string;
  spec?: string;
  qty?: string;
  unitCost?: string;
  supplyCost?: string;
  tax?: string;
  remark?: string;
}

export interface PopbillIssueResponse {
  code: number;
  message: string;
  ntsConfirmNum?: string;
}

export interface PopbillTaxInvoiceInfo {
  itemKey: string;
  stateCode: number;
  ntsconfirmNum: string;
  writeDate: string;
  issueDT: string;
}

export const POPBILL_SERVICE = Symbol('POPBILL_SERVICE');

export interface IPopbillService {
  isConfigured(): boolean;
  registIssue(
    corpNum: string,
    taxInvoice: PopbillTaxInvoice,
    memo?: string,
  ): Promise<PopbillIssueResponse>;
  registRequest(
    corpNum: string,
    taxInvoice: PopbillTaxInvoice,
    memo?: string,
  ): Promise<PopbillIssueResponse>;
  getInfo(
    corpNum: string,
    keyType: string,
    mgtKey: string,
  ): Promise<PopbillTaxInvoiceInfo>;
  cancelIssue(
    corpNum: string,
    keyType: string,
    mgtKey: string,
    memo?: string,
  ): Promise<{ code: number; message: string }>;
}
