import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from '@tanstack/react-query';
import { clientPortalApiService } from '../service/client-portal.service';
import { toast } from 'sonner';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';
import { Search, X, ChevronDown, CalendarDays, Link2 } from 'lucide-react';
import type { ClientProject, ClientIssue, ProjectMember } from '../types/client-portal.types';

const ISSUE_TYPES = ['BUG', 'FEATURE_REQUEST', 'OPINION', 'OTHER'] as const;
const SEVERITIES = ['CRITICAL', 'MAJOR', 'MINOR'] as const;

const TYPE_COLORS: Record<string, string> = {
  BUG: 'bg-red-100 text-red-700',
  FEATURE_REQUEST: 'bg-blue-100 text-blue-700',
  OPINION: 'bg-yellow-100 text-yellow-700',
  OTHER: 'bg-gray-100 text-gray-700',
};

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-600',
  MAJOR: 'text-orange-600',
  MINOR: 'text-gray-600',
};

export default function ClientIssueCreatePage() {
  const { t } = useTranslation('clientPortal');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedProjectId = searchParams.get('project_id') || '';

  // ── Form state ──
  const [projectId, setProjectId] = useState(preselectedProjectId);
  const [type, setType] = useState<string>('BUG');
  const [severity, setSeverity] = useState<string>('MAJOR');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [parentIssueId, setParentIssueId] = useState<string | null>(null);
  const [parentIssueTitle, setParentIssueTitle] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [googleDriveLink, setGoogleDriveLink] = useState('');

  // ── Parent issue search ──
  const [parentSearch, setParentSearch] = useState('');
  const [debouncedParentSearch, setDebouncedParentSearch] = useState('');
  const [showParentDropdown, setShowParentDropdown] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);
  const parentTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Participant dropdown ──
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const participantRef = useRef<HTMLDivElement>(null);

  // ── Data queries ──
  const { data: projectsData } = useQuery({
    queryKey: ['client-projects-select'],
    queryFn: () => clientPortalApiService.getProjects({ size: 100 }),
  });
  const projects = projectsData?.data || [];

  const { data: members = [] } = useQuery({
    queryKey: ['client-project-members', projectId],
    queryFn: () => clientPortalApiService.getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const { data: parentIssuesData } = useQuery({
    queryKey: ['client-parent-issues', projectId, debouncedParentSearch],
    queryFn: () =>
      clientPortalApiService.getProjectIssues(projectId, {
        search: debouncedParentSearch || undefined,
        size: 10,
      }),
    enabled: !!projectId && showParentDropdown,
  });
  const parentIssues = parentIssuesData?.data || [];

  // ── Debounce parent search ──
  const handleParentSearchChange = (value: string) => {
    setParentSearch(value);
    clearTimeout(parentTimerRef.current);
    parentTimerRef.current = setTimeout(() => {
      setDebouncedParentSearch(value);
    }, 400);
  };

  // ── Close dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (parentRef.current && !parentRef.current.contains(e.target as Node)) {
        setShowParentDropdown(false);
      }
      if (participantRef.current && !participantRef.current.contains(e.target as Node)) {
        setShowParticipantDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Reset dependent fields on project change ──
  useEffect(() => {
    setParentIssueId(null);
    setParentIssueTitle('');
    setParentSearch('');
    setDebouncedParentSearch('');
    setAssigneeId(null);
    setParticipantIds([]);
  }, [projectId]);

  // ── Available participants (exclude assignee) ──
  const availableParticipants = useMemo(
    () => members.filter((m) => m.userId !== assigneeId),
    [members, assigneeId],
  );

  // ── Remove participant if they become assignee ──
  useEffect(() => {
    if (assigneeId) {
      setParticipantIds((prev) => prev.filter((id) => id !== assigneeId));
    }
  }, [assigneeId]);

  // ── Create mutation ──
  const createMut = useMutation({
    mutationFn: () =>
      clientPortalApiService.createIssue({
        project_id: projectId,
        type,
        title,
        description,
        severity,
        parent_issue_id: parentIssueId || undefined,
        assignee_id: assigneeId || undefined,
        participant_ids: participantIds.length > 0 ? participantIds : undefined,
        start_date: startDate || undefined,
        due_date: dueDate || undefined,
        google_drive_link: googleDriveLink.trim() || undefined,
      }),
    onSuccess: (data) => {
      toast.success(t('issue.created'));
      navigate(`/client/issues/${data.id}`);
    },
    onError: (err: Error & { response?: { data?: { error?: { message?: string } } } }) =>
      toast.error(err.response?.data?.error?.message || 'Error'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    createMut.mutate();
  };

  const toggleParticipant = (userId: string) => {
    setParticipantIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const selectParentIssue = (issue: ClientIssue) => {
    setParentIssueId(issue.id);
    setParentIssueTitle(issue.title);
    setParentSearch('');
    setShowParentDropdown(false);
  };

  const clearParentIssue = () => {
    setParentIssueId(null);
    setParentIssueTitle('');
    setParentSearch('');
  };

  // ── Render ──
  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelCls = 'mb-1 block text-sm font-medium text-gray-700';

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">{t('issue.create')}</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ─── Left column: main content ─── */}
          <div className="space-y-4 lg:col-span-2">
            {/* Title */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <label className={labelCls}>{t('issue.subject')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                className={inputCls}
                placeholder={t('issue.subject')}
              />
            </div>

            {/* Description (RichTextEditor) */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <label className={labelCls}>{t('issue.description')}</label>
              <RichTextEditor
                content={description}
                onChange={setDescription}
                placeholder={t('issue.descriptionPlaceholder', 'Write a detailed description...')}
                minHeight="250px"
                maxHeight="400px"
              />
            </div>

            {/* Link URL */}
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <label className={labelCls}>
                <Link2 className="mr-1 inline h-4 w-4" />
                {t('issue.linkUrl', 'Link URL')}
              </label>
              <input
                type="url"
                value={googleDriveLink}
                onChange={(e) => setGoogleDriveLink(e.target.value)}
                className={inputCls}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* ─── Right column: metadata ─── */}
          <div className="space-y-4">
            {/* Project */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className={labelCls}>{t('issue.project')} <span className="text-red-500">*</span></label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} required className={inputCls}>
                <option value="">{t('issue.selectProject')}</option>
                {projects.map((p: ClientProject) => (
                  <option key={p.projectId} value={p.projectId}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className={labelCls}>{t('issue.type')}</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
                {ISSUE_TYPES.map((t2) => (
                  <option key={t2} value={t2}>{t(`issue.types.${t2}`)}</option>
                ))}
              </select>
            </div>

            {/* Severity */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className={labelCls}>{t('issue.severity')}</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className={`${inputCls} ${SEVERITY_COLORS[severity] || ''}`}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{t(`issue.severities.${s}`)}</option>
                ))}
              </select>
            </div>

            {/* Parent Issue */}
            <div className="rounded-lg border border-gray-200 bg-white p-4" ref={parentRef}>
              <label className={labelCls}>{t('issue.parentIssue', 'Related Issue')}</label>
              {parentIssueId ? (
                <div className="flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm">
                  <span className="flex-1 truncate">{parentIssueTitle}</span>
                  <button type="button" onClick={clearParentIssue} className="text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={parentSearch}
                      onChange={(e) => handleParentSearchChange(e.target.value)}
                      onFocus={() => projectId && setShowParentDropdown(true)}
                      disabled={!projectId}
                      className={`${inputCls} pl-9`}
                      placeholder={t('issue.searchParentIssue', 'Search issues...')}
                    />
                  </div>
                  {showParentDropdown && parentIssues.length > 0 && (
                    <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                      {parentIssues.map((issue: ClientIssue) => (
                        <button
                          key={issue.id}
                          type="button"
                          onClick={() => selectParentIssue(issue)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${TYPE_COLORS[issue.type] || TYPE_COLORS.OTHER}`}>
                            {t(`issue.types.${issue.type}`, issue.type)}
                          </span>
                          <span className="flex-1 truncate">{issue.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Assignee */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <label className={labelCls}>{t('issue.assignee')}</label>
              <select
                value={assigneeId || ''}
                onChange={(e) => setAssigneeId(e.target.value || null)}
                disabled={!projectId}
                className={inputCls}
              >
                <option value="">{t('issue.selectAssignee', 'Select assignee')}</option>
                {members.map((m: ProjectMember) => (
                  <option key={m.userId} value={m.userId}>{m.name || m.email}</option>
                ))}
              </select>
            </div>

            {/* Participants */}
            <div className="rounded-lg border border-gray-200 bg-white p-4" ref={participantRef}>
              <label className={labelCls}>{t('issue.participants', 'Participants')}</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => projectId && setShowParticipantDropdown((v) => !v)}
                  disabled={!projectId}
                  className={`${inputCls} flex items-center justify-between text-left`}
                >
                  <span className="truncate text-gray-500">
                    {participantIds.length > 0
                      ? `${participantIds.length} ${t('issue.participantCount', 'selected')}`
                      : t('issue.selectParticipants', 'Select participants')}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {showParticipantDropdown && (
                  <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {availableParticipants.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-400">{t('issue.noMembers', 'No members')}</div>
                    ) : (
                      availableParticipants.map((m: ProjectMember) => (
                        <label
                          key={m.userId}
                          className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                        >
                          <input
                            type="checkbox"
                            checked={participantIds.includes(m.userId)}
                            onChange={() => toggleParticipant(m.userId)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>{m.name || m.email}</span>
                          <span className="ml-auto text-xs text-gray-400">{m.role}</span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Selected participant tags */}
              {participantIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {participantIds.map((uid) => {
                    const m = members.find((mm) => mm.userId === uid);
                    return (
                      <span
                        key={uid}
                        className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                      >
                        {m?.name || m?.email || uid}
                        <button type="button" onClick={() => toggleParticipant(uid)} className="hover:text-indigo-900">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>
                    <CalendarDays className="mr-1 inline h-4 w-4" />
                    {t('issue.startDate', 'Start Date')}
                  </label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>
                    <CalendarDays className="mr-1 inline h-4 w-4" />
                    {t('issue.dueDate', 'Due Date')}
                  </label>
                  <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Submit buttons ─── */}
        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={createMut.isPending || !projectId || !title.trim()}
            className="rounded-lg bg-indigo-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMut.isPending ? '...' : t('issue.create')}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-gray-300 px-8 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {t('common:cancel', 'Cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
