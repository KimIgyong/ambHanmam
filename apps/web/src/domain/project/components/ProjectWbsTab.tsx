import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  DndContext,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Layers,
  Box,
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
} from 'lucide-react';
import { IssueResponse, ProjectEpicResponse, ProjectComponentResponse, EpicStatus } from '@amb/types';
import {
  useWbsTree,
  useCreateEpic,
  useUpdateEpic,
  useDeleteEpic,
  useCreateComponent,
  useUpdateComponent,
  useDeleteComponent,
  useUpdateIssueGroup,
} from '../hooks/useWbs';
import { useUpdateIssue, useDeleteIssue } from '@/domain/issues/hooks/useIssues';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import IssueDetailModal from '@/domain/issues/components/IssueDetailModal';
import IssueFormModal from '@/domain/issues/components/IssueFormModal';
import IssueDeleteConfirmModal from '@/domain/issues/components/IssueDeleteConfirmModal';

interface ProjectWbsTabProps {
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-indigo-100 text-indigo-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const EPIC_STATUS_STYLES: Record<EpicStatus, string> = {
  PLANNED: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const DEFAULT_EPIC_COLORS = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4', '#F97316'];
const DEFAULT_COMPONENT_COLORS = ['#3B82F6', '#14B8A6', '#A855F7', '#F43F5E', '#22C55E', '#EAB308', '#0EA5E9', '#E879F9'];

export default function ProjectWbsTab({ projectId }: ProjectWbsTabProps) {
  const { t } = useTranslation(['project', 'issues']);
  const queryClient = useQueryClient();
  const isMaster = useAuthStore((s) => s.isMaster());

  const [showClosed, setShowClosed] = useState(false);
  const [closedVisibleGroups, setClosedVisibleGroups] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeIssue, setActiveIssue] = useState<IssueResponse | null>(null);

  // Modal states
  const [selectedIssue, setSelectedIssue] = useState<IssueResponse | null>(null);
  const [editingIssue, setEditingIssue] = useState<IssueResponse | null>(null);
  const [deletingIssue, setDeletingIssue] = useState<IssueResponse | null>(null);

  // Epic/Component form states
  const [epicForm, setEpicForm] = useState<{ open: boolean; editing?: ProjectEpicResponse }>({ open: false });
  const [componentForm, setComponentForm] = useState<{ open: boolean; editing?: ProjectComponentResponse }>({ open: false });
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formStatus, setFormStatus] = useState<EpicStatus>('PLANNED');

  // Mutations
  const createEpic = useCreateEpic(projectId);
  const updateEpic = useUpdateEpic(projectId);
  const deleteEpic = useDeleteEpic(projectId);
  const createComponent = useCreateComponent(projectId);
  const updateComponent = useUpdateComponent(projectId);
  const deleteComponent = useDeleteComponent(projectId);
  const updateIssue = useUpdateIssue();
  const deleteIssue = useDeleteIssue();
  const updateIssueGroup = useUpdateIssueGroup(projectId);

