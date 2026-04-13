import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meetingNoteService, MeetingNoteFormData, FolderFormData } from '../service/meeting-note.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const noteKeys = {
  all: ['meetingNotes'] as const,
  list: (entityId?: string, filters?: Record<string, string>) => [...noteKeys.all, 'list', entityId, filters] as const,
  detail: (id: string) => [...noteKeys.all, 'detail', id] as const,
  comments: (id: string) => [...noteKeys.all, 'comments', id] as const,
  folders: (entityId?: string) => [...noteKeys.all, 'folders', entityId] as const,
  backlinks: (id: string) => [...noteKeys.all, 'backlinks', id] as const,
};

export const useMeetingNoteList = (filters?: { visibility?: string; type?: string; scope?: string; search?: string; date_from?: string; date_to?: string; folder_id?: string; exclude_daily?: boolean; page?: number; size?: number }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: noteKeys.list(entityId, filters as Record<string, string>),
    queryFn: () => meetingNoteService.getMeetingNotes(filters),
    staleTime: 1000 * 60,
    enabled: !!entityId,
  });
};

export const useMeetingNoteDetail = (id: string) => {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => meetingNoteService.getMeetingNoteById(id),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
};

export const useCreateMeetingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MeetingNoteFormData) => meetingNoteService.createMeetingNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

export const useUpdateMeetingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MeetingNoteFormData> }) =>
      meetingNoteService.updateMeetingNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

export const useDeleteMeetingNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingNoteService.deleteMeetingNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

// ─── Comments ─────────────────────────────────────────────────
export const useNoteComments = (noteId: string) => {
  return useQuery({
    queryKey: noteKeys.comments(noteId),
    queryFn: () => meetingNoteService.getComments(noteId),
    enabled: !!noteId,
  });
};

export const useAddNoteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content, parentId }: { noteId: string; content: string; parentId?: string }) =>
      meetingNoteService.addComment(noteId, content, parentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.comments(variables.noteId) });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.noteId) });
    },
  });
};

export const useDeleteNoteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, commentId }: { noteId: string; commentId: string }) =>
      meetingNoteService.deleteComment(noteId, commentId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.comments(variables.noteId) });
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.noteId) });
    },
  });
};

// ─── Rating ───────────────────────────────────────────────────
export const useUpsertNoteRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, rating }: { noteId: string; rating: number }) =>
      meetingNoteService.upsertRating(noteId, rating),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(variables.noteId) });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

export const useDeleteNoteRating = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => meetingNoteService.deleteRating(noteId),
    onSuccess: (_data, noteId) => {
      queryClient.invalidateQueries({ queryKey: noteKeys.detail(noteId) });
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

// ─── Backlinks ────────────────────────────────────────────────
export const useBacklinks = (noteId: string) => {
  return useQuery({
    queryKey: noteKeys.backlinks(noteId),
    queryFn: () => meetingNoteService.getBacklinks(noteId),
    enabled: !!noteId,
    staleTime: 1000 * 60,
  });
};

// ─── Folders ──────────────────────────────────────────────────
export const useMeetingNoteFolders = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: noteKeys.folders(entityId),
    queryFn: () => meetingNoteService.getFolders(),
    staleTime: 1000 * 60,
    enabled: !!entityId,
  });
};

export const useCreateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FolderFormData) => meetingNoteService.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, data }: { folderId: string; data: Partial<FolderFormData> }) =>
      meetingNoteService.updateFolder(folderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};

export const useDeleteFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => meetingNoteService.deleteFolder(folderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
};
