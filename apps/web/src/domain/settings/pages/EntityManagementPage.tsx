import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Loader2, ArrowLeft, Plus, Pencil, X, Check, Stamp, Trash2, ChevronDown, Users, Network } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HrEntityResponse } from '@amb/types';
import { apiClient } from '@/lib/api-client';
import { useEntityList, useCreateEntity, useUpdateEntity } from '../hooks/useEntities';
import EntityCellsTab from '../components/EntityCellsTab';
import EntityUnitsTab from '../components/EntityUnitsTab';

interface EntityFormData {
  code: string;
  name: string;
  name_en: string;
  country: string;
  currency: string;
  registration_no: string;
  address: string;
  representative: string;
  phone: string;
  email: string;
  pay_day: number;
  status: string;
  email_display_name: string;
  email_brand_color: string;
  email_logo_url: string;
}

const EMPTY_FORM: EntityFormData = {
  code: '',
  name: '',
  name_en: '',
  country: 'VN',
  currency: 'VND',
  registration_no: '',
  address: '',
  representative: '',
  phone: '',
  email: '',
  pay_day: 25,
  status: 'ACTIVE',
  email_display_name: '',
  email_brand_color: '',
  email_logo_url: '',
};

const COUNTRIES = ['KR', 'VN'];
const CURRENCIES = ['KRW', 'VND', 'USD'];

function entityToForm(entity: HrEntityResponse): EntityFormData {
  return {
    code: entity.code,
    name: entity.name,
    name_en: entity.nameEn || '',
    country: entity.country,
    currency: entity.currency,
    registration_no: entity.registrationNo || '',
    address: entity.address || '',
    representative: entity.representative || '',
    phone: (entity as any).phone || '',
    email: (entity as any).email || '',
    pay_day: entity.payDay,
    status: entity.status,
    email_display_name: entity.emailDisplayName || '',
    email_brand_color: entity.emailBrandColor || '',
    email_logo_url: entity.emailLogoUrl || '',
  };
}

