import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus, Pencil, Trash2, Check, X, Loader2,
  ChevronRight, Users, Building2, Network, Building, Save,
  Settings, Bot, HardDrive,
} from 'lucide-react';
import {
  useOrgUnits, useCreateOrgUnit, useUpdateOrgUnit, useDeleteOrgUnit,
  useOrgCells, useCreateOrgCell, useUpdateOrgCell, useDeleteOrgCell,
  useEntityBasicInfo, useUpdateEntityBasicInfo,
  useWorkPayroll, useUpdateWorkPayroll,
  useAiConfig, useSaveAiConfig,
} from '../hooks/useEntityOrganization';
import type { OrgUnit, OrgCell, EntityBasicInfo, WorkPayrollSettings, UpdateDriveDto } from '../service/entity-settings.service';
import {
  useEntityDriveSettings,
  useUpdateDriveSettings,
} from '../hooks/useEntitySettings';
import { useEntityStore } from '@/domain/hr/store/entity.store';
import { toast } from 'sonner';

export default function EntityOrganizationPage() {
  const { t } = useTranslation(['entitySettings', 'common']);

  return (
    <div className="h-full overflow-y-auto">
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="mb-1 text-xl font-bold text-gray-900">
        {t('entitySettings:organization.title')}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {t('entitySettings:organization.subtitle')}
      </p>

      {/* Section 1: Entity Basic Info */}
      <EntityBasicInfoSection />

      {/* Section 2: Units & Sections */}
      <div className="mt-6">
        <UnitsSection />
      </div>

      {/* Section 3: Cells */}
      <div className="mt-6">
        <CellsSection />
      </div>

      {/* Section 4: Work & Payroll Defaults */}
      <div className="mt-6">
        <WorkPayrollSection />
      </div>

      {/* Section 5: AI Agent Config */}
      <div className="mt-6">
        <AiConfigSection />
      </div>

      {/* Section 6: Drive Integration */}
      <div className="mt-6">
        <DriveSection />
      </div>
    </div>
    </div>
  );
}

/* ───────────────── Entity Basic Info Section ───────────────── */