  const { data: wbsTree, isLoading } = useWbsTree(projectId, { include_closed: true });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const issue = event.active.data.current?.issue as IssueResponse | undefined;
    setActiveIssue(issue || null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveIssue(null);
      const { active, over } = event;
      if (!over) return;

      const issue = active.data.current?.issue as IssueResponse | undefined;
      if (!issue) return;

      const targetId = over.id as string;

      // Determine target group
      let groupType: 'epic' | 'component' | 'unassigned';
      let groupId: string | undefined;

      if (targetId === 'drop-unassigned') {
        groupType = 'unassigned';
      } else if (targetId.startsWith('drop-epic-')) {
        groupType = 'epic';
        groupId = targetId.replace('drop-epic-', '');
      } else if (targetId.startsWith('drop-comp-')) {
        groupType = 'component';
        groupId = targetId.replace('drop-comp-', '');
      } else {
        return;
      }

      // Skip if already in same group
      if (groupType === 'epic' && issue.epicId === groupId) return;
      if (groupType === 'component' && issue.componentId === groupId) return;
      if (groupType === 'unassigned' && !issue.epicId && !issue.componentId) return;

      updateIssueGroup.mutate(
        { issueId: issue.issueId, data: { group_type: groupType, group_id: groupId } },
        { onSuccess: () => toast.success(t('project:wbs.issueGroupUpdated', '이슈 그룹이 변경되었습니다')) },
      );
    },
    [updateIssueGroup, t],
  );

  const toggleGroup = (id: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroupClosed = (groupKey: string) => {
    setClosedVisibleGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  };

  const isClosedIssue = (issue: IssueResponse) => issue.status === 'CLOSED' || issue.status === 'REJECTED';

  const filterGroupIssues = (issues: IssueResponse[], groupKey: string) => {
    if (showClosed || closedVisibleGroups.has(groupKey)) return issues;
    return issues.filter((i) => !isClosedIssue(i));
  };

  const getClosedCount = (issues: IssueResponse[]) => issues.filter(isClosedIssue).length;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'wbs'] });
    queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'issues'] });
  };

  // ─── Epic form handlers ───
  const openEpicCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormColor(DEFAULT_EPIC_COLORS[Math.floor(Math.random() * DEFAULT_EPIC_COLORS.length)]);
    setFormStatus('PLANNED');
    setEpicForm({ open: true });
  };

  const openEpicEdit = (epic: ProjectEpicResponse) => {
    setFormTitle(epic.title);
    setFormDescription(epic.description || '');
    setFormColor(epic.color || '#6366F1');
    setFormStatus(epic.status);
    setEpicForm({ open: true, editing: epic });
  };

  const handleEpicSubmit = () => {
    if (!formTitle.trim()) return;
    if (epicForm.editing) {
      updateEpic.mutate(
        { epicId: epicForm.editing.epicId, data: { title: formTitle, description: formDescription || undefined, color: formColor, status: formStatus } },
        { onSuccess: () => { toast.success(t('project:wbs.epicUpdated')); setEpicForm({ open: false }); } },
      );
    } else {
      createEpic.mutate(
        { title: formTitle, description: formDescription || undefined, color: formColor, status: formStatus },
        { onSuccess: () => { toast.success(t('project:wbs.epicCreated')); setEpicForm({ open: false }); } },
      );
    }
  };

  const handleEpicDelete = (epicId: string) => {
    if (!window.confirm(t('project:wbs.confirmDeleteEpic'))) return;
    deleteEpic.mutate(epicId, {
      onSuccess: () => toast.success(t('project:wbs.epicDeleted')),
    });
  };

  // ─── Component form handlers ───
  const openComponentCreate = () => {
    setFormTitle('');
    setFormDescription('');
    setFormColor(DEFAULT_COMPONENT_COLORS[Math.floor(Math.random() * DEFAULT_COMPONENT_COLORS.length)]);
    setComponentForm({ open: true });
  };

  const openComponentEdit = (comp: ProjectComponentResponse) => {
    setFormTitle(comp.title);
    setFormDescription(comp.description || '');
    setFormColor(comp.color || '#3B82F6');
    setComponentForm({ open: true, editing: comp });
  };

  const handleComponentSubmit = () => {
    if (!formTitle.trim()) return;
    if (componentForm.editing) {
      updateComponent.mutate(
        { componentId: componentForm.editing.componentId, data: { title: formTitle, description: formDescription || undefined, color: formColor } },
        { onSuccess: () => { toast.success(t('project:wbs.componentUpdated')); setComponentForm({ open: false }); } },
      );
    } else {
      createComponent.mutate(
        { title: formTitle, description: formDescription || undefined, color: formColor },
        { onSuccess: () => { toast.success(t('project:wbs.componentCreated')); setComponentForm({ open: false }); } },
      );
    }
  };

  const handleComponentDelete = (componentId: string) => {
    if (!window.confirm(t('project:wbs.confirmDeleteComponent'))) return;
    deleteComponent.mutate(componentId, {
      onSuccess: () => toast.success(t('project:wbs.componentDeleted')),
    });
  };

  // ─── Issue handlers ───
  const handleEdit = (issue: IssueResponse) => {
    setSelectedIssue(null);
    setEditingIssue(issue);
  };

  const handleDeleteRequest = (issue: IssueResponse) => {
    setSelectedIssue(null);
    setDeletingIssue(issue);
  };

  const handleEditSubmit = (formData: Parameters<typeof updateIssue.mutate>[0]['data']) => {
    if (!editingIssue) return;
    updateIssue.mutate(
      { id: editingIssue.issueId, data: formData },
      {
        onSuccess: () => {
          toast.success(t('issues:messages.updated'));
          setEditingIssue(null);
          invalidate();
        },
      },
    );
  };

  const handleDeleteConfirm = () => {
    if (!deletingIssue) return;
    deleteIssue.mutate(deletingIssue.issueId, {
      onSuccess: () => {
        toast.success(t('issues:messages.deleted'));
        setDeletingIssue(null);
        invalidate();
      },
    });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  if (!wbsTree) {
    return <div className="text-center py-8 text-gray-400">{t('project:wbs.noIssues')}</div>;
  }

  const epics = wbsTree.epics || [];
  const components = wbsTree.components || [];
  const unassigned = wbsTree.unassigned?.issues || [];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={openEpicCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('project:wbs.addEpic')}
          </button>
          <button
            onClick={openComponentCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('project:wbs.addComponent')}
          </button>
          <span className="text-xs text-gray-400 ml-2">{t('project:wbs.dragHint')}</span>
        </div>
        <button
          onClick={() => setShowClosed((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          {showClosed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {t('project:wbs.showClosed')}
        </button>
      </div>

      {/* WBS Tree */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {/* Epics */}
        {epics.map((epic) => {
          const isCollapsed = collapsedGroups.has(`epic-${epic.epicId}`);
          const progress = epic.issueCount > 0 ? Math.round((epic.doneIssueCount / epic.issueCount) * 100) : 0;
          const groupKey = `epic-${epic.epicId}`;
          const closedCount = getClosedCount(epic.issues);
          const visibleIssues = filterGroupIssues(epic.issues, groupKey);
          const isGroupClosedVisible = showClosed || closedVisibleGroups.has(groupKey);
          return (
            <DroppableGroup key={epic.epicId} id={`drop-epic-${epic.epicId}`} isActive={!!activeIssue}>
              <div
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleGroup(`epic-${epic.epicId}`)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <Layers className="h-4 w-4 flex-shrink-0" style={{ color: epic.color || '#6366F1' }} />
                <span className="font-medium text-sm text-gray-900">{epic.title}</span>
                <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${EPIC_STATUS_STYLES[epic.status]}`}>
                  {t(`project:wbs.epicStatus.${epic.status}`)}
                </span>
                {closedCount > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleGroupClosed(groupKey); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted"
                  >
                    {isGroupClosedVisible
                      ? t('project:wbs.hideClosedGroup')
                      : t('project:wbs.showClosedGroup', { count: closedCount })}
                  </button>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {t('project:wbs.issues', { count: visibleIssues.length })}
                </span>
                {epic.issueCount > 0 && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{progress}%</span>
                  </div>
                )}
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openEpicEdit(epic)} className="p-1 text-gray-400 hover:text-gray-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleEpicDelete(epic.epicId)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="pl-10 pr-4 pb-2">
                  {visibleIssues.length === 0 ? (
                    <div className="py-2 text-xs text-gray-400">{t('project:wbs.noIssues')}</div>
                  ) : (
                    <div className="space-y-1">
                      {visibleIssues.map((issue) => (
                        <DraggableIssueRow key={issue.issueId} issue={issue} onClick={setSelectedIssue} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </DroppableGroup>
          );
        })}

        {/* Components */}
        {components.map((comp) => {
          const isCollapsed = collapsedGroups.has(`comp-${comp.componentId}`);
          const groupKey = `comp-${comp.componentId}`;
          const closedCount = getClosedCount(comp.issues);
          const visibleIssues = filterGroupIssues(comp.issues, groupKey);
          const isGroupClosedVisible = showClosed || closedVisibleGroups.has(groupKey);
          return (
            <DroppableGroup key={comp.componentId} id={`drop-comp-${comp.componentId}`} isActive={!!activeIssue}>
              <div
                className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleGroup(`comp-${comp.componentId}`)}
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
                <Box className="h-4 w-4 flex-shrink-0" style={{ color: comp.color || '#3B82F6' }} />
                <span className="font-medium text-sm text-gray-900">{comp.title}</span>
                {closedCount > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleGroupClosed(groupKey); }}
                    className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted"
                  >
                    {isGroupClosedVisible
                      ? t('project:wbs.hideClosedGroup')
                      : t('project:wbs.showClosedGroup', { count: closedCount })}
                  </button>
                )}
                <span className="text-xs text-gray-400 ml-auto">
                  {t('project:wbs.issues', { count: visibleIssues.length })}
                </span>
                <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => openComponentEdit(comp)} className="p-1 text-gray-400 hover:text-gray-600">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleComponentDelete(comp.componentId)} className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {!isCollapsed && (
                <div className="pl-10 pr-4 pb-2">
                  {visibleIssues.length === 0 ? (
                    <div className="py-2 text-xs text-gray-400">{t('project:wbs.noIssues')}</div>
                  ) : (
                    <div className="space-y-1">
                      {visibleIssues.map((issue) => (
                        <DraggableIssueRow key={issue.issueId} issue={issue} onClick={setSelectedIssue} t={t} />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </DroppableGroup>
          );
        })}

        {/* Unassigned */}
        <DroppableGroup id="drop-unassigned" isActive={!!activeIssue}>
          {(() => {
            const groupKey = 'unassigned';
            const closedCount = getClosedCount(unassigned);
            const visibleIssues = filterGroupIssues(unassigned, groupKey);
            const isGroupClosedVisible = showClosed || closedVisibleGroups.has(groupKey);
            return (
              <>
                <div
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleGroup('unassigned')}
                >
                  {collapsedGroups.has('unassigned') ? (
                    <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  )}
                  <FolderOpen className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="font-medium text-sm text-gray-500">{t('project:wbs.unassigned')}</span>
                  {closedCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleGroupClosed(groupKey); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline decoration-dotted"
                    >
                      {isGroupClosedVisible
                        ? t('project:wbs.hideClosedGroup')
                        : t('project:wbs.showClosedGroup', { count: closedCount })}
                    </button>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {t('project:wbs.issues', { count: visibleIssues.length })}
                  </span>
                </div>
                {!collapsedGroups.has('unassigned') && (
                  <div className="pl-10 pr-4 pb-2">
                    {visibleIssues.length === 0 ? (
                      <div className="py-2 text-xs text-gray-400">{t('project:wbs.noIssues')}</div>
                    ) : (
                      <div className="space-y-1">
                        {visibleIssues.map((issue) => (
                          <DraggableIssueRow key={issue.issueId} issue={issue} onClick={setSelectedIssue} t={t} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </DroppableGroup>

        {/* Empty state */}
        {epics.length === 0 && components.length === 0 && unassigned.length === 0 && (
          <div className="py-12 text-center text-gray-400 text-sm">
            {t('project:wbs.noIssues')}
          </div>
        )}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeIssue && (
          <div className="rounded bg-white border border-indigo-300 shadow-lg px-3 py-2 text-sm text-gray-900 opacity-90">
            {activeIssue.title}
          </div>
        )}
      </DragOverlay>
      </DndContext>

      {/* Epic / Component Form Modal */}
      {(epicForm.open || componentForm.open) && (
        <GroupFormModal
          type={epicForm.open ? 'epic' : 'component'}
          isEditing={!!(epicForm.editing || componentForm.editing)}
          title={formTitle}
          description={formDescription}
          color={formColor}
          status={formStatus}
          onTitleChange={setFormTitle}
          onDescriptionChange={setFormDescription}
          onColorChange={setFormColor}
          onStatusChange={setFormStatus}
          onSubmit={epicForm.open ? handleEpicSubmit : handleComponentSubmit}
          onClose={() => { setEpicForm({ open: false }); setComponentForm({ open: false }); }}
          isLoading={createEpic.isPending || updateEpic.isPending || createComponent.isPending || updateComponent.isPending}
          t={t}
        />
      )}

      {/* Issue modals */}
      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      )}
      {editingIssue && (
        <IssueFormModal
          isOpen={!!editingIssue}
          editingIssue={editingIssue}
          onClose={() => setEditingIssue(null)}
          onSubmit={handleEditSubmit}
        />
      )}
      {deletingIssue && (
        <IssueDeleteConfirmModal
          isOpen={!!deletingIssue}
          onClose={() => setDeletingIssue(null)}
          onConfirm={handleDeleteConfirm}
          canSoftDelete={true}
          canPermanentDelete={isMaster}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───

function DroppableGroup({ id, isActive, children }: { id: string; isActive: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`transition-colors ${isActive && isOver ? 'bg-indigo-50 ring-1 ring-inset ring-indigo-300' : ''}`}
    >
      {children}
    </div>
  );
}

function DraggableIssueRow({ issue, onClick, t }: { issue: IssueResponse; onClick: (i: IssueResponse) => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: issue.issueId,
    data: { issue },
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-50 cursor-pointer ${isDragging ? 'opacity-50' : ''}`}
    >
      <span {...listeners} {...attributes} className="cursor-grab text-gray-300 hover:text-gray-500" onClick={(e) => e.stopPropagation()}>
        <GripVertical className="h-3.5 w-3.5" />
      </span>
      <span
        role="button"
        tabIndex={0}
        onClick={() => onClick(issue)}
        onKeyDown={(e) => e.key === 'Enter' && onClick(issue)}
        className="flex flex-1 items-center gap-2 min-w-0"
      >
        <span className={`inline-flex rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_COLORS[issue.status] || ''}`}>
          {t(`issues:status.${issue.status}`)}
        </span>
        <span className="truncate text-gray-900">{issue.title}</span>
        <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{issue.assignee || '-'}</span>
        {issue.doneRatio != null && issue.doneRatio > 0 && (
          <span className="text-xs text-gray-400 flex-shrink-0">{issue.doneRatio}%</span>
        )}
      </span>
    </div>
  );
}

function GroupFormModal({
  type,
  isEditing,
  title,
  description,
  color,
  status,
  onTitleChange,
  onDescriptionChange,
  onColorChange,
  onStatusChange,
  onSubmit,
  onClose,
  isLoading,
  t,
}: {
  type: 'epic' | 'component';
  isEditing: boolean;
  title: string;
  description: string;
  color: string;
  status: EpicStatus;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onStatusChange: (v: EpicStatus) => void;
  onSubmit: () => void;
  onClose: () => void;
  isLoading: boolean;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const colors = type === 'epic' ? DEFAULT_EPIC_COLORS : DEFAULT_COMPONENT_COLORS;
  const modalTitle = isEditing
    ? t(`project:wbs.edit${type === 'epic' ? 'Epic' : 'Component'}`)
    : t(`project:wbs.add${type === 'epic' ? 'Epic' : 'Component'}`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{modalTitle}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project:wbs.title')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project:wbs.description')}</label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('project:wbs.color')}</label>
            <div className="flex items-center gap-2 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`h-7 w-7 rounded-full border-2 ${color === c ? 'border-gray-900' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {type === 'epic' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('issues:status.title')}</label>
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value as EpicStatus)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                {(['PLANNED', 'IN_PROGRESS', 'DONE', 'CANCELLED'] as EpicStatus[]).map((s) => (
                  <option key={s} value={s}>{t(`project:wbs.epicStatus.${s}`)}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            {t('project:actions.cancel')}
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading || !title.trim()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {t('project:actions.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
