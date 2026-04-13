import { apiClient } from '@/lib/api-client';

interface ListResponse<T> {
  success: boolean;
  data: T[];
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface DocTypeResponse {
  dtpId: string;
  entId: string;
  dtpCode: string;
  dtpName: string;
  dtpNameKr: string;
  dtpDescription: string;
  dtpSectionTemplate: any[];
  dtpBaseDataRefs: string[];
  dtpInheritsFrom: string | null;
  dtpIsActive: boolean;
}

export interface DocBaseCategoryResponse {
  dbcId: string;
  entId: string;
  dbcCode: string;
  dbcName: string;
  dbcNameKr: string;
  dbcDescription: string;
  dbcFieldSchema: FieldSchema[];
  dbcDataSource: string;
  dbcConfidentiality: string;
  dbcDisplayOrder: number;
  dbcIsActive: boolean;
}

export interface FieldSchema {
  field: string;
  type: string;
  required: boolean;
  label: string;
  schema?: Record<string, string>;
}

export interface DocBaseDataResponse {
  dbdId: string;
  dbcId: string;
  entId: string;
  dbdLanguage: string;
  dbdData: Record<string, any>;
  dbdVersion: number;
  dbdIsCurrent: boolean;
  dbdUpdatedBy: string;
  dbdUpdateSource: string;
  dbdFreshnessAt: string;
  dbdCreatedAt: string;
  dbdUpdatedAt: string;
  category?: DocBaseCategoryResponse;
}

export interface DocBaseDataHistoryResponse {
  dbhId: string;
  dbdId: string;
  dbhVersion: number;
  dbhData: Record<string, any>;
  dbhChangeReason: string;
  dbhChangedBy: string;
  dbhCreatedAt: string;
}

export interface CompletenessResponse {
  categoryCode: string;
  categoryName: string;
  hasData: boolean;
  fieldCount: number;
  filledCount: number;
  completeness: number;
}

export interface DocGeneratedResponse {
  dgnId: string;
  entId: string;
  dtpId: string;
  dgnTitle: string;
  dgnAudienceType: string;
  dgnLanguage: string;
  dgnFileFormat: string;
  dgnStatus: string;
  dgnSectionsConfig: any[];
  dgnAiModel: string;
  dgnFileSizeBytes: number;
  dgnGeneratedBy: string;
  dgnCreatedAt: string;
  dgnUpdatedAt: string;
  docType?: DocTypeResponse;
}

export interface GenerateDocumentRequest {
  doc_type_id: string;
  audience: string;
  language: string;
  format: string;
  title?: string;
  sections?: string[];
}

export interface SectionDiffResponse {
  sectionCode: string;
  sectionName: string;
  changeType: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';
  similarity: number;
  changes: { type: 'added' | 'removed' | 'unchanged'; text: string; lineNumber?: number }[];
}

export interface DataUpdateProposalResponse {
  categoryCode: string;
  categoryName: string;
  field: string;
  currentValue: any;
  proposedValue: any;
  reason: string;
  confidence: number;
  source: string;
}

export interface DiffAnalysisResponse {
  documentId: string;
  editHistoryId: string;
  sectionDiffs: SectionDiffResponse[];
  dataUpdateProposals: DataUpdateProposalResponse[];
  summary: {
    totalSections: number;
    modifiedSections: number;
    addedSections: number;
    removedSections: number;
    overallSimilarity: number;
  };
}

export interface EditHistoryResponse {
  dehId: string;
  dgnId: string;
  dehAction: string;
  dehDiffResult: any;
  dehBaseDataUpdates: any;
  dehUserId: string;
  dehNotes: string;
  dehCreatedAt: string;
  user?: { name: string; email: string };
}

export interface StaleDocumentResponse {
  dgnId: string;
  dgnTitle: string;
  reason: string;
}

export interface SyncResultResponse {
  category: string;
  action: 'CREATED' | 'UPDATED' | 'SKIPPED';
  version: number;
  fieldCount: number;
}

export interface DddSyncSummaryResponse {
  dashboardId: string;
  period: string;
  syncedAt: string;
  results: SyncResultResponse[];
}

export interface ModuleSyncResultResponse {
  module: string;
  categories: { code: string; action: 'CREATED' | 'UPDATED' | 'SKIPPED'; fieldCount: number }[];
  syncedAt: string;
}

export interface SyncStatusResponse {
  ddd: { lastSyncAt: string | null; categoriesCount: number };
  billing: { lastSyncAt: string | null; categoriesCount: number };
  hr: { lastSyncAt: string | null; categoriesCount: number };
}

export interface StaleReportResponse {
  staleData: {
    dbdId: string;
    categoryCode: string;
    categoryName: string;
    language: string;
    lastUpdated: string;
    daysSinceUpdate: number;
    dataSource: string;
  }[];
  affectedDocuments: {
    dgnId: string;
    title: string;
    status: string;
    createdAt: string;
    staleCategories: string[];
  }[];
  checkedAt: string;
  thresholdDays: number;
}

// ===== Extraction / Conflict / Gap Types =====

export interface ExtractionResultResponse {
  sourceFile: string;
  categories: ExtractedCategoryResponse[];
}

export interface ExtractedCategoryResponse {
  categoryCode: string;
  categoryName: string;
  data: Record<string, any>;
  confidence: number;
}

export interface ConflictReportResponse {
  totalConflicts: number;
  items: ConflictItemResponse[];
}

export interface ConflictItemResponse {
  categoryCode: string;
  categoryName: string;
  fieldKey: string;
  fieldLabel: string;
  values: { source: string; value: any }[];
}

export interface ComparisonResultResponse {
  totalDifferences: number;
  items: {
    categoryCode: string;
    categoryName: string;
    fieldKey: string;
    fieldLabel: string;
    existingValue: any;
    extractedValue: any;
    isDifferent: boolean;
  }[];
}

export interface GapReportResponse {
  totalGaps: number;
  criticalGaps: number;
  items: GapItemResponse[];
}

export interface GapItemResponse {
  categoryCode: string;
  categoryName: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface PreviewSectionResponse {
  code: string;
  name: string;
  content: string;
}

export interface DocAssetResponse {
  dasId: string;
  entId: string;
  dasName: string;
  dasType: string;
  dasDescription: string;
  dasDriveFileId: string;
  dasDriveUrl: string;
  dasMimeType: string;
  dasDimensions: any;
  dasTags: string[];
  dasIsActive: boolean;
  dasCreatedAt: string;
}

export interface BrandConfigResponse {
  primary: string;
  secondary: string;
  accent: string;
  fontTitle: string;
  fontBody: string;
  logoUrl?: string;
}

class DocBuilderService {
  private readonly basePath = '/kms/doc-builder';

