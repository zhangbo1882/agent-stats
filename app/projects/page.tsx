'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProjectList } from '@/components/lists/ProjectList';
import { SessionList } from '@/components/lists/SessionList';
import { PlanList } from '@/components/lists/PlanList';
import { TaskList } from '@/components/lists/TaskList';
import { RefreshCw, Search, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, useCallback, useTransition, useMemo } from 'react';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports: Lazy load SessionViewer and PlanViewer to reduce initial bundle size
const SessionViewerDynamic = dynamic(() =>
  import('@/components/debug/SessionViewer').then(mod => ({ default: mod.SessionViewer })),
  { ssr: false }
);

const PlanViewerDynamic = dynamic(() =>
  import('@/components/debug/PlanViewer').then(mod => ({ default: mod.PlanViewer })),
  { ssr: false }
);

type SortOption = 'name' | 'sessionCount' | 'lastActive';
type SessionSortOption = 'date' | 'messageCount' | 'duration';
type PlanSortOption = 'created' | 'title';
type TaskSortOption = 'date' | 'taskCount' | 'agentId';
type StatusFilter = 'all' | 'has_in_progress' | 'completed' | 'pending';

type ExpandableSection = 'sessions' | 'plans' | 'tasks' | null;

export default function ProjectsPage() {
  const { projects, plans, history, tasks, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('sessionCount');
  const [expandedSection, setExpandedSection] = useState<ExpandableSection>(null);

  // Search states for expanded sections
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [sessionSortBy, setSessionSortBy] = useState<SessionSortOption>('date');
  const [planSortBy, setPlanSortBy] = useState<PlanSortOption>('created');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSortBy, setTaskSortBy] = useState<TaskSortOption>('date');
  const [taskStatusFilter, setTaskStatusFilter] = useState<StatusFilter>('all');

  // Viewer states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  const handleProjectDelete = useCallback(async (projectPath: string) => {
    try {
      const response = await fetch('/api/projects', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectName: projectPath }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete project');
      }

      // Refresh data after deletion
      await refresh();
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  }, [refresh]);

  // Find most active project
  const mostActiveProject = useMemo(() => {
    if (projects.length === 0) return undefined;
    return projects.reduce((max, p) =>
      p.sessionCount > max.sessionCount ? p : max
    ).name;
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.path?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'sessionCount':
          return b.sessionCount - a.sessionCount;
        case 'lastActive':
          const aTime = a.lastActive ? new Date(a.lastActive).getTime() : 0;
          const bTime = b.lastActive ? new Date(b.lastActive).getTime() : 0;
          return bTime - aTime;
        default:
          return 0;
      }
    });

    return sorted;
  }, [projects, searchQuery, sortBy]);

  // Summary stats
  const totalSessions = useMemo(() => {
    return projects.reduce((sum, p) => sum + p.sessionCount, 0);
  }, [projects]);
  const totalTasks = tasks.length;

  // Extract history data
  const historyData = history as { entries: any[], sessions: any[] } | null;
  const allSessions = historyData?.sessions || [];
  const historyEntries = historyData?.entries || [];

  // Process sessions for expanded view
  const processedSessions = useMemo(() => {
    let sessions = [...allSessions];

    if (sessionSearchQuery) {
      const query = sessionSearchQuery.toLowerCase();
      sessions = sessions.filter(s =>
        s.id.toLowerCase().includes(query)
      );
    }

    sessions = sessions.sort((a, b) => {
      switch (sessionSortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'messageCount':
          return b.messageCount - a.messageCount;
        case 'duration':
          return (b.duration || 0) - (a.duration || 0);
        default:
          return 0;
      }
    });

    return sessions;
  }, [allSessions, sessionSearchQuery, sessionSortBy]);

  // Process plans for expanded view
  const processedPlans = useMemo(() => {
    let filtered = plans;

    if (planSearchQuery) {
      const query = planSearchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.title.toLowerCase().includes(query) ||
        plan.summary?.toLowerCase().includes(query) ||
        plan.filesToModify.some((f: string) => f.toLowerCase().includes(query))
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      switch (planSortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [plans, planSearchQuery, planSortBy]);

  // Process tasks for expanded view
  const processedTasks = useMemo(() => {
    let filteredTasks = [...tasks];

    // Apply status filter
    if (taskStatusFilter === 'has_in_progress') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.some(todo => todo.status === 'in_progress')
      );
    } else if (taskStatusFilter === 'completed') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.every(todo => todo.status === 'completed')
      );
    } else if (taskStatusFilter === 'pending') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.some(todo => todo.status === 'pending')
      );
    }

    // Apply search
    if (taskSearchQuery) {
      const query = taskSearchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter(t =>
        t.agentId.toLowerCase().includes(query) ||
        t.sessionId.toLowerCase().includes(query) ||
        t.todos.some(todo => todo.content.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    filteredTasks = filteredTasks.sort((a, b) => {
      switch (taskSortBy) {
        case 'date':
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        case 'taskCount':
          return b.todos.length - a.todos.length;
        case 'agentId':
          return a.agentId.localeCompare(b.agentId);
        default:
          return 0;
      }
    });

    return filteredTasks;
  }, [tasks, taskStatusFilter, taskSearchQuery, taskSortBy]);

  // Toggle expandable section
  const toggleSection = useCallback((section: ExpandableSection) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  if (loading) {
    return (
      <Layout currentPage="/projects">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Projects</h1>
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
      <Layout currentPage="/projects">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Projects</h1>
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
    <Layout currentPage="/projects">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Projects</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projects.length} Projects · {totalSessions} Sessions
              {searchQuery && ` · Found ${filteredProjects.length} Results`}
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

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-2xl">{projects.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection('sessions')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Sessions</CardDescription>
                {expandedSection === 'sessions' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <CardTitle className="text-2xl">{totalSessions}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection('plans')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Plans</CardDescription>
                {expandedSection === 'plans' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <CardTitle className="text-2xl">{plans.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => toggleSection('tasks')}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription>Total Tasks</CardDescription>
                {expandedSection === 'tasks' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
              <CardTitle className="text-2xl">{totalTasks}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Most Active Project</CardDescription>
              <CardTitle className="text-lg truncate">
                {mostActiveProject || 'None'}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Expandable Sections */}
        {expandedSection === 'sessions' && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="session-search"
                      placeholder="Search session ID..."
                      autoComplete="off"
                      value={sessionSearchQuery}
                      onChange={(e) => setSessionSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <select
                    name="session-sort"
                    value={sessionSortBy}
                    onChange={(e) => setSessionSortBy(e.target.value as SessionSortOption)}
                    className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="date">Sort by Time</option>
                    <option value="messageCount">Sort by Message Count</option>
                    <option value="duration">Sort by Duration</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Sessions</CardTitle>
                <CardDescription>Click on a session to view details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <SessionList
                  sessions={processedSessions}
                  onSessionClick={setSelectedSessionId}
                />
              </CardContent>
            </Card>
          </>
        )}

        {expandedSection === 'plans' && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="plan-search"
                      placeholder="Search title, summary, or filename..."
                      autoComplete="off"
                      value={planSearchQuery}
                      onChange={(e) => setPlanSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <select
                    name="plan-sort"
                    value={planSortBy}
                    onChange={(e) => setPlanSortBy(e.target.value as PlanSortOption)}
                    className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="created">Sort by Created Date</option>
                    <option value="title">Sort by Title</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Plans</CardTitle>
                <CardDescription>Click on a plan to view details</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <PlanList plans={processedPlans} onPlanClick={setSelectedPlanId} />
              </CardContent>
            </Card>
          </>
        )}

        {expandedSection === 'tasks' && (
          <>
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      name="task-search"
                      placeholder="Search task content, Agent ID, or Session ID..."
                      autoComplete="off"
                      value={taskSearchQuery}
                      onChange={(e) => setTaskSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                  </div>
                  <select
                    name="task-status-filter"
                    value={taskStatusFilter}
                    onChange={(e) => setTaskStatusFilter(e.target.value as StatusFilter)}
                    className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="all">All Status</option>
                    <option value="has_in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                  <select
                    name="task-sort"
                    value={taskSortBy}
                    onChange={(e) => setTaskSortBy(e.target.value as TaskSortOption)}
                    className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="taskCount">Sort by Task Count</option>
                    <option value="agentId">Sort by Agent ID</option>
                  </select>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
                <CardDescription>Agent tasks with todo items</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <TaskList tasks={processedTasks} />
              </CardContent>
            </Card>
          </>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="project-search"
                  placeholder="Search project name..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Sort Options */}
              <select
                name="project-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="sessionCount">Sort by Session Count</option>
                <option value="lastActive">Sort by Last Active</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Projects List */}
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-4" />
              {searchQuery ? 'No matching projects found' : 'No projects'}
            </CardContent>
          </Card>
        ) : (
          <ProjectList
            projects={filteredProjects}
            mostActiveProject={mostActiveProject}
            onProjectDelete={handleProjectDelete}
            makeClickable={true}
          />
        )}
      </div>

      {/* Session Viewer Modal */}
      {selectedSessionId && (
        <SessionViewerDynamic
          sessionId={selectedSessionId}
          entries={historyEntries}
          onClose={() => setSelectedSessionId(null)}
        />
      )}

      {/* Plan Viewer Modal */}
      {selectedPlanId && (
        <PlanViewerDynamic
          plan={plans.find(p => p.id === selectedPlanId)!}
          onClose={() => setSelectedPlanId(null)}
        />
      )}
    </Layout>
  );
}
