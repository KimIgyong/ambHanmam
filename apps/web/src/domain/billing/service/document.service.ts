import { apiClient } from '@/lib/api-client';
import { BilDocumentResponse } from '@amb/types';

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

class DocumentApiService {
  private readonly basePath = '/billing/documents';

  getDocuments = (refType: string, refId: string) =>
    apiClient
      .get<ListResponse<BilDocumentResponse>>(this.basePath, {
        params: { ref_type: refType, ref_id: refId },
      })
      .then((r) => r.data.data);

  uploadDocument = (refType: string, refId: string, docType: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('ref_type', refType);
    formData.append('ref_id', refId);
    formData.append('doc_type', docType);

    return apiClient
      .post<SingleResponse<BilDocumentResponse>>(`${this.basePath}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  };

  addUrlDocument = (refType: string, refId: string, docType: string, filename: string, url: string) =>
    apiClient
      .post<SingleResponse<BilDocumentResponse>>(`${this.basePath}/url`, {
        ref_type: refType,
        ref_id: refId,
        doc_type: docType,
        filename,
        url,
      })
      .then((r) => r.data.data);

  deleteDocument = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  getPreview = (id: string) =>
    apiClient
      .get<SingleResponse<{
        docId: string;
        filename: string;
        mimeType: string | null;
        gdriveFileId: string | null;
        gdriveUrl: string | null;
        previewUrl: string | null;
      }>>(`${this.basePath}/${id}/preview`)
      .then((r) => r.data.data);

  downloadDocument = (id: string) =>
    apiClient
      .get(`${this.basePath}/${id}/download`, { responseType: 'blob' })
      .then((r) => {
        const disposition = r.headers['content-disposition'] || '';
        const match = disposition.match(/filename="?([^"]+)"?/);
        const filename = match ? decodeURIComponent(match[1]) : 'download';
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      });
}

export const documentApiService = new DocumentApiService();
