import { apiClient } from '@/lib/api-client';
import { BilInvoiceResponse } from '@amb/types';

interface ListResponse<T> {
  success: boolean;
  data: T[];
  timestamp: string;
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

class InvoiceApiService {
  private readonly basePath = '/billing/invoices';

  getInvoices = (params?: { status?: string; direction?: string; search?: string; year_month?: string; partner_id?: string }) =>
    apiClient
      .get<ListResponse<BilInvoiceResponse>>(this.basePath, { params })
      .then((r) => r.data.data);

  getInvoiceById = (id: string) =>
    apiClient
      .get<SingleResponse<BilInvoiceResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createInvoice = (data: Record<string, unknown>) =>
    apiClient
      .post<SingleResponse<BilInvoiceResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateInvoice = (id: string, data: Record<string, unknown>) =>
    apiClient
      .patch<SingleResponse<BilInvoiceResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteInvoice = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  voidAndReissue = (id: string) =>
    apiClient
      .post<SingleResponse<BilInvoiceResponse>>(`${this.basePath}/${id}/void-reissue`)
      .then((r) => r.data.data);

  sendEmail = (id: string, data: { to: string[]; cc?: string[]; subject?: string; body?: string }) =>
    apiClient
      .post<SingleResponse<{ sent: boolean; to: string[]; subject: string }>>(`${this.basePath}/${id}/send-email`, data)
      .then((r) => r.data.data);

  downloadPdf = (id: string, saveToDrive = false) =>
    apiClient
      .get(`${this.basePath}/${id}/pdf`, {
        responseType: 'blob',
        params: saveToDrive ? { save_to_drive: 'true' } : undefined,
      })
      .then((r) => {
        const disposition = r.headers['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match ? match[1] : `Invoice_${id}.pdf`;
        const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });

  // ── Approval Workflow ──

  submitForReview = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/submit-review`).then((r) => r.data);

  approveReview = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/approve-review`).then((r) => r.data);

  approveManager = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/approve-manager`).then((r) => r.data);

  approveAdmin = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/approve-admin`).then((r) => r.data);

  reject = (id: string, reason: string) =>
    apiClient.post(`${this.basePath}/${id}/reject`, { reason }).then((r) => r.data);

  // ── E-Invoice (Vietnam) ──

  issueEinvoice = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/issue-einvoice`).then((r) => r.data);

  cancelEinvoice = (id: string, reason: string) =>
    apiClient.post(`${this.basePath}/${id}/cancel-einvoice`, { reason }).then((r) => r.data);

  getEinvoiceInfo = (id: string) =>
    apiClient.get(`${this.basePath}/${id}/einvoice`).then((r) => r.data.data);

  downloadEinvoiceXml = (id: string) =>
    apiClient.get(`${this.basePath}/${id}/einvoice/xml`, { responseType: 'blob' }).then((r) => {
      const disposition = r.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `einvoice_${id}.xml`;
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/xml' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });

  downloadEinvoicePdf = (id: string) =>
    apiClient.get(`${this.basePath}/${id}/einvoice/pdf`, { responseType: 'blob' }).then((r) => {
      const disposition = r.headers['content-disposition'] || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `einvoice_${id}.pdf`;
      const url = window.URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    });

  // ── NTS Tax Invoice (Korea) ──

  issueNtsTaxInvoice = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/issue-nts`).then((r) => r.data);

  issueNtsModified = (id: string, data: { modify_code: string; original_invoice_id: string }) =>
    apiClient.post(`${this.basePath}/${id}/issue-nts-modified`, data).then((r) => r.data);

  requestNtsReverse = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/request-nts-reverse`).then((r) => r.data);

  cancelNtsTaxInvoice = (id: string) =>
    apiClient.post(`${this.basePath}/${id}/cancel-nts`).then((r) => r.data);

  getNtsStatus = (id: string) =>
    apiClient.get(`${this.basePath}/${id}/nts-status`).then((r) => r.data.data);
}

export const invoiceApiService = new InvoiceApiService();
