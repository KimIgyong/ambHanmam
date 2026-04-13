import { useState, useMemo } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MessageSquare, Link2, Search, RefreshCw, FolderOpen, ChevronRight, Square, History, Trash2 } from 'lucide-react';
import { TodoResponse, TodoComputedStatus } from '@amb/types';
import { useGroupTodos, useCompanyTodos, useUnitTodos, useUpdateTodo, useDeleteTodo, useCompleteTodo, useReopenTodo } from '../hooks/useTodos';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import TodoDetailModal from './TodoDetailModal';
import TodoItem from './TodoItem';
import TodoFormModal from './TodoFormModal';
import TodoDeleteConfirmModal from './TodoDeleteConfirmModal';
import TodoActionConfirmModal from './TodoActionConfirmModal';
import TodoStatusHistory from './TodoStatusHistory';
import TodoKanbanView from './TodoKanbanView';
import SaveTranslationDialog from '@/domain/translations/components/SaveTranslationDialog';

interface ScopedTodoListProps {
  scope: 'unit' | 'cell' | 'company';
  viewMode: 'card' | 'list' | 'kanban';
}

const LEFT_SECTIONS: TodoComputedStatus[] = ['OVERDUE', 'DUE_TODAY', 'IN_PROGRESS'];
const RIGHT_SECTIONS: TodoComputedStatus[] = ['UPCOMING_SOON', 'UPCOMING'];

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