function EntityBasicInfoSection() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data, isLoading } = useEntityBasicInfo();
  const updateMutation = useUpdateEntityBasicInfo();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<EntityBasicInfo>>({});

  const handleEdit = () => {
    if (data) {
      setForm({
        entName: data.entName,
        entNameEn: data.entNameEn,
        entCountry: data.entCountry,
        entCurrency: data.entCurrency,
        entRegNo: data.entRegNo,
        entAddress: data.entAddress,
        entRepresentative: data.entRepresentative,
        entPhone: data.entPhone,
        entEmail: data.entEmail,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({});
  };

  const handleSave = async () => {
    if (!data) return;
    const dto: Record<string, any> = {};
    if (form.entName !== data.entName) dto.ent_name = form.entName;
    if (form.entNameEn !== data.entNameEn) dto.ent_name_en = form.entNameEn;
    if (form.entCountry !== data.entCountry) dto.ent_country = form.entCountry;
    if (form.entCurrency !== data.entCurrency) dto.ent_currency = form.entCurrency;
    if (form.entRegNo !== data.entRegNo) dto.ent_reg_no = form.entRegNo;
    if (form.entAddress !== data.entAddress) dto.ent_address = form.entAddress;
    if (form.entRepresentative !== data.entRepresentative) dto.ent_representative = form.entRepresentative;
    if (form.entPhone !== data.entPhone) dto.ent_phone = form.entPhone;
    if (form.entEmail !== data.entEmail) dto.ent_email = form.entEmail;

    if (Object.keys(dto).length === 0) {
      setIsEditing(false);
      return;
    }

    try {
      await updateMutation.mutateAsync(dto);
      toast.success(t('entitySettings:organization.basicSaved'));
      setIsEditing(false);
    } catch {
      /* handled by mutation */
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-24 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      </section>
    );
  }

  if (!data) return null;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';
  const valueClass = 'text-sm text-gray-900';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building className="h-5 w-5 text-indigo-500" />
          <h3 className="font-semibold text-gray-900">
            {t('entitySettings:organization.basicInfo')}
          </h3>
          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600">
            {data.entCode}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${data.entStatus === 'ACTIVE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
            {data.entStatus}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('common:save')}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                {t('common:cancel')}
              </button>
            </>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('common:edit')}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entName')} *</label>
              <input
                type="text"
                value={form.entName || ''}
                onChange={(e) => setForm((p) => ({ ...p, entName: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entNameEn')}</label>
              <input
                type="text"
                value={form.entNameEn || ''}
                onChange={(e) => setForm((p) => ({ ...p, entNameEn: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entCountry')}</label>
              <input
                type="text"
                value={form.entCountry || ''}
                onChange={(e) => setForm((p) => ({ ...p, entCountry: e.target.value }))}
                className={inputClass}
                maxLength={5}
              />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entCurrency')}</label>
              <input
                type="text"
                value={form.entCurrency || ''}
                onChange={(e) => setForm((p) => ({ ...p, entCurrency: e.target.value }))}
                className={inputClass}
                maxLength={5}
              />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entRegNo')}</label>
              <input
                type="text"
                value={form.entRegNo || ''}
                onChange={(e) => setForm((p) => ({ ...p, entRegNo: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('entitySettings:organization.entAddress')}</label>
            <input
              type="text"
              value={form.entAddress || ''}
              onChange={(e) => setForm((p) => ({ ...p, entAddress: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entRepresentative')}</label>
              <input
                type="text"
                value={form.entRepresentative || ''}
                onChange={(e) => setForm((p) => ({ ...p, entRepresentative: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entPhone')}</label>
              <input
                type="text"
                value={form.entPhone || ''}
                onChange={(e) => setForm((p) => ({ ...p, entPhone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:organization.entEmail')}</label>
              <input
                type="email"
                value={form.entEmail || ''}
                onChange={(e) => setForm((p) => ({ ...p, entEmail: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entName')}</span>
              <p className={valueClass}>{data.entName}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entNameEn')}</span>
              <p className={valueClass}>{data.entNameEn || '-'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entCountry')}</span>
              <p className={valueClass}>{data.entCountry}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entCurrency')}</span>
              <p className={valueClass}>{data.entCurrency}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entRegNo')}</span>
              <p className={valueClass}>{data.entRegNo || '-'}</p>
            </div>
          </div>
          <div>
            <span className={labelClass}>{t('entitySettings:organization.entAddress')}</span>
            <p className={valueClass}>{data.entAddress || '-'}</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entRepresentative')}</span>
              <p className={valueClass}>{data.entRepresentative || '-'}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entPhone')}</span>
              <p className={valueClass}>{data.entPhone || '-'}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:organization.entEmail')}</span>
              <p className={valueClass}>{data.entEmail || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────── Units Section ───────────────── */

function UnitsSection() {
  const { t } = useTranslation(['entitySettings', 'settings', 'common']);
  const { data: departments, isLoading } = useOrgUnits();
  const createMutation = useCreateOrgUnit();
  const updateMutation = useUpdateOrgUnit();
  const deleteMutation = useDeleteOrgUnit();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameLocal, setNameLocal] = useState('');
  const [parentId, setParentId] = useState('');
  const [level, setLevel] = useState(1);

  const handleAdd = () => { setIsAdding(true); setEditingId(null); setName(''); setNameLocal(''); setParentId(''); setLevel(1); };
  const handleEdit = (d: OrgUnit) => { setEditingId(d.unitId); setIsAdding(false); setName(d.name); setNameLocal(d.nameLocal || ''); setParentId(d.parentId || ''); setLevel(d.level); };
  const handleCancel = () => { setIsAdding(false); setEditingId(null); setName(''); setNameLocal(''); setParentId(''); setLevel(1); };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      const payload = {
        name: name.trim(),
        name_local: nameLocal.trim() || undefined,
        parent_id: parentId || undefined,
        level,
      };
      if (isAdding) {
        await createMutation.mutateAsync(payload);
      } else if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data: payload });
      }
      handleCancel();
    } catch { /* handled by mutation */ }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('entitySettings:organization.deleteUnitConfirm'))) return;
    await deleteMutation.mutateAsync(id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const topLevel = (departments || []).filter((d) => !d.parentId);
  const childrenOf = (pid: string) => (departments || []).filter((d) => d.parentId === pid);
  const parentOptions = (departments || []).filter((d) => d.level === 1);

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const selectClass = inputClass;

  const renderForm = () => (
    <div className="flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
      <div className="flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('entitySettings:organization.unitName')} className={inputClass} autoFocus />
          <input type="text" value={nameLocal} onChange={(e) => setNameLocal(e.target.value)} placeholder={t('entitySettings:organization.unitNameLocal')} className={inputClass} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={parentId} onChange={(e) => { setParentId(e.target.value); setLevel(e.target.value ? 2 : 1); }} className={selectClass}>
            <option value="">{t('entitySettings:organization.topLevel')}</option>
            {parentOptions.filter((p) => p.unitId !== editingId).map((p) => (
              <option key={p.unitId} value={p.unitId}>{p.name} {p.nameLocal ? `(${p.nameLocal})` : ''}</option>
            ))}
          </select>
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className={selectClass}>
            <option value={1}>Unit</option>
            <option value={2}>Section</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1 pt-1">
        <button onClick={handleSave} disabled={isSaving || !name.trim()} className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button onClick={handleCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );

  const renderRow = (dept: OrgUnit, indent = 0) => {
    const children = childrenOf(dept.unitId);
    if (editingId === dept.unitId) return <div key={dept.unitId} className="mb-1.5">{renderForm()}</div>;

    return (
      <div key={dept.unitId}>
        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 hover:border-gray-200 transition-colors mb-1.5" style={{ marginLeft: indent * 20 }}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {indent > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
              <span className="text-sm font-medium text-gray-900">{dept.name}</span>
              {dept.nameLocal && <span className="text-xs text-gray-400">({dept.nameLocal})</span>}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${dept.level === 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                {dept.level === 1 ? 'Unit' : 'Section'}
              </span>
              {!dept.isActive && <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">Inactive</span>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => handleEdit(dept)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
            <button onClick={() => handleDelete(dept.unitId)} disabled={deleteMutation.isPending} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        </div>
        {children.map((child) => renderRow(child, indent + 1))}
      </div>
    );
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">
            {t('entitySettings:organization.unitsAndSections')}
          </h3>
          <span className="text-xs text-gray-400">({(departments || []).length})</span>
        </div>
        {!isAdding && !editingId && (
          <button onClick={handleAdd} className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
            <Plus className="h-3.5 w-3.5" />{t('entitySettings:organization.addUnit')}
          </button>
        )}
      </div>
      {isAdding && <div className="mb-3">{renderForm()}</div>}
      {topLevel.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">{t('entitySettings:organization.noUnits')}</div>
      ) : (
        <div>{topLevel.map((d) => renderRow(d))}</div>
      )}
    </section>
  );
}

/* ───────────────── Cells Section ───────────────── */

function CellsSection() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const currentEntity = useEntityStore((s) => s.currentEntity);
  const entityId = currentEntity?.entityId;
  const { data: allCells, isLoading } = useOrgCells();
  const createMutation = useCreateOrgCell();
  const updateMutation = useUpdateOrgCell();
  const deleteMutation = useDeleteOrgCell();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const cells = allCells || [];

  const handleAdd = () => { setIsAdding(true); setEditingId(null); setName(''); setDescription(''); };
  const handleEdit = (c: OrgCell) => { setEditingId(c.cellId); setIsAdding(false); setName(c.name); setDescription(c.description || ''); };
  const handleCancel = () => { setIsAdding(false); setEditingId(null); setName(''); setDescription(''); };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (isAdding) {
        await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          entity_id: entityId,
        });
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: { name: name.trim(), description: description.trim() || undefined },
        });
      }
      handleCancel();
    } catch { /* handled by mutation */ }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('entitySettings:organization.deleteCellConfirm'))) return;
    await deleteMutation.mutateAsync(id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-teal-500" />
          <h3 className="font-semibold text-gray-900">
            {t('entitySettings:organization.cells')}
          </h3>
          <span className="text-xs text-gray-400">({cells.length})</span>
        </div>
        {!isAdding && !editingId && (
          <button onClick={handleAdd} className="flex items-center gap-1 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors">
            <Plus className="h-3.5 w-3.5" />{t('entitySettings:organization.addCell')}
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-indigo-200 bg-indigo-50/50 p-3">
          <div className="flex-1 space-y-2">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('entitySettings:organization.cellName')} className={inputClass} autoFocus />
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('entitySettings:organization.cellDescription')} className={inputClass} />
          </div>
          <div className="flex items-center gap-1 pt-1">
            <button onClick={handleSave} disabled={isSaving || !name.trim()} className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            </button>
            <button onClick={handleCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* Cell list */}
      {cells.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">{t('entitySettings:organization.noCells')}</div>
      ) : (
        <div className="space-y-1.5">
          {cells.map((cell) => (
            <div key={cell.cellId} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 hover:border-gray-200 transition-colors">
              {editingId === cell.cellId ? (
                <div className="flex flex-1 items-start gap-2">
                  <div className="flex-1 space-y-1.5">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('entitySettings:organization.cellDescription')} className={inputClass} />
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <button onClick={handleSave} disabled={isSaving || !name.trim()} className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50 transition-colors">
                      {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button onClick={handleCancel} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{cell.name}</span>
                      <span className="flex items-center gap-0.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                        <Users className="h-3 w-3" />{cell.memberCount}
                      </span>
                    </div>
                    {cell.description && <p className="mt-0.5 truncate text-xs text-gray-500">{cell.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(cell)} className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(cell.cellId)} disabled={deleteMutation.isPending} className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/* ───────────────── Work & Payroll Section ───────────────── */

function WorkPayrollSection() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data, isLoading } = useWorkPayroll();
  const updateMutation = useUpdateWorkPayroll();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<Partial<WorkPayrollSettings>>({});

  const handleEdit = () => {
    if (data) setForm({ ...data });
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); setForm({}); };

  const handleSave = async () => {
    if (!data) return;
    const dto: Record<string, any> = {};
    if (form.entPayDay !== data.entPayDay) dto.ent_pay_day = form.entPayDay;
    if (form.entPayPeriodType !== data.entPayPeriodType) dto.ent_pay_period_type = form.entPayPeriodType;
    if (form.entPayPeriodStart !== data.entPayPeriodStart) dto.ent_pay_period_start = form.entPayPeriodStart;
    if (form.entPayPeriodEnd !== data.entPayPeriodEnd) dto.ent_pay_period_end = form.entPayPeriodEnd;
    if (form.entWorkHoursPerDay !== data.entWorkHoursPerDay) dto.ent_work_hours_per_day = form.entWorkHoursPerDay;
    if (form.entWorkDaysPerWeek !== data.entWorkDaysPerWeek) dto.ent_work_days_per_week = form.entWorkDaysPerWeek;
    if (form.entLeaveBaseDays !== data.entLeaveBaseDays) dto.ent_leave_base_days = form.entLeaveBaseDays;

    if (Object.keys(dto).length === 0) { setIsEditing(false); return; }

    try {
      await updateMutation.mutateAsync(dto);
      toast.success(t('entitySettings:workPayroll.saved'));
      setIsEditing(false);
    } catch { /* handled */ }
  };

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      </section>
    );
  }

  if (!data) return null;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';
  const valueClass = 'text-sm text-gray-900';

  const PAY_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-orange-500" />
          <h3 className="font-semibold text-gray-900">{t('entitySettings:workPayroll.title')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('common:save')}
              </button>
              <button onClick={handleCancel} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">{t('common:cancel')}</button>
            </>
          ) : (
            <button onClick={handleEdit} className="flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <Pencil className="h-3.5 w-3.5" />{t('common:edit')}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('entitySettings:workPayroll.payDay')}</label>
              <select value={form.entPayDay} onChange={(e) => setForm((p) => ({ ...p, entPayDay: Number(e.target.value) }))} className={inputClass}>
                {PAY_DAYS.map((d) => <option key={d} value={d}>{d}{t('entitySettings:workPayroll.dayUnit')}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:workPayroll.payPeriodType')}</label>
              <select value={form.entPayPeriodType} onChange={(e) => setForm((p) => ({ ...p, entPayPeriodType: e.target.value }))} className={inputClass}>
                <option value="MONTHLY_FULL">{t('entitySettings:workPayroll.monthlyFull')}</option>
                <option value="CUSTOM">{t('entitySettings:workPayroll.custom')}</option>
              </select>
            </div>
          </div>
          {form.entPayPeriodType === 'CUSTOM' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t('entitySettings:workPayroll.periodStart')}</label>
                <input type="number" min={1} max={31} value={form.entPayPeriodStart} onChange={(e) => setForm((p) => ({ ...p, entPayPeriodStart: Number(e.target.value) }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t('entitySettings:workPayroll.periodEnd')}</label>
                <input type="number" min={1} max={31} value={form.entPayPeriodEnd} onChange={(e) => setForm((p) => ({ ...p, entPayPeriodEnd: Number(e.target.value) }))} className={inputClass} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('entitySettings:workPayroll.workHours')}</label>
              <input type="number" min={1} max={24} value={form.entWorkHoursPerDay} onChange={(e) => setForm((p) => ({ ...p, entWorkHoursPerDay: Number(e.target.value) }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:workPayroll.workDays')}</label>
              <input type="number" min={1} max={7} value={form.entWorkDaysPerWeek} onChange={(e) => setForm((p) => ({ ...p, entWorkDaysPerWeek: Number(e.target.value) }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:workPayroll.leaveDays')}</label>
              <input type="number" min={0} max={365} value={form.entLeaveBaseDays} onChange={(e) => setForm((p) => ({ ...p, entLeaveBaseDays: Number(e.target.value) }))} className={inputClass} />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:workPayroll.payDay')}</span>
              <p className={valueClass}>{t('entitySettings:workPayroll.everyMonth')} {data.entPayDay}{t('entitySettings:workPayroll.dayUnit')}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:workPayroll.payPeriodType')}</span>
              <p className={valueClass}>
                {data.entPayPeriodType === 'MONTHLY_FULL'
                  ? t('entitySettings:workPayroll.monthlyFull')
                  : `${t('entitySettings:workPayroll.custom')} (${data.entPayPeriodStart}${t('entitySettings:workPayroll.dayUnit')} ~ ${data.entPayPeriodEnd}${t('entitySettings:workPayroll.dayUnit')})`}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:workPayroll.workHours')}</span>
              <p className={valueClass}>{data.entWorkHoursPerDay}{t('entitySettings:workPayroll.hoursUnit')}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:workPayroll.workDays')}</span>
              <p className={valueClass}>{data.entWorkDaysPerWeek}{t('entitySettings:workPayroll.daysUnit')}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:workPayroll.leaveDays')}</span>
              <p className={valueClass}>{data.entLeaveBaseDays}{t('entitySettings:workPayroll.daysPerYear')}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────── AI Agent Config Section ───────────────── */

function AiConfigSection() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data, isLoading } = useAiConfig();
  const saveMutation = useSaveAiConfig();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    useSharedKey: true,
    apiKey: '',
    dailyTokenLimit: 0,
    monthlyTokenLimit: 0,
  });

  const handleEdit = () => {
    if (data) {
      setForm({
        useSharedKey: data.eacUseSharedKey,
        apiKey: '',
        dailyTokenLimit: data.eacDailyTokenLimit,
        monthlyTokenLimit: data.eacMonthlyTokenLimit,
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); };

  const handleSave = async () => {
    const dto: Record<string, any> = {
      use_shared_key: form.useSharedKey,
      daily_token_limit: form.dailyTokenLimit,
      monthly_token_limit: form.monthlyTokenLimit,
    };
    if (!form.useSharedKey && form.apiKey) {
      dto.api_key = form.apiKey;
    }

    try {
      await saveMutation.mutateAsync(dto);
      toast.success(t('entitySettings:aiConfig.saved'));
      setIsEditing(false);
    } catch { /* handled */ }
  };

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      </section>
    );
  }

  if (!data) return null;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';
  const valueClass = 'text-sm text-gray-900';

  const formatTokens = (n: number) => n === 0 ? t('entitySettings:aiConfig.unlimited') : n.toLocaleString();

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">{t('entitySettings:aiConfig.title')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={saveMutation.isPending} className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {saveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('common:save')}
              </button>
              <button onClick={handleCancel} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">{t('common:cancel')}</button>
            </>
          ) : (
            <button onClick={handleEdit} className="flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <Pencil className="h-3.5 w-3.5" />{t('common:edit')}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>{t('entitySettings:aiConfig.keyMode')}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={form.useSharedKey} onChange={() => setForm((p) => ({ ...p, useSharedKey: true }))} className="text-indigo-600" />
                {t('entitySettings:aiConfig.sharedKey')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={!form.useSharedKey} onChange={() => setForm((p) => ({ ...p, useSharedKey: false }))} className="text-indigo-600" />
                {t('entitySettings:aiConfig.ownKey')}
              </label>
            </div>
          </div>
          {!form.useSharedKey && (
            <div>
              <label className={labelClass}>{t('entitySettings:aiConfig.apiKey')}</label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm((p) => ({ ...p, apiKey: e.target.value }))}
                placeholder={data.hasApiKey ? '••••••••••••••••' : 'sk-ant-api03-...'}
                className={inputClass}
              />
              {data.hasApiKey && <p className="mt-1 text-xs text-gray-400">{t('entitySettings:aiConfig.keyRegistered')}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('entitySettings:aiConfig.dailyLimit')}</label>
              <input type="number" min={0} value={form.dailyTokenLimit} onChange={(e) => setForm((p) => ({ ...p, dailyTokenLimit: Number(e.target.value) }))} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">{t('entitySettings:aiConfig.zeroUnlimited')}</p>
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:aiConfig.monthlyLimit')}</label>
              <input type="number" min={0} value={form.monthlyTokenLimit} onChange={(e) => setForm((p) => ({ ...p, monthlyTokenLimit: Number(e.target.value) }))} className={inputClass} />
              <p className="mt-1 text-xs text-gray-400">{t('entitySettings:aiConfig.zeroUnlimited')}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:aiConfig.keyMode')}</span>
              <p className={valueClass}>
                {data.eacUseSharedKey ? t('entitySettings:aiConfig.sharedKey') : t('entitySettings:aiConfig.ownKey')}
                {!data.eacUseSharedKey && data.hasApiKey && (
                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-600">{t('entitySettings:aiConfig.keyRegistered')}</span>
                )}
              </p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:aiConfig.status')}</span>
              <p className={valueClass}>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${data.eacIsActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {data.eacIsActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:aiConfig.dailyLimit')}</span>
              <p className={valueClass}>{formatTokens(data.eacDailyTokenLimit)} tokens</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:aiConfig.monthlyLimit')}</span>
              <p className={valueClass}>{formatTokens(data.eacMonthlyTokenLimit)} tokens</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ───────────────── Drive Section ───────────────── */

function DriveSection() {
  const { t } = useTranslation(['entitySettings', 'common']);
  const { data, isLoading } = useEntityDriveSettings();
  const updateMutation = useUpdateDriveSettings();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<UpdateDriveDto>({
    impersonate_email: '',
    billing_root_folder_id: '',
    billing_root_folder_name: '',
  });

  const handleEdit = () => {
    if (data) {
      setForm({
        impersonate_email: data.impersonateEmail || '',
        billing_root_folder_id: data.billingRootFolderId || '',
        billing_root_folder_name: data.billingRootFolderName || '',
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => { setIsEditing(false); };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(form);
      toast.success(t('entitySettings:drive.saved'));
      setIsEditing(false);
    } catch { /* handled */ }
  };

  if (isLoading) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      </section>
    );
  }

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
  const labelClass = 'block text-xs font-medium text-gray-500 mb-1';
  const valueClass = 'text-sm text-gray-900';

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="h-5 w-5 text-violet-500" />
          <h3 className="font-semibold text-gray-900">{t('entitySettings:drive.title')}</h3>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={updateMutation.isPending} className="flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {t('common:save')}
              </button>
              <button onClick={handleCancel} className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">{t('common:cancel')}</button>
            </>
          ) : (
            <button onClick={handleEdit} className="flex items-center gap-1 rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100">
              <Pencil className="h-3.5 w-3.5" />{t('common:edit')}
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>{t('entitySettings:drive.impersonateEmail')}</label>
            <input
              type="email"
              value={form.impersonate_email || ''}
              onChange={(e) => setForm((p) => ({ ...p, impersonate_email: e.target.value }))}
              className={inputClass}
              placeholder="service-account@company.com"
            />
            <p className="mt-1 text-xs text-gray-400">{t('entitySettings:drive.impersonateDesc')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('entitySettings:drive.billingFolderId')}</label>
              <input
                type="text"
                value={form.billing_root_folder_id || ''}
                onChange={(e) => setForm((p) => ({ ...p, billing_root_folder_id: e.target.value }))}
                className={`${inputClass} font-mono`}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjg..."
              />
            </div>
            <div>
              <label className={labelClass}>{t('entitySettings:drive.billingFolderName')}</label>
              <input
                type="text"
                value={form.billing_root_folder_name || ''}
                onChange={(e) => setForm((p) => ({ ...p, billing_root_folder_name: e.target.value }))}
                className={inputClass}
                placeholder="Billing Documents"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className={labelClass}>{t('entitySettings:drive.impersonateEmail')}</span>
            <p className={valueClass}>{data?.impersonateEmail || t('entitySettings:drive.notConfigured')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className={labelClass}>{t('entitySettings:drive.billingFolderId')}</span>
              <p className={`${valueClass} font-mono text-xs`}>{data?.billingRootFolderId || '-'}</p>
            </div>
            <div>
              <span className={labelClass}>{t('entitySettings:drive.billingFolderName')}</span>
              <p className={valueClass}>{data?.billingRootFolderName || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
