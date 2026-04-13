import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, ChevronRight as ChevronRightIcon, LayoutGrid, List, Columns3, Search, Square, ArrowRightCircle, History, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { TodoResponse, TodoComputedStatus } from '@amb/types';
import { useTodoList, useCreateTodo, useUpdateTodo, useDeleteTodo, useCompleteTodo, useReopenTodo } from '../hooks/useTodos';
import { useCreateIssue } from '@/domain/issues/hooks/useIssues';
import TodoItem from '../components/TodoItem';
import TodoFormModal from '../components/TodoFormModal';
import TodoDeleteConfirmModal from '../components/TodoDeleteConfirmModal';
import TodoActionConfirmModal from '../components/TodoActionConfirmModal';
import TodoStatusHistory from '../components/TodoStatusHistory';
import TodoDetailModal from '../components/TodoDetailModal';
import ScopedTodoList from '../components/ScopedTodoList';
import TodoKanbanView from '../components/TodoKanbanView';
import IssueFormModal from '@/domain/issues/components/IssueFormModal';
import ViewScopeTab, { type ViewScope } from '@/shared/components/ViewScopeTab';
import SaveTranslationDialog from '@/domain/translations/components/SaveTranslationDialog';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import PageTitle from '@/global/components/PageTitle';

const LEFT_SECTIONS: TodoComputedStatus[] = ['OVERDUE', 'DUE_TODAY', 'IN_PROGRESS'];
const RIGHT_SECTIONS: TodoComputedStatus[] = ['UPCOMING_SOON', 'UPCOMING'];
const ALL_ACTIVE_SECTIONS: TodoComputedStatus[] = [...LEFT_SECTIONS, ...RIGHT_SECTIONS];

const sectionI18nKey: Record<string, string> = {
  OVERDUE: 'overdue',
  DUE_TODAY: 'dueToday',
  IN_PROGRESS: 'inProgress',
  UPCOMING_SOON: 'upcomingSoon',
  UPCOMING: 'upcoming',
  COMPLETED: 'completed',
};

