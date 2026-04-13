import { useQuery } from '@tanstack/react-query';
import { billingReportApiService } from '../service/billing-report.service';
import { useEntityStore } from '@/domain/hr/store/entity.store';

const reportKeys = {
  all: ['bil-reports'] as const,
  summary: (entityId: string | undefined) => [...reportKeys.all, 'summary', entityId] as const,
  revenue: (entityId: string | undefined, year: number) => [...reportKeys.all, 'revenue', entityId, year] as const,
  outstanding: (entityId: string | undefined) => [...reportKeys.all, 'outstanding', entityId] as const,
  timeline: (entityId: string | undefined) => [...reportKeys.all, 'timeline', entityId] as const,
  partnerDist: (entityId: string | undefined) => [...reportKeys.all, 'partner-dist', entityId] as const,
  monthlyMatrix: (entityId: string | undefined, year: number) => [...reportKeys.all, 'monthly-matrix', entityId, year] as const,
  taxInvoices: (entityId: string | undefined, year?: number, month?: number) => [...reportKeys.all, 'tax-invoices', entityId, year, month] as const,
  categoryBreakdown: (entityId: string | undefined) => [...reportKeys.all, 'category-breakdown', entityId] as const,
  consolidated: () => [...reportKeys.all, 'consolidated'] as const,
};

export const useDashboardSummary = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.summary(entityId),
    queryFn: () => billingReportApiService.getSummary(),
    enabled: !!entityId,
  });
};

export const useRevenueSummary = (year: number) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.revenue(entityId, year),
    queryFn: () => billingReportApiService.getRevenueSummary(year),
    enabled: !!entityId,
  });
};

export const useOutstandingReport = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.outstanding(entityId),
    queryFn: () => billingReportApiService.getOutstandingReport(),
    enabled: !!entityId,
  });
};

export const useContractTimeline = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.timeline(entityId),
    queryFn: () => billingReportApiService.getContractTimeline(),
    enabled: !!entityId,
  });
};

export const usePartnerDistribution = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.partnerDist(entityId),
    queryFn: () => billingReportApiService.getPartnerDistribution(),
    enabled: !!entityId,
  });
};

export const useMonthlyMatrix = (year: number) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.monthlyMatrix(entityId, year),
    queryFn: () => billingReportApiService.getMonthlyMatrix(year),
    enabled: !!entityId,
  });
};

export const useTaxInvoiceHistory = (params?: { year?: number; month?: number }) => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.taxInvoices(entityId, params?.year, params?.month),
    queryFn: () => billingReportApiService.getTaxInvoiceHistory(params),
    enabled: !!entityId,
  });
};

export const useCategoryBreakdown = () => {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: reportKeys.categoryBreakdown(entityId),
    queryFn: () => billingReportApiService.getCategoryBreakdown(),
    enabled: !!entityId,
  });
};

export const useConsolidatedSummary = () => {
  return useQuery({
    queryKey: reportKeys.consolidated(),
    queryFn: () => billingReportApiService.getConsolidatedSummary(),
  });
};
