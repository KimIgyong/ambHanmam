import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, Check, X, Loader2, ChevronRight } from 'lucide-react';
import { UnitResponse } from '@amb/types';
import {
  useAllUnits,
  useCreateUnit,
  useUpdateUnit,
  useDeleteUnit,
} from '../hooks/useUnits';

interface Props {
  entityId: string;
}

export default function EntityUnitsTab({ entityId }: Props) {
  const { t } = useTranslation(['settings', 'common']);
  const { data: departments, isLoading } = useAllUnits(entityId);
  const createMutation = useCreateUnit();
  const updateMutation = useUpdateUnit();
  const deleteMutation = useDeleteUnit();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameLocal, setNameLocal] = useState('');
  const [parentId, setParentId] = useState('');
  const [level, setLevel] = useState(1);

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setName('');
    setNameLocal('');
    setParentId('');
    setLevel(1);
  };

  const handleEdit = (dept: UnitResponse) => {
    setEditingId(dept.unitId);
    setIsAdding(false);
    setName(dept.name);
    setNameLocal(dept.nameLocal || '');
    setParentId(dept.parentId || '');
    setLevel(dept.level);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setName('');
    setNameLocal('');
    setParentId('');
    setLevel(1);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (isAdding) {
        await createMutation.mutateAsync({
          data: {
            name: name.trim(),
            name_local: nameLocal.trim() || undefined,
            parent_id: parentId || undefined,
            level,
          },
          entityId,
        });
      } else if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: {
            name: name.trim(),
            name_local: nameLocal.trim() || undefined,
            parent_id: parentId || undefined,
            level,
          },
        });
      }
      handleCancel();
    } catch {
      // Error handled by mutation
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('settings:entities.deleteDepartmentConfirm', { defaultValue: '이 부서를 삭제하시겠습니까?' }))) return;
    await deleteMutation.mutateAsync(id);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // Build hierarchy: top-level units
  const topLevel = (departments || []).filter((d: UnitResponse) => !d.parentId);
  const childrenOf = (parentUnitId: string) =>
    (departments || []).filter((d: UnitResponse) => d.parentId === parentUnitId);

  // Parent unit options for dropdown (only level 1)
  const parentOptions = (departments || []).filter((d: UnitResponse) => d.level === 1);

  if (isLoading) {
    return (
      <div className="flex h-20 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';
  const selectClass =
    'w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500';

  const renderDeptForm = () => (
    <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50/50 p-3">
      <div className="flex-1 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('settings:entities.departmentName', { defaultValue: '부서명' })}
            className={inputClass}
            autoFocus
          />
          <input
            type="text"
            value={nameLocal}
            onChange={(e) => setNameLocal(e.target.value)}
            placeholder={t('settings:entities.departmentNameLocal', { defaultValue: '현지 부서명 (선택)' })}
            className={inputClass}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select
            value={parentId}
            onChange={(e) => {
              setParentId(e.target.value);
              setLevel(e.target.value ? 2 : 1);
            }}
            className={selectClass}
          >
            <option value="">{t('settings:entities.topLevel', { defaultValue: '최상위 부서' })}</option>
            {parentOptions
              .filter((p: UnitResponse) => p.unitId !== editingId)
              .map((p: UnitResponse) => (
                <option key={p.unitId} value={p.unitId}>
                  {p.name} {p.nameLocal ? `(${p.nameLocal})` : ''}
                </option>
              ))}
          </select>
          <select value={level} onChange={(e) => setLevel(Number(e.target.value))} className={selectClass}>
            <option value={1}>Department</option>
            <option value={2}>Team</option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1 pt-1">
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="rounded-md p-1.5 text-teal-600 hover:bg-teal-100 disabled:opacity-50 transition-colors"
        >
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button
          onClick={handleCancel}
          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const renderDeptRow = (dept: UnitResponse, indent = 0) => {
    const children = childrenOf(dept.unitId);
    const isEditing = editingId === dept.unitId;

    if (isEditing) {
      return (
        <div key={dept.unitId} className="mb-1.5">
          {renderDeptForm()}
        </div>
      );
    }

    return (
      <div key={dept.unitId}>
        <div
          className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 hover:border-gray-200 transition-colors mb-1.5"
          style={{ marginLeft: indent * 20 }}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {indent > 0 && <ChevronRight className="h-3 w-3 text-gray-300" />}
              <span className="text-sm font-medium text-gray-900">{dept.name}</span>
              {dept.nameLocal && (
                <span className="text-xs text-gray-400">({dept.nameLocal})</span>
              )}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                dept.level === 1 ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {dept.level === 1 ? 'Dept' : 'Team'}
              </span>
              {!dept.isActive && (
                <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(dept)}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(dept.unitId)}
              disabled={deleteMutation.isPending}
              className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {children.map((child: UnitResponse) => renderDeptRow(child, indent + 1))}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-700">
          {t('settings:entities.units', { defaultValue: '부서 관리' })}
          <span className="ml-2 text-xs font-normal text-gray-400">({(departments || []).length})</span>
        </h4>
        {!isAdding && !editingId && (
          <button
            onClick={handleAdd}
            className="flex items-center gap-1 rounded-md bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('settings:entities.addDepartment', { defaultValue: '부서 추가' })}
          </button>
        )}
      </div>

      {/* Add form */}
      {isAdding && <div className="mb-3">{renderDeptForm()}</div>}

      {/* Unit list */}
      {topLevel.length === 0 && !isAdding ? (
        <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-xs text-gray-400">
          {t('settings:entities.noDepartments', { defaultValue: '등록된 부서가 없습니다.' })}
        </div>
      ) : (
        <div>
          {topLevel.map((dept: UnitResponse) => renderDeptRow(dept))}
        </div>
      )}
    </div>
  );
}
