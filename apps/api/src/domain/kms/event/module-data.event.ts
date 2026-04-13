export interface ModuleDataEvent {
  module: string;   // 'todo' | 'billing' | 'meeting-notes' | 'drive' | 'issue' | 'partner' | 'notice' | 'service' | 'client' | 'talk'
  type: string;     // WorkItem type: 'TODO' | 'DOC' | 'EMAIL' | 'NOTE' | 'REPORT' | 'ISSUE'
  refId: string;    // module-specific entity ID
  title: string;
  content: string;
  ownerId: string;
  entityId?: string; // HR entity ID (optional, resolved from user if missing)
  visibility?: string; // PRIVATE | CELL | ENTITY | PUBLIC (default: PRIVATE)
  cellId?: string;    // cell ID for CELL visibility
}

export const MODULE_DATA_EVENTS = {
  CREATED: 'module.data.created',
  UPDATED: 'module.data.updated',
} as const;
