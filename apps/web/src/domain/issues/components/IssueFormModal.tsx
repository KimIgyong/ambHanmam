import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Search, Upload, FileText, Loader2, ExternalLink, Trash2, Globe, Link as LinkIcon, RotateCcw } from 'lucide-react';
import { IssueResponse } from '@amb/types';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import { useProjectList } from '@/domain/project/hooks/useProject';
import { useEpics, useComponents } from '@/domain/project/hooks/useWbs';
import { issueService } from '../service/issue.service';
import { driveApiService } from '@/domain/drive/service/drive.service';
import { useRegisteredFolders, useDriveStatus } from '@/domain/drive/hooks/useDrive';
import { apiClient } from '@/lib/api-client';
import { translationService } from '@/domain/translations/service/translation.service';
import AssigneeSelector from './AssigneeSelector';
import ParticipantSelector from './ParticipantSelector';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';

interface IssueFormInitialData {
  type?: string;
  title?: string;
  description?: string;
  severity?: string;
  priority?: number;
  project_id?: string;
  start_date?: string;
  due_date?: string;
  visibility?: string;
  cell_id?: string;
  participant_ids?: string[];
}

interface IssueFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    title: string;
    description?: string;
    severity: string;
    priority: number;
    affected_modules?: string[];
    assignee_id?: string | null;
    participant_ids?: string[];
    resolution?: string;
    project_id?: string;
    epic_id?: string | null;
    component_id?: string | null;
    start_date?: string;
    due_date?: string;
    done_ratio?: number;
    parent_issue_id?: string;
    google_drive_link?: string;
  }) => void;
  editingIssue?: IssueResponse | null;
  defaultProjectId?: string;
  initialData?: IssueFormInitialData | null;
}

