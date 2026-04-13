import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, Loader2, Sparkles, Clock, HardDrive, Eye } from 'lucide-react';
import { useDocTypes, useGenerateDocument, useGeneratedDocuments } from '../hooks/useDocBuilder';
import { DocGeneratedResponse } from '../service/doc-builder.service';
import { docBuilderService } from '../service/doc-builder.service';
import { LocalDateTime } from '@/components/common/LocalDateTime';

const AUDIENCES = ['CLIENT', 'INVESTOR', 'PARTNER', 'GOVERNMENT'] as const;
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ko', label: '한국어' },
  { value: 'vi', label: 'Tiếng Việt' },
];
const FORMATS = ['PPTX', 'DOCX', 'PDF'] as const;

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-yellow-50 text-yellow-700',
  FINALIZED: 'bg-green-50 text-green-700',
  ARCHIVED: 'bg-gray-50 text-gray-500',
};

interface DocGeneratePanelProps {
  onViewDocument?: (doc: DocGeneratedResponse) => void;
}

export default function DocGeneratePanel({ onViewDocument }: DocGeneratePanelProps) {
  const { t, i18n } = useTranslation('kms');
  const lang = i18n.language === 'ko' ? 'ko' : 'en';

  const { data: docTypes } = useDocTypes();
  const { data: documents, refetch: refetchDocs } = useGeneratedDocuments();
  const generateMutation = useGenerateDocument();

  const [activeTab, setActiveTab] = useState<'generate' | 'documents'>('generate');
  const [selectedType, setSelectedType] = useState<string>('');
  const [audience, setAudience] = useState<string>('CLIENT');
  const [language, setLanguage] = useState<string>(i18n.language === 'ko' ? 'ko' : i18n.language === 'vi' ? 'vi' : 'en');
  const [format, setFormat] = useState<string>('PPTX');
  const [title, setTitle] = useState('');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [useAllSections, setUseAllSections] = useState(true);

  const selectedDocType = docTypes?.find((dt) => dt.dtpId === selectedType);
  const sections = selectedDocType?.dtpSectionTemplate || [];

  const handleGenerate = async () => {
    if (!selectedType) return;
    await generateMutation.mutateAsync({
      doc_type_id: selectedType,
      audience,
      language,
      format,
      title: title || undefined,
      sections: useAllSections ? undefined : selectedSections,
    });
    refetchDocs();
    setActiveTab('documents');
  };

  const handleDownload = async (doc: DocGeneratedResponse) => {
    const blob = await docBuilderService.downloadDocument(doc.dgnId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.dgnTitle.replace(/[^a-zA-Z0-9가-힣\s]/g, '_')}.${doc.dgnFileFormat || 'pptx'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAudienceLabel = (aud: string) => {
    const key = `docBuilder.audience${aud.charAt(0) + aud.slice(1).toLowerCase()}` as const;
    return t(key);
  };

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Sub-tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'generate' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Sparkles className="mr-1.5 inline h-4 w-4" />
          {t('docBuilder.generateTab')}
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            activeTab === 'documents' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="mr-1.5 inline h-4 w-4" />
          {t('docBuilder.documentsTab')}
          {documents && documents.length > 0 && (
            <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
              {documents.length}
            </span>
          )}
        </button>
      </div>

      {/* Generate Tab */}
      {activeTab === 'generate' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{t('docBuilder.generateTitle')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('docBuilder.generateDesc')}</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
            {/* Document Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('docBuilder.docType')}</label>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setSelectedSections([]); }}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">--</option>
                {docTypes?.filter((dt) => dt.dtpIsActive).map((dt) => (
                  <option key={dt.dtpId} value={dt.dtpId}>
                    {lang === 'ko' ? dt.dtpNameKr : dt.dtpName}
                  </option>
                ))}
              </select>
            </div>

            {/* Audience + Language + Format row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('docBuilder.audience')}</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {AUDIENCES.map((a) => (
                    <option key={a} value={a}>{getAudienceLabel(a)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('docBuilder.language')}</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('docBuilder.format')}</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {FORMATS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('docBuilder.customTitle')}</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('docBuilder.customTitlePlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Sections */}
            {selectedDocType && sections.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">{t('docBuilder.selectSections')}</label>
                <label className="mb-2 flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={useAllSections}
                    onChange={(e) => setUseAllSections(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  {t('docBuilder.allSections')}
                </label>
                {!useAllSections && (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {sections.map((s: any) => (
                      <label key={s.code} className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={selectedSections.includes(s.code)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSections([...selectedSections, s.code]);
                            } else {
                              setSelectedSections(selectedSections.filter((c) => c !== s.code));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!selectedType || generateMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('docBuilder.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t('docBuilder.generateButton')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-900">{t('docBuilder.documents')}</h3>

          {!documents || documents.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">{t('docBuilder.noDocuments')}</p>
              <p className="mt-1 text-xs text-gray-400">{t('docBuilder.noDocumentsDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.dgnId}
                  className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 hover:border-gray-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      doc.dgnFileFormat === 'docx' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{doc.dgnTitle}</p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.dgnStatus] || STATUS_STYLES.DRAFT}`}>
                          {doc.dgnStatus}
                        </span>
                        <span>{getAudienceLabel(doc.dgnAudienceType)}</span>
                        <span className="uppercase">{doc.dgnFileFormat}</span>
                        <span className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(doc.dgnFileSizeBytes)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {<LocalDateTime value={doc.dgnCreatedAt} format='YYYY-MM-DD HH:mm' />}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {onViewDocument && (
                      <button
                        onClick={() => onViewDocument(doc)}
                        className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Eye className="h-4 w-4" />
                        {t('docBuilder.viewDetail')}
                      </button>
                    )}
                    <button
                      onClick={() => handleDownload(doc)}
                      className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      {t('docBuilder.download')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