  // Doc Types
  getDocTypes = () =>
    apiClient
      .get<ListResponse<DocTypeResponse>>(`${this.basePath}/types`)
      .then((r) => r.data.data);

  getDocType = (dtpId: string) =>
    apiClient
      .get<SingleResponse<DocTypeResponse>>(`${this.basePath}/types/${dtpId}`)
      .then((r) => r.data.data);

  getDocTypeBaseDataRefs = (dtpId: string) =>
    apiClient
      .get<SingleResponse<string[]>>(`${this.basePath}/types/${dtpId}/base-data-refs`)
      .then((r) => r.data.data);

  // Categories
  getCategories = () =>
    apiClient
      .get<ListResponse<DocBaseCategoryResponse>>(`${this.basePath}/categories`)
      .then((r) => r.data.data);

  getCategory = (dbcId: string) =>
    apiClient
      .get<SingleResponse<DocBaseCategoryResponse>>(`${this.basePath}/categories/${dbcId}`)
      .then((r) => r.data.data);

  // Base Data
  getData = (params?: { category?: string; language?: string }) =>
    apiClient
      .get<ListResponse<DocBaseDataResponse>>(`${this.basePath}/data`, { params })
      .then((r) => r.data.data);

  getDataById = (dbdId: string) =>
    apiClient
      .get<SingleResponse<DocBaseDataResponse>>(`${this.basePath}/data/${dbdId}`)
      .then((r) => r.data.data);

