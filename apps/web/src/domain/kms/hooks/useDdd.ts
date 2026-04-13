import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { dddService } from '../service/ddd.service';

const KEYS = {
  all: ['kms', 'ddd'] as const,
  frameworks: (entityId?: string) => ['kms', 'ddd', 'frameworks', entityId] as const,
  framework: (fwkId: string) => ['kms', 'ddd', 'frameworks', fwkId] as const,
  dashboards: (entityId?: string) => ['kms', 'ddd', 'dashboards', entityId] as const,
  dashboard: (ddbId: string) => ['kms', 'ddd', 'dashboards', ddbId] as const,
  snapshots: (ddbId: string, period?: string) => ['kms', 'ddd', 'snapshots', ddbId, period] as const,
  overview: (ddbId: string, period: string) => ['kms', 'ddd', 'overview', ddbId, period] as const,
  gauges: (ddbId: string) => ['kms', 'ddd', 'gauges', ddbId] as const,
  insights: (ddbId: string, period?: string) => ['kms', 'ddd', 'insights', ddbId, period] as const,
};

export function useDddFrameworks() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.frameworks(entityId),
    queryFn: dddService.getFrameworks,
    enabled: !!entityId,
  });
}

export function useDddFramework(fwkId: string) {
  return useQuery({
    queryKey: KEYS.framework(fwkId),
    queryFn: () => dddService.getFramework(fwkId),
    enabled: !!fwkId,
  });
}

export function useDddDashboards() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.dashboards(entityId),
    queryFn: dddService.getDashboards,
    enabled: !!entityId,
  });
}

export function useDddDashboard(ddbId: string) {
  return useQuery({
    queryKey: KEYS.dashboard(ddbId),
    queryFn: () => dddService.getDashboard(ddbId),
    enabled: !!ddbId,
  });
}

export function useDddStageOverview(ddbId: string, period: string) {
  return useQuery({
    queryKey: KEYS.overview(ddbId, period),
    queryFn: () => dddService.getStageOverview(ddbId, period),
    enabled: !!ddbId && !!period,
  });
}

export function useDddSnapshots(ddbId: string, period?: string) {
  return useQuery({
    queryKey: KEYS.snapshots(ddbId, period),
    queryFn: () => dddService.getSnapshots(ddbId, { period }),
    enabled: !!ddbId,
  });
}

export function useDddLatestGauges(ddbId: string) {
  return useQuery({
    queryKey: KEYS.gauges(ddbId),
    queryFn: () => dddService.getLatestGaugeScores(ddbId),
    enabled: !!ddbId,
  });
}

export function useCreateDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: dddService.createDashboard,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useCreateSnapshot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ddbId, ...data }: { ddbId: string; metric_id: string; period: string; value: number; target?: number; annotation?: string }) =>
      dddService.createSnapshot(ddbId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useBulkCreateSnapshots() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ddbId, ...data }: { ddbId: string; period: string; snapshots: { metric_id: string; value: number; target?: number }[] }) =>
      dddService.bulkCreateSnapshots(ddbId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useBulkCreateGaugeScores() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ddbId, ...data }: { ddbId: string; period: string; scores: { dimension: string; score: number }[] }) =>
      dddService.bulkCreateGaugeScores(ddbId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

// ===== Data Collection =====

export function useCollectData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ddbId, period }: { ddbId: string; period: string }) =>
      dddService.collectData(ddbId, period),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

// ===== AI Analysis + Insights =====

export function useDddInsights(ddbId: string, period?: string) {
  return useQuery({
    queryKey: KEYS.insights(ddbId, period),
    queryFn: () => dddService.getInsights(ddbId, period),
    enabled: !!ddbId,
  });
}

export function useAnalyzeDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ ddbId, period, types }: { ddbId: string; period: string; types?: string[] }) =>
      dddService.analyzeDashboard(ddbId, period, types),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useMarkInsightActioned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (aisId: string) => dddService.markInsightActioned(aisId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}
