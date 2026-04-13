import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Upload, Trash2 } from 'lucide-react';
import { NoticeResponse, NOTICE_VISIBILITY, UNIT_CODE } from '@amb/types';
import RichTextEditor from '@/domain/meeting-notes/components/RichTextEditor';

interface NoticeFormModalProps {
  notice?: NoticeResponse;
  onSubmit: (formData: FormData | { title?: string; content?: string; visibility?: string; unit?: string; is_pinned?: boolean }) => void;
  onClose: () => void;
  onDeleteAttachment?: (attachmentId: string) => void;
  isSaving: boolean;
}

export default function NoticeFormModal({
  notice,
  onSubmit,
  onClose,
  onDeleteAttachment,
  isSaving,
}: NoticeFormModalProps) {
  const { t } = useTranslation(['notices', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(notice?.title || '');
  const [content, setContent] = useState(notice?.content || '');
  const [visibility, setVisibility] = useState<string>(notice?.visibility || 'PUBLIC');
  const [unit, setUnit] = useState(notice?.unit || '');
  const [isPinned, setIsPinned] = useState(notice?.isPinned || false);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const isEdit = !!notice;

  useEffect(() => {
    if (notice) {
      setTitle(notice.title);
      setContent(notice.content);
      setVisibility(notice.visibility);
      setUnit(notice.unit || '');
      setIsPinned(notice.isPinned);
    }
  }, [notice]);

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;

    if (isEdit) {
      onSubmit({
        title,
        content,
        visibility,
        unit: visibility === 'UNIT' ? unit : undefined,
        is_pinned: isPinned,
      });
    } else {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('visibility', visibility);
      if (visibility === 'UNIT' && unit) {
        formData.append('unit', unit);
      }
      formData.append('is_pinned', String(isPinned));
      newFiles.forEach((file) => formData.append('files', file));
      onSubmit(formData);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEdit ? t('notices:editNotice') : t('notices:createNotice')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-4">
          {/* Title */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('notices:form.title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('notices:form.titlePlaceholder')}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('notices:form.content')}
            </label>
            <RichTextEditor content={content} onChange={setContent} maxHeight="400px" />
          </div>

          {/* Visibility + Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('notices:form.visibility')}
              </label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {Object.values(NOTICE_VISIBILITY).map((v) => (
                  <option key={v} value={v}>
                    {t(`notices:visibility.${v}`)}
                  </option>
                ))}
              </select>
            </div>
            {visibility === 'UNIT' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('notices:form.unit')}
                </label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">--</option>
                  {Object.values(UNIT_CODE).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Pin toggle */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">{t('notices:form.pinned')}</span>
          </label>

          {/* Existing attachments (edit mode) */}
          {isEdit && notice!.attachments.length > 0 && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('notices:form.attachments')}
              </label>
              <div className="space-y-1">
                {notice!.attachments.map((att) => (
                  <div key={att.attachmentId} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                    <span className="truncate text-gray-700">{att.originalName}</span>
                    <button
                      type="button"
                      onClick={() => onDeleteAttachment?.(att.attachmentId)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New file upload (create mode) */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('notices:form.attachments')}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
              >
                <Upload className="h-4 w-4" />
                {t('notices:form.addFile')}
                <span className="text-xs text-gray-400">({t('notices:form.maxFileSize')})</span>
              </button>
              {newFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  {newFiles.map((file, i) => (
                    <div key={i} className="flex items-center justify-between rounded bg-gray-50 px-3 py-1.5 text-sm">
                      <span className="truncate text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeNewFile(i)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t('common:close')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving || !title.trim() || !content.trim()}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('common:save')}
          </button>
        </div>
      </div>
    </div>
  );
}
