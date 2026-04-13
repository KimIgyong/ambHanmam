import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import {
  calendarService,
  CalendarListParams,
  CreateCalendarBody,
  UpdateCalendarBody,
  CreateExceptionBody,
} from '../service/calendar.service';

// ── Query Key Factory ───────────────────────────────────────

export const calendarKeys = {
  all: ['calendars'] as const,
  list: (entityId?: string, params?: CalendarListParams) =>
    [...calendarKeys.all, 'list', entityId, params] as const,
  detail: (entityId?: string, calId?: string) =>
    [...calendarKeys.all, 'detail', entityId, calId] as const,
  exceptions: (entityId?: string, calId?: string) =>
    [...calendarKeys.all, 'exceptions', entityId, calId] as const,
};

// ── Queries ─────────────────────────────────────────────────

export const useCalendarList = (params: CalendarListParams) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: calendarKeys.list(entityId, params),
    queryFn: () => calendarService.getCalendars(params),
    staleTime: 1000 * 60,
    enabled: !!entityId && !!params.start_date && !!params.end_date,
  });
};

export const useCalendarDetail = (calId: string | null) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: calendarKeys.detail(entityId, calId ?? undefined),
    queryFn: () => calendarService.getCalendar(calId!),
    staleTime: 1000 * 60,
    enabled: !!entityId && !!calId,
  });
};

export const useCalendarExceptions = (calId: string | null) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: calendarKeys.exceptions(entityId, calId ?? undefined),
    queryFn: () => calendarService.getExceptions(calId!),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId && !!calId,
  });
};

// ── Mutations ───────────────────────────────────────────────

export const useCreateCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCalendarBody) => calendarService.createCalendar(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useUpdateCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ calId, data }: { calId: string; data: UpdateCalendarBody }) =>
      calendarService.updateCalendar(calId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useDeleteCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (calId: string) => calendarService.deleteCalendar(calId),
    onSuccess: () => {
      // Remove all detail/exception queries so deleted resources aren't refetched
      queryClient.removeQueries({
        queryKey: [...calendarKeys.all, 'detail'],
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: [...calendarKeys.all, 'exceptions'],
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: [...calendarKeys.all, 'list'],
      });
    },
  });
};

export const useCreateException = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ calId, data }: { calId: string; data: CreateExceptionBody }) =>
      calendarService.createException(calId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useAddParticipants = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ calId, userIds }: { calId: string; userIds: string[] }) =>
      calendarService.addParticipants(calId, userIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useRespondCalendar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ calId, status, comment }: { calId: string; status: string; comment?: string }) =>
      calendarService.respondToCalendar(calId, status, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useRemoveParticipant = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ calId, clpId }: { calId: string; clpId: string }) =>
      calendarService.removeParticipant(calId, clpId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};

export const useGoogleSync = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (calId: string) => calendarService.syncToGoogle(calId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });
};
