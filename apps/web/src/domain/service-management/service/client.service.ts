import { apiClient } from '@/lib/api-client';
import { SvcClientResponse, SvcClientContactResponse, SvcClientNoteResponse } from '@amb/types';

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

class ClientApiService {
  private readonly basePath = '/service/clients';

  getClients = (params?: { status?: string; type?: string; service?: string; manager?: string; search?: string }) =>
    apiClient.get<ListResponse<SvcClientResponse>>(this.basePath, { params }).then((r) => r.data.data);

  getClientById = (id: string) =>
    apiClient.get<SingleResponse<SvcClientResponse>>(`${this.basePath}/${id}`).then((r) => r.data.data);

  createClient = (data: Record<string, unknown>) =>
    apiClient.post<SingleResponse<SvcClientResponse>>(this.basePath, data).then((r) => r.data.data);

  updateClient = (id: string, data: Record<string, unknown>) =>
    apiClient.patch<SingleResponse<SvcClientResponse>>(`${this.basePath}/${id}`, data).then((r) => r.data.data);

  deleteClient = (id: string) =>
    apiClient.delete(`${this.basePath}/${id}`);

  // Contacts
  getContacts = (clientId: string) =>
    apiClient.get<ListResponse<SvcClientContactResponse>>(`${this.basePath}/${clientId}/contacts`).then((r) => r.data.data);

  createContact = (clientId: string, data: Record<string, unknown>) =>
    apiClient.post<SingleResponse<SvcClientContactResponse>>(`${this.basePath}/${clientId}/contacts`, data).then((r) => r.data.data);

  updateContact = (clientId: string, contactId: string, data: Record<string, unknown>) =>
    apiClient.patch<SingleResponse<SvcClientContactResponse>>(`${this.basePath}/${clientId}/contacts/${contactId}`, data).then((r) => r.data.data);

  deleteContact = (clientId: string, contactId: string) =>
    apiClient.delete(`${this.basePath}/${clientId}/contacts/${contactId}`);

  // Notes
  getNotes = (clientId: string) =>
    apiClient.get<ListResponse<SvcClientNoteResponse>>(`${this.basePath}/${clientId}/notes`).then((r) => r.data.data);

  createNote = (clientId: string, data: Record<string, unknown>) =>
    apiClient.post<SingleResponse<SvcClientNoteResponse>>(`${this.basePath}/${clientId}/notes`, data).then((r) => r.data.data);

  updateNote = (clientId: string, noteId: string, data: Record<string, unknown>) =>
    apiClient.patch<SingleResponse<SvcClientNoteResponse>>(`${this.basePath}/${clientId}/notes/${noteId}`, data).then((r) => r.data.data);

  deleteNote = (clientId: string, noteId: string) =>
    apiClient.delete(`${this.basePath}/${clientId}/notes/${noteId}`);
}

export const clientApiService = new ClientApiService();
