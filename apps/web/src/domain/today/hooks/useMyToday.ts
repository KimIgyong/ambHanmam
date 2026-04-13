import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { todayService } from '../service/today.service';
import { translationService } from '@/domain/translations/service/translation.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { apiClient } from '@/lib/api-client';

export const todayKeys = {
  all: ['today'] as const,
  me: (entityId?: string) => [...todayKeys.all, 'me', entityId] as const,
  team: (entityId?: string) => [...todayKeys.all, 'team', entityId] as const,
  cell: (entityId?: string) => [...todayKeys.all, 'cell', entityId] as const,
  everyone: (entityId?: string) => [...todayKeys.all, 'everyone', entityId] as const,
  snapshotCalendar: (year: number, month: number) => [...todayKeys.all, 'snapshot-calendar', year, month] as const,
  snapshotDetail: (date: string) => [...todayKeys.all, 'snapshot-detail', date] as const,
};

export const useMyToday = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: todayKeys.me(entityId),
    queryFn: () => todayService.getMyToday(),
    staleTime: 1000 * 60,
    enabled: !!entityId,
  });
};

export const useAllToday = (enabled = true) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: todayKeys.everyone(entityId),
    queryFn: () => todayService.getAllToday(),
    staleTime: 1000 * 60 * 2,
    enabled: !!entityId && enabled,
  });
};

export const useTeamToday = (enabled = true) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: todayKeys.team(entityId),
    queryFn: () => todayService.getTeamToday(),
    staleTime: 1000 * 60 * 2,
    enabled: !!entityId && enabled,
  });
};

export const useCellToday = (enabled = true) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: todayKeys.cell(entityId),
    queryFn: () => todayService.getCellToday(),
    staleTime: 1000 * 60 * 2,
    enabled: !!entityId && enabled,
  });
};

export const useTodayReports = (scope?: string) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['today', 'reports', entityId, scope],
    queryFn: () => todayService.getReports(scope),
    enabled: !!entityId,
  });
};

export const useSaveTodayReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; scope: string }) =>
      todayService.saveReport(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['today', 'reports'] }); },
  });
};

export const useDeleteTodayReport = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => todayService.deleteReport(reportId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['today', 'reports'] }); },
  });
};

// ─── Hide/Unhide Member ─────────────────────────────

export const useToggleMemberHidden = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, hidden }: { userId: string; hidden: boolean }) =>
      todayService.toggleMemberHidden(userId, hidden),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

// ─── Mission Hooks ──────────────────────────────────

export const useSaveMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string | null) => todayService.saveMission(content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

export const useUpdateMission = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, content }: { date: string; content: string }) =>
      todayService.updateMission(date, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

export const useSaveMissionCheck = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ date, lines }: { date: string; lines: import('../service/today.service').MissionCheckLine[] }) =>
      todayService.saveMissionCheck(date, lines),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

// ─── Snapshot Hooks ─────────────────────────────────

export const useSnapshotCalendar = (year: number, month: number) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: todayKeys.snapshotCalendar(year, month),
    queryFn: () => todayService.getSnapshotCalendar(year, month),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId,
  });
};

export const useSnapshotDetail = (date: string, enabled = true) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: todayKeys.snapshotDetail(date),
    queryFn: () => todayService.getSnapshotDetail(date),
    enabled: !!entityId && !!date && enabled,
    staleTime: 1000 * 60 * 5,
  });
};

export const useAddSnapshotMemo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ snpId, content }: { snpId: string; content: string }) =>
      todayService.addSnapshotMemo(snpId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

export const useUpdateSnapshotMemo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ snpId, memoId, content }: { snpId: string; memoId: string; content: string }) =>
      todayService.updateSnapshotMemo(snpId, memoId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

export const useDeleteSnapshotMemo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ snpId, memoId }: { snpId: string; memoId: string }) =>
      todayService.deleteSnapshotMemo(snpId, memoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: todayKeys.all });
    },
  });
};

// ─── Content Translation (Report / Mission) ─────────

export const useTranslateContent = () => {
  return useMutation({
    mutationFn: async (params: {
      sourceType: string;
      sourceId: string;
      sourceFields: string[];
      targetLang: string;
      sourceText?: string;
      sourceLang?: string;
    }): Promise<string> => {
      return new Promise((resolve, reject) => {
        let fullContent = '';
        if (params.sourceText) {
          // 직접 텍스트 번역 (DB 저장 없음)
          translationService.translateTextStreamFetch(
            { text: params.sourceText, source_lang: params.sourceLang || 'en', target_lang: params.targetLang },
            (data) => {
              if (data.content) fullContent += data.content;
            },
            () => resolve(fullContent),
            (err) => reject(new Error(err)),
          );
        } else {
          translationService.translateStreamFetch(
            {
              source_type: params.sourceType,
              source_id: params.sourceId,
              source_fields: params.sourceFields,
              target_lang: params.targetLang,
            },
            (data) => {
              if (data.content) fullContent += data.content;
              if (data.fullContent) fullContent = data.fullContent;
            },
            () => resolve(fullContent),
            (err) => reject(new Error(err)),
          );
        }
      });
    },
  });
};

// ─── Organization Hooks (Units / Cells) ──────────────

export const useOrganizationUnits = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['organization', 'units', entityId],
    queryFn: () => apiClient.get('/entity-settings/organization/units').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId,
  });
};

export const useOrganizationCells = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['organization', 'cells', entityId],
    queryFn: () => apiClient.get('/entity-settings/organization/cells').then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!entityId,
  });
};
