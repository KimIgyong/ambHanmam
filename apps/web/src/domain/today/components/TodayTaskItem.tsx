import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { useUpdateTodo } from '@/domain/todos/hooks/useTodos';
import type { TodoSummaryItem } from '../service/today.service';

interface Props {
  todo: TodoSummaryItem;
}

export default function TodayTaskItem({ todo }: Props) {
  const navigate = useNavigate();
  const updateTodo = useUpdateTodo();
  const isCompleted = todo.status === 'COMPLETED';

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) return;
    updateTodo.mutate({ id: todo.todoId, data: { status: 'COMPLETED' } });
  };

  return (
    <div
      onClick={() => navigate('/todos')}
      className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50"
    >
      <button
        onClick={handleToggle}
        className="shrink-0"
        disabled={isCompleted || updateTodo.isPending}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : (
          <Circle className="h-4 w-4 text-gray-300 hover:text-indigo-400" />
        )}
      </button>
      <span className={`flex-1 truncate text-sm ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
        {todo.title}
      </span>
      <span className="shrink-0 text-xs text-gray-400">{todo.dueDate}</span>
    </div>
  );
}
