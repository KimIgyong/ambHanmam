import { useState, useEffect, useRef } from 'react';
import { MeetingNoteResponse, MeetingNoteFolderResponse } from '@amb/types';
import { useTranslation } from 'react-i18next';
import { X, Search, Upload, FileText, Loader2, Trash2, ExternalLink, Link as LinkIcon } from 'lucide-react';
import RichTextEditor from './RichTextEditor';
import { useCellList } from '@/domain/members/hooks/useCells';
import { useMemberList } from '@/domain/members/hooks/useMembers';
import { useProjectList } from '@/domain/project/hooks/useProject';
import { useIssueList } from '@/domain/issues/hooks/useIssues';
import SaveTranslationDialog from '@/domain/translations/components/SaveTranslationDialog';
import { MeetingNoteFormData } from '../service/meeting-note.service';
import { driveApiService } from '@/domain/drive/service/drive.service';
import { useRegisteredFolders, useDriveStatus } from '@/domain/drive/hooks/useDrive';
import { apiClient } from '@/lib/api-client';

interface MeetingNoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: MeetingNoteFormData) => void;
  editingNote?: MeetingNoteResponse | null;
  folders?: MeetingNoteFolderResponse[];
  activeFolderId?: string | null;
}

export default function MeetingNoteFormModal({ isOpen, onClose, onSubmit, editingNote, folders = [], activeFolderId }: MeetingNoteFormModalProps) {
  const { t } = useTranslation(['meetingNotes', 'common', 'issues']);
  const { data: cells = [] } = useCellList();
  const { data: members = [] } = useMemberList();
  const { data: projects = [] } = useProjectList();
  const { data: issueData } = useIssueList();
  const issues = issueData?.data || [];

  // Drive hooks
  const { data: driveStatus } = useDriveStatus();
  const { data: registeredFolders = [] } = useRegisteredFolders();
  const driveConfigured = driveStatus?.configured && registeredFolders.length > 0;
  const uploadFolderId = registeredFolders.length > 0 ? registeredFolders[0].folderId : '';

  const [noteType, setNoteType] = useState<'MEMO' | 'MEETING_NOTE'>('MEMO');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().split('T')[0]);
  const [visibility, setVisibility] = useState('PRIVATE');
  const [cellId, setCellId] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [projectIds, setProjectIds] = useState<string[]>([]);
  const [issueIds, setIssueIds] = useState<string[]>([]);
  const [folderId, setFolderId] = useState<string>('');
  const [createIssue, setCreateIssue] = useState(false);
  const [createIssueProjectId, setCreateIssueProjectId] = useState('');
  const [createIssueType, setCreateIssueType] = useState('TASK');
  const [createIssueSeverity, setCreateIssueSeverity] = useState('MINOR');
  const [showTranslationDialog, setShowTranslationDialog] = useState(false);
  const [savedNoteId, setSavedNoteId] = useState('');
  const [savedContent, setSavedContent] = useState<Record<string, string>>({});
  const [memberSearch, setMemberSearch] = useState('');

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  void setSavedNoteId;
  void setSavedContent;

  const getMeetingTemplate = () => {
    return `<h2>${t('meetingNotes:template.meetingInfo')}</h2>
<p><strong>${t('meetingNotes:template.meetingTitle')} :</strong> </p>
<p><strong>${t('meetingNotes:template.attendees')} :</strong> </p>
<p><strong>${t('meetingNotes:template.topic')} :</strong> </p>

<h2>${t('meetingNotes:template.meetingContent')}</h2>
<p></p>

<h2>${t('meetingNotes:template.decisions')}</h2>
<p></p>

<h2>${t('meetingNotes:template.actionItems')}</h2>
<ul><li></li></ul>`;
  };

  const handleTypeChange = (newType: 'MEMO' | 'MEETING_NOTE') => {
    if (newType === noteType) return;
    if (content && content !== '<p></p>' && content !== '') {
      if (!confirm(t('meetingNotes:typeChangeConfirm'))) return;
    }
    setNoteType(newType);
    if (newType === 'MEETING_NOTE') {
      setContent(getMeetingTemplate());
    } else {
      setContent('');
    }
  };

  useEffect(() => {
    if (editingNote) {
      setNoteType((editingNote.type as 'MEMO' | 'MEETING_NOTE') || 'MEMO');
      setTitle(editingNote.title);
      setContent(editingNote.content);
      setMeetingDate(editingNote.meetingDate);
      setVisibility(editingNote.visibility);
      setCellId(editingNote.cellId || '');
      setAssigneeId(editingNote.assigneeId || null);
      setParticipantIds((editingNote.participants || []).map((p) => p.userId));
      setProjectIds((editingNote.projects || []).map((p) => p.projectId));
      setIssueIds((editingNote.issues || []).map((i) => i.issueId));
      setFolderId(editingNote.folderId || '');
    } else {
      setNoteType('MEMO');
      setTitle('');
      setContent('');
      setMeetingDate(new Date().toISOString().split('T')[0]);
      setVisibility('PRIVATE');
      setCellId('');
      setAssigneeId(null);
      setParticipantIds([]);
      setProjectIds([]);
      setIssueIds([]);
      setFolderId(activeFolderId && activeFolderId !== 'uncategorized' ? activeFolderId : '');
    }
    setCreateIssue(false);
    setCreateIssueProjectId('');
    setCreateIssueType('TASK');
    setCreateIssueSeverity('MINOR');
    setMemberSearch('');
    setUploadedFiles([]);
    setUploadError('');
    setUrlLink('');
    setIsDragOver(false);
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Append attached file links to content
    let finalContent = content || '';
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
      finalContent = finalContent + allLinks.join('');
    }
    onSubmit({
      type: noteType,
      title,
      content: finalContent,
      meeting_date: noteType === 'MEETING_NOTE' ? meetingDate : undefined,
      visibility,
      cell_id: visibility === 'CELL' ? cellId : undefined,
      assignee_id: assigneeId,
      participant_ids: participantIds,
      project_ids: projectIds,
      issue_ids: issueIds,
      folder_id: folderId || null,
      create_issue: createIssue || undefined,
      create_issue_project_id: createIssue ? createIssueProjectId || undefined : undefined,
      create_issue_type: createIssue ? createIssueType : undefined,
      create_issue_severity: createIssue ? createIssueSeverity : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {editingNote ? t('meetingNotes:editNote') : t('meetingNotes:newNote')}
          </h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Type Selector */}
        <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => handleTypeChange('MEMO')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              noteType === 'MEMO' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📝 {t('meetingNotes:type.MEMO')}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('MEETING_NOTE')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              noteType === 'MEETING_NOTE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🗓 {t('meetingNotes:type.MEETING_NOTE')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('meetingNotes:form.titlePlaceholder')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className={`grid gap-4 ${noteType === 'MEETING_NOTE' ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {noteType === 'MEETING_NOTE' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.meetingDate')}</label>
                <input
                  type="date"
                  value={meetingDate}
                  onChange={(e) => setMeetingDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.visibility')}</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="PRIVATE">{t('meetingNotes:visibility.PRIVATE')}</option>
                <option value="CELL">{t('meetingNotes:visibility.CELL')}</option>
                <option value="ENTITY">{t('meetingNotes:visibility.ENTITY')}</option>
              </select>
            </div>
            {visibility === 'CELL' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.cell')}</label>
                <select
                  value={cellId}
                  onChange={(e) => setCellId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  required
                >
                  <option value="">{t('meetingNotes:form.cellPlaceholder')}</option>
                  {cells.map((g: any) => (
                    <option key={g.cellId} value={g.cellId}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Folder selector */}
          {folders.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:folder.label')}</label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">{t('meetingNotes:folder.uncategorized')}</option>
                {folders.map((f) => (
                  <option key={f.folderId} value={f.folderId}>{f.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.content')}</label>
            <RichTextEditor content={content} onChange={setContent} maxHeight="400px" />
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

          {/* Assignee */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.assignee')}</label>
            <select
              value={assigneeId || ''}
              onChange={(e) => setAssigneeId(e.target.value || null)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">{t('meetingNotes:form.assigneePlaceholder')}</option>
              {members.map((m: any) => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Participants (multi-select with tags) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.participants')}</label>
            <div className="rounded-lg border border-gray-300 p-2">
              {participantIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {participantIds.map((uid) => {
                    const m = members.find((m: any) => m.userId === uid);
                    return (
                      <span key={uid} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                        {m?.name || uid}
                        <button type="button" onClick={() => setParticipantIds((prev) => prev.filter((id) => id !== uid))} className="text-indigo-400 hover:text-indigo-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={t('meetingNotes:form.participantsPlaceholder')}
                  className="w-full border-0 pl-7 text-sm focus:outline-none focus:ring-0"
                />
              </div>
              {memberSearch && (
                <div className="mt-1 max-h-32 overflow-y-auto border-t border-gray-100">
                  {members
                    .filter((m: any) => !participantIds.includes(m.userId) && m.name.toLowerCase().includes(memberSearch.toLowerCase()))
                    .map((m: any) => (
                      <button
                        key={m.userId}
                        type="button"
                        onClick={() => { setParticipantIds((prev) => [...prev, m.userId]); setMemberSearch(''); }}
                        className="block w-full px-2 py-1.5 text-left text-sm text-gray-700 hover:bg-indigo-50"
                      >
                        {m.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Projects (multi-select) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.projects')}</label>
            <div className="rounded-lg border border-gray-300 p-2">
              {projectIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {projectIds.map((pid) => {
                    const p = projects.find((p: any) => p.projectId === pid);
                    return (
                      <span key={pid} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {p ? `[${p.code}] ${p.name}` : pid}
                        <button type="button" onClick={() => setProjectIds((prev) => prev.filter((id) => id !== pid))} className="text-blue-400 hover:text-blue-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <select
                value=""
                onChange={(e) => { if (e.target.value && !projectIds.includes(e.target.value)) setProjectIds((prev) => [...prev, e.target.value]); }}
                className="w-full border-0 text-sm focus:outline-none focus:ring-0"
              >
                <option value="">{t('meetingNotes:form.projectsPlaceholder')}</option>
                {projects.filter((p: any) => !projectIds.includes(p.projectId)).map((p: any) => (
                  <option key={p.projectId} value={p.projectId}>[{p.code}] {p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Register as Issue */}
          <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={createIssue}
                onChange={(e) => setCreateIssue(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-900">{t('meetingNotes:form.createIssue')}</span>
              <span className="text-xs text-gray-500">— {t('meetingNotes:form.createIssueDesc')}</span>
            </label>
            {createIssue && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{t('meetingNotes:form.createIssueProject')}</label>
                  <select
                    value={createIssueProjectId}
                    onChange={(e) => setCreateIssueProjectId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">{t('meetingNotes:form.createIssueProjectPlaceholder')}</option>
                    {projects.map((p: any) => (
                      <option key={p.projectId} value={p.projectId}>[{p.code}] {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{t('meetingNotes:form.createIssueType')}</label>
                  <select
                    value={createIssueType}
                    onChange={(e) => setCreateIssueType(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="TASK">Task</option>
                    <option value="BUG">Bug</option>
                    <option value="FEATURE_REQUEST">Feature Request</option>
                    <option value="OPINION">Opinion</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">{t('meetingNotes:form.createIssueSeverity')}</label>
                  <select
                    value={createIssueSeverity}
                    onChange={(e) => setCreateIssueSeverity(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="MINOR">Minor</option>
                    <option value="MAJOR">Major</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Related Issues (multi-select) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{t('meetingNotes:form.issues')}</label>
            <div className="rounded-lg border border-gray-300 p-2">
              {issueIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {issueIds.map((iid) => {
                    const issue = issues.find((i) => i.issueId === iid);
                    return (
                      <span key={iid} className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-700">
                        {issue?.title || iid}
                        <button type="button" onClick={() => setIssueIds((prev) => prev.filter((id) => id !== iid))} className="text-orange-400 hover:text-orange-700">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
              <select
                value=""
                onChange={(e) => { if (e.target.value && !issueIds.includes(e.target.value)) setIssueIds((prev) => [...prev, e.target.value]); }}
                className="w-full border-0 text-sm focus:outline-none focus:ring-0"
              >
                <option value="">{t('meetingNotes:form.issuesPlaceholder')}</option>
                {issues.filter((i) => !issueIds.includes(i.issueId)).map((i) => (
                  <option key={i.issueId} value={i.issueId}>{i.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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

        {showTranslationDialog && savedNoteId && (
          <SaveTranslationDialog
            isOpen={showTranslationDialog}
            sourceType="MEETING_NOTE"
            sourceId={savedNoteId}
            sourceFields={['title', 'content']}
            originalContent={savedContent}
            originalLang={editingNote?.originalLang || 'ko'}
            onClose={() => { setShowTranslationDialog(false); onClose(); }}
            onSaved={() => setShowTranslationDialog(false)}
          />
        )}
      </div>
    </div>
  );
}
