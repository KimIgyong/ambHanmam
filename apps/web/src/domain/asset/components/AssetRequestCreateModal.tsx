import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { useCreateDraft, useSubmitRequest, useAssetList } from '../hooks/useAsset';
import type { CreateAssetRequestBody } from '../service/asset.service';

const REQUEST_TYPES = ['NEW_RENTAL', 'MEETING_ROOM_RESERVATION', 'EXTENSION', 'RETURN', 'REPLACEMENT'] as const;
const CATEGORIES = ['IT_EQUIPMENT', 'SUPPLY', 'FACILITY', 'MEETING_ROOM', 'VEHICLE'] as const;
const MEETING_TYPES = ['INTERNAL', 'EXTERNAL', 'VIDEO'] as const;

interface Props {
  onClose: () => void;
}

export default function AssetRequestCreateModal({ onClose }: Props) {
  const { t } = useTranslation('asset');
  const createDraft = useCreateDraft();
  const submitRequest = useSubmitRequest();
  const { data: assets } = useAssetList();

  const [form, setForm] = useState<CreateAssetRequestBody>({
    request_type: 'NEW_RENTAL',
    asset_select_mode: 'CATEGORY_ONLY',
    purpose: '',
    start_at: '',
    end_at: '',
  });
  const [meetingTitle, setMeetingTitle] = useState('');
  const [attendeeCount, setAttendeeCount] = useState<number>(0);
  const [meetingType, setMeetingType] = useState('INTERNAL');

  const isMeetingRoom = form.request_type === 'MEETING_ROOM_RESERVATION';

  const update = (key: keyof CreateAssetRequestBody, value: unknown) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const buildPayload = (): CreateAssetRequestBody => {
    const payload: CreateAssetRequestBody = { ...form };
    if (isMeetingRoom) {
      payload.meeting_title = meetingTitle;
      payload.attendee_count = attendeeCount;
      payload.meeting_type = meetingType;
      // For meeting rooms, force category
      payload.asset_select_mode = 'CATEGORY_ONLY';
      payload.asset_category = 'MEETING_ROOM';
    }
    return payload;
  };

  const handleSaveDraft = async () => {
    await createDraft.mutateAsync(buildPayload());
    onClose();
  };

  const handleSubmit = async () => {
    const draft = await createDraft.mutateAsync(buildPayload());
    await submitRequest.mutateAsync(draft.requestId);
    onClose();
  };

  const isPending = createDraft.isPending || submitRequest.isPending;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('request.create')}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('request.type')} <span className="text-red-500">*</span>
            </label>
            <select
              value={form.request_type}
              onChange={(e) => update('request_type', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {REQUEST_TYPES.map((rt) => (
                <option key={rt} value={rt}>{t(`requestType.${rt}`)}</option>
              ))}
            </select>
          </div>

          {/* Asset Selection (not for meeting room) */}
          {!isMeetingRoom && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('request.selectMode')}
                </label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="selectMode"
                      checked={form.asset_select_mode === 'SPECIFIC'}
                      onChange={() => update('asset_select_mode', 'SPECIFIC')}
                    />
                    {t('request.specific')}
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input
                      type="radio"
                      name="selectMode"
                      checked={form.asset_select_mode === 'CATEGORY_ONLY'}
                      onChange={() => update('asset_select_mode', 'CATEGORY_ONLY')}
                    />
                    {t('request.categoryOnly')}
                  </label>
                </div>
              </div>

              {form.asset_select_mode === 'SPECIFIC' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('common.asset')}
                  </label>
                  <select
                    value={form.asset_id || ''}
                    onChange={(e) => update('asset_id', e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- {t('common.asset')} --</option>
                    {assets?.map((a) => (
                      <option key={a.assetId} value={a.assetId}>
                        [{a.assetCode}] {a.assetName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('form.category')}
                  </label>
                  <select
                    value={form.asset_category || ''}
                    onChange={(e) => update('asset_category', e.target.value || undefined)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- {t('form.category')} --</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{t(`category.${c}`)}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Purpose */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('request.purpose')} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.purpose}
              onChange={(e) => update('purpose', e.target.value)}
              rows={2}
              placeholder={t('request.purposePlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('request.startAt')} <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.start_at}
                onChange={(e) => update('start_at', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('request.endAt')} <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={form.end_at}
                onChange={(e) => update('end_at', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Place */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('request.place')}
            </label>
            <input
              type="text"
              value={form.place || ''}
              onChange={(e) => update('place', e.target.value)}
              placeholder={t('request.placePlaceholder')}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Meeting Room specific fields */}
          {isMeetingRoom && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('request.meetingTitle')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  placeholder={t('request.meetingTitlePlaceholder')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('request.attendeeCount')}
                  </label>
                  <input
                    type="number"
                    value={attendeeCount || ''}
                    onChange={(e) => setAttendeeCount(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('request.meetingType')}
                  </label>
                  <select
                    value={meetingType}
                    onChange={(e) => setMeetingType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {MEETING_TYPES.map((mt) => (
                      <option key={mt} value={mt}>{t(`request.meetingType${mt.charAt(0) + mt.slice(1).toLowerCase()}`)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {t('form.cancel')}
          </button>
          <button
            onClick={handleSaveDraft}
            disabled={isPending || !form.purpose || !form.start_at || !form.end_at}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            {t('request.saveDraft')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.purpose || !form.start_at || !form.end_at}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {t('request.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