  createData = (data: { category_id: string; language?: string; data: any; update_source?: string }) =>
    apiClient
      .post<SingleResponse<DocBaseDataResponse>>(`${this.basePath}/data`, data)
      .then((r) => r.data.data);

  updateData = (dbdId: string, data: { data: any; change_reason?: string; update_source?: string }) =>
    apiClient
      .put<SingleResponse<DocBaseDataResponse>>(`${this.basePath}/data/${dbdId}`, data)
      .then((r) => r.data.data);

  // History
  getHistory = (dbdId: string) =>
    apiClient
      .get<ListResponse<DocBaseDataHistoryResponse>>(`${this.basePath}/data/${dbdId}/history`)
      .then((r) => r.data.data);

  rollback = (dbdId: string, version: number) =>
    apiClient
      .post<SingleResponse<DocBaseDataResponse>>(`${this.basePath}/data/${dbdId}/rollback/${version}`)
      .then((r) => r.data.data);

  // Completeness
  getCompleteness = (language?: string) =>
    apiClient
      .get<ListResponse<CompletenessResponse>>(`${this.basePath}/completeness`, {
        params: { language },
      })
      .then((r) => r.data.data);

  // Document Generation
  generateDocument = (data: GenerateDocumentRequest) =>
    apiClient
      .post<SingleResponse<DocGeneratedResponse>>(`${this.basePath}/generate`, data)
      .then((r) => r.data.data);

  getDocuments = () =>
    apiClient
      .get<ListResponse<DocGeneratedResponse>>(`${this.basePath}/documents`)
      .then((r) => r.data.data);

  getDocument = (dgnId: string) =>
    apiClient
      .get<SingleResponse<DocGeneratedResponse>>(`${this.basePath}/documents/${dgnId}`)
      .then((r) => r.data.data);

  downloadDocument = (dgnId: string) =>
    apiClient
      .get(`${this.basePath}/documents/${dgnId}/download`, { responseType: 'blob' })
      .then((r) => r.data);

  updateDocumentStatus = (dgnId: string, status: string) =>
    apiClient
      .put<SingleResponse<DocGeneratedResponse>>(`${this.basePath}/documents/${dgnId}/status`, { status })
      .then((r) => r.data.data);