export default function ScopedTodoList({ scope, viewMode }: ScopedTodoListProps) {
  const { t } = useTranslation(['todos', 'common']);
  const isMaster = useAuthStore((s) => s.isMaster());
  const userId = useAuthStore((s) => s.user?.userId);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('__all__');

  // MASTER용 수정 상태
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoResponse | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<TodoResponse | null>(null);
  const [historyTodoId, setHistoryTodoId] = useState<string | null>(null);
  const [translateTarget, setTranslateTarget] = useState<{ todoId: string; title: string; description: string; originalLang?: string } | null>(null);
  const [listConfirm, setListConfirm] = useState<{ type: 'complete'; todo: TodoResponse } | null>(null);

  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const completeTodo = useCompleteTodo();
  const reopenTodo = useReopenTodo();

  // Debounce search input
  const debouncedSearch = useDebounce(searchInput, 500);

  // Build filters — 전체 데이터를 가져와 클라이언트에서 날짜 분류
  const filters = useMemo(() => {
    const f: Record<string, string> = {};
    if (debouncedSearch) f.search = debouncedSearch;
    return Object.keys(f).length > 0 ? f : undefined;
  }, [debouncedSearch]);

  const groupQuery = useGroupTodos(scope === 'cell' ? filters : { enabled: false } as any);
  const unitQuery = useUnitTodos(scope === 'unit' ? filters : { enabled: false } as any);
  const companyQuery = useCompanyTodos(scope === 'company' ? filters : { enabled: false } as any);

  const { data: rawTodos = [], isLoading } = scope === 'cell' ? groupQuery : scope === 'unit' ? unitQuery : companyQuery;

  // Extract unique projects for filter dropdown
  const projectOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const todo of rawTodos) {
      if (todo.projectId && todo.projectName) {
        map.set(todo.projectId, todo.projectName);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rawTodos]);

  // Apply project filter
  const todos = useMemo(() => {
    if (projectFilter === '__all__') return rawTodos;
    if (projectFilter === '__none__') return rawTodos.filter((t) => !t.projectId);
    return rawTodos.filter((t) => t.projectId === projectFilter);
  }, [rawTodos, projectFilter]);

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
    for (const todo of todos) {
      const cs = todo.computedStatus || 'UPCOMING';
      if (grouped[cs]) grouped[cs].push(todo);
      else grouped.UPCOMING.push(todo);
    }
    return grouped;
  }, [todos]);

  const selectedTodo = selectedTodoId ? todos.find((t) => t.todoId === selectedTodoId) || null : null;
  const noResultsKey = scope === 'cell' ? 'todos:cell.noResults' : 'todos:company.noResults';

  // MASTER 핸들러
  const handleToggleComplete = (todoId: string, isCompleted: boolean) => {
    if (isCompleted) {
      reopenTodo.mutate(todoId);
    } else {
      completeTodo.mutate(todoId);
    }
  };

  const handleEdit = (todo: TodoResponse) => {
    setEditingTodo(todo);
    setShowFormModal(true);
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
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingTodo) {
      deleteTodo.mutate(deletingTodo.todoId, {
        onSuccess: () => setDeletingTodo(null),
      });
    }
  };

  const handleShowDetail = (todoId: string) => {
    setSelectedTodoId(todoId);
  };

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-gray-400">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div>
      {/* 검색 + 프로젝트 필터 */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Project filter */}
          {projectOptions.length > 0 && (
            <div className="relative">
              <FolderOpen className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-8 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="__all__">{t('todos:filter.allProjects')}</option>
                {projectOptions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
                <option value="__none__">{t('todos:filter.noProject')}</option>
              </select>
            </div>
          )}
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('todos:filter.searchPlaceholder')}
              className="rounded-lg border border-gray-300 py-1.5 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2칸 그리드 또는 리스트 레이아웃 */}
      {todos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-400">
          {t(noResultsKey)}
        </div>
      ) : (
        <div className="space-y-4">
          {viewMode === 'kanban' ? (
            <TodoKanbanView
              todos={todos}
              currentUserId={userId}
              onEdit={isMaster ? handleEdit : (todo) => setSelectedTodoId(todo.todoId)}
              onShowDetail={(todoId) => setSelectedTodoId(todoId)}
              onToggleComplete={handleToggleComplete}
              onDelete={setDeletingTodo}
              onShowHistory={setHistoryTodoId}
              onConvertToIssue={() => {}}
            />
          ) : viewMode === 'card' ? (
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
                          isMaster ? (
                            <TodoItem
                              key={todo.todoId}
                              todo={todo}
                              onToggleComplete={handleToggleComplete}
                              onEdit={handleEdit}
                              onDelete={setDeletingTodo}
                              onShowHistory={setHistoryTodoId}
                              onShowDetail={handleShowDetail}
                              currentUserId={userId}
                            />
                          ) : (
                            <ScopedTodoItem key={todo.todoId} todo={todo} onClick={() => setSelectedTodoId(todo.todoId)} t={t} />
                          )
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
                          isMaster ? (
                            <TodoItem
                              key={todo.todoId}
                              todo={todo}
                              onToggleComplete={handleToggleComplete}
                              onEdit={handleEdit}
                              onDelete={setDeletingTodo}
                              onShowHistory={setHistoryTodoId}
                              onShowDetail={handleShowDetail}
                              currentUserId={userId}
                            />
                          ) : (
                            <ScopedTodoItem key={todo.todoId} todo={todo} onClick={() => setSelectedTodoId(todo.todoId)} t={t} />
                          )
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* 리스트 뷰 */
            <div className="rounded-xl border border-gray-200 bg-white">
              <div className="divide-y divide-gray-100">
                {[...LEFT_SECTIONS, ...RIGHT_SECTIONS].flatMap((status) =>
                  sections[status].map((todo) => {
                    const badge = computedStatusBadge[todo.computedStatus] || computedStatusBadge.UPCOMING;
                    const isOverdue = todo.computedStatus === 'OVERDUE';
                    return (
                      <div
                        key={todo.todoId}
                        onClick={() => isMaster ? handleEdit(todo) : setSelectedTodoId(todo.todoId)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${isOverdue ? 'bg-red-50/40' : ''}`}
                      >
                        {/* 마스터: 완료 체크박스 - 제목 앞 */}
                        {isMaster && (
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
                        <span className={`inline-block shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}>
                          {t(`todos:computedStatus.${todo.computedStatus}`)}
                        </span>
                        <span className={`min-w-0 flex-1 truncate text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                          {todo.title}
                        </span>
                        {todo.userName && (
                          <span className="hidden shrink-0 text-xs font-medium text-indigo-600 sm:inline">
                            {todo.userName}
                          </span>
                        )}
                        {todo.dueDate && (
                          <span className={`shrink-0 text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                            {todo.dueDate}
                          </span>
                        )}
                        {/* 마스터: 히스토리 + 삭제 - 오른쪽 끝 */}
                        {isMaster && (
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
            </div>
          )}

          {/* Completed: 숫자만 표기, 클릭 시 완료 페이지로 이동 */}
          {sections.COMPLETED.length > 0 && (
            <Link
              to={`/todos/completed?scope=${scope === 'company' ? 'all' : scope}`}
              className={`flex items-center gap-2 rounded-xl border ${sectionStyle.COMPLETED.border} ${sectionStyle.COMPLETED.bg} p-4 text-sm font-semibold tracking-wider ${sectionStyle.COMPLETED.text} transition-colors hover:bg-green-50`}
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${sectionStyle.COMPLETED.dot}`} />
              {t('todos:section.completed')} ({sections.COMPLETED.length})
              <ChevronRight className="ml-auto h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {selectedTodo && (
        <TodoDetailModal
          todo={selectedTodo}
          onClose={() => setSelectedTodoId(null)}
        />
      )}

      {/* MASTER 전용 모달 */}
      {isMaster && (
        <>
          <TodoFormModal
            isOpen={showFormModal}
            onClose={() => { setShowFormModal(false); setEditingTodo(null); }}
            onSubmit={handleFormSubmit}
            editingTodo={editingTodo}
          />

          <TodoDeleteConfirmModal
            isOpen={!!deletingTodo}
            onClose={() => setDeletingTodo(null)}
            onConfirm={handleDeleteConfirm}
          />

          <TodoActionConfirmModal
            isOpen={!!listConfirm}
            message={t('todos:confirm.complete')}
            confirmColor="indigo"
            onClose={() => setListConfirm(null)}
            onConfirm={() => {
              if (listConfirm) {
                handleToggleComplete(listConfirm.todo.todoId, false);
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
        </>
      )}
    </div>
  );
}

function ScopedTodoItem({ todo, onClick, t }: { todo: TodoResponse; onClick: () => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const isCompleted = todo.computedStatus === 'COMPLETED';
  const badge = computedStatusBadge[todo.computedStatus] || computedStatusBadge.UPCOMING;

  const borderClass = {
    OVERDUE: 'border-red-300 bg-red-50',
    DUE_TODAY: 'border-orange-200 bg-orange-50/30',
    IN_PROGRESS: 'border-blue-200 bg-white hover:bg-gray-50',
    UPCOMING_SOON: 'border-yellow-200 bg-yellow-50/30 hover:bg-yellow-50',
    UPCOMING: 'border-gray-200 bg-white hover:bg-gray-50',
    COMPLETED: 'border-gray-200 bg-gray-50 opacity-60',
  }[todo.computedStatus] || 'border-gray-200 bg-white hover:bg-gray-50';

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${borderClass}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-indigo-600">
            {todo.userName || t('todos:cell.author')}
          </span>
          {todo.projectName && (
            <span className="flex items-center gap-0.5 text-xs text-purple-600">
              <FolderOpen className="h-3 w-3" />
              {todo.projectName}
            </span>
          )}
          {todo.issueTitle && (
            <span className="flex items-center gap-0.5 text-xs text-orange-600">
              <Link2 className="h-3 w-3" />
              {todo.issueTitle}
            </span>
          )}
        </div>
        <div className={`mt-0.5 text-sm font-medium ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>{todo.title}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Computed status badge */}
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.bg} ${badge.text}`}>
            {t(`todos:computedStatus.${todo.computedStatus}`)}
          </span>
          {/* D-day info */}
          {todo.daysUntilDue !== null && !isCompleted && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}>
              {todo.daysUntilDue < 0
                ? t('todos:badge.overdueDays', { n: Math.abs(todo.daysUntilDue) })
                : todo.daysUntilDue === 0
                  ? t('todos:badge.dday')
                  : t('todos:badge.remainingDays', { n: todo.daysUntilDue })}
            </span>
          )}
          {todo.dueDate && (
            <span className={`text-xs ${todo.computedStatus === 'OVERDUE' ? 'font-medium text-red-600' : 'text-gray-400'}`}>
              {todo.dueDate}
            </span>
          )}
          {!todo.dueDate && !isCompleted && (
            <span className="text-xs text-gray-400">{t('todos:columns.noDueDate')}</span>
          )}
          {todo.recurrenceType && (
            <span className="flex items-center gap-0.5 rounded-full bg-purple-50 px-2 py-0.5 text-xs text-purple-600">
              <RefreshCw className="h-3 w-3" />
              {t(`todos:recurrence.${todo.recurrenceType}`)}
            </span>
          )}
        </div>
      </div>

      {todo.commentCount > 0 && (
        <div className="flex shrink-0 items-center gap-1 text-gray-400">
          <MessageSquare className="h-4 w-4" />
          <span className="text-xs">{todo.commentCount}</span>
        </div>
      )}
    </button>
  );
}
