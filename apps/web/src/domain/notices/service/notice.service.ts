import { apiClient } from '@/lib/api-client';
import { NoticeResponse } from '@amb/types';

interface NoticeListResponse {
  success: boolean;
  data: NoticeResponse[];
  timestamp: string;
}

interface NoticeSingleResponse {
  success: boolean;
  data: NoticeResponse;
  timestamp: string;
}

class NoticeService {
  private readonly basePath = '/notices';

  getNotices = () =>
    apiClient
      .get<NoticeListResponse>(this.basePath)
      .then((r) => r.data.data);

  getRecentNotices = (limit = 5) =>
    apiClient
      .get<NoticeListResponse>(`${this.basePath}/recent`, { params: { limit } })
      .then((r) => r.data.data);

  getNoticeById = (id: string) =>
    apiClient
      .get<NoticeSingleResponse>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createNotice = (formData: FormData) =>
    apiClient
      .post<NoticeSingleResponse>(this.basePath, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);

  updateNotice = (id: string, data: { title?: string; content?: string; visibility?: string; unit?: string; is_pinned?: boolean }) =>
    apiClient
      .patch<NoticeSingleResponse>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteNotice = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  deleteAttachment = (attachmentId: string) =>
    apiClient.delete(`${this.basePath}/attachments/${attachmentId}`);
}

export const noticeService = new NoticeService();
