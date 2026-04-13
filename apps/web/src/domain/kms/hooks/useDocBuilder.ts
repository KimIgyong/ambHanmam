import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import {
  docBuilderService,
  GenerateDocumentRequest,
  ExtractionResultResponse,
  ExtractedCategoryResponse,
} from '../service/doc-builder.service';

const KEYS = {
  all: ['kms', 'doc-builder'] as const,
  types: (entityId?: string) => ['kms', 'doc-builder', 'types', entityId] as const,
  categories: (entityId?: string) => ['kms', 'doc-builder', 'categories', entityId] as const,
  data: (entityId?: string, category?: string, language?: string) =>
    ['kms', 'doc-builder', 'data', entityId, category, language] as const,
  dataById: (dbdId: string) => ['kms', 'doc-builder', 'data', dbdId] as const,
  history: (dbdId: string) => ['kms', 'doc-builder', 'history', dbdId] as const,
  completeness: (entityId?: string, language?: string) =>
    ['kms', 'doc-builder', 'completeness', entityId, language] as const,
  documents: (entityId?: string) => ['kms', 'doc-builder', 'documents', entityId] as const,
};

export function useDocTypes() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.types(entityId),
    queryFn: docBuilderService.getDocTypes,
    enabled: !!entityId,
  });
}

export function useDocCategories() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.categories(entityId),
    queryFn: docBuilderService.getCategories,
    enabled: !!entityId,
  });
}

export function useDocData(params?: { category?: string; language?: string }) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.data(entityId, params?.category, params?.language),
    queryFn: () => docBuilderService.getData(params),
    enabled: !!entityId,
  });
}

export function useDocDataById(dbdId: string) {
  return useQuery({
    queryKey: KEYS.dataById(dbdId),
    queryFn: () => docBuilderService.getDataById(dbdId),
    enabled: !!dbdId,
  });
}

export function useDocDataHistory(dbdId: string) {
  return useQuery({
    queryKey: KEYS.history(dbdId),
    queryFn: () => docBuilderService.getHistory(dbdId),
    enabled: !!dbdId,
  });
}

export function useDocCompleteness(language?: string) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.completeness(entityId, language),
    queryFn: () => docBuilderService.getCompleteness(language),
    enabled: !!entityId,
  });
}

export function useCreateDocData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: docBuilderService.createData,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateDocData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dbdId, ...data }: { dbdId: string; data: any; change_reason?: string; update_source?: string }) =>
      docBuilderService.updateData(dbdId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useRollbackDocData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dbdId, version }: { dbdId: string; version: number }) =>
      docBuilderService.rollback(dbdId, version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

// ===== Document Generation =====

export function useGeneratedDocuments() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: KEYS.documents(entityId),
    queryFn: docBuilderService.getDocuments,
    enabled: !!entityId,
  });
}

export function useGenerateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateDocumentRequest) => docBuilderService.generateDocument(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useUpdateDocumentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dgnId, status }: { dgnId: string; status: string }) =>
      docBuilderService.updateDocumentStatus(dgnId, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

// ===== Re-upload + Diff =====

export function useReUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dgnId, file }: { dgnId: string; file: File }) =>
      docBuilderService.reUploadDocument(dgnId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useEditHistory(dgnId: string) {
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'edit-history', dgnId] as const,
    queryFn: () => docBuilderService.getEditHistory(dgnId),
    enabled: !!dgnId,
  });
}

// ===== Lifecycle =====

export function useTransitionDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ dgnId, status, notes }: { dgnId: string; status: string; notes?: string }) =>
      docBuilderService.transitionDocument(dgnId, status, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useDocumentTimeline(dgnId: string) {
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'timeline', dgnId] as const,
    queryFn: () => docBuilderService.getDocumentTimeline(dgnId),
    enabled: !!dgnId,
  });
}

export function useValidTransitions(dgnId: string) {
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'valid-transitions', dgnId] as const,
    queryFn: () => docBuilderService.getValidTransitions(dgnId),
    enabled: !!dgnId,
  });
}

// ===== Cross-Module Sync =====

export function useSyncDdd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: docBuilderService.syncDdd,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useSyncBilling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: docBuilderService.syncBilling,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useSyncHr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: docBuilderService.syncHr,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useSyncStatus() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'sync-status', entityId] as const,
    queryFn: docBuilderService.getSyncStatus,
    enabled: !!entityId,
  });
}

export function useStaleReport() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'stale-report', entityId] as const,
    queryFn: () => docBuilderService.getStaleReport(),
    enabled: !!entityId,
  });
}

// ===== AI Extraction =====

export function useExtractFromFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fileId: string) => docBuilderService.extractFromFile(fileId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

export function useApplyExtraction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { extractions: { categoryCode: string; data: Record<string, any>; language?: string }[] }) =>
      docBuilderService.applyExtraction(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
    },
  });
}

// ===== Conflict Detection =====

export function useDetectConflicts() {
  return useMutation({
    mutationFn: (extractions: ExtractionResultResponse[]) =>
      docBuilderService.detectConflicts(extractions),
  });
}

export function useCompareWithExisting() {
  return useMutation({
    mutationFn: ({ extracted, language }: { extracted: ExtractedCategoryResponse[]; language?: string }) =>
      docBuilderService.compareWithExisting(extracted, language),
  });
}

// ===== Gap Analysis =====

export function useGapAnalysis(language?: string) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'gaps', entityId, language] as const,
    queryFn: () => docBuilderService.getGapAnalysis(language),
    enabled: !!entityId,
  });
}

// ===== Preview =====

export function useDocumentPreview() {
  return useMutation({
    mutationFn: (data: { doc_type_id: string; audience: string; language: string; sections?: string[] }) =>
      docBuilderService.getDocumentPreview(data),
  });
}

// ===== Assets =====

export function useDocAssets(type?: string) {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'assets', entityId, type] as const,
    queryFn: () => docBuilderService.getAssets(type ? { type } : undefined),
    enabled: !!entityId,
  });
}

export function useUploadAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => docBuilderService.uploadAsset(formData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kms', 'doc-builder', 'assets'] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dasId: string) => docBuilderService.deleteAsset(dasId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kms', 'doc-builder', 'assets'] });
    },
  });
}

// ===== Brand Config =====

export function useBrandConfig() {
  const entityId = useEntityStore((s) => s.currentEntity?.entityId);
  return useQuery({
    queryKey: ['kms', 'doc-builder', 'brand-config', entityId] as const,
    queryFn: docBuilderService.getBrandConfig,
    enabled: !!entityId,
  });
}
