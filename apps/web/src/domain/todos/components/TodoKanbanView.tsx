import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Square, History, Trash2, ArrowRightCircle } from 'lucide-react';
import { TodoResponse } from '@amb/types';

interface TodoKanbanViewProps {
  todos: TodoResponse[];
  currentUserId?: string;
  onEdit: (todo: TodoResponse) => void;
  onShowDetail: (todoId: string) => void;
  onToggleComplete: (todoId: string, isCompleted: boolean) => void;
  onDelete: (todo: TodoResponse) => void;
  onShowHistory: (todoId: string) => void;
  onConvertToIssue: (todo: TodoResponse) => void;
}

type KanbanColumn = 'DUE_TODAY' | 'IN_PROGRESS' | 'COMPLETED';

const COLUMNS: { key: KanbanColumn; labelKey: string; dot: string; headerBg: string; border: string }[] = [
  { key: 'DUE_TODAY', labelKey: 'todos:kanban.dueToday', dot: 'bg-orange-500', headerBg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'IN_PROGRESS', labelKey: 'todos:kanban.inProgress', dot: 'bg-blue-500', headerBg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'COMPLETED', labelKey: 'todos:kanban.completed', dot: 'bg-green-500', headerBg: 'bg-green-50', border: 'border-green-200' },
];

export default function TodoKanbanView({
  todos,
  currentUserId,
  onEdit,
  onShowDetail,
  onToggleComplete,
  onDelete,
  onShowHistory,
  onConvertToIssue,
}: TodoKanbanViewProps) {
  const { t } = useTranslation(['todos', 'common']);

  const columns = useMemo(() => {
    const grouped: Record<KanbanColumn, TodoResponse[]> = {
      DUE_TODAY: [],
      IN_PROGRESS: [],
      COMPLETED: [],
    };

    for (const todo of todos) {
      const cs = todo.computedStatus;
      if (cs === 'COMPLETED') {
        grouped.COMPLETED.push(todo);
      } else if (cs === 'DUE_TODAY' || cs === 'OVERDUE') {
        grouped.DUE_TODAY.push(todo);
      } else {
        // IN_PROGRESS, UPCOMING_SOON, UPCOMING all go to IN_PROGRESS column
        grouped.IN_PROGRESS.push(todo);
      }
    }

    return grouped;
  }, [todos]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {COLUMNS.map(({ key, labelKey, dot, headerBg, border }) => (
        <div key={key} className={`rounded-xl border ${border} bg-white`}>
          {/* Column Header */}
          <div className={`flex items-center gap-2 rounded-t-xl ${headerBg} px-4 py-3`}>
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
            <h3 className="text-sm font-semibold text-gray-700">
              {t(labelKey)}
            </h3>
            <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-gray-500">
              {columns[key].length}
            </span>
          </div>

          {/* Column Body */}
          <div className="max-h-[calc(100vh-280px)] space-y-2 overflow-y-auto p-3">
            {columns[key].length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400">
                {t('todos:kanban.empty')}
              </div>
            ) : (
              columns[key].map((todo) => {
                const isOwner = !currentUserId || todo.userId === currentUserId;
                const isOverdue = todo.computedStatus === 'OVERDUE';
                const isCompleted = todo.computedStatus === 'COMPLETED';
                return (
                  <div
                    key={todo.todoId}
                    onClick={() => isOwner ? onEdit(todo) : onShowDetail(todo.todoId)}
                    className={`cursor-pointer rounded-lg border p-3 transition-shadow hover:shadow-md ${
                      isOverdue ? 'border-red-200 bg-red-50/50' : isCompleted ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {todo.userName && (
                      <div className="mb-1 text-[11px] font-medium text-indigo-600">
                        {todo.userName}
                      </div>
                    )}
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <span className={`text-sm font-medium leading-snug ${
                        isOverdue ? 'text-red-700' : isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </span>
                    </div>

                    {/* Due date */}
                    {todo.dueDate && (
                      <div className={`mb-2 text-xs ${isOverdue ? 'font-medium text-red-500' : 'text-gray-400'}`}>
                        {todo.dueDate}
                        {todo.daysUntilDue !== null && todo.daysUntilDue < 0 && (
                          <span className="ml-1 text-red-500">
                            ({t('todos:badge.overdueDays', { n: Math.abs(todo.daysUntilDue) })})
                          </span>
                        )}
                        {todo.daysUntilDue === 0 && (
                          <span className="ml-1 font-semibold text-orange-500">
                            ({t('todos:badge.dday')})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {todo.tags && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {todo.tags.split(',').slice(0, 2).map((tag) => (
                          <span key={tag.trim()} className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    {isOwner && (
                      <div className="flex items-center gap-1 border-t border-gray-100 pt-2">
                        {!isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onToggleComplete(todo.todoId, false); }}
                            className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
                            title={t('todos:completeTodo')}
                          >
                            <Square className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {!todo.issueId && !isCompleted && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onConvertToIssue(todo); }}
                            className="rounded p-1 text-gray-400 hover:bg-orange-50 hover:text-orange-500"
                            title={t('todos:convertToIssue')}
                          >
                            <ArrowRightCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onShowHistory(todo.todoId); }}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title={t('todos:statusHistory')}
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); onDelete(todo); }}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                          title={t('todos:deleteTodo')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