  // Re-upload + Diff
  reUploadDocument = (dgnId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient
      .post<SingleResponse<DiffAnalysisResponse>>(`${this.basePath}/documents/${dgnId}/re-upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);
  };

  getDiffResult = (dgnId: string, dehId: string) =>
    apiClient
      .get<SingleResponse<DiffAnalysisResponse>>(`${this.basePath}/documents/${dgnId}/diff/${dehId}`)
      .then((r) => r.data.data);

  getEditHistory = (dgnId: string) =>
    apiClient
      .get<ListResponse<EditHistoryResponse>>(`${this.basePath}/documents/${dgnId}/edit-history`)
      .then((r) => r.data.data);

  // Lifecycle
  transitionDocument = (dgnId: string, status: string, notes?: string) =>
    apiClient
      .post<SingleResponse<DocGeneratedResponse>>(`${this.basePath}/documents/${dgnId}/transition`, { status, notes })
      .then((r) => r.data.data);

  getDocumentTimeline = (dgnId: string) =>
    apiClient
      .get<ListResponse<EditHistoryResponse>>(`${this.basePath}/documents/${dgnId}/timeline`)
      .then((r) => r.data.data);

  getValidTransitions = (dgnId: string) =>
    apiClient
      .get<SingleResponse<string[]>>(`${this.basePath}/documents/${dgnId}/valid-transitions`)
      .then((r) => r.data.data);

  checkStaleness = () =>
    apiClient
      .get<ListResponse<StaleDocumentResponse>>(`${this.basePath}/stale-check`)
      .then((r) => r.data.data);

  // Cross-Module Sync
  syncDdd = () =>
    apiClient
      .post<SingleResponse<DddSyncSummaryResponse>>(`${this.basePath}/sync/ddd`)
      .then((r) => r.data.data);

  syncBilling = () =>
    apiClient
      .post<SingleResponse<ModuleSyncResultResponse>>(`${this.basePath}/sync/billing`)
      .then((r) => r.data.data);

  syncHr = () =>
    apiClient
      .post<SingleResponse<ModuleSyncResultResponse>>(`${this.basePath}/sync/hr`)
      .then((r) => r.data.data);

  getSyncStatus = () =>
    apiClient
      .get<SingleResponse<SyncStatusResponse>>(`${this.basePath}/sync/status`)
      .then((r) => r.data.data);

  getStaleReport = (threshold?: number) =>
    apiClient
      .get<SingleResponse<StaleReportResponse>>(`${this.basePath}/stale-report`, {
        params: threshold ? { threshold } : undefined,
      })
      .then((r) => r.data.data);

  // ===== AI Extraction =====

  extractFromFile = (fileId: string) =>
    apiClient
      .post<SingleResponse<ExtractionResultResponse>>(`${this.basePath}/extract/${fileId}`)
      .then((r) => r.data.data);

  applyExtraction = (data: { extractions: { categoryCode: string; data: Record<string, any>; language?: string }[] }) =>
    apiClient
      .post<SingleResponse<{ applied: boolean }>>(`${this.basePath}/extract/apply`, data)
      .then((r) => r.data.data);

  // ===== Conflict Detection =====

  detectConflicts = (extractions: ExtractionResultResponse[]) =>
    apiClient
      .post<SingleResponse<ConflictReportResponse>>(`${this.basePath}/conflicts/detect`, { extractions })
      .then((r) => r.data.data);

  compareWithExisting = (extracted: ExtractedCategoryResponse[], language?: string) =>
    apiClient
      .post<SingleResponse<ComparisonResultResponse>>(`${this.basePath}/conflicts/compare`, { extracted, language })
      .then((r) => r.data.data);

  // ===== Gap Analysis =====

  getGapAnalysis = (language?: string) =>
    apiClient
      .get<SingleResponse<GapReportResponse>>(`${this.basePath}/gaps`, {
        params: language ? { language } : undefined,
      })
      .then((r) => r.data.data);

  // ===== Preview =====

  getDocumentPreview = (data: { doc_type_id: string; audience: string; language: string; sections?: string[] }) =>
    apiClient
      .post<SingleResponse<PreviewSectionResponse[]>>(`${this.basePath}/preview`, data)
      .then((r) => r.data.data);

  // ===== Assets =====

  getAssets = (params?: { type?: string }) =>
    apiClient
      .get<ListResponse<DocAssetResponse>>(`${this.basePath}/assets`, { params })
      .then((r) => r.data.data);

  uploadAsset = (formData: FormData) =>
    apiClient
      .post<SingleResponse<DocAssetResponse>>(`${this.basePath}/assets`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data);

  deleteAsset = (dasId: string) =>
    apiClient
      .delete(`${this.basePath}/assets/${dasId}`)
      .then((r) => r.data);

  // ===== Brand Config =====

  getBrandConfig = () =>
    apiClient
      .get<SingleResponse<BrandConfigResponse>>(`${this.basePath}/brand-config`)
      .then((r) => r.data.data);
}

export const docBuilderService = new DocBuilderService();
