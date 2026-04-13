import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Plus, LayoutGrid, List, FileText, Video, CalendarDays, User, Search, Share2 } from 'lucide-react';
import { useMeetingNoteList, useCreateMeetingNote, useMeetingNoteFolders } from '../hooks/useMeetingNotes';
import MeetingNoteCard from '../components/MeetingNoteCard';
import MeetingNoteFormModal from '../components/MeetingNoteFormModal';
import NoteFolderSidebar from '../components/NoteFolderSidebar';
import NoteSearch from '../components/NoteSearch';
import { MeetingNoteFormData } from '../service/meeting-note.service';
import ViewScopeTab, { type ViewScope } from '@/shared/components/ViewScopeTab';
import { useDebounce } from '@/hooks/useDebounce';
import PageTitle from '@/global/components/PageTitle';

type NoteTypeFilter = '' | 'MEETING_NOTE' | 'MEMO' | 'DAILY_NOTE';

const PAGE_SIZE = 20;

const NOTE_TYPE_TABS: { value: NoteTypeFilter; labelKey: string; icon: React.ReactNode }[] = [
  { value: '', labelKey: 'filter.all', icon: <FileText className="h-3.5 w-3.5" /> },
  { value: 'MEETING_NOTE', labelKey: 'type.MEETING_NOTE', icon: <Video className="h-3.5 w-3.5" /> },
  { value: 'MEMO', labelKey: 'type.MEMO', icon: <FileText className="h-3.5 w-3.5" /> },
  { value: 'DAILY_NOTE', labelKey: 'type.DAILY_NOTE', icon: <CalendarDays className="h-3.5 w-3.5" /> },
];

export default function MeetingNotesPage() {
  const { t } = useTranslation(['meetingNotes']);
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<NoteTypeFilter>('');
  const [scopeFilter, setScopeFilter] = useState<ViewScope>('mine');
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('notes-view-mode') as 'card' | 'list') || 'list';
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 400);
  const [page, setPage] = useState(1);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const { data: folders = [] } = useMeetingNoteFolders();
  const { data, isLoading } = useMeetingNoteList({
    ...(typeFilter ? { type: typeFilter } : { exclude_daily: true }),
    ...(scopeFilter !== 'all' ? { scope: scopeFilter } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(activeFolderId ? { folder_id: activeFolderId } : {}),
    page,
    size: PAGE_SIZE,
  });
  const notes = data?.data || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const createNote = useCreateMeetingNote();
  const [showFormModal, setShowFormModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('notes-view-mode', mode);
  };

  const handleCreate = (data: MeetingNoteFormData) => {
    createNote.mutate(data, {
      onSuccess: () => setShowFormModal(false),
    });
  };

  const getNoteIcon = (type: string) => {
    if (type === 'MEETING_NOTE') return <Video className="h-4 w-4 shrink-0 text-amber-500" />;
    if (type === 'DAILY_NOTE') return <CalendarDays className="h-4 w-4 shrink-0 text-violet-500" />;
    return <FileText className="h-4 w-4 shrink-0 text-sky-500" />;
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <PageTitle>{t('meetingNotes:title')}</PageTitle>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              title="Cmd+K"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">{t('meetingNotes:search.button')}</span>
              <kbd className="hidden sm:inline-block rounded border border-gray-200 bg-gray-50 px-1 py-0.5 text-[10px] text-gray-400">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => navigate('/meeting-notes/graph')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
              title={t('meetingNotes:graph.title')}
            >
              <Share2 className="h-4 w-4" />
            </button>
            <div className="flex rounded-lg border border-gray-300 p-0.5">
              <button
                onClick={() => handleViewModeChange('card')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'card' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title={t('common:menuCategory.viewCard')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title={t('common:menuCategory.viewList')}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              {t('meetingNotes:newNote')}
            </button>
          </div>
        </div>

        {/* Folder Bar */}
        <NoteFolderSidebar
          folders={folders}
          activeFolderId={activeFolderId}
          onFolderSelect={(id) => { setActiveFolderId(id); setPage(1); }}
          totalNoteCount={totalCount}
        />

        {/* Filter Row — Type 탭(좌측) + ViewScope 탭(우측) 1줄 */}
        <div className="mb-4 flex items-center justify-between gap-2">
          {/* 좌측: Note Type 탭 */}
          <div className="flex flex-wrap gap-1.5">
            {NOTE_TYPE_TABS.map(({ value, labelKey, icon }) => (
              <button
                key={value}
                onClick={() => { setTypeFilter(value); setPage(1); }}
                className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  typeFilter === value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{t(`meetingNotes:${labelKey}`)}</span>
              </button>
            ))}
          </div>

          {/* 우측: ViewScope 탭 */}
          <ViewScopeTab
            activeScope={scopeFilter}
            onScopeChange={(scope) => { setScopeFilter(scope); setPage(1); }}
          />
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }}
              placeholder={t('meetingNotes:filter.searchPlaceholder', { defaultValue: 'Search notes...' })}
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
            {t('meetingNotes:noNotes')}
          </div>
        ) : (
          <>
            {viewMode === 'card' ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {notes.map((note) => (
                  <MeetingNoteCard
                    key={note.meetingNoteId}
                    note={note}
                    onClick={() => navigate(`/meeting-notes/${note.meetingNoteId}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
                {notes.map((note) => (
                  <div
                    key={note.meetingNoteId}
                    onClick={() => navigate(`/meeting-notes/${note.meetingNoteId}`)}
                    className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                  >
                    {getNoteIcon(note.type)}
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                      {note.title}
                    </span>
                    <span className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 sm:flex">
                      <User className="h-3 w-3" />
                      {note.authorName}
                    </span>
                    <span className="shrink-0 flex items-center gap-1 text-xs text-gray-400">
                      <CalendarDays className="h-3 w-3" />
                      {note.type === 'MEETING_NOTE' ? note.meetingDate : note.createdAt.split('T')[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {t('meetingNotes:pagination.showing', {
                    from: (page - 1) * PAGE_SIZE + 1,
                    to: Math.min(page * PAGE_SIZE, totalCount),
                    total: totalCount,
                  })}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('meetingNotes:pagination.prev')}
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {t('meetingNotes:pagination.next')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showFormModal && (
          <MeetingNoteFormModal
            isOpen={showFormModal}
            onClose={() => setShowFormModal(false)}
            onSubmit={handleCreate}
            folders={folders}
            activeFolderId={activeFolderId}
          />
        )}

        <NoteSearch isOpen={showSearch} onClose={() => setShowSearch(false)} />
      </div>
    </div>
  );
}
