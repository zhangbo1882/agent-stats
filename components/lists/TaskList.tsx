'use client';

import { memo } from 'react';
import { CheckCircle2, Circle, Loader2, Bot, Folder } from 'lucide-react';
import { AgentTask } from '@/lib/types';
import { formatDate, formatProjectName } from '@/lib/utils';

interface TaskListProps {
  tasks: AgentTask[];
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const TaskList = memo(function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bot className="h-12 w-12 mx-auto mb-4" />
        <p>No task records</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Circle className="h-4 w-4 text-gray-400" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-4">
      {tasks.slice(0, 50).map((task) => (
        <div
          key={`${task.sessionId}-${task.agentId}`}
          className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm text-muted-foreground">
                  {task.agentId.substring(0, 8)}...
                </span>
                {task.createdAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(task.createdAt)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Session: {task.sessionId.substring(0, 8)}...</span>
                {task.projectPath && (
                  <span className="flex items-center gap-1">
                    <Folder className="h-3 w-3" />
                    {formatProjectName(task.projectPath)}
                  </span>
                )}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {task.todos.length} tasks
            </div>
          </div>

          <div className="space-y-2">
            {task.todos.map((todo, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30"
              >
                <div className="mt-0.5">{getStatusIcon(todo.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{todo.content}</div>
                  <div className="text-xs text-muted-foreground">
                    {getStatusText(todo.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
