import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { UnitResponse } from '@amb/types';

interface UnitTreeProps {
  departments: UnitResponse[];
  selectedId?: string;
  onSelect: (dept: UnitResponse) => void;
  onAddChild?: (parentId: string) => void;
  onEdit?: (dept: UnitResponse) => void;
  onDelete?: (dept: UnitResponse) => void;
  showActions?: boolean;
}

export default function UnitTree({
  departments,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  showActions = false,
}: UnitTreeProps) {
  return (
    <div className="space-y-0.5">
      {departments.map((dept) => (
        <TreeNode
          key={dept.unitId}
          department={dept}
          selectedId={selectedId}
          onSelect={onSelect}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
          level={0}
        />
      ))}
    </div>
  );
}

function TreeNode({
  department,
  selectedId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  showActions,
  level,
}: {
  department: UnitResponse;
  selectedId?: string;
  onSelect: (dept: UnitResponse) => void;
  onAddChild?: (parentId: string) => void;
  onEdit?: (dept: UnitResponse) => void;
  onDelete?: (dept: UnitResponse) => void;
  showActions: boolean;
  level: number;
}) {
  const { t } = useTranslation('acl');
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = department.children && department.children.length > 0;
  const isSelected = selectedId === department.unitId;

  return (
    <div>
      <div
        className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm cursor-pointer transition-colors ${
          isSelected
            ? 'bg-indigo-50 text-indigo-700'
            : 'hover:bg-gray-50 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(department)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="shrink-0 p-0.5 rounded hover:bg-gray-200"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : (
          <span className="w-[18px]" />
        )}

        <Users className="h-3.5 w-3.5 shrink-0 text-gray-400" />

        <span className="flex-1 truncate font-medium">{department.name}</span>

        {department.nameLocal && (
          <span className="text-xs text-gray-400 truncate max-w-[100px]">
            {department.nameLocal}
          </span>
        )}

        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            department.level === 1
              ? 'bg-blue-100 text-blue-600'
              : 'bg-purple-100 text-purple-600'
          }`}
        >
          {department.level === 1 ? t('department.levelDepartment') : t('department.levelTeam')}
        </span>

        {!department.isActive && (
          <span className="shrink-0 rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
            {t('department.inactive')}
          </span>
        )}

        {showActions && (
          <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
            {onAddChild && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddChild(department.unitId);
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                title={t('department.addTeam')}
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(department);
                }}
                className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(department);
                }}
                className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div>
          {department.children!.map((child) => (
            <TreeNode
              key={child.unitId}
              department={child}
              selectedId={selectedId}
              onSelect={onSelect}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              showActions={showActions}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
