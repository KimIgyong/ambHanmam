import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApiService } from '../service/client.service';

const clientKeys = {
  all: ['svc-clients'] as const,
  list: (params?: Record<string, string | undefined>) => [...clientKeys.all, 'list', params] as const,
  detail: (id: string) => [...clientKeys.all, 'detail', id] as const,
  contacts: (clientId: string) => [...clientKeys.all, 'contacts', clientId] as const,
  notes: (clientId: string) => [...clientKeys.all, 'notes', clientId] as const,
};

export const useClientList = (params?: { status?: string; type?: string; service?: string; manager?: string; search?: string }) => {
  return useQuery({
    queryKey: clientKeys.list(params),
    queryFn: () => clientApiService.getClients(params),
  });
};

export const useClientDetail = (id: string) => {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => clientApiService.getClientById(id),
    enabled: !!id,
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => clientApiService.createClient(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      clientApiService.updateClient(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientApiService.deleteClient(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

// Contacts
export const useClientContacts = (clientId: string) => {
  return useQuery({
    queryKey: clientKeys.contacts(clientId),
    queryFn: () => clientApiService.getContacts(clientId),
    enabled: !!clientId,
  });
};

export const useCreateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: Record<string, unknown> }) =>
      clientApiService.createContact(clientId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

export const useUpdateContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, contactId, data }: { clientId: string; contactId: string; data: Record<string, unknown> }) =>
      clientApiService.updateContact(clientId, contactId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

export const useDeleteContact = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, contactId }: { clientId: string; contactId: string }) =>
      clientApiService.deleteContact(clientId, contactId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

// Notes
export const useClientNotes = (clientId: string) => {
  return useQuery({
    queryKey: clientKeys.notes(clientId),
    queryFn: () => clientApiService.getNotes(clientId),
    enabled: !!clientId,
  });
};

export const useCreateNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, data }: { clientId: string; data: Record<string, unknown> }) =>
      clientApiService.createNote(clientId, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};

export const useDeleteNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, noteId }: { clientId: string; noteId: string }) =>
      clientApiService.deleteNote(clientId, noteId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: clientKeys.all }); },
  });
};
