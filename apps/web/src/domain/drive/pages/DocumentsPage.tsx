import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PageTitle from '@/global/components/PageTitle';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import { FolderOpen, Search, Upload, Loader2, CheckCircle, XCircle, FolderPlus, List, LayoutGrid, ArrowUpDown, HardDrive, Settings, AlertTriangle, ExternalLink } from 'lucide-react';
import { DriveFileResponse } from '@amb/types';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import {
  useDriveStatus,
  useRegisteredFolders,
  useDriveFilesInfinite,
  useDriveSearchInfinite,
  useUploadFile,
  useCreateSubfolder,
} from '../hooks/useDrive';
import FolderCard from '../components/FolderCard';
import FileListItem from '../components/FileListItem';
import FileGridItem from '../components/FileGridItem';
import FileDetailModal from '../components/FileDetailModal';
import Breadcrumb, { BreadcrumbItem } from '../components/Breadcrumb';

export default function DocumentsPage() {
  const { t } = useTranslation(['drive', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const isMaster = useAuthStore((s) => s.isMaster);
  const guideUrl = useMemo(() => {
    const hostname = window.location.hostname;
    if (hostname.includes('stg-ama.amoeba.site')) {
      return 'https://stg-www.amoeba.site/service/ama/ama-google-drive-guide.html';
    }
    if (hostname.includes('ama.amoeba.site')) {
      return 'https://www.amoeba.site/service/ama/ama-google-drive-guide.html';
    }
    return '/service/ama/ama-google-drive-guide.html';
  }, []);

  // Drive status
  const { data: status } = useDriveStatus();
  const isConfigured = status?.configured ?? false;

  // Registered folders are the single source of truth for /drive visibility
  const { data: folders = [], isLoading: foldersLoading, error: foldersError } = useRegisteredFolders();
  const hasDriveApiError = isConfigured && !!foldersError;

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderStack, setFolderStack] = useState<BreadcrumbItem[]>([]);

  // Search state
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload
  const uploadMutation = useUploadFile();
  const createSubfolderMutation = useCreateSubfolder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<
    { file: File; status: 'pending' | 'uploading' | 'done' | 'error'; error?: string }[]
  >([]);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    return (localStorage.getItem('drive-view-mode') as 'list' | 'grid') || 'list';
  });

  // Sort
  type SortBy = 'date' | 'size' | 'type' | 'owner';
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    return (localStorage.getItem('drive-sort-by') as SortBy) || 'date';
  });
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => {
    return (localStorage.getItem('drive-sort-dir') as 'asc' | 'desc') || 'desc';
  });

  // Modal state
  const [selectedFile, setSelectedFile] = useState<DriveFileResponse | null>(null);
  const shouldShowUnregisteredGuideCard = isConfigured && !foldersLoading && !currentFolderId && folders.length === 0;

  // File listing (infinite scroll)
  const {
    data: filesPages,
    isLoading: filesLoading,
    fetchNextPage: fetchNextFiles,
    hasNextPage: hasMoreFiles,
    isFetchingNextPage: isFetchingMoreFiles,
  } = useDriveFilesInfinite(currentFolderId || '');

  // Search (infinite scroll)
  const {
    data: searchPages,
    isLoading: searchLoading,
    fetchNextPage: fetchNextSearch,
    hasNextPage: hasMoreSearch,
    isFetchingNextPage: isFetchingMoreSearch,
  } = useDriveSearchInfinite(searchQuery);

  const isSearchMode = searchQuery.length >= 2;

  // Debounced search
  const debouncedSearchInput = useDebounce(searchInput.trim(), 500);
  useEffect(() => {
    setSearchQuery(debouncedSearchInput);
  }, [debouncedSearchInput]);

  // Navigation handlers
  const handleFolderCardClick = useCallback((folderId: string, name: string) => {
    setCurrentFolderId(folderId);
    setFolderStack([{ id: folderId, name }]);
    setSearchInput('');
    setSearchQuery('');
  }, []);

  const handleSubFolderClick = useCallback((folderId: string, folderName: string) => {
    setCurrentFolderId(folderId);
    setFolderStack((prev) => [...prev, { id: folderId, name: folderName }]);
  }, []);

  const handleBreadcrumbNavigate = useCallback(
    (index: number) => {
      if (index === -1) {
        // Go to root (all folders)
        setCurrentFolderId(null);
        setFolderStack([]);
      } else {
        const targetItem = folderStack[index];
        setCurrentFolderId(targetItem.id);
        setFolderStack((prev) => prev.slice(0, index + 1));
      }
    },
    [folderStack],
  );

  const handleFileClick = useCallback((file: DriveFileResponse) => {
    setSelectedFile(file);
  }, []);

  // Upload handler
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !currentFolderId) return;

      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      const items = Array.from(files).map((file) => ({
        file,
        status: file.size > MAX_SIZE ? ('error' as const) : ('pending' as const),
        error: file.size > MAX_SIZE ? t('drive:uploadSizeLimit') : undefined,
      }));
      setUploadQueue(items);

      for (let i = 0; i < items.length; i++) {
        if (items[i].status === 'error') continue;
        setUploadQueue((prev) =>
          prev.map((item, idx) => (idx === i ? { ...item, status: 'uploading' } : item)),
        );
        try {
          await uploadMutation.mutateAsync({ folderId: currentFolderId, file: items[i].file });
          setUploadQueue((prev) =>
            prev.map((item, idx) => (idx === i ? { ...item, status: 'done' } : item)),
          );
        } catch (err) {
          setUploadQueue((prev) =>
            prev.map((item, idx) =>
              idx === i
                ? { ...item, status: 'error', error: err instanceof Error ? err.message : t('drive:uploadFailed') }
                : item,
            ),
          );
        }
      }

      // Clear queue after delay
      setTimeout(() => setUploadQueue([]), 5000);

      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [currentFolderId, uploadMutation, t],
  );

  // View mode toggle
  const handleViewModeChange = useCallback((mode: 'list' | 'grid') => {
    setViewMode(mode);
    localStorage.setItem('drive-view-mode', mode);
  }, []);

  // Sort handler
  const handleSortChange = useCallback((newSortBy: SortBy) => {
    setSortBy((prev) => {
      if (prev === newSortBy) {
        // Toggle direction if same sort clicked
        setSortDir((d) => {
          const next = d === 'asc' ? 'desc' : 'asc';
          localStorage.setItem('drive-sort-dir', next);
          return next;
        });
        return prev;
      }
      localStorage.setItem('drive-sort-by', newSortBy);
      // Default directions: date=desc, size=desc, type=asc, owner=asc
      const defaultDir = newSortBy === 'date' || newSortBy === 'size' ? 'desc' : 'asc';
      setSortDir(defaultDir);
      localStorage.setItem('drive-sort-dir', defaultDir);
      return newSortBy;
    });
  }, []);

  // Create subfolder (admin only)
  const handleCreateSubfolder = useCallback(() => {
    if (!currentFolderId) return;
    const folderName = window.prompt(t('drive:newFolderPrompt'));
    if (!folderName || !folderName.trim()) return;
    createSubfolderMutation.mutate({ parentFolderId: currentFolderId, folderName: folderName.trim() });
  }, [currentFolderId, createSubfolderMutation, t]);

  // Determine what to display
  const rawFiles = isSearchMode
    ? searchPages?.pages.flatMap((p) => p.files) || []
    : filesPages?.pages.flatMap((p) => p.files) || [];
  const isLoadingFiles = isSearchMode ? searchLoading : filesLoading;
  const hasMore = isSearchMode ? hasMoreSearch : hasMoreFiles;
  const isFetchingMore = isSearchMode ? isFetchingMoreSearch : isFetchingMoreFiles;
  const fetchMore = isSearchMode ? fetchNextSearch : fetchNextFiles;

  // Sort files (folders always first)
  const displayFiles = useMemo(() => {
    const folders = rawFiles.filter((f) => f.isFolder);
    const files = rawFiles.filter((f) => !f.isFolder);
    const dir = sortDir === 'asc' ? 1 : -1;

    files.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return dir * (new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime());
        case 'size': {
          const sA = parseInt(a.size || '0', 10);
          const sB = parseInt(b.size || '0', 10);
          return dir * (sA - sB);
        }
        case 'type':
          return dir * (a.mimeType || '').localeCompare(b.mimeType || '');
        case 'owner': {
          const oA = a.owners?.[0] || '';
          const oB = b.owners?.[0] || '';
          return dir * oA.localeCompare(oB);
        }
        default:
          return 0;
      }
    });

    return [...folders, ...files];
  }, [rawFiles, sortBy, sortDir]);

  const renderGuideCard = (className = 'mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-left') => (
    <div className={className}>
      <p className="text-sm font-semibold text-blue-900">
        {t('drive:guideCard.title')}
      </p>
      <p className="mt-1 text-xs leading-5 text-blue-700">
        {t('drive:guideCard.description')}
      </p>
      <a
        href={guideUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
      >
        {t('drive:guideCard.button')}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <PageTitle>{t('drive:title')}</PageTitle>
            <p className="text-sm text-gray-500">{t('drive:subtitle')}</p>
          </div>
          <div className="flex items-center gap-2" />
        </div>

        {/* Search bar */}
        {isConfigured && !hasDriveApiError && (currentFolderId || folders.length > 0) && (
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('drive:search')}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        )}
      </div>

      {/* Not configured warning */}
      {(!isConfigured || hasDriveApiError) && !foldersLoading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center max-w-md">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${hasDriveApiError ? 'bg-red-100' : 'bg-yellow-100'}`}>
              {hasDriveApiError
                ? <AlertTriangle className="h-8 w-8 text-red-500" />
                : <HardDrive className="h-8 w-8 text-yellow-500" />
              }
            </div>
            <h3 className="mt-4 text-base font-semibold text-gray-900">
              {hasDriveApiError
                ? t('drive:driveConnectionError.title', { defaultValue: 'Drive Connection Failed' })
                : t('drive:driveNotConfigured.title')
              }
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {hasDriveApiError
                ? t('drive:driveConnectionError.description', { defaultValue: 'Could not connect to Google Drive. Please check the Drive settings.' })
                : t('drive:driveNotConfigured.description')
              }
            </p>
            {isMaster() && (
              <button
                onClick={() => navigate('/entity-settings/drive')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <Settings className="h-4 w-4" />
                {t('drive:driveNotConfigured.goToSettings')}
              </button>
            )}
            {!isMaster() && !isAdmin && (
              <p className="mt-3 text-xs text-gray-400">
                {t('drive:driveNotConfigured.contactAdmin')}
              </p>
            )}

            {renderGuideCard()}
          </div>
        </div>
      )}

      {/* Content area */}
      {isConfigured && !hasDriveApiError && (
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Search results mode */}
          {isSearchMode && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">
                  {t('drive:searchResults')}
                </p>
                <div className="flex items-center gap-2">
                  {/* Sort dropdown */}
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value as SortBy)}
                      className="rounded-lg border border-gray-200 bg-white py-1 pl-1 pr-6 text-xs text-gray-700 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="date">{t('drive:sort.date')}</option>
                      <option value="size">{t('drive:sort.size')}</option>
                      <option value="type">{t('drive:sort.type')}</option>
                      <option value="owner">{t('drive:sort.owner')}</option>
                    </select>
                    <button
                      onClick={() => handleSortChange(sortBy)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={sortDir === 'asc' ? '↑' : '↓'}
                    >
                      <span className="text-xs font-medium">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    </button>
                  </div>
                  {/* View toggle */}
                  <div className="flex rounded-lg border border-gray-200 bg-white">
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`rounded-l-lg p-1.5 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      className={`rounded-r-lg p-1.5 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              {searchLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
                </div>
              ) : displayFiles.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  {t('drive:noResults')}
                </p>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {displayFiles.map((file) => (
                    <FileGridItem
                      key={file.id}
                      file={file}
                      onFolderClick={handleSubFolderClick}
                      onFileClick={handleFileClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {displayFiles.map((file) => (
                    <FileListItem
                      key={file.id}
                      file={file}
                      onFolderClick={handleSubFolderClick}
                      onFileClick={handleFileClick}
                    />
                  ))}
                </div>
              )}
              {hasMore && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => fetchMore()}
                    disabled={isFetchingMore}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isFetchingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('drive:loadMore')}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Root folder list */}
          {!isSearchMode && !currentFolderId && (
            <>
              {foldersLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
                </div>
              ) : (
                <>
                  {/* Registered folders section (single source: /drive/folders) */}
                  {folders.length > 0 && (
                    <div className="mb-6">
                      <div className="space-y-2">
                        {folders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            onClick={() => handleFolderCardClick(folder.folderId, folder.folderName)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {shouldShowUnregisteredGuideCard && (
                    <div className="mb-6">
                      {renderGuideCard('rounded-xl border border-blue-200 bg-blue-50 p-4 text-left')}
                    </div>
                  )}

                  {/* Empty state */}
                  {folders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                        <FolderOpen className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-gray-900">
                        {t('drive:noFolders')}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {t('drive:noFoldersDesc')}
                      </p>
                      {renderGuideCard('mt-5 w-full max-w-md rounded-xl border border-blue-200 bg-blue-50 p-4 text-left')}
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Upload progress */}
          {uploadQueue.length > 0 && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 space-y-2">
              {uploadQueue.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  {item.status === 'uploading' && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />}
                  {item.status === 'done' && <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />}
                  {item.status === 'error' && <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                  {item.status === 'pending' && <div className="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300" />}
                  <span className="truncate text-gray-700">{item.file.name}</span>
                  <span className="ml-auto shrink-0 text-xs text-gray-400">
                    {(item.file.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                  {item.status === 'error' && item.error && (
                    <span className="shrink-0 text-xs text-red-500">{item.error}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Subfolder file listing */}
          {!isSearchMode && currentFolderId && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Breadcrumb items={folderStack} onNavigate={handleBreadcrumbNavigate} />
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {/* Sort dropdown */}
                  <div className="flex items-center gap-1">
                    <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value as SortBy)}
                      className="rounded-lg border border-gray-200 bg-white py-1 pl-1 pr-6 text-xs text-gray-700 focus:border-purple-500 focus:outline-none"
                    >
                      <option value="date">{t('drive:sort.date')}</option>
                      <option value="size">{t('drive:sort.size')}</option>
                      <option value="type">{t('drive:sort.type')}</option>
                      <option value="owner">{t('drive:sort.owner')}</option>
                    </select>
                    <button
                      onClick={() => handleSortChange(sortBy)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title={sortDir === 'asc' ? '↑' : '↓'}
                    >
                      <span className="text-xs font-medium">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    </button>
                  </div>
                  {/* View mode toggle */}
                  <div className="flex rounded-lg border border-gray-200 bg-white">
                    <button
                      onClick={() => handleViewModeChange('list')}
                      className={`rounded-l-lg p-1.5 ${viewMode === 'list' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                      title={t('drive:viewList')}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleViewModeChange('grid')}
                      className={`rounded-r-lg p-1.5 ${viewMode === 'grid' ? 'bg-purple-100 text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
                      title={t('drive:viewGrid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                  </div>
                  {/* Admin: Create subfolder */}
                  {isAdmin && (
                    <button
                      onClick={handleCreateSubfolder}
                      disabled={createSubfolderMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      title={t('drive:newFolder')}
                    >
                      <FolderPlus className="h-4 w-4" />
                      {t('drive:newFolder')}
                    </button>
                  )}
                  {/* Upload button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    <Upload className="h-4 w-4" />
                    {t('drive:upload')}
                  </button>
                </div>
              </div>

              {isLoadingFiles ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
                </div>
              ) : displayFiles.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  {t('drive:noFiles')}
                </p>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {displayFiles.map((file) => (
                    <FileGridItem
                      key={file.id}
                      file={file}
                      onFolderClick={handleSubFolderClick}
                      onFileClick={handleFileClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {displayFiles.map((file) => (
                    <FileListItem
                      key={file.id}
                      file={file}
                      onFolderClick={handleSubFolderClick}
                      onFileClick={handleFileClick}
                    />
                  ))}
                </div>
              )}
              {hasMore && (
                <div className="pt-4 text-center">
                  <button
                    onClick={() => fetchMore()}
                    disabled={isFetchingMore}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isFetchingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                    {t('drive:loadMore')}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedFile && (
        <FileDetailModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
