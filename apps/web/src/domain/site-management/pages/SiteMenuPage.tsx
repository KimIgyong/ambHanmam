import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  ChevronRight,
  Menu as MenuIcon,
  Loader2,
} from 'lucide-react';
import { CmsMenuResponse } from '@amb/types';
import {
  useMenuTree,
  useUpdateMenu,
  useReorderMenus,
  useDeleteMenu,
} from '../hooks/useMenus';
import MenuCreateModal from '../components/MenuCreateModal';

// ── Sortable Menu Item ──

interface SortableMenuItemProps {
  menu: CmsMenuResponse;
  depth: number;
  onToggleVisibility: (menu: CmsMenuResponse) => void;
  onEdit: (menu: CmsMenuResponse) => void;
  onDelete: (menu: CmsMenuResponse) => void;
  t: (key: string) => string;
}

function SortableMenuItem({
  menu,
  depth,
  onToggleVisibility,
  onEdit,
  onDelete,
  t,
}: SortableMenuItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: menu.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pageStatus = menu.page?.status;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 rounded-lg border bg-white px-3 py-2.5 transition-shadow ${
        isDragging
          ? 'z-50 border-lime-300 shadow-lg opacity-90'
          : 'border-gray-200 hover:shadow-sm'
      } ${depth > 0 ? 'ml-8 border-l-2 border-l-lime-200' : ''}`}
    >
      {/* Drag Handle */}
      <button
        className="cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Icon */}
      {menu.icon ? (
        <span className="text-base leading-none">{menu.icon}</span>
      ) : (
        <FileText className="h-4 w-4 shrink-0 text-gray-400" />
      )}

      {/* Name + Slug */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {menu.nameEn}
          </span>
          {menu.nameKo && (
            <span className="hidden truncate text-xs text-gray-400 sm:inline">
              ({menu.nameKo})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>/{menu.slug}</span>
          {menu.type === 'EXTERNAL' && menu.externalUrl && (
            <span className="flex items-center gap-0.5 text-blue-400">
              <ExternalLink className="h-3 w-3" />
              <span className="hidden max-w-[120px] truncate sm:inline">
                {menu.externalUrl}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Badges */}
      <div className="hidden items-center gap-1.5 sm:flex">
        {/* Menu Type Badge */}
        <span
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
            menu.type === 'EXTERNAL'
              ? 'bg-blue-50 text-blue-600'
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          {menu.type === 'EXTERNAL' ? t('site:menu.external') : t('site:menu.internal')}
        </span>

        {/* Page Type Badge */}
        {menu.page && (
          <span className="inline-flex items-center rounded bg-violet-50 px-1.5 py-0.5 text-[10px] font-medium text-violet-600">
            {t(`site:pageType.${menu.page.type}`)}
          </span>
        )}

        {/* Page Status Badge */}
        {pageStatus && (
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
              pageStatus === 'PUBLISHED'
                ? 'bg-green-50 text-green-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {pageStatus === 'PUBLISHED' ? t('site:page.published') : t('site:page.draft')}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Visibility Toggle */}
        <button
          onClick={() => onToggleVisibility(menu)}
          className={`rounded p-1.5 transition-colors ${
            menu.isVisible
              ? 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
              : 'text-amber-400 hover:bg-amber-50 hover:text-amber-600'
          }`}
          title={menu.isVisible ? t('site:menu.visible') : t('site:menu.hidden')}
        >
          {menu.isVisible ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Edit */}
        <button
          onClick={() => onEdit(menu)}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title={t('site:menu.editMenu')}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(menu)}
          className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Drag Overlay Item (non-interactive preview) ──

function MenuDragOverlay({ menu }: { menu: CmsMenuResponse }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-lime-300 bg-white px-3 py-2.5 shadow-xl">
      <GripVertical className="h-4 w-4 text-gray-300" />
      {menu.icon ? (
        <span className="text-base leading-none">{menu.icon}</span>
      ) : (
        <FileText className="h-4 w-4 text-gray-400" />
      )}
      <span className="text-sm font-medium text-gray-900">{menu.nameEn}</span>
      <span className="text-xs text-gray-400">/{menu.slug}</span>
    </div>
  );
}

// ── Main Page Component ──

export default function SiteMenuPage() {
  const { t } = useTranslation(['site', 'common']);
  const navigate = useNavigate();

  const { data: menuTree = [], isLoading } = useMenuTree();
  const updateMenu = useUpdateMenu();
  const reorderMenus = useReorderMenus();
  const deleteMenu = useDeleteMenu();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<CmsMenuResponse | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Flatten tree into ordered list for sortable context
  const flatMenus = useMemo(() => {
    const items: { menu: CmsMenuResponse; depth: number }[] = [];
    menuTree.forEach((parent) => {
      items.push({ menu: parent, depth: 0 });
      parent.children?.forEach((child) => {
        items.push({ menu: child, depth: 1 });
      });
    });
    return items;
  }, [menuTree]);

  const flatIds = useMemo(() => flatMenus.map((item) => item.menu.id), [flatMenus]);

  const menuMap = useMemo(() => {
    const map = new Map<string, CmsMenuResponse>();
    flatMenus.forEach(({ menu }) => map.set(menu.id, menu));
    return map;
  }, [flatMenus]);

  // ── Handlers ──

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const found = menuMap.get(event.active.id as string);
      setActiveMenu(found || null);
    },
    [menuMap],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveMenu(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = flatIds.indexOf(active.id as string);
      const newIndex = flatIds.indexOf(over.id as string);
      if (oldIndex === -1 || newIndex === -1) return;

      // Build reorder payload from new positions
      const reordered = [...flatMenus];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      // Determine parent_id based on position context
      const items = reordered.map((item, idx) => {
        // If target position is after a depth-0 item and original was depth-1, keep as child
        const parentId = item.depth > 0 ? item.menu.parentId : null;
        return {
          id: item.menu.id,
          sort_order: idx,
          parent_id: parentId,
        };
      });

      reorderMenus.mutate(items);
    },
    [flatMenus, flatIds, reorderMenus, t],
  );

  const handleToggleVisibility = useCallback(
    (menu: CmsMenuResponse) => {
      updateMenu.mutate({ id: menu.id, data: { is_visible: !menu.isVisible } });
    },
    [updateMenu, t],
  );

  const handleEdit = useCallback(
    (menu: CmsMenuResponse) => {
      if (menu.page) {
        navigate(`/site/pages/${menu.page.id}`);
      }
    },
    [navigate],
  );

  const handleDelete = useCallback(
    (menu: CmsMenuResponse) => {
      if (menu.children && menu.children.length > 0) {
        window.alert(t('site:menu.deleteHasChildren'));
        return;
      }

      if (!window.confirm(t('site:menu.deleteConfirm'))) return;

      deleteMenu.mutate(menu.id);
    },
    [deleteMenu, t],
  );

  // ── Render ──

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lime-100">
              <MenuIcon className="h-5 w-5 text-lime-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {t('site:menu.title')}
              </h1>
              <p className="text-xs text-gray-500 sm:text-sm">
                {t('site:menu.menuTree')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-md bg-lime-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-lime-700 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t('site:menu.addMenu')}</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-gray-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t('common:loading')}
          </div>
        ) : flatMenus.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-gray-400">
            <MenuIcon className="h-8 w-8" />
            <p className="text-sm">{t('site:menu.menuTree')}</p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-2 flex items-center gap-1 rounded-md bg-lime-50 px-3 py-1.5 text-sm font-medium text-lime-700 transition-colors hover:bg-lime-100"
            >
              <Plus className="h-4 w-4" />
              {t('site:menu.addMenu')}
            </button>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl">
            {/* Hint */}
            <p className="mb-3 text-xs text-gray-400">
              {t('site:menu.dragToReorder')}
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={flatIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {flatMenus.map(({ menu, depth }) => (
                    <SortableMenuItem
                      key={menu.id}
                      menu={menu}
                      depth={depth}
                      onToggleVisibility={handleToggleVisibility}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      t={t}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeMenu && <MenuDragOverlay menu={activeMenu} />}
              </DragOverlay>
            </DndContext>

            {/* Parent menu navigation */}
            {menuTree.length > 0 && (
              <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {t('site:menu.menuTree')}
                </h3>
                <div className="space-y-1">
                  {menuTree.map((parent) => (
                    <div key={parent.id}>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        {parent.icon && (
                          <span className="text-xs">{parent.icon}</span>
                        )}
                        <span className="font-medium">{parent.nameEn}</span>
                        <span className="text-xs text-gray-400">/{parent.slug}</span>
                      </div>
                      {parent.children?.length > 0 && (
                        <div className="ml-4 mt-0.5 space-y-0.5">
                          {parent.children.map((child) => (
                            <div
                              key={child.id}
                              className="flex items-center gap-1 text-xs text-gray-400"
                            >
                              <ChevronRight className="h-3 w-3" />
                              <span>{child.nameEn}</span>
                              <span>/{child.slug}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {createModalOpen && (
        <MenuCreateModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} />
      )}
    </div>
  );
}
