import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentPreview } from '../hooks/useDocBuilder';
import { Eye, Loader2, FileText, ChevronDown, ChevronRight } from 'lucide-react';

interface DocumentPreviewProps {
  docTypeId: string;
  audience: string;
  language: string;
  sections?: string[];
}

export default function DocumentPreview({ docTypeId, audience, language, sections }: DocumentPreviewProps) {
  const { t } = useTranslation('kms');
  const previewMutation = useDocumentPreview();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const handleGenerate = () => {
    previewMutation.mutate({ doc_type_id: docTypeId, audience, language, sections });
  };

  const toggleSection = (code: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const previewData = previewMutation.data;

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">{t('docBuilder.preview.title')}</h3>
        </div>
        <button
          onClick={handleGenerate}
          disabled={previewMutation.isPending || !docTypeId}
          className="flex items-center gap-1.5 rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {previewMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="h-3.5 w-3.5" />
          )}
          {previewMutation.isPending ? t('docBuilder.preview.generating') : t('docBuilder.preview.title')}
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {!previewData && !previewMutation.isPending && (
          <div className="py-8 text-center text-sm text-gray-400">
            <FileText className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            {t('docBuilder.preview.noContent')}
          </div>
        )}

        {previewMutation.isPending && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          </div>
        )}

        {previewData && (
          <div className="divide-y divide-gray-50">
            {(Array.isArray(previewData) ? previewData : []).map((section: any) => {
              const isExpanded = expandedSections.has(section.code);
              return (
                <div key={section.code}>
                  <button
                    onClick={() => toggleSection(section.code)}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium text-gray-700">{section.name}</span>
                    <span className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {section.code}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-50 bg-gray-50/50 px-4 py-3">
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-600">
                        {section.content}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
