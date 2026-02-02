'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { TaskList } from '@/components/lists/TaskList';
import { RefreshCw, Search, Bot, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { useState, useCallback, useTransition, useMemo } from 'react';

type StatusFilter = 'all' | 'has_in_progress' | 'completed' | 'pending';
type SortOption = 'date' | 'taskCount';

export default function TasksPage() {
  const { history, projects, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // Extract tasks from history
  const historyData = history as { entries: any[], sessions: any[] } | null;
  // @ts-ignore - tasks will be added to the data
  const tasks = historyData?.tasks || [];

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    let filteredTasks = [...tasks];

    // Apply status filter
    if (statusFilter === 'has_in_progress') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.some((todo: any) => todo.status === 'in_progress')
      );
    } else if (statusFilter === 'completed') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.every((todo: any) => todo.status === 'completed')
      );
    } else if (statusFilter === 'pending') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.some((todo: any) => todo.status === 'pending')
      );
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter((t: any) =>
        t.agentId.toLowerCase().includes(query) ||
        t.sessionId.toLowerCase().includes(query) ||
        t.todos.some((todo: any) => todo.content.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filteredTasks = filteredTasks.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'date':
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        case 'taskCount':
          return b.todos.length - a.todos.length;
        default:
          return 0;
      }
    });

    return filteredTasks;
  }, [tasks, statusFilter, searchQuery, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const hasInProgress = tasks.filter((t: any) =>
      t.todos.some((todo: any) => todo.status === 'in_progress')
    ).length;
    const allCompleted = tasks.filter((t: any) =>
      t.todos.every((todo: any) => todo.status === 'completed')
    ).length;
    const hasPending = tasks.filter((t: any) =>
      t.todos.some((todo: any) => todo.status === 'pending')
    ).length;

    return { totalTasks, hasInProgress, allCompleted, hasPending };
  }, [tasks]);

  if (loading) {
    return (
      <Layout currentPage="/tasks">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <div className="text-center py-12 text-muted-foreground">
            <LoadingSpinner size="lg" />
            <p>Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout currentPage="/tasks">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPage="/tasks">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tasks</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.totalTasks} Task Records
              {searchQuery || statusFilter !== 'all' ? ` · Found ${processedTasks.length} Results` : ''}
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={isPending}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Bot className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{stats.totalTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold">{stats.hasInProgress}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold">{stats.allCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Circle className="h-8 w-8 text-gray-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.hasPending}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="task-search"
                  placeholder="Search task content, Agent ID, or Session ID..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Status Filter */}
              <select
                name="task-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="has_in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>

              {/* Sort Options */}
              <select
                name="task-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="date">Sort by Date</option>
                <option value="taskCount">Sort by Task Count</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tasks List */}
        {processedTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchQuery || statusFilter !== 'all' ? 'No matching tasks found' : 'No task records'}
            </CardContent>
          </Card>
        ) : (
          <TaskList tasks={processedTasks} />
        )}
      </div>
    </Layout>
  );
}
