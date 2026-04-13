import { apiClient } from '@/lib/api-client';
import { MeetingNoteResponse, MeetingNoteCommentResponse, MeetingNoteFolderResponse, BaseSingleResponse } from '@amb/types';

interface MeetingNoteListResponse {
  success: boolean;
  data: MeetingNoteResponse[];
  totalCount: number;
  timestamp: string;
}

export interface MeetingNoteFormData {
  type: string;
  title: string;
  content: string;
  meeting_date?: string;
  visibility?: string;
  unit?: string;
  cell_id?: string;
  assignee_id?: string | null;
  participant_ids?: string[];
  project_ids?: string[];
  issue_ids?: string[];
  folder_id?: string | null;
  create_issue?: boolean;
  create_issue_project_id?: string;
  create_issue_type?: string;
  create_issue_severity?: string;
}

export interface FolderFormData {
  name: string;
  color?: string;
  sort_order?: number;
}

class MeetingNoteService {
  private readonly basePath = '/meeting-notes';

  getMeetingNotes = (params?: { visibility?: string; type?: string; scope?: string; search?: string; date_from?: string; date_to?: string; folder_id?: string; exclude_daily?: boolean; page?: number; size?: number }) =>
    apiClient
      .get<MeetingNoteListResponse>(this.basePath, { params })
      .then((r) => ({ data: r.data.data, totalCount: r.data.totalCount }));

  getMeetingNoteById = (id: string) =>
    apiClient
      .get<BaseSingleResponse<MeetingNoteResponse>>(`${this.basePath}/${id}`)
      .then((r) => r.data.data);

  createMeetingNote = (data: MeetingNoteFormData) =>
    apiClient
      .post<BaseSingleResponse<MeetingNoteResponse>>(this.basePath, data)
      .then((r) => r.data.data);

  updateMeetingNote = (id: string, data: Partial<MeetingNoteFormData>) =>
    apiClient
      .patch<BaseSingleResponse<MeetingNoteResponse>>(`${this.basePath}/${id}`, data)
      .then((r) => r.data.data);

  deleteMeetingNote = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  // Comments
  getComments = (noteId: string) =>
    apiClient
      .get<{ success: boolean; data: MeetingNoteCommentResponse[] }>(`${this.basePath}/${noteId}/comments`)
      .then((r) => r.data.data);

  addComment = (noteId: string, content: string, parentId?: string) =>
    apiClient
      .post<BaseSingleResponse<MeetingNoteCommentResponse>>(`${this.basePath}/${noteId}/comments`, { content, parent_id: parentId })
      .then((r) => r.data.data);

  deleteComment = (noteId: string, commentId: string) =>
    apiClient.delete(`${this.basePath}/${noteId}/comments/${commentId}`);

  // Rating
  upsertRating = (noteId: string, rating: number) =>
    apiClient.put(`${this.basePath}/${noteId}/rating`, { rating });

  deleteRating = (noteId: string) =>
    apiClient.delete(`${this.basePath}/${noteId}/rating`);

  // Folders
  getFolders = () =>
    apiClient
      .get<{ success: boolean; data: MeetingNoteFolderResponse[] }>(`${this.basePath}/folders`)
      .then((r) => r.data.data);

  createFolder = (data: FolderFormData) =>
    apiClient
      .post<BaseSingleResponse<MeetingNoteFolderResponse>>(`${this.basePath}/folders`, data)
      .then((r) => r.data.data);

  updateFolder = (folderId: string, data: Partial<FolderFormData>) =>
    apiClient
      .patch<BaseSingleResponse<MeetingNoteFolderResponse>>(`${this.basePath}/folders/${folderId}`, data)
      .then((r) => r.data.data);

  deleteFolder = (folderId: string) =>
    apiClient.delete(`${this.basePath}/folders/${folderId}`);

  // Wiki Links
  linkAutocomplete = (q: string, type?: string) =>
    apiClient
      .get<{ success: boolean; data: Array<{ id: string; type: string; title: string }> }>(
        `${this.basePath}/link-autocomplete`,
        { params: { q, type } },
      )
      .then((r) => r.data.data);

  getBacklinks = (noteId: string) =>
    apiClient
      .get<{ success: boolean; data: BacklinkItem[] }>(`${this.basePath}/${noteId}/backlinks`)
      .then((r) => r.data.data);

  getGraphData = (params?: { scope?: string; center_id?: string }) =>
    apiClient
      .get<{ success: boolean; data: GraphData }>(`${this.basePath}/graph`, { params })
      .then((r) => r.data.data);

  // Full-text Search
  fullTextSearch = (q: string, scope?: string, page?: number, size?: number) =>
    apiClient
      .get<{ success: boolean; data: FtsSearchResult[]; totalCount: number }>(
        `${this.basePath}/search`,
        { params: { q, scope, page, size } },
      )
      .then((r) => ({ data: r.data.data, totalCount: r.data.totalCount }));
}

export interface FtsSearchResult {
  meetingNoteId: string;
  title: string;
  type: string;
  authorName: string;
  folderName: string | null;
  updatedAt: string;
  snippet: string;
  rank: number;
}

export interface BacklinkItem {
  noteId: string;
  title: string;
  linkText: string;
  context: string | null;
  createdAt: string;
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export const meetingNoteService = new MeetingNoteService();