const sectionStyle: Record<string, { dot: string; text: string; border: string; bg: string }> = {
  OVERDUE: { dot: 'bg-red-500', text: 'text-red-700', border: 'border-red-200', bg: 'bg-red-50' },
  DUE_TODAY: { dot: 'bg-orange-500', text: 'text-orange-700', border: 'border-orange-200', bg: 'bg-orange-50/30' },
  IN_PROGRESS: { dot: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/30' },
  UPCOMING_SOON: { dot: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-200', bg: 'bg-yellow-50/30' },
  UPCOMING: { dot: 'bg-gray-400', text: 'text-gray-600', border: 'border-gray-200', bg: 'bg-white' },
  COMPLETED: { dot: 'bg-green-500', text: 'text-green-700', border: 'border-green-200', bg: 'bg-green-50/30' },
};

const computedStatusBadge: Record<string, { bg: string; text: string }> = {
  OVERDUE: { bg: 'bg-red-100', text: 'text-red-700' },
  DUE_TODAY: { bg: 'bg-orange-100', text: 'text-orange-700' },
  IN_PROGRESS: { bg: 'bg-blue-100', text: 'text-blue-700' },
  UPCOMING_SOON: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  UPCOMING: { bg: 'bg-gray-100', text: 'text-gray-600' },
  COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
};

export default function TodoPage() {
  const { t } = useTranslation(['todos', 'common']);
  const userId = useAuthStore((s) => s.user?.userId);
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: todos = [], isLoading } = useTodoList();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const completeTodo = useCompleteTodo();
  const reopenTodo = useReopenTodo();
  const createIssue = useCreateIssue();

  const [activeTab, setActiveTab] = useState<ViewScope>('mine');
  const [viewMode, setViewMode] = useState<'card' | 'list' | 'kanban'>(() => {
    return (localStorage.getItem('todo-view-mode') as 'card' | 'list' | 'kanban') || 'list';
  });
  const [searchInput, setSearchInput] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoResponse | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<TodoResponse | null>(null);
  const [historyTodoId, setHistoryTodoId] = useState<string | null>(null);
  const [detailTodo, setDetailTodo] = useState<TodoResponse | null>(null);
  const [translateTarget, setTranslateTarget] = useState<{ todoId: string; title: string; description: string; originalLang?: string } | null>(null);
  const [convertingTodo, setConvertingTodo] = useState<TodoResponse | null>(null);
  const [listConfirm, setListConfirm] = useState<{ type: 'complete' | 'convert'; todo: TodoResponse } | null>(null);

  const handleViewModeChange = (mode: 'card' | 'list' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('todo-view-mode', mode);
  };

  // 클라이언트 사이드 검색 필터
  const filteredTodos = useMemo(() => {
    if (!searchInput.trim()) return todos;
    const q = searchInput.trim().toLowerCase();
    return todos.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.tags?.toLowerCase().includes(q),
    );
  }, [todos, searchInput]);

  // 검색 결과에서 바로가기: ?id=xxx 쿼리 파라미터로 상세 모달 자동 열기
  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && todos.length > 0 && !detailTodo) {
      const found = todos.find((t) => t.todoId === targetId);
      if (found) {
        setDetailTodo(found);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, todos, detailTodo, setSearchParams]);

  // 5-section 분류: computedStatus 기반
  const sections = useMemo(() => {
    const grouped: Record<string, TodoResponse[]> = {
      OVERDUE: [],
      DUE_TODAY: [],
      IN_PROGRESS: [],
      UPCOMING_SOON: [],
      UPCOMING: [],
      COMPLETED: [],
    };
    for (const todo of filteredTodos) {
      const cs = todo.computedStatus || 'UPCOMING';
      if (grouped[cs]) grouped[cs].push(todo);
      else grouped.UPCOMING.push(todo);
    }
    return grouped;
  }, [filteredTodos]);

  const handleToggleComplete = (todoId: string, isCompleted: boolean) => {
    if (isCompleted) {
      reopenTodo.mutate(todoId);
    } else {
      completeTodo.mutate(todoId);
    }
  };

  const handleFormSubmit = (data: { title: string; description?: string; start_date?: string; due_date?: string; tags?: string; issue_id?: string; project_id?: string; participant_ids?: string[]; recurrence_type?: string | null; recurrence_day?: number | null; due_date_change_note?: string }) => {
    if (editingTodo) {
      updateTodo.mutate(
        { id: editingTodo.todoId, data },
        {
          onSuccess: () => {
            setHistoryTodoId(editingTodo.todoId);
            setShowFormModal(false);
            setEditingTodo(null);
            setTranslateTarget({ todoId: editingTodo.todoId, title: data.title, description: data.description || '', originalLang: editingTodo.originalLang });
          },
        },
      );
    } else {
      createTodo.mutate(data, {
        onSuccess: (result: any) => {
          setShowFormModal(false);
          const todoId = result?.data?.data?.todoId || result?.data?.todoId;
          if (todoId) {
            setTranslateTarget({ todoId, title: data.title, description: data.description || '', originalLang: 'ko' });
          }
        },
      });
    }
  };

  const handleEdit = (todo: TodoResponse) => {
    setEditingTodo(todo);
    setShowFormModal(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingTodo) {
      deleteTodo.mutate(deletingTodo.todoId, {
        onSuccess: () => setDeletingTodo(null),
      });
    }
  };

  const handleShowDetail = (todoId: string) => {
    const todo = todos.find((t) => t.todoId === todoId);
    if (todo) setDetailTodo(todo);
  };

  const handleConvertToIssue = (todo: TodoResponse) => {
    setConvertingTodo(todo);
  };

  const handleIssueConvertSubmit = (data: {
    type: string;
    title: string;
    description?: string;
    severity: string;
    priority: number;
    affected_modules?: string[];
    assignee_id?: string | null;
    participant_ids?: string[];
    resolution?: string;
    project_id?: string;
    epic_id?: string | null;
    component_id?: string | null;
    start_date?: string;
    due_date?: string;
    done_ratio?: number;
    parent_issue_id?: string;
    google_drive_link?: string;
  }) => {
    if (!convertingTodo) return;
    const todoId = convertingTodo.todoId;
    createIssue.mutate(
      {
        ...data,
        description: data.description || data.title,
        source_todo_id: convertingTodo.todoId,
        source_todo_title: convertingTodo.title,
      } as any,
      {
        onSuccess: (issue: any) => {
          const issueId = issue?.issueId || issue?.data?.issueId;
          if (issueId) {
            updateTodo.mutate({ id: todoId, data: { issue_id: issueId } });
          }
          toast.success(t('todos:messages.convertedToIssue'));
          setConvertingTodo(null);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 py-6">
        <div className="mb-6 flex items-center justify-between">
          <PageTitle>{t('todos:title')}</PageTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-gray-300 p-0.5">
              <button
                onClick={() => handleViewModeChange('card')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'card' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title={t('common:menuCategory.viewCard')}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('list')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title={t('common:menuCategory.viewList')}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleViewModeChange('kanban')}
                className={`rounded-md p-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                title={t('todos:kanban.title')}
              >
                <Columns3 className="h-4 w-4" />
              </button>
            </div>
            {activeTab === 'mine' && (
              <button
                onClick={() => { setEditingTodo(null); setShowFormModal(true); }}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4" />
                {t('todos:addTodo')}
              </button>
            )}
          </div>
        </div>

        {/* Tabs - ViewScopeTab */}
        <ViewScopeTab
          activeScope={activeTab}
          onScopeChange={setActiveTab}
          className="mb-6"
        />

        {/* Search bar (Mine 탭) */}
        {activeTab === 'mine' && (
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('todos:filter.searchPlaceholder')}
                className="w-full rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'mine' ? (
          <div className="space-y-4">
            {viewMode === 'kanban' ? (
              <TodoKanbanView
                todos={filteredTodos}
                currentUserId={userId}
                onEdit={handleEdit}
                onShowDetail={handleShowDetail}
                onToggleComplete={handleToggleComplete}
                onDelete={setDeletingTodo}
                onShowHistory={setHistoryTodoId}
                onConvertToIssue={handleConvertToIssue}
              />
            ) : viewMode === 'card' ? (
              <>
                {/* 2칸 그리드 레이아웃 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* 왼쪽: OVERDUE, DUE_TODAY, IN_PROGRESS */}
                  <div className="space-y-4">
                    {LEFT_SECTIONS.map((status) => {
                      const items = sections[status];
                      if (items.length === 0) return null;
                      const style = sectionStyle[status];
                      return (
                        <div key={status} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
                          <h2 className={`mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider ${style.text}`}>
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            {t(`todos:section.${sectionI18nKey[status]}`)} ({items.length})
                          </h2>
                          <div className="space-y-2">
                            {items.map((todo) => (
                              <TodoItem
                                key={todo.todoId}
                                todo={todo}
                                onToggleComplete={handleToggleComplete}
                                onEdit={handleEdit}
                                onDelete={setDeletingTodo}
                                onShowHistory={setHistoryTodoId}
                                onShowDetail={handleShowDetail}
                                onConvertToIssue={handleConvertToIssue}
                                currentUserId={userId}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {/* 오른쪽: UPCOMING_SOON, UPCOMING */}
                  <div className="space-y-4">
                    {RIGHT_SECTIONS.map((status) => {
                      const items = sections[status];
                      if (items.length === 0) return null;
                      const style = sectionStyle[status];
                      return (
                        <div key={status} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
                          <h2 className={`mb-3 flex items-center gap-2 text-sm font-semibold tracking-wider ${style.text}`}>
                            <span className={`inline-block h-2.5 w-2.5 rounded-full ${style.dot}`} />
                            {t(`todos:section.${sectionI18nKey[status]}`)} ({items.length})
                          </h2>
                          <div className="space-y-2">
                            {items.map((todo) => (
                              <TodoItem
                                key={todo.todoId}
                                todo={todo}
                                onToggleComplete={handleToggleComplete}
                                onEdit={handleEdit}
                                onDelete={setDeletingTodo}
                                onShowHistory={setHistoryTodoId}
                                onShowDetail={handleShowDetail}
                                onConvertToIssue={handleConvertToIssue}
                                currentUserId={userId}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              /* 리스트 뷰 */
              <div className="rounded-xl border border-gray-200 bg-white">
                {ALL_ACTIVE_SECTIONS.flatMap((status) => sections[status]).length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {ALL_ACTIVE_SECTIONS.flatMap((status) =>
                      sections[status].map((todo) => {
                        const badge = computedStatusBadge[todo.computedStatus] || computedStatusBadge.UPCOMING;
                        const isOverdue = todo.computedStatus === 'OVERDUE';
                        const isOwner = !userId || todo.userId === userId;
                        return (
                          <div
                            key={todo.todoId}
                            onClick={() => isOwner ? handleEdit(todo) : handleShowDetail(todo.todoId)}
                            className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}
                          >
                            {/* 완료 체크박스 - 제목 앞 */}
                            {isOwner && (
                              <div className="group/check relative shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setListConfirm({ type: 'complete', todo });
                                  }}
                                  className="rounded p-0.5 text-gray-400 hover:text-indigo-500"
                                >
                                  <Square className="h-4 w-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/check:opacity-100">
                                  {t('todos:completeTodo')}
                                </span>
                              </div>
                            )}
                            {/* 이슈 등록 - 제목 앞 */}
                            {isOwner && !todo.issueId && (
                              <div className="group/convert relative shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setListConfirm({ type: 'convert', todo });
                                  }}
                                  className="rounded p-0.5 text-gray-400 hover:text-orange-500"
                                >
                                  <ArrowRightCircle className="h-4 w-4" />
                                </button>
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/convert:opacity-100">
                                  {t('todos:convertToIssue')}
                                </span>
                              </div>
                            )}
                            <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                              {t(`todos:computedStatus.${todo.computedStatus}`)}
                            </span>
                            <span className={`min-w-0 flex-1 truncate text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                              {todo.title}
                            </span>
                            {todo.tags && (
                              <span className="hidden shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-600 sm:inline">
                                {todo.tags.split(',')[0].trim()}
                              </span>
                            )}
                            {todo.dueDate && (
                              <span className={`shrink-0 text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                                {todo.dueDate}
                              </span>
                            )}
                            {/* 히스토리 + 삭제 - 오른쪽 끝 */}
                            {isOwner && (
                              <div className="flex shrink-0 items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setHistoryTodoId(todo.todoId); }}
                                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                  title={t('todos:statusHistory')}
                                >
                                  <History className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setDeletingTodo(todo); }}
                                  className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                                  title={t('todos:deleteTodo')}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }),
                    )}
                  </div>
                ) : null}
              </div>
            )}

            {/* 모든 활성 섹션이 비어있을 때 */}
            {ALL_ACTIVE_SECTIONS.every((s) => sections[s].length === 0) && sections.COMPLETED.length === 0 && (
              <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
                {t('todos:noTodos')}
              </div>
            )}

            {/* Completed: 숫자만 표기, 클릭 시 완료 페이지로 이동 */}
            {sections.COMPLETED.length > 0 && (
              <Link
                to="/todos/completed?scope=mine"
                className={`flex items-center gap-2 rounded-xl border ${sectionStyle.COMPLETED.border} ${sectionStyle.COMPLETED.bg} p-4 text-sm font-semibold tracking-wider ${sectionStyle.COMPLETED.text} transition-colors hover:bg-green-50`}
              >
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${sectionStyle.COMPLETED.dot}`} />
                {t('todos:section.completed')} ({sections.COMPLETED.length})
                <ChevronRightIcon className="ml-auto h-4 w-4" />
              </Link>
            )}
          </div>
        ) : activeTab === 'unit' ? (
          <ScopedTodoList scope="unit" viewMode={viewMode} />
        ) : activeTab === 'cell' ? (
          <ScopedTodoList scope="cell" viewMode={viewMode} />
        ) : (
          <ScopedTodoList scope="company" viewMode={viewMode} />
        )}

        <TodoFormModal
          isOpen={showFormModal}
          onClose={() => { setShowFormModal(false); setEditingTodo(null); }}
          onSubmit={handleFormSubmit}
          editingTodo={editingTodo}
          onConvertToIssue={handleConvertToIssue}
        />

        <IssueFormModal
          isOpen={!!convertingTodo}
          onClose={() => setConvertingTodo(null)}
          onSubmit={handleIssueConvertSubmit}
          initialData={convertingTodo ? {
            type: 'TASK',
            title: convertingTodo.title,
            description: convertingTodo.description || convertingTodo.title,
            project_id: convertingTodo.projectId || undefined,
            start_date: convertingTodo.startDate || undefined,
            due_date: convertingTodo.dueDate || undefined,
            participant_ids: convertingTodo.participants?.map((p) => p.userId),
          } : null}
        />

        <TodoDeleteConfirmModal
          isOpen={!!deletingTodo}
          onClose={() => setDeletingTodo(null)}
          onConfirm={handleDeleteConfirm}
        />

        <TodoActionConfirmModal
          isOpen={!!listConfirm}
          message={listConfirm?.type === 'complete' ? t('todos:confirm.complete') : t('todos:confirm.convertToIssue')}
          confirmColor={listConfirm?.type === 'convert' ? 'orange' : 'indigo'}
          onClose={() => setListConfirm(null)}
          onConfirm={() => {
            if (listConfirm?.type === 'complete') {
              handleToggleComplete(listConfirm.todo.todoId, false);
            } else if (listConfirm?.type === 'convert') {
              handleConvertToIssue(listConfirm.todo);
            }
            setListConfirm(null);
          }}
        />

        {historyTodoId && (
          <TodoStatusHistory
            todoId={historyTodoId}
            onClose={() => setHistoryTodoId(null)}
          />
        )}

        {detailTodo && (
          <TodoDetailModal
            todo={detailTodo}
            onClose={() => setDetailTodo(null)}
          />
        )}

        {translateTarget && (
          <SaveTranslationDialog
            isOpen={true}
            sourceType="TODO"
            sourceId={translateTarget.todoId}
            sourceFields={['title', 'content']}
            originalContent={{ title: translateTarget.title, content: translateTarget.description }}
            originalLang={translateTarget.originalLang || 'ko'}
            onClose={() => setTranslateTarget(null)}
            onSaved={() => setTranslateTarget(null)}
          />
        )}
      </div>
    </div>
  );
}