export default function EntityManagementPage() {
  const { t } = useTranslation(['settings', 'common']);
  const navigate = useNavigate();
  const { data: entities, isLoading } = useEntityList();
  const createMutation = useCreateEntity();
  const updateMutation = useUpdateEntity();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<EntityFormData>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subTab, setSubTab] = useState<'cells' | 'units'>('cells');
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleEdit = (entity: HrEntityResponse) => {
    setEditingId(entity.entityId);
    setForm(entityToForm(entity));
    setIsCreating(false);
    setStatusMessage(null);
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setStatusMessage(null);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsCreating(false);
    setStatusMessage(null);
  };

  const handleSave = async () => {
    setStatusMessage(null);
    try {
      if (isCreating) {
        await createMutation.mutateAsync({ ...form } as unknown as Record<string, unknown>);
        setStatusMessage({ type: 'success', text: t('settings:entities.createSuccess') });
        setIsCreating(false);
      } else if (editingId) {
        const { code: _code, ...updateData } = form;
        await updateMutation.mutateAsync({ id: editingId, data: { ...updateData } as unknown as Record<string, unknown> });
        setStatusMessage({ type: 'success', text: t('settings:entities.saveSuccess') });
        setEditingId(null);
      }
    } catch {
      setStatusMessage({ type: 'error', text: t('settings:entities.saveFailed') });
    }
  };

  const handleChange = (field: keyof EntityFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isEditing = editingId !== null || isCreating;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
              <Building2 className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {t('settings:entities.title')}
              </h1>
              <p className="text-sm text-gray-500">
                {t('settings:entities.subtitle')}
              </p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('settings:entities.addNew')}
            </button>
          )}
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mb-4 rounded-lg p-3 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Create Form */}
        {isCreating && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-white p-6">
            <h3 className="mb-4 text-sm font-semibold text-gray-900">
              {t('settings:entities.addNew')}
            </h3>
            <EntityForm
              form={form}
              onChange={handleChange}
              isCodeDisabled={false}
              t={t}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                {t('common:close')}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !form.code || !form.name}
                className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {t('common:create')}
              </button>
            </div>
          </div>
        )}

        {/* Entity List */}
        {(!entities || entities.length === 0) && !isCreating ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            {t('settings:entities.empty')}
          </div>
        ) : (
          <div className="space-y-4">
            {entities?.map((entity) => (
              <div
                key={entity.entityId}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                {editingId === entity.entityId ? (
                  <>
                    <EntityForm
                      form={form}
                      onChange={handleChange}
                      isCodeDisabled={true}
                      t={t}
                    />
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        {t('common:close')}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50 transition-colors"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        {t('common:save')}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                  <div className="flex items-start justify-between">
                    <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.code')}</span>
                        <p className="font-medium text-gray-900">{entity.code}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.name')}</span>
                        <p className="font-medium text-gray-900">{entity.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.country')}</span>
                        <p className="font-medium text-gray-900">{entity.country}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.currency')}</span>
                        <p className="font-medium text-gray-900">{entity.currency}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.representative')}</span>
                        <p className="font-medium text-gray-900">{entity.representative || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.payDay')}</span>
                        <p className="font-medium text-gray-900">{entity.payDay}</p>
                      </div>
                      <div>
                        <span className="text-gray-400">{t('settings:entities.form.status')}</span>
                        <p className="font-medium text-gray-900">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              entity.status === 'ACTIVE'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {t(`settings:entities.status.${entity.status}`)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <StampUploadButton entityId={entity.entityId} />
                      <button
                        onClick={() => handleEdit(entity)}
                        className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setExpandedId(expandedId === entity.entityId ? null : entity.entityId);
                          setSubTab('cells');
                        }}
                        className={`shrink-0 rounded-md p-2 transition-colors ${
                          expandedId === entity.entityId
                            ? 'bg-teal-50 text-teal-600'
                            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                        }`}
                        title={t('settings:entities.manageSubItems', { defaultValue: '그룹/부서 관리' })}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedId === entity.entityId ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expandable Groups/Departments section */}
                  {expandedId === entity.entityId && (
                    <div className="mt-4 border-t border-gray-100 pt-4">
                      <div className="mb-4 flex gap-4 border-b border-gray-100">
                        <button
                          onClick={() => setSubTab('cells')}
                          className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
                            subTab === 'cells'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          {t('settings:entities.cells', { defaultValue: '그룹 관리' })}
                        </button>
                        <button
                          onClick={() => setSubTab('units')}
                          className={`flex items-center gap-1.5 border-b-2 pb-2 text-sm font-medium transition-colors ${
                            subTab === 'units'
                              ? 'border-teal-500 text-teal-600'
                              : 'border-transparent text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          <Network className="h-4 w-4" />
                          {t('settings:entities.units', { defaultValue: '부서 관리' })}
                        </button>
                      </div>
                      {subTab === 'cells' && (
                        <EntityCellsTab entityId={entity.entityId} entityCode={entity.code} />
                      )}
                      {subTab === 'units' && (
                        <EntityUnitsTab entityId={entity.entityId} />
                      )}
                    </div>
                  )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EntityForm({
  form,
  onChange,
  isCodeDisabled,
  t,
}: {
  form: EntityFormData;
  onChange: (field: keyof EntityFormData, value: string | number) => void;
  isCodeDisabled: boolean;
  t: (key: string) => string;
}) {
  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:bg-gray-50 disabled:text-gray-500';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.code')} *
        </label>
        <input
          type="text"
          value={form.code}
          onChange={(e) => onChange('code', e.target.value)}
          disabled={isCodeDisabled}
          className={inputClass}
          placeholder="VN01"
          maxLength={10}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.name')} *
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => onChange('name', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.nameEn')}
        </label>
        <input
          type="text"
          value={form.name_en}
          onChange={(e) => onChange('name_en', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.country')}
        </label>
        <select
          value={form.country}
          onChange={(e) => onChange('country', e.target.value)}
          className={inputClass}
        >
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.currency')}
        </label>
        <select
          value={form.currency}
          onChange={(e) => onChange('currency', e.target.value)}
          className={inputClass}
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.registrationNo')}
        </label>
        <input
          type="text"
          value={form.registration_no}
          onChange={(e) => onChange('registration_no', e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.address')}
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => onChange('address', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.representative')}
        </label>
        <input
          type="text"
          value={form.representative}
          onChange={(e) => onChange('representative', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.phone')}
        </label>
        <input
          type="text"
          value={form.phone}
          onChange={(e) => onChange('phone', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.email')}
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => onChange('email', e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.payDay')}
        </label>
        <input
          type="number"
          min={1}
          max={31}
          value={form.pay_day}
          onChange={(e) => onChange('pay_day', parseInt(e.target.value) || 25)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('settings:entities.form.status')}
        </label>
        <select
          value={form.status}
          onChange={(e) => onChange('status', e.target.value)}
          className={inputClass}
        >
          <option value="ACTIVE">{t('settings:entities.status.ACTIVE')}</option>
          <option value="INACTIVE">{t('settings:entities.status.INACTIVE')}</option>
        </select>
      </div>

      {/* Email Branding Section */}
      <div className="col-span-full mt-2 border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          {t('settings:entities.emailBranding.title')}
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('settings:entities.emailBranding.displayName')}
            </label>
            <input
              type="text"
              value={form.email_display_name}
              onChange={(e) => onChange('email_display_name', e.target.value)}
              className={inputClass}
              placeholder="e.g. AMB Korea"
              maxLength={200}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('settings:entities.emailBranding.displayNameHint')}
            </p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('settings:entities.emailBranding.brandColor')}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={form.email_brand_color || '#4F46E5'}
                onChange={(e) => onChange('email_brand_color', e.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-gray-300 bg-white p-0.5"
              />
              <input
                type="text"
                value={form.email_brand_color}
                onChange={(e) => onChange('email_brand_color', e.target.value)}
                className={inputClass}
                placeholder="#4F46E5"
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('settings:entities.emailBranding.logoUrl')}
            </label>
            <input
              type="url"
              value={form.email_logo_url}
              onChange={(e) => onChange('email_logo_url', e.target.value)}
              className={inputClass}
              placeholder="https://..."
              maxLength={500}
            />
            <p className="mt-1 text-xs text-gray-400">
              {t('settings:entities.emailBranding.logoUrlHint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StampUploadButton({ entityId, initialHasStamp }: { entityId: string; initialHasStamp?: boolean }) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hasStamp, setHasStamp] = useState<boolean>(initialHasStamp ?? false);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await apiClient.post(`/hr/entities/${entityId}/stamp`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setHasStamp(true);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    await apiClient.delete(`/hr/entities/${entityId}/stamp`);
    setHasStamp(false);
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg"
        onChange={handleUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className={`shrink-0 rounded-md p-2 transition-colors ${
          hasStamp
            ? 'text-green-600 hover:bg-green-50'
            : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
        }`}
        title={hasStamp ? 'Stamp uploaded' : 'Upload stamp'}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Stamp className="h-4 w-4" />}
      </button>
      {hasStamp && (
        <button
          onClick={handleDelete}
          className="shrink-0 rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Delete stamp"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
