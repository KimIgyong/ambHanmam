import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TodoResponse, IssueResponse } from '@amb/types';
import { useTranslation } from 'react-i18next';
import { X, Search, Users, RefreshCw, ArrowRightCircle, Upload, FileText, Loader2, Trash2, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { issueService } from '@/domain/issues/service/issue.service';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import { useProjectList } from '@/domain/project/hooks/useProject';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { driveApiService } from '@/domain/drive/service/drive.service';
import { useRegisteredFolders, useDriveStatus } from '@/domain/drive/hooks/useDrive';
import { apiClient } from '@/lib/api-client';

interface TodoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description?: string; start_date?: string; due_date?: string; tags?: string; issue_id?: string; project_id?: string; participant_ids?: string[]; recurrence_type?: string | null; recurrence_day?: number | null; due_date_change_note?: string }) => void;
  editingTodo?: TodoResponse | null;
  onConvertToIssue?: (todo: TodoResponse) => void;
}

export default function TodoFormModal({ isOpen, onClose, onSubmit, editingTodo, onConvertToIssue }: TodoFormModalProps) {
  const { t } = useTranslation(['todos', 'common', 'issues']);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [issueId, setIssueId] = useState('');
  const [issueTitle, setIssueTitle] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [searchedIssues, setSearchedIssues] = useState<IssueResponse[]>([]);
  const [showIssueDropdown, setShowIssueDropdown] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [participantSearch, setParticipantSearch] = useState('');
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('');
  const [recurrenceDay, setRecurrenceDay] = useState<number | undefined>();
  const [dueDateChangeNote, setDueDateChangeNote] = useState('');
  const [originalDueDate, setOriginalDueDate] = useState('');
  const participantRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const [urlLink, setUrlLink] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { data: driveStatus } = useDriveStatus();
  const { data: registeredFolders = [] } = useRegisteredFolders();
  const driveConfigured = driveStatus?.configured && registeredFolders.length > 0;
  const uploadFolderId = registeredFolders.length > 0 ? registeredFolders[0].folderId : '';

  const { data: projects = [] } = useProjectList();
  const { data: members = [] } = useMemberList();

  const filteredMembers = useMemo(() => {
    const q = participantSearch.toLowerCase();
    return members.filter(
      (m) =>
        !participantIds.includes(m.userId) &&
        (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)),
    );
  }, [members, participantIds, participantSearch]);

  const filteredProjects = useMemo(() => {
    const q = projectSearch.toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q)),
    );
  }, [projects, projectSearch]);

  const selectProject = (project: { projectId: string; name: string; code?: string }) => {
    setProjectId(project.projectId);
    setProjectName(project.code ? `[${project.code}] ${project.name}` : project.name);
    setProjectSearch('');
    setShowProjectDropdown(false);
    clearLinkedIssue();
  };

  const clearProject = () => {
    setProjectId('');
    setProjectName('');
    setProjectSearch('');
    clearLinkedIssue();
  };

  const selectedMembers = useMemo(
    () => members.filter((m) => participantIds.includes(m.userId)),
    [members, participantIds],
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (participantRef.current && !participantRef.current.contains(e.target as Node)) {
        setShowParticipantDropdown(false);
        setParticipantSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search linked issues - debounced API call
  useEffect(() => {
    if (!issueSearch.trim() && !projectId) {
      setSearchedIssues([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const params: { search?: string; size: number; project_id?: string } = { size: 10 };
        if (issueSearch.trim()) params.search = issueSearch;
        if (projectId) params.project_id = projectId;
        const result = await issueService.getIssues(params);
        setSearchedIssues(result.data);
      } catch {
        setSearchedIssues([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [issueSearch, projectId]);

  const selectLinkedIssue = (issue: IssueResponse) => {
    setIssueId(issue.issueId);
    setIssueTitle(issue.title);
    setIssueSearch('');
    setShowIssueDropdown(false);
  };

  const clearLinkedIssue = () => {
    setIssueId('');
    setIssueTitle('');
    setIssueSearch('');
  };

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title);
      setDescription(editingTodo.description || '');
      setStartDate(editingTodo.startDate || '');
      setDueDate(editingTodo.dueDate || '');
      setTags(editingTodo.tags || '');
      setIssueId(editingTodo.issueId || '');
      setIssueTitle(editingTodo.issueTitle || '');
      setProjectId(editingTodo.projectId || '');
      // Resolve project name from projects list
      const editProject = projects.find((p) => p.projectId === editingTodo.projectId);
      setProjectName(editProject ? (editProject.code ? `[${editProject.code}] ${editProject.name}` : editProject.name) : '');
      setProjectSearch('');
      setParticipantIds(editingTodo.participants?.map((p) => p.userId) || []);
      setRecurrenceType(editingTodo.recurrenceType || '');
      setRecurrenceDay(editingTodo.recurrenceDay ?? undefined);
      setDueDateChangeNote('');
      setOriginalDueDate(editingTodo.dueDate || '');
    } else {
      setTitle('');
      setDescription('');
      setStartDate('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setTags('');
      setIssueId('');
      setIssueTitle('');
      setIssueSearch('');
      setProjectId('');
      setProjectName('');
      setProjectSearch('');
      setParticipantIds([]);
      setRecurrenceType('');
      setRecurrenceDay(undefined);
      setDueDateChangeNote('');
      setOriginalDueDate('');
    }
    setUploadedFiles([]);
    setUploadError('');
    setUrlLink('');
  }, [editingTodo, isOpen]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError('');
    try {
      const newFiles: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        if (driveConfigured && uploadFolderId) {
          const result = await driveApiService.uploadFile(uploadFolderId, file);
          newFiles.push({
            fileId: result.fileId,
            name: result.name,
            webViewLink: result.webViewLink,
            size: result.size,
            source: 'drive',
          });
        } else {
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
    } catch (err: any) {
      setUploadError(err?.response?.data?.error || err?.message || t('issues:form.uploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.fileId !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Build description with attached files
    let finalDescription = description || '';
    const allLinks: string[] = [];
    if (uploadedFiles.length > 0) {
      for (const f of uploadedFiles) {
        allLinks.push(`<p><a href="${f.webViewLink}" target="_blank" rel="noopener noreferrer">📎 ${f.name} (${formatFileSize(f.size)})</a></p>`);
      }
    }
    if (urlLink.trim()) {
      allLinks.push(`<p><a href="${urlLink.trim()}" target="_blank" rel="noopener noreferrer">🔗 ${urlLink.trim()}</a></p>`);
    }
    if (allLinks.length > 0) {
      finalDescription = finalDescription + allLinks.join('');
    }
    onSubmit({
      title,
      description: finalDescription || undefined,
      start_date: startDate || undefined,
      due_date: dueDate || undefined,
      tags: tags || undefined,
      issue_id: issueId || undefined,
      project_id: (projectId && projectId !== '__none__') ? projectId : undefined,
      participant_ids: participantIds.length > 0 ? participantIds : undefined,
      recurrence_type: recurrenceType || null,
      recurrence_day: recurrenceType ? recurrenceDay : null,
      due_date_change_note: (editingTodo && dueDate !== originalDueDate && dueDateChangeNote) ? dueDateChangeNote : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingTodo ? t('todos:editTodo') : t('todos:addTodo')}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('todos:form.titlePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.description')}</label>
            <RichTextEditor
              content={description}
              onChange={setDescription}
              placeholder={t('todos:form.descriptionPlaceholder')}
              minHeight="100px"
              maxHeight="300px"
            />
          </div>

          {/* File Attachment */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('issues:form.fileAttachment')}</label>
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

            {attachTab === 'upload' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-5 text-sm transition-colors cursor-pointer ${
                    isDragOver
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                      : 'border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-gray-50'
                  } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
                      <span className="text-xs">{t('issues:form.uploading')}</span>
                    </>
                  ) : (
                    <>
                      <Upload className={`h-6 w-6 ${isDragOver ? 'text-indigo-500' : 'text-gray-400'}`} />
                      <span className="text-xs font-medium">{t('issues:form.dragDropText')}</span>
                      <span className="text-xs text-gray-400">
                        {driveConfigured ? t('issues:form.dragDropHint') : t('issues:form.localUploadHint')}
                      </span>
                    </>
                  )}
                </div>
                {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
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

            {attachTab === 'url' && (
              <div className="space-y-2">
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    value={urlLink}
                    onChange={(e) => setUrlLink(e.target.value)}
                    placeholder={t('issues:form.urlPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400">{t('issues:form.urlHint')}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={t('todos:form.startDatePlaceholder')}
              />
              <p className="mt-0.5 text-xs text-gray-400">{t('todos:form.startDatePlaceholder')}</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.dueDate')}</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={t('todos:form.dueDatePlaceholder')}
              />
              <p className="mt-0.5 text-xs text-gray-400">{t('todos:form.dueDatePlaceholder')}</p>
            </div>
          </div>

          {/* Due date change note - 수정 모드에서 예정일이 변경된 경우에만 표시 */}
          {editingTodo && dueDate !== originalDueDate && (
            <div>
              <label className="mb-1 block text-sm font-medium text-amber-700">
                {t('todos:form.dueDateChangeNote')}
              </label>
              <div className="mb-1 text-xs text-amber-600">
                {originalDueDate} → {dueDate}
              </div>
              <input
                type="text"
                value={dueDateChangeNote}
                onChange={(e) => setDueDateChangeNote(e.target.value)}
                placeholder={t('todos:form.dueDateChangeNotePlaceholder')}
                className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.project')}</label>
              {projectId ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                  <span className="flex-1 truncate text-gray-700">{projectName}</span>
                  <button type="button" onClick={clearProject} className="text-gray-400 hover:text-gray-600">
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
                    placeholder={t('todos:form.searchProjectPlaceholder')}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {showProjectDropdown && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      <button
                        type="button"
                        onClick={() => { setProjectId('__none__'); setProjectName(t('todos:form.unassignedProject')); setProjectSearch(''); setShowProjectDropdown(false); clearLinkedIssue(); }}
                        className="flex w-full items-center px-3 py-2 text-left text-sm text-gray-500 hover:bg-indigo-50"
                      >
                        {t('todos:form.unassignedProject')}
                      </button>
                      {filteredProjects.map((p) => (
                        <button
                          key={p.projectId}
                          type="button"
                          onClick={() => selectProject(p)}
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
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.linkedIssue')}</label>
              {issueId ? (
                <div className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50">
                  <span className="flex-1 truncate text-gray-700">{issueTitle}</span>
                  <button type="button" onClick={clearLinkedIssue} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => { setIssueSearch(e.target.value); setShowIssueDropdown(true); }}
                    onFocus={() => (issueSearch || projectId) && setShowIssueDropdown(true)}
                    onBlur={() => setTimeout(() => setShowIssueDropdown(false), 200)}
                    placeholder={t('todos:form.searchIssuePlaceholder')}
                    className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {showIssueDropdown && searchedIssues.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {searchedIssues.map((issue) => (
                        <button
                          key={issue.issueId}
                          type="button"
                          onClick={() => selectLinkedIssue(issue)}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.tags')}</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t('todos:form.tagsPlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Recurrence */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 flex items-center gap-1 text-sm font-medium text-gray-700">
                <RefreshCw className="h-3.5 w-3.5" />
                {t('todos:form.recurrence')}
              </label>
              <select
                value={recurrenceType}
                onChange={(e) => { setRecurrenceType(e.target.value); setRecurrenceDay(undefined); }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{t('todos:form.noRecurrence')}</option>
                <option value="WEEKLY">{t('todos:recurrence.WEEKLY')}</option>
                <option value="MONTHLY">{t('todos:recurrence.MONTHLY')}</option>
                <option value="YEARLY">{t('todos:recurrence.YEARLY')}</option>
              </select>
            </div>
            {recurrenceType === 'WEEKLY' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.recurrenceDay')}</label>
                <select
                  value={recurrenceDay ?? ''}
                  onChange={(e) => setRecurrenceDay(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">{t('todos:form.recurrenceDay')}</option>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{t(`todos:weekdays.${d}`)}</option>
                  ))}
                </select>
              </div>
            )}
            {recurrenceType === 'MONTHLY' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('todos:form.recurrenceDayOfMonth')}</label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={recurrenceDay ?? ''}
                  onChange={(e) => setRecurrenceDay(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="1-31"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
          </div>

          {/* Participants */}
          <div ref={participantRef} className="relative">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              <Users className="mr-1 inline h-4 w-4" />
              {t('todos:form.participants')}
            </label>
            {/* Selected participants chips */}
            {selectedMembers.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {selectedMembers.map((m) => (
                  <span
                    key={m.userId}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700"
                  >
                    {m.name}
                    <button
                      type="button"
                      onClick={() => setParticipantIds((ids) => ids.filter((id) => id !== m.userId))}
                      className="rounded-full p-0.5 hover:bg-indigo-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {/* Search input */}
            <div
              onClick={() => setShowParticipantDropdown(true)}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:border-indigo-400"
            >
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={participantSearch}
                onChange={(e) => {
                  setParticipantSearch(e.target.value);
                  setShowParticipantDropdown(true);
                }}
                onFocus={() => setShowParticipantDropdown(true)}
                placeholder={t('todos:form.participantsPlaceholder')}
                className="flex-1 border-none bg-transparent text-sm outline-none"
              />
            </div>
            {/* Dropdown */}
            {showParticipantDropdown && filteredMembers.length > 0 && (
              <div className="absolute bottom-full z-30 mb-1 max-h-40 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {filteredMembers.map((m) => (
                  <button
                    key={m.userId}
                    type="button"
                    onClick={() => {
                      setParticipantIds((ids) => [...ids, m.userId]);
                      setParticipantSearch('');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-700">
                      {m.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-gray-900">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          </div>

          <div className="flex flex-shrink-0 justify-end gap-3 border-t border-gray-100 px-6 py-4">
            {editingTodo && onConvertToIssue && !editingTodo.issueId && (
              <button
                type="button"
                onClick={() => { onClose(); onConvertToIssue(editingTodo); }}
                className="mr-auto flex items-center gap-1.5 rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-600 hover:bg-orange-50"
              >
                <ArrowRightCircle className="h-4 w-4" />
                {t('todos:convertToIssue')}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {t('common:close')}
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('common:save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