export default function IssueFormModal({ isOpen, onClose, onSubmit, editingIssue, defaultProjectId, initialData }: IssueFormModalProps) {
  const { t } = useTranslation(['issues', 'common', 'project']);
  const currentUser = useAuthStore((s) => s.user);
  const { data: projects = [] } = useProjectList();
  const { data: driveStatus } = useDriveStatus();
  const { data: registeredFolders = [] } = useRegisteredFolders();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MAJOR');
  const [priority, setPriority] = useState(3);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [affectedModules, setAffectedModules] = useState('');
  const [resolution, setResolution] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [epicId, setEpicId] = useState('');
  const [componentId, setComponentId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [doneRatio, setDoneRatio] = useState(0);
  const [parentIssueId, setParentIssueId] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');

  // File upload state
  interface UploadedFile {
    fileId: string;
    name: string;
    webViewLink: string;
    size: number;
    source?: 'drive' | 'local';
  }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [attachTab, setAttachTab] = useState<'upload' | 'url'>('upload');
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Parent issue search
  const [parentSearch, setParentSearch] = useState('');
  const [parentIssues, setParentIssues] = useState<IssueResponse[]>([]);
  const [parentIssueTitle, setParentIssueTitle] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  // Project search
  const [projectName, setProjectName] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  // 번역 상태
  const [translateLang, setTranslateLang] = useState<'ko' | 'en' | 'vi' | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedPreview, setTranslatedPreview] = useState<{ title: string; description: string } | null>(null);
  const translateAbortRef = useRef<AbortController | null>(null);

  // Auto-save draft
  const DRAFT_KEY = 'amb_issue_draft';
  const [hasDraft, setHasDraft] = useState(false);
  const [draftTimestamp, setDraftTimestamp] = useState('');
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const formDataRef = useRef({ type, title, description, severity, priority, affectedModules, resolution, projectId, startDate, dueDate, doneRatio, parentIssueId, parentIssueTitle, googleDriveLink, assigneeId, participantIds });

  // Keep ref in sync
  useEffect(() => {
    formDataRef.current = { type, title, description, severity, priority, affectedModules, resolution, projectId, startDate, dueDate, doneRatio, parentIssueId, parentIssueTitle, googleDriveLink, assigneeId, participantIds };
  }, [type, title, description, severity, priority, affectedModules, resolution, projectId, startDate, dueDate, doneRatio, parentIssueId, parentIssueTitle, googleDriveLink, assigneeId, participantIds]);

  const saveDraft = useCallback(() => {
    const d = formDataRef.current;
    if (!d.title.trim() && !d.description.trim()) return;
    const draft = { ...d, savedAt: new Date().toISOString() };
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* ignore */ }
  }, []);

  const loadDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }, []);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    setHasDraft(false);
  }, []);

  const restoreDraft = useCallback(() => {
    const draft = loadDraft();
    if (!draft) return;
    setType(draft.type || 'BUG');
    setTitle(draft.title || '');
    setDescription(draft.description || '');
    setSeverity(draft.severity || 'MAJOR');
    setPriority(draft.priority ?? 3);
    setAffectedModules(draft.affectedModules || '');
    setResolution(draft.resolution || '');
    setProjectId(draft.projectId || '');
    // Resolve project name for draft
    const draftProject = projects.find((p) => p.projectId === draft.projectId);
    setProjectName(draftProject ? (draftProject.code ? `[${draftProject.code}] ${draftProject.name}` : draftProject.name) : '');
    setProjectSearch('');
    setStartDate(draft.startDate || '');
    setDueDate(draft.dueDate || '');
    setDoneRatio(draft.doneRatio ?? 0);
    setParentIssueId(draft.parentIssueId || '');
    setParentIssueTitle(draft.parentIssueTitle || '');
    setGoogleDriveLink(draft.googleDriveLink || '');
    if (draft.assigneeId !== undefined) setAssigneeId(draft.assigneeId);
    if (draft.participantIds) setParticipantIds(draft.participantIds);
    setHasDraft(false);
  }, [loadDraft, projects]);

  const driveConfigured = driveStatus?.configured && registeredFolders.length > 0;
  const uploadFolderId = registeredFolders.length > 0 ? registeredFolders[0].folderId : '';

  useEffect(() => {
    if (editingIssue) {
      setType(editingIssue.type);
      setTitle(editingIssue.title);
      setDescription(editingIssue.description || '');
      setSeverity(editingIssue.severity);
      setPriority(editingIssue.priority);
      setAssigneeId(editingIssue.assigneeId || null);
      setParticipantIds(
        (editingIssue.participants || [])
          .filter((p) => p.role === 'PARTICIPANT')
          .map((p) => p.userId),
      );
      setAffectedModules((editingIssue.affectedModules || []).join(', '));
      setResolution(editingIssue.resolution || '');
      setProjectId(editingIssue.projectId || '');
      // Resolve project name from projects list
      const editProject = projects.find((p) => p.projectId === editingIssue.projectId);
      setProjectName(editProject ? (editProject.code ? `[${editProject.code}] ${editProject.name}` : editProject.name) : '');
      setProjectSearch('');
      setEpicId(editingIssue.epicId || '');
      setComponentId(editingIssue.componentId || '');
      setStartDate(editingIssue.startDate || '');
      setDueDate(editingIssue.dueDate || '');
      setDoneRatio(editingIssue.doneRatio ?? 0);
      setParentIssueId(editingIssue.parentIssueId || '');
      setParentIssueTitle(editingIssue.parentIssueTitle || '');
      setGoogleDriveLink(editingIssue.googleDriveLink || '');
      setHasDraft(false);
    } else {
      // Check for saved draft
      const draft = loadDraft();
      if (draft && (draft.title || draft.description)) {
        setHasDraft(true);
        setDraftTimestamp(draft.savedAt || '');
        // Initialize with defaults first
        setType('BUG');
        setTitle('');
        setDescription('');
        setSeverity('MAJOR');
        setPriority(3);
        setAssigneeId(currentUser?.userId || null);
        setParticipantIds([]);
        setAffectedModules('');
        setResolution('');
        setProjectId(defaultProjectId || '');
        // Resolve project name for default project
        const defProject = projects.find((p) => p.projectId === defaultProjectId);
        setProjectName(defProject ? (defProject.code ? `[${defProject.code}] ${defProject.name}` : defProject.name) : '');
        setProjectSearch('');
        setEpicId('');
        setComponentId('');
        setStartDate('');
        setDueDate('');
        setDoneRatio(0);
        setParentIssueId('');
        setParentIssueTitle('');
        setGoogleDriveLink('');
      } else {
        setType(initialData?.type || 'BUG');
        setTitle(initialData?.title || '');
        setDescription(initialData?.description || '');
        setSeverity(initialData?.severity || 'MAJOR');
        setPriority(initialData?.priority ?? 3);
        setAssigneeId(currentUser?.userId || null);
        setParticipantIds(initialData?.participant_ids || []);
        setAffectedModules('');
        setResolution('');
        setProjectId(initialData?.project_id || defaultProjectId || '');
        // Resolve project name for initial/default project
        const initProjId = initialData?.project_id || defaultProjectId || '';
        const initProject = projects.find((p) => p.projectId === initProjId);
        setProjectName(initProject ? (initProject.code ? `[${initProject.code}] ${initProject.name}` : initProject.name) : '');
        setProjectSearch('');
        setEpicId('');
        setComponentId('');
        setStartDate(initialData?.start_date || '');
        setDueDate(initialData?.due_date || '');
        setDoneRatio(0);
        setParentIssueId('');
        setParentIssueTitle('');
        setGoogleDriveLink('');
        setHasDraft(false);
      }
    }
    setUploadedFiles([]);
    setUploadError('');
    setParentSearch('');
    setShowParentDropdown(false);
    setTranslateLang(null);
    setTranslating(false);
    setTranslatedPreview(null);
    translateAbortRef.current?.abort();
  }, [editingIssue, isOpen, currentUser, loadDraft, defaultProjectId, initialData]);

  // Auto-save timer: save draft every 3 seconds for new issues
  useEffect(() => {
    if (!isOpen || editingIssue) {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
      return;
    }
    autoSaveTimerRef.current = setInterval(() => {
      saveDraft();
    }, 3000);
    return () => {
      if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current);
    };
  }, [isOpen, editingIssue, saveDraft]);

  // Search parent issues - filter by project if selected
  useEffect(() => {
    // If project is selected, show its issues even without search text
    if (!parentSearch.trim() && !projectId) {
      setParentIssues([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const params: { search?: string; size: number; project_id?: string } = { size: 10 };
        if (parentSearch.trim()) {
          params.search = parentSearch;
        }
        if (projectId) {
          params.project_id = projectId;
        }
        const result = await issueService.getIssues(params);
        // Exclude the current issue from parent candidates
        const filtered = editingIssue
          ? result.data.filter((i) => i.issueId !== editingIssue.issueId)
          : result.data;
        setParentIssues(filtered);
      } catch {
        setParentIssues([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [parentSearch, editingIssue, projectId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone (not entering child)
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  }, []);

  if (!isOpen) return null;

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const newFiles: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        if (driveConfigured && uploadFolderId) {
          // Google Drive 업로드
          const result = await driveApiService.uploadFile(uploadFolderId, file);
          newFiles.push({
            fileId: result.fileId,
            name: result.name,
            webViewLink: result.webViewLink,
            size: result.size,
            source: 'drive',
          });
        } else {
          // 로컬 서버 업로드 Fallback
          const formData = new FormData();
          formData.append('file', file);
          const res = await apiClient.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          const saved = res.data?.data;
          if (saved) {
            newFiles.push({
              fileId: saved.storedName,
              name: saved.originalName,
              webViewLink: `/api/v1/files/${saved.storedName}/download?name=${encodeURIComponent(saved.originalName)}`,
              size: saved.fileSize,
              source: 'local',
            });
          }
        }
      }
      setUploadedFiles((prev) => [...prev, ...newFiles]);
      // Auto-set google_drive_link to the first uploaded file's link if not set
      if (!googleDriveLink && newFiles.length > 0) {
        setGoogleDriveLink(newFiles[0].webViewLink);
      }
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || err?.message || t('issues:form.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const next = prev.filter((f) => f.fileId !== fileId);
      // Update link: use first remaining file or clear
      if (next.length > 0) {
        setGoogleDriveLink(next[0].webViewLink);
      } else {
        setGoogleDriveLink('');
      }
      return next;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    clearDraft();

    const modules = affectedModules
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean);

    // Build google_drive_link: if multiple files, join with newlines
    const driveLink = uploadedFiles.length > 0
      ? uploadedFiles.map((f) => f.webViewLink).join('\n')
      : googleDriveLink.trim() || undefined;

    onSubmit({
      type,
      title: title.trim(),
      description: description.trim() || '-',
      severity,
      priority,
      affected_modules: modules.length ? modules : undefined,
      assignee_id: assigneeId,
      participant_ids: participantIds.length > 0 ? participantIds : undefined,
      resolution: resolution.trim() || undefined,
      project_id: projectId || undefined,
      epic_id: epicId || null,
      component_id: componentId || null,
      start_date: startDate || undefined,
      due_date: dueDate || undefined,
      done_ratio: doneRatio,
      parent_issue_id: parentIssueId || undefined,
      google_drive_link: driveLink,
    });
  };

  const selectParentIssue = (issue: IssueResponse) => {
    setParentIssueId(issue.issueId);
    setParentIssueTitle(issue.title);
    setParentSearch('');
    setShowParentDropdown(false);
  };

  const clearParentIssue = () => {
    setParentIssueId('');
    setParentIssueTitle('');
    setParentSearch('');
  };

  const q = projectSearch.toLowerCase();
  const filteredProjects = !q
    ? projects
    : projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)),
    );

  const selectProjectItem = (project: { projectId: string; name: string; code?: string }) => {
    setProjectId(project.projectId);
    setProjectName(project.code ? `[${project.code}] ${project.name}` : project.name);
    setProjectSearch('');
    setShowProjectDropdown(false);
    clearParentIssue();
    setEpicId('');
    setComponentId('');
  };

  const clearProjectItem = () => {
    setProjectId('');
    setProjectName('');
    setProjectSearch('');
    clearParentIssue();
    setEpicId('');
    setComponentId('');
  };

  const handleTranslate = async (lang: 'ko' | 'en' | 'vi') => {
    if (!title.trim()) return;
    translateAbortRef.current?.abort();
    setTranslateLang(lang);
    setTranslating(true);
    setTranslatedPreview(null);

    // description에서 HTML 태그 제거해 텍스트 추출
    const descText = description.replace(/<[^>]*>/g, '').trim();
    const textToTranslate = `[TITLE]\n${title.trim()}${descText ? `\n\n[DESCRIPTION]\n${descText}` : ''}`;

    let accumulated = '';

    const controller = await translationService.translateTextStreamFetch(
      { text: textToTranslate, target_lang: lang },
      (data) => {
        if (data.chunk) {
          accumulated += data.chunk;
        }
        if (data.text) {
          accumulated = data.text;
        }
      },
      () => {
        // 스트림 완료 - title/description 파싱
        const titleMatch = accumulated.match(/\[TITLE\]\n([\s\S]*?)(?:\n\n\[DESCRIPTION\]|$)/);
        const descMatch = accumulated.match(/\[DESCRIPTION\]\n([\s\S]*?)$/);
        const translatedTitle = titleMatch ? titleMatch[1].trim() : '';
        const translatedDesc = descMatch ? descMatch[1].trim() : '';
        setTranslatedPreview({
          title: translatedTitle || accumulated.trim(),
          description: translatedDesc,
        });
        setTranslating(false);
      },
      (_err) => {
        setTranslating(false);
        setTranslateLang(null);
      },
    );
    translateAbortRef.current = controller;
  };

  const applyTranslation = () => {
    if (!translatedPreview) return;
    if (translatedPreview.title) setTitle(translatedPreview.title);
    if (translatedPreview.description) setDescription(translatedPreview.description);
    setTranslatedPreview(null);
    setTranslateLang(null);
  };

  const cancelTranslation = () => {
    translateAbortRef.current?.abort();
    setTranslatedPreview(null);
    setTranslateLang(null);
    setTranslating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingIssue ? t('issues:editIssue') : t('issues:addIssue')}
          </h2>
          <button onClick={() => { saveDraft(); onClose(); }} className="rounded-md p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Draft restore banner */}
        {hasDraft && !editingIssue && (
          <div className="mx-6 mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5">
            <RotateCcw className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-800">
                {t('issues:draft.found')}
                {draftTimestamp && (
                  <span className="text-xs text-amber-600 ml-1">
                    ({new Date(draftTimestamp).toLocaleString()})
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
            >
              {t('issues:draft.restore')}
            </button>
            <button
              type="button"
              onClick={clearDraft}
              className="rounded border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              {t('issues:draft.discard')}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-6 py-4 space-y-4">
          {/* Row 1: Project / Parent Issue */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.project')}</label>
              {projectId ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                  <span className="flex-1 truncate text-gray-700">{projectName}</span>
                  <button type="button" onClick={clearProjectItem} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={projectSearch}
                    onChange={(e) => { setProjectSearch(e.target.value); setShowProjectDropdown(true); }}
                    onFocus={() => setShowProjectDropdown(true)}
                    onBlur={() => setTimeout(() => setShowProjectDropdown(false), 200)}
                    placeholder={t('issues:form.searchProjectPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  {showProjectDropdown && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {filteredProjects.map((p) => (
                        <button
                          key={p.projectId}
                          type="button"
                          onClick={() => selectProjectItem(p)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
                        >
                          {p.code && <span className="inline-flex rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">{p.code}</span>}
                          <span className="flex-1 truncate text-gray-700">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.parentIssue')}</label>
              {parentIssueId ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                  <span className="flex-1 truncate text-gray-700">{parentIssueTitle}</span>
                  <button type="button" onClick={clearParentIssue} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={parentSearch}
                    onChange={(e) => { setParentSearch(e.target.value); setShowParentDropdown(true); }}
                    onFocus={() => (parentSearch || projectId) && setShowParentDropdown(true)}
                    onBlur={() => setTimeout(() => setShowParentDropdown(false), 200)}
                    placeholder={t('issues:form.parentIssuePlaceholder')}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                  {showParentDropdown && parentIssues.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {parentIssues.map((issue) => (
                        <button
                          key={issue.issueId}
                          type="button"
                          onClick={() => selectParentIssue(issue)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
                        >
                          <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${
                            issue.type === 'BUG' ? 'bg-red-100 text-red-700' :
                            issue.type === 'FEATURE_REQUEST' ? 'bg-blue-100 text-blue-700' :
                            issue.type === 'TASK' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {t(`issues:type.${issue.type}`)}
                          </span>
                          <span className="flex-1 truncate text-gray-700">{issue.title}</span>
                          <span className={`text-xs ${
                            issue.status === 'CLOSED' ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {t(`issues:status.${issue.status}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Row 1.5: Group (Epic / Component) - only when project selected */}
          {projectId && <IssueGroupSelector projectId={projectId} epicId={epicId} componentId={componentId} onEpicChange={(v) => { setEpicId(v); if (v) setComponentId(''); }} onComponentChange={(v) => { setComponentId(v); if (v) setEpicId(''); }} t={t} />}

          {/* Row 2: Type / Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.type')}</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="BUG">{t('issues:type.BUG')}</option>
                <option value="FEATURE_REQUEST">{t('issues:type.FEATURE_REQUEST')}</option>
                <option value="OPINION">{t('issues:type.OPINION')}</option>
                <option value="TASK">{t('issues:type.TASK')}</option>
                <option value="OTHER">{t('issues:type.OTHER')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.severity')}</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="CRITICAL">{t('issues:severity.CRITICAL')}</option>
                <option value="MAJOR">{t('issues:severity.MAJOR')}</option>
                <option value="MINOR">{t('issues:severity.MINOR')}</option>
              </select>
            </div>
          </div>

          {/* Row 3: Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('issues:form.titlePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Row 4: Description - Rich Text Editor */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.description')}</label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder={t('issues:form.descriptionPlaceholder')}
              minHeight="120px"
              maxHeight="300px"
            />
          </div>

          {/* Row 4.5: 번역 패널 */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-gray-500 flex-shrink-0" />
              <span className="text-xs font-medium text-gray-600">{t('issues:form.translate')}</span>
              <span className="text-xs text-gray-400">{t('issues:form.translateLangSelect')}</span>
              <div className="flex items-center gap-1 ml-auto">
                {(['ko', 'en', 'vi'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleTranslate(lang)}
                    disabled={translating}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      translateLang === lang
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-600'
                    }`}
                  >
                    {lang === 'ko' ? '🇰🇷 KO' : lang === 'en' ? '🇺🇸 EN' : '🇻🇳 VI'}
                  </button>
                ))}
              </div>
            </div>
            {translating && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('issues:form.translating')}
              </div>
            )}
            {translatedPreview && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-medium text-gray-500">{t('issues:form.translateResult')}</p>
                <div className="rounded border border-dashed border-gray-300 bg-white p-2 space-y-1">
                  {translatedPreview.title && (
                    <p className="text-xs text-gray-800 font-medium">{translatedPreview.title}</p>
                  )}
                  {translatedPreview.description && (
                    <p className="text-xs text-gray-600 whitespace-pre-line">{translatedPreview.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyTranslation}
                    className="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
                  >
                    {t('issues:form.translateApply')}
                  </button>
                  <button
                    type="button"
                    onClick={cancelTranslation}
                    className="rounded border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
                  >
                    {t('issues:form.translateCancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Row 5: Priority / Assignee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.priority')}</label>
              <select
                value={priority}
                onChange={(e) => setPriority(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              >
                {[1, 2, 3, 4, 5].map((v) => (
                  <option key={v} value={v}>{t(`issues:priority.${v}`)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.assignee')}</label>
              <AssigneeSelector
                value={assigneeId}
                onChange={setAssigneeId}
              />
            </div>
          </div>

          {/* Row 5.5: Participants */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.participants')}</label>
            <ParticipantSelector
              value={participantIds}
              onChange={setParticipantIds}
              excludeUserId={assigneeId}
            />
          </div>

          {/* Row 6: File Attachment - Tabs for Upload / URL */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('issues:form.fileAttachment')}</label>
            {/* Tab buttons */}
            <div className="flex border-b border-gray-200 mb-3">
              <button
                type="button"
                onClick={() => setAttachTab('upload')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  attachTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Upload className="h-4 w-4" />
                {t('issues:form.tabFileUpload')}
              </button>
              <button
                type="button"
                onClick={() => setAttachTab('url')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  attachTab === 'url'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <LinkIcon className="h-4 w-4" />
                {t('issues:form.tabUrlRegister')}
              </button>
            </div>

            {/* Upload Tab */}
            {attachTab === 'upload' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                {/* Drag & Drop Zone */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-gray-50'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <span>{t('issues:form.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className={`h-8 w-8 ${isDragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <span className="font-medium">{t('issues:form.dragDropText')}</span>
                      <span className="text-xs text-gray-400">
                        {driveConfigured ? t('issues:form.dragDropHint') : t('issues:form.localUploadHint')}
                      </span>
                    </>
                  )}
                </div>
                {uploadError && (
                  <p className="text-xs text-red-500">{uploadError}</p>
                )}
                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <ul className="space-y-1">
                    {uploadedFiles.map((file) => (
                      <li key={file.fileId} className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm">
                        <FileText className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 truncate text-indigo-600 hover:underline"
                        >
                          {file.name}
                        </a>
                        <span className="flex-shrink-0 text-xs text-gray-400">{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile(file.fileId)}
                          className="flex-shrink-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* URL Tab */}
            {attachTab === 'url' && (
              <div className="space-y-2">
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={googleDriveLink}
                    onChange={(e) => setGoogleDriveLink(e.target.value)}
                    placeholder={t('issues:form.urlPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400">{t('issues:form.urlHint')}</p>
              </div>
            )}
          </div>

          {/* Row 7: Affected Modules */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.affectedModules')}</label>
            <input
              type="text"
              value={affectedModules}
              onChange={(e) => setAffectedModules(e.target.value)}
              placeholder={t('issues:form.affectedModulesPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {editingIssue && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.resolution')}</label>
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder={t('issues:form.resolutionPlaceholder')}
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          )}

          {/* Date & Progress */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.dueDate')}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('issues:form.doneRatio')} ({doneRatio}%)</label>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={doneRatio}
                onChange={(e) => setDoneRatio(Number(e.target.value))}
                className="w-full mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:cancel')}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {editingIssue ? t('common:save') : t('issues:addIssue')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IssueGroupSelector({ projectId, epicId, componentId, onEpicChange, onComponentChange, t }: {
  projectId: string;
  epicId: string;
  componentId: string;
  onEpicChange: (v: string) => void;
  onComponentChange: (v: string) => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { data: epics = [] } = useEpics(projectId);
  const { data: components = [] } = useComponents(projectId);
  const activeEpics = epics.filter((e) => e.status !== 'DONE' && e.status !== 'CANCELLED');

  if (activeEpics.length === 0 && components.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {activeEpics.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('project:wbs.epic')}</label>
          <select
            value={epicId}
            onChange={(e) => onEpicChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">{t('project:wbs.groupNone')}</option>
            {activeEpics.map((ep) => (
              <option key={ep.epicId} value={ep.epicId}>{ep.title}</option>
            ))}
          </select>
        </div>
      )}
      {components.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('project:wbs.component')}</label>
          <select
            value={componentId}
            onChange={(e) => onComponentChange(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            <option value="">{t('project:wbs.groupNone')}</option>
            {components.map((c) => (
              <option key={c.componentId} value={c.componentId}>{c.title}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
