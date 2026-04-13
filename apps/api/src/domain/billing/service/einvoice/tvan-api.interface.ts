/**
 * TVAN API 추상 인터페이스
 * TVAN 업체 교체 시 이 인터페이스만 구현하면 됨
 */

export interface EinvoiceXmlData {
  // 판매자 정보
  seller: {
    taxCode: string;       // MST (Mã số thuế)
    name: string;
    nameEn?: string;
    address: string;
    phone?: string;
    email?: string;
    representative?: string;
  };
  // 구매자 정보
  buyer: {
    taxCode: string;
    name: string;
    nameLocal?: string;
    address: string;
    contactName?: string;
    email?: string;
  };
  // 인보이스 정보
  invoice: {
    invNumber: string;
    invDate: string;        // YYYY-MM-DD
    currency: string;
    formNumber: string;     // 1=VAT, 2=Sales
    referenceCode: string;  // 청구서 기호 (예: C26TAA)
    paymentMethod?: string;
  };
  // 품목 목록
  items: Array<{
    seq: number;
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
  // 합계
  totals: {
    subtotal: number;     // 세전 합계
    taxRate: number;       // 세율 (%)
    taxAmount: number;     // 세액
    total: number;         // 총액
  };
}

export interface TvanIssueRequest {
  invoiceData: EinvoiceXmlData;
  xmlContent: string;  // 생성된 XML 문자열
}

export interface TvanIssueResponse {
  success: boolean;
  einvNumber?: string;
  gdtCode?: string;
  lookupUrl?: string;
  signedXml?: string;
  signedPdfBuffer?: Buffer;
  error?: string;
}

export interface TvanCancelRequest {
  einvNumber: string;
  reason: string;
}

export interface TvanStatusResponse {
  status: 'ISSUED' | 'CANCELLED' | 'PENDING' | 'ERROR';
  einvNumber?: string;
}

export const TVAN_API_SERVICE = 'ITvanApiService';

export interface ITvanApiService {
  issueInvoice(request: TvanIssueRequest): Promise<TvanIssueResponse>;
  cancelInvoice(request: TvanCancelRequest): Promise<{ success: boolean; error?: string }>;
  getInvoiceStatus(einvNumber: string): Promise<TvanStatusResponse>;
  downloadPdf(einvNumber: string): Promise<Buffer | null>;
  downloadXml(einvNumber: string): Promise<string | null>;
}
