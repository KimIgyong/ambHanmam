import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Save, X, Loader2, Users } from 'lucide-react';
import type { EntityDetail } from '../service/admin.service';
import { useUpdateEntity, useEntityMembers } from '../hooks/useAdmin';

const ROLES = ['MASTER', 'MANAGER', 'MEMBER', 'VIEWER'];
const COUNTRIES = ['KR', 'VN', 'US', 'JP', 'SG'];
const CURRENCIES = ['KRW', 'VND', 'USD', 'JPY', 'SGD'];

interface EditForm {
  entityName: string;
  entityNameEn: string;
  country: string;
  currency: string;
  regNo: string;
  representative: string;
  phone: string;
  email: string;
  address: string;
}

export default function EntitySummaryTab({ entity }: { entity: EntityDetail }) {
  const { t } = useTranslation(['entityManagement', 'members']);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<EditForm>(toForm(entity));
  const updateEntity = useUpdateEntity();
  const { data: members } = useEntityMembers(entity.entityId);

  function toForm(e: EntityDetail): EditForm {
    return {
      entityName: e.entityName,
      entityNameEn: e.entityNameEn,
      country: e.country,
      currency: e.currency,
      regNo: e.regNo,
      representative: e.representative,
      phone: e.phone,
      email: e.email,
      address: e.address,
    };
  }

  const handleEdit = () => {
    setForm(toForm(entity));
    setIsEditing(true);
  };

  const handleCancel = () => setIsEditing(false);

  const handleSave = () => {
    updateEntity.mutate(
      {
        entityId: entity.entityId,
        data: {
          name: form.entityName,
          name_en: form.entityNameEn,
          country: form.country,
          currency: form.currency,
          registration_no: form.regNo,
          representative: form.representative,
          phone: form.phone,
          email: form.email,
          address: form.address,
        },
      },
      { onSuccess: () => setIsEditing(false) },
    );
  };

  const updateField = (key: keyof EditForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Basic Info */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{t('entityManagement:summary.basicInfo')}</h3>
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
            >
              <Pencil className="h-3 w-3" />
              {t('entityManagement:edit')}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
                {t('entityManagement:cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={updateEntity.isPending}
                className="flex items-center gap-1 rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {updateEntity.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                {t('entityManagement:save')}
              </button>
            </div>
          )}
        </div>
        <dl className="space-y-3">
          <InfoRow label={t('entityManagement:summary.entityCode')} value={entity.entityCode} />
          {isEditing ? (
            <>
              <EditRow label={t('entityManagement:summary.entityName')} value={form.entityName} onChange={(v) => updateField('entityName', v)} />
              <EditRow label={t('entityManagement:summary.entityNameEn')} value={form.entityNameEn} onChange={(v) => updateField('entityNameEn', v)} />
              <SelectRow label={t('entityManagement:summary.country')} value={form.country} options={COUNTRIES} onChange={(v) => updateField('country', v)} />
              <SelectRow label={t('entityManagement:summary.currency')} value={form.currency} options={CURRENCIES} onChange={(v) => updateField('currency', v)} />
              <EditRow label={t('entityManagement:summary.regNo')} value={form.regNo} onChange={(v) => updateField('regNo', v)} />
              <EditRow label={t('entityManagement:summary.representative')} value={form.representative} onChange={(v) => updateField('representative', v)} />
              <EditRow label={t('entityManagement:summary.phone')} value={form.phone} onChange={(v) => updateField('phone', v)} />
              <EditRow label={t('entityManagement:summary.email')} value={form.email} onChange={(v) => updateField('email', v)} type="email" />
              <EditRow label={t('entityManagement:summary.address')} value={form.address} onChange={(v) => updateField('address', v)} />
            </>
          ) : (
            <>
              <InfoRow label={t('entityManagement:summary.entityName')} value={entity.entityName} />
              <InfoRow label={t('entityManagement:summary.entityNameEn')} value={entity.entityNameEn || '-'} />
              <InfoRow label={t('entityManagement:summary.country')} value={entity.country || '-'} />
              <InfoRow label={t('entityManagement:summary.currency')} value={entity.currency || '-'} />
              <InfoRow label={t('entityManagement:summary.regNo')} value={entity.regNo || '-'} />
              <InfoRow label={t('entityManagement:summary.representative')} value={entity.representative || '-'} />
              <InfoRow label={t('entityManagement:summary.phone')} value={entity.phone || '-'} />
              <InfoRow label={t('entityManagement:summary.email')} value={entity.email || '-'} />
              <InfoRow label={t('entityManagement:summary.address')} value={entity.address || '-'} />
            </>
          )}
        </dl>
      </div>

      <div className="space-y-6">
        {/* Org Structure */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:summary.orgStructure')}</h3>
          <dl className="space-y-3">
            <InfoRow
              label={t('entityManagement:col.level')}
              value={
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  entity.level === 'ROOT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {t(`entityManagement:level.${entity.level}`)}
                </span>
              }
            />
            <InfoRow label={t('entityManagement:summary.parentEntity')} value={entity.parentEntityName || '-'} />
            <InfoRow label={t('entityManagement:summary.isHq')} value={entity.isHq ? 'Yes' : 'No'} />
          </dl>
        </div>

        {/* Member Status */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">{t('entityManagement:summary.memberStatus')}</h3>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3.5 w-3.5" />
              {entity.members.total} {t('entityManagement:summary.totalMembers')}
            </div>
          </div>

          {/* Role distribution */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {ROLES.map((role) => (
              <div key={role} className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 text-sm">
                <span className="text-gray-600">{t(`members:roles.${role}`)}</span>
                <span className="font-medium text-gray-900">{entity.members.byRole[role] || 0}</span>
              </div>
            ))}
          </div>

          {/* Member list table */}
          {members && members.length > 0 && (
            <div className="overflow-x-auto rounded-md border border-gray-100">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('entityManagement:member.name')}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('entityManagement:member.email')}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('entityManagement:member.role')}</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">{t('entityManagement:member.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.map((m) => (
                    <tr key={m.eurId} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">{m.userName}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-500">{m.userEmail}</td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.role === 'MASTER' ? 'bg-amber-100 text-amber-700'
                            : m.role === 'MANAGER' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {t(`members:roles.${m.role}`)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.userStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {t(`members:userStatus.${m.userStatus}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Org Units */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">{t('entityManagement:summary.orgUnits')}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center rounded-lg bg-gray-50 p-3">
              <div className="text-2xl font-bold text-gray-900">{entity.organization.unitCount}</div>
              <div className="text-xs text-gray-500">{t('entityManagement:summary.units')}</div>
            </div>
            <div className="text-center rounded-lg bg-gray-50 p-3">
              <div className="text-2xl font-bold text-gray-900">{entity.organization.cellCount}</div>
              <div className="text-xs text-gray-500">{t('entityManagement:summary.cells')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 text-right">{value}</dd>
    </div>
  );
}

function EditRow({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="flex-1 max-w-[200px]">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        />
      </dd>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="flex-1 max-w-[200px]">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-2 py-1 text-sm text-right focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
        >
          <option value="">-</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </dd>
    </div>
  );
}
