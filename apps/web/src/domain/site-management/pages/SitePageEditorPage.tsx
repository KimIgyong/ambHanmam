import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Eye,
  Globe,
  Loader2,
  FileText,
  Search,
  History,
  Monitor,
  Layout,
} from 'lucide-react';
import { usePageDetail, useSaveContent, usePublishPage, useUnpublishPage } from '../hooks/usePages';
import { useCmsEditorStore } from '../store/cms.store';
import { cmsPageService } from '../service/cms-api.service';

import StaticEditor from '../components/StaticEditor';
import SectionBuilder from '../components/SectionBuilder';
import PageMetaForm from '../components/PageMetaForm';
import VersionHistory from '../components/VersionHistory';
import PublishConfirmModal from '../components/PublishConfirmModal';

type EditorTab = 'content' | 'meta' | 'versions';

const STATUS_BADGE: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PUBLISHED: 'bg-green-100 text-green-700',
  ARCHIVED: 'bg-yellow-100 text-yellow-700',
};

export default function SitePageEditorPage() {
  const { t } = useTranslation(['site', 'common']);
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  // Store
  const editorLang = useCmsEditorStore((s) => s.editorLang);
  const setEditorLang = useCmsEditorStore((s) => s.setEditorLang);
  const isDirty = useCmsEditorStore((s) => s.isDirty);
  const setDirty = useCmsEditorStore((s) => s.setDirty);

  // Query / Mutations
  const { data: page, isLoading, refetch: refetchPage } = usePageDetail(pageId ?? null);
  const saveContentMutation = useSaveContent();
  const publishMutation = usePublishPage();
  const unpublishMutation = useUnpublishPage();

  // Local state
  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [editableTitle, setEditableTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialContentRef = useRef('');

  // ── Derived data ──
  const currentContent = useMemo(() => {
    if (!page?.contents) return null;
    return page.contents.find((c) => c.lang === editorLang) ?? page.contents[0] ?? null;
  }, [page, editorLang]);

  const isPublished = page?.status === 'PUBLISHED';
  const isLandingPage = page?.type === 'LANDING';
  const renderMode: 'CMS' | 'STATIC' = page?.config?.renderMode || 'CMS';

  // ── Sync page data into local state ──
  useEffect(() => {
    if (page) {
      setEditableTitle(page.title || '');
    }
  }, [page]);

  useEffect(() => {
    if (currentContent) {
      setLocalContent(currentContent.content || '');
      initialContentRef.current = currentContent.content || '';
    }
  }, [currentContent]);

  // ── Clean up on unmount ──
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      setDirty(false);
    };
  }, [setDirty]);

  // ── Unsaved changes blocker ──
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        t('site:page.unsavedChanges', 'You have unsaved changes. Leave anyway?'),
      );
      if (confirmed) {
        setDirty(false);
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker, setDirty, t]);

  // ── Browser beforeunload ──
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // ── Content change handler (with auto-save debounce) ──
  const handleContentChange = useCallback(
    (newContent: string) => {
      setLocalContent(newContent);

      const hasChanged = newContent !== initialContentRef.current;
      setDirty(hasChanged);

      // Clear previous auto-save timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }

      if (!hasChanged || !pageId) return;

      // Auto-save after 3 seconds of inactivity
      autoSaveTimerRef.current = setTimeout(async () => {
        try {
          await saveContentMutation.mutateAsync({
            pageId,
            data: { content: newContent, lang: editorLang },
          });
          initialContentRef.current = newContent;
          setDirty(false);
        } catch {
          // Silent failure for auto-save — user can manually save
        }
      }, 3000);
    },
    [pageId, editorLang, saveContentMutation, setDirty, t],
  );

  // ── Manual save ──
  const handleSave = useCallback(async () => {
    if (!pageId) return;

    // Clear pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    setIsSaving(true);
    try {
      await saveContentMutation.mutateAsync({
        pageId,
        data: { content: localContent, lang: editorLang },
      });
      initialContentRef.current = localContent;
      setDirty(false);
    } catch {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [pageId, localContent, editorLang, saveContentMutation, setDirty, t]);

  // ── Preview ──
  const handlePreview = useCallback(async () => {
    if (!pageId) return;
    try {
      const { token } = await cmsPageService.getPreview(pageId);
      const previewUrl = `${window.location.origin}/site/preview/${token}`;
      window.open(previewUrl, '_blank', 'noopener,noreferrer');
    } catch {
      // Preview failed
    }
  }, [pageId]);

  // ── Unpublish ──
  const handleUnpublish = useCallback(async () => {
    if (!pageId) return;
    const confirmed = window.confirm(t('site:page.unpublishConfirm'));
    if (!confirmed) return;

    try {
      await unpublishMutation.mutateAsync(pageId);
    } catch {
      // Error handled by mutation
    }
  }, [pageId, unpublishMutation, t]);

  // ── Render mode toggle (LANDING pages) ──
  const handleRenderModeChange = useCallback(
    async (mode: 'CMS' | 'STATIC') => {
      if (!pageId) return;
      try {
        await cmsPageService.updatePage(pageId, {
          config: { ...page?.config, renderMode: mode },
        });
      } catch {
        // Error handled silently
      }
    },
    [pageId, page?.config],
  );

  // ── Navigate back ──
  const handleBack = useCallback(() => {
    navigate('/site/pages');
  }, [navigate]);

  // ── Status label helper ──
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return t('site:page.draft');
      case 'PUBLISHED':
        return t('site:page.published');
      case 'ARCHIVED':
        return t('site:page.archived');
      default:
        return status;
    }
  };

  // ── Tab config ──
  const tabs: { key: EditorTab; labelKey: string; icon: typeof FileText }[] = [
    { key: 'content', labelKey: 'site:page.content', icon: FileText },
    { key: 'meta', labelKey: 'site:page.metaSeo', icon: Search },
    { key: 'versions', labelKey: 'site:page.versionHistory', icon: History },
  ];

  // ── Loading state ──
  if (isLoading || !page) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-600" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Top Bar ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <button
            onClick={handleBack}
            className="shrink-0 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title={t('common:cancel')}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Editable title */}
          <input
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            placeholder={t('site:page.editor')}
            className="min-w-0 flex-1 truncate border-0 bg-transparent text-lg font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0"
          />

          {/* Status badge */}
          <span
            className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              STATUS_BADGE[page.status] || 'bg-gray-100 text-gray-600'
            }`}
          >
            {getStatusLabel(page.status)}
          </span>

          {/* Dirty indicator */}
          {isDirty && (
            <span className="shrink-0 h-2 w-2 rounded-full bg-orange-400" title="Unsaved changes" />
          )}

          {/* Language toggle */}
          <div className="shrink-0 flex rounded-md border border-gray-300 text-xs font-medium">
            {(['en', 'ko'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setEditorLang(lang)}
                className={`px-2.5 py-1 transition-colors ${
                  editorLang === lang
                    ? 'bg-lime-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                } ${lang === 'en' ? 'rounded-l-md' : 'rounded-r-md border-l border-gray-300'}`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex items-center gap-2">
            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {t('site:page.save')}
            </button>

            {/* Preview */}
            <button
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{t('site:page.preview')}</span>
            </button>

            {/* Publish / Unpublish */}
            {isPublished ? (
              <button
                onClick={handleUnpublish}
                disabled={unpublishMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md border border-orange-300 bg-orange-50 px-3 py-1.5 text-sm font-medium text-orange-700 transition-colors hover:bg-orange-100 disabled:opacity-50"
              >
                {unpublishMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t('site:page.unpublish')}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowPublishModal(true)}
                className="inline-flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-lime-700"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{t('site:page.publish')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 sm:px-6">
        <nav className="-mb-px flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'border-lime-600 text-lime-700'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(tab.labelKey)}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Render Mode Toggle (LANDING pages only) ── */}
      {isLandingPage && (
        <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              {t('site:page.renderMode')}
            </span>
            <div className="flex rounded-lg border border-gray-300 bg-white p-0.5">
              <button
                onClick={() => handleRenderModeChange('CMS')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  renderMode === 'CMS'
                    ? 'bg-lime-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={t('site:page.renderModeCmsDesc')}
              >
                <Layout className="h-3.5 w-3.5" />
                {t('site:page.renderModeCms')}
              </button>
              <button
                onClick={() => handleRenderModeChange('STATIC')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  renderMode === 'STATIC'
                    ? 'bg-lime-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={t('site:page.renderModeStaticDesc')}
              >
                <Monitor className="h-3.5 w-3.5" />
                {t('site:page.renderModeStatic')}
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {t('site:page.renderModeDesc')}
            </span>
          </div>
        </div>
      )}

      {/* ── Content Area ── */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'content' && (
          <div className="h-full">
            {page.type === 'STATIC' && (
              <StaticEditor
                content={localContent}
                onChange={handleContentChange}
              />
            )}
            {(page.type === 'LANDING' || page.type === 'SERVICE_INFO') && pageId && (
              <SectionBuilder
                pageId={pageId}
                sections={page.sections || []}
                onRefresh={() => refetchPage()}
              />
            )}
            {page.type !== 'STATIC' && page.type !== 'LANDING' && page.type !== 'SERVICE_INFO' && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <FileText className="h-12 w-12" />
                <p className="mt-3 text-sm">
                  {t(`site:pageType.${page.type}`)} editor is not available yet.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'meta' && (
          <PageMetaForm
            page={{
              id: page.id,
              title: page.title,
              description: page.description,
              ogImage: page.ogImage,
              seoKeywords: page.seoKeywords ? page.seoKeywords.split(',').map((s) => s.trim()).filter(Boolean) : [],
            }}
            onSave={(data) => {
              if (!pageId) return;
              cmsPageService.updatePage(pageId, data);
            }}
          />
        )}

        {activeTab === 'versions' && pageId && (
          <VersionHistory pageId={pageId} />
        )}
      </div>

      {/* ── Publish Confirm Modal ── */}
      {showPublishModal && pageId && (
        <PublishConfirmModal
          open={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          onConfirm={async (note: string) => {
            try {
              await publishMutation.mutateAsync({ pageId, note });
              setShowPublishModal(false);
            } catch {
              // Error handled by mutation
            }
          }}
          isPublishing={publishMutation.isPending}
        />
      )}
    </div>
  );
}
