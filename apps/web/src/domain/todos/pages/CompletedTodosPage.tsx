import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { TodoResponse } from '@amb/types';
import { useTodoList, useGroupTodos, useUnitTodos, useCompanyTodos, useUpdateTodo, useDeleteTodo, useCompleteTodo, useReopenTodo } from '../hooks/useTodos';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuthStore } from '@/domain/auth/store/auth.store';
import TodoItem from '../components/TodoItem';
import TodoFormModal from '../components/TodoFormModal';
import TodoDeleteConfirmModal from '../components/TodoDeleteConfirmModal';
import TodoStatusHistory from '../components/TodoStatusHistory';
import TodoDetailModal from '../components/TodoDetailModal';
import SaveTranslationDialog from '@/domain/translations/components/SaveTranslationDialog';

type CompletedScope = 'mine' | 'unit' | 'cell' | 'all';

const sectionStyle = {
  dot: 'bg-green-500',
  text: 'text-green-700',
  border: 'border-green-200',
  bg: 'bg-green-50/30',
};

type SortKey = 'completedAt' | 'dueDate' | 'title';
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function CompletedTodosPage() {
  const { t } = useTranslation(['todos', 'common']);
  const [searchParams, setSearchParams] = useSearchParams();
  const scope = (searchParams.get('scope') as CompletedScope) || 'mine';
  const isMaster = useAuthStore((s) => s.isMaster());
  const canEdit = scope === 'mine' || isMaster;

  // Scope별 데이터 가져오기
  const mineQuery = useTodoList(scope === 'mine' ? undefined : { enabled: false });
  const unitQuery = useUnitTodos(scope === 'unit' ? undefined : { enabled: false });
  const cellQuery = useGroupTodos(scope === 'cell' ? undefined : { enabled: false });
  const companyQuery = useCompanyTodos(scope === 'all' ? undefined : { enabled: false });

  const { data: todos = [], isLoading } = scope === 'mine' ? mineQuery : scope === 'unit' ? unitQuery : scope === 'cell' ? cellQuery : companyQuery;
  const updateTodo = useUpdateTodo();
  const deleteTodo = useDeleteTodo();
  const completeTodo = useCompleteTodo();
  const reopenTodo = useReopenTodo();

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TodoResponse | null>(null);
  const [deletingTodo, setDeletingTodo] = useState<TodoResponse | null>(null);
  const [historyTodoId, setHistoryTodoId] = useState<string | null>(null);
  const [detailTodo, setDetailTodo] = useState<TodoResponse | null>(null);
  const [translateTarget, setTranslateTarget] = useState<{ todoId: string; title: string; description: string; originalLang?: string } | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('completedAt');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const debouncedSearch = useDebounce(searchInput, 300);

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

  const completedTodos = useMemo(() => {
    let filtered = todos.filter((todo) => todo.computedStatus === 'COMPLETED');

    // 검색 필터
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (todo) =>
          todo.title.toLowerCase().includes(q) ||
          (todo.description && todo.description.replace(/<[^>]*>/g, '').toLowerCase().includes(q)) ||
          (todo.tags && todo.tags.toLowerCase().includes(q)),
      );
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortKey) {
        case 'completedAt':
          return (b.completedAt || '').localeCompare(a.completedAt || '');
        case 'dueDate':
          return (b.dueDate || '').localeCompare(a.dueDate || '');
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [todos, debouncedSearch, sortKey]);

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(completedTodos.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedTodos = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return completedTodos.slice(start, start + pageSize);
  }, [completedTodos, safePage, pageSize]);

  // 검색/정렬 변경 시 1페이지로 리셋
  useEffect(() => { setPage(1); }, [debouncedSearch, sortKey, pageSize]);

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

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-gray-400">{t('common:loading')}</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            to="/todos"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('todos:backToTodos')}
          </Link>
        </div>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span className={`inline-block h-3 w-3 rounded-full ${sectionStyle.dot}`} />
            {t('todos:completedTodos')}
            {scope !== 'mine' && (
              <span className="ml-1 text-base font-medium text-gray-500">
                ({t(`todos:scope.${scope}`)})
              </span>
            )}
            <span className="text-base font-normal text-gray-500">({completedTodos.length})</span>
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {/* 검색 */}
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
            {/* 정렬 */}
            <div className="relative">
              <ArrowUpDown className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-8 pr-8 text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="completedAt">{t('todos:completed.sortByCompletedAt')}</option>
                <option value="dueDate">{t('todos:completed.sortByDueDate')}</option>
                <option value="title">{t('todos:completed.sortByTitle')}</option>
              </select>
            </div>
            {/* 페이지 크기 */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-gray-300 bg-white py-1.5 px-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{t('todos:completed.perPage', { n })}</option>
              ))}
            </select>
          </div>
        </div>

        {completedTodos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center text-sm text-gray-400">
            {t('todos:noCompletedTodos')}
          </div>
        ) : (
          <>
            <div className={`rounded-xl border ${sectionStyle.border} ${sectionStyle.bg} p-4`}>
              <div className="space-y-2">
                {pagedTodos.map((todo) => (
                  <TodoItem
                    key={todo.todoId}
                    todo={todo}
                    onToggleComplete={handleToggleComplete}
                    onEdit={canEdit ? handleEdit : (t) => setDetailTodo(t)}
                    onDelete={setDeletingTodo}
                    onShowHistory={setHistoryTodoId}
                    onShowDetail={handleShowDetail}
                    readOnly={!canEdit}
                  />
                ))}
              </div>
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-gray-600">
                  {t('todos:completed.pageInfo', { current: safePage, total: totalPages })}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="rounded-lg border border-gray-300 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

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
