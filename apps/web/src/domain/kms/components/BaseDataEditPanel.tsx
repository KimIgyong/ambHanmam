import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, History, RotateCcw } from 'lucide-react';
import { DocBaseCategoryResponse, DocBaseDataResponse, FieldSchema } from '../service/doc-builder.service';
import { useCreateDocData, useUpdateDocData, useDocDataHistory, useRollbackDocData } from '../hooks/useDocBuilder';
import BaseDataField from './BaseDataField';
import { LocalDateTime } from '@/components/common/LocalDateTime';

interface Props {
  category: DocBaseCategoryResponse;
  existingData: DocBaseDataResponse | null;
  language: string;
  onBack: () => void;
  onSaved: () => void;
}

export default function BaseDataEditPanel({ category, existingData, language, onBack, onSaved }: Props) {
  const { t } = useTranslation('kms');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [changeReason, setChangeReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [dirty, setDirty] = useState(false);

  const createData = useCreateDocData();
  const updateData = useUpdateDocData();
  const rollback = useRollbackDocData();
  const { data: history } = useDocDataHistory(existingData?.dbdId || '');

  useEffect(() => {
    if (existingData?.dbdData) {
      setFormData({ ...existingData.dbdData });
    } else {
      setFormData({});
    }
    setDirty(false);
  }, [existingData]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    if (existingData) {
      await updateData.mutateAsync({
        dbdId: existingData.dbdId,
        data: formData,
        change_reason: changeReason || undefined,
        update_source: 'MANUAL',
      });
    } else {
      await createData.mutateAsync({
        category_id: category.dbcId,
        language,
        data: formData,
        update_source: 'MANUAL',
      });
    }
    setChangeReason('');
    setDirty(false);
    onSaved();
  };

  const handleRollback = async (version: number) => {
    if (!existingData) return;
    await rollback.mutateAsync({ dbdId: existingData.dbdId, version });
    setShowHistory(false);
    onSaved();
  };

  const isSaving = createData.isPending || updateData.isPending;

  return (
    <div className="mx-auto max-w-4xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {language === 'ko' ? category.dbcNameKr : category.dbcName}
            </h2>
            <p className="text-sm text-gray-500">{category.dbcDescription}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {existingData && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                showHistory
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <History className="h-4 w-4" />
              {t('docBuilder.history')}
              {existingData && (
                <span className="text-xs text-gray-400">v{existingData.dbdVersion}</span>
              )}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || isSaving}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? t('docBuilder.saving') : t('docBuilder.save')}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Form */}
        <div className={`flex-1 ${showHistory ? 'max-w-2xl' : ''}`}>
          {/* Version info */}
          {existingData && (
            <div className="mb-4 flex items-center gap-4 rounded-md bg-gray-50 px-4 py-2 text-xs text-gray-500">
              <span>{t('docBuilder.version')}: v{existingData.dbdVersion}</span>
              <span>{t('docBuilder.source')}: {existingData.dbdUpdateSource}</span>
              <span>{t('docBuilder.lastUpdated')}: {<LocalDateTime value={existingData.dbdUpdatedAt} format='YYYY-MM-DD HH:mm' />}</span>
            </div>
          )}

          {/* Fields */}
          <div className="space-y-4">
            {category.dbcFieldSchema?.map((field: FieldSchema) => (
              <BaseDataField
                key={field.field}
                field={field}
                value={formData[field.field]}
                onChange={(val) => handleFieldChange(field.field, val)}
              />
            ))}
          </div>

          {/* Change reason (for updates) */}
          {existingData && dirty && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t('docBuilder.changeReason')}
              </label>
              <input
                type="text"
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                placeholder={t('docBuilder.changeReasonPlaceholder')}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* History Panel */}
        {showHistory && history && (
          <div className="w-72 shrink-0">
            <h3 className="mb-3 text-sm font-semibold text-gray-700">{t('docBuilder.versionHistory')}</h3>
            <div className="space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-gray-400">{t('docBuilder.noHistory')}</p>
              ) : (
                history.map((h) => (
                  <div
                    key={h.dbhId}
                    className="rounded-md border border-gray-100 bg-gray-50 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">v{h.dbhVersion}</span>
                      <button
                        onClick={() => handleRollback(h.dbhVersion)}
                        className="flex items-center gap-1 rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                        {t('docBuilder.rollback')}
                      </button>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {<LocalDateTime value={h.dbhCreatedAt} format='YYYY-MM-DD HH:mm' />}
                    </p>
                    {h.dbhChangeReason && (
                      <p className="mt-1 text-xs text-gray-400">{h.dbhChangeReason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
