'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { SessionList } from '@/components/lists/SessionList';
import { PlanList } from '@/components/lists/PlanList';
import { TaskList } from '@/components/lists/TaskList';
import { RefreshCw, Search, FolderOpen, History, FileText, Bot, ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState, useCallback, useTransition, useMemo, useEffect, use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { formatProjectName } from '@/lib/utils';
import Link from 'next/link';

// bundle-dynamic-imports: Lazy load SessionViewer and PlanViewer to reduce initial bundle size
const SessionViewerDynamic = dynamic(() =>
  import('@/components/debug/SessionViewer').then(mod => ({ default: mod.SessionViewer })),
  { ssr: false }
);

const PlanViewerDynamic = dynamic(() =>
  import('@/components/debug/PlanViewer').then(mod => ({ default: mod.PlanViewer })),
  { ssr: false }
);

type SortOption = 'date' | 'messageCount' | 'duration' | 'created' | 'title' | 'taskCount';
type StatusFilter = 'all' | 'has_in_progress' | 'completed' | 'pending';
type TabType = 'sessions' | 'plans' | 'tasks';

interface ProjectDetailPageProps {
  params: Promise<{
    projectPath: string;
  }>;
}

const tabs = [
  { id: 'sessions' as TabType, name: 'Sessions', icon: History },
  { id: 'plans' as TabType, name: 'Plans', icon: FileText },
  { id: 'tasks' as TabType, name: 'Tasks', icon: Bot },
];

function ProjectDetailPageContent({ projectPath }: { projectPath: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { history, plans, projects, tasks, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();

  // Get project path from URL params (URL-encoded)
  const decodedProjectPath = decodeURIComponent(projectPath);

  // Find the current project from the projects list to get its display name
  const currentProject = useMemo(() => {
    return projects.find(p => p.path === decodedProjectPath);
  }, [projects, projectPath]);

  // Get initial tab from URL query param, default to 'sessions'
  const initialTab = (searchParams.get('tab') as TabType) || 'sessions';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    router.push(`/projects/${encodeURIComponent(projectPath)}?tab=${tab}`, { scroll: false });
  }, [projectPath, router]);

  // Sync tab state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType;
    if (tabParam && ['sessions', 'plans', 'tasks'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Viewer states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Search and sort states for each tab
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionSortBy, setSessionSortBy] = useState<SortOption>('date');

  const [planSearchQuery, setPlanSearchQuery] = useState('');
  const [planSortBy, setPlanSortBy] = useState<SortOption>('created');

  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [taskSortBy, setTaskSortBy] = useState<SortOption>('date');
  const [taskStatusFilter, setTaskStatusFilter] = useState<StatusFilter>('all');

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Extract data from history
  const historyData = history as { entries: any[], sessions: any[] } | null;
  const historyEntries = historyData?.entries || [];
  const allSessions = historyData?.sessions || [];
  const allTasks = tasks || [];

  // Filter data for this project
  // Note: session.project stores the full path (e.g., "/Users/zhangbo/Public/go/github.com/agent-stats")
  // while projectPath is the directory name (e.g., "-Users-zhangbo-Public-go-github-com-agent-stats")
  // We match by the project's display name from the projects list
  const projectSessions = useMemo(() => {
    if (!currentProject) return [];

    // Use the project's display name for matching
    // Sessions have project field like "/Users/zhangbo/Public/go/github.com/agent-stats"
    // We need to match sessions where the project path ends with "/" + currentProject.name
    const projectName = currentProject.name;

    // Try to find sessions that match the project
    // Match by checking if session.project ends with "/" + projectName or "/" + projectName.replace(/-/g, '/')
    return allSessions.filter(s => {
      if (!s.project) return false;
      // Normalize both paths for comparison
      const sessionProjectEnd = s.project.split('/').filter((p: string) => p.length > 0).slice(-2).join('/');
      const searchPatterns = [
        projectName,                           // "agent-stats"
        projectName.replace(/-/g, '/'),        // "agent/stats" (handles dashes in name)
      ];
      return searchPatterns.some(pattern => s.project.endsWith('/' + pattern) || sessionProjectEnd === pattern);
    });
  }, [allSessions, currentProject]);

  const projectPlans = useMemo(() => {
    if (!currentProject) return [];

    const projectName = currentProject.name;

    // More direct approach: find plans that explicitly mention this project
    // and check if they mention other projects
    return plans.filter(p => {
      // If plan has exact project field, use it
      if (p.project) {
        const project = p.project; // Type narrowing
        const sessionProjectEnd = project.split('/').filter((part: string) => part.length > 0).slice(-2).join('/');
        const searchPatterns = [
          projectName,
          projectName.replace(/-/g, '/'),
        ];
        return searchPatterns.some(pattern => project.endsWith('/' + pattern) || sessionProjectEnd === pattern);
      }

      // For plans without project field, use smart matching
      const searchContent = [
        p.title,
        p.summary,
        ...(p.filesToModify || [])
      ].join(' ').toLowerCase();

      // Check for explicit "for X project" mentions
      const explicitProjectPattern = new RegExp(
        `(?:for|in)\\s+(?:the\\s+)?[\"']?([\\w\\-]+)[\"']?\\s+(?:project|项目)`,
        'gi'
      );

      const explicitMentions = [];
      let match;
      while ((match = explicitProjectPattern.exec(searchContent)) !== null) {
        explicitMentions.push(match[1]);
      }

      // If there are explicit project mentions, only match if this project is mentioned
      if (explicitMentions.length > 0) {
        // Normalize project name for comparison (remove dashes for flexible matching)
        const normalizedProjectName = projectName.toLowerCase().replace(/-/g, '');
        const mentioned = explicitMentions.some(mentionedProject =>
          mentionedProject.toLowerCase().replace(/-/g, '') === normalizedProjectName ||
          mentionedProject.toLowerCase() === projectName.toLowerCase()
        );
        return mentioned;
      }

      // If no explicit mentions, fall back to checking if the plan is primarily about this project
      // Check for patterns like "X is a ... project" or "X Dashboard" etc.
      const dashboardPattern = new RegExp(
        `${projectName.replace(/-/g, '[\\-]?')}\\s+(?:dashboard|implementation|plan)`,
        'i'
      );
      if (dashboardPattern.test(searchContent)) {
        return true;
      }

      // For very specific project names (>=8 chars), check for loose match
      // But avoid matching "claude" in "CLAUDE.md"
      if (projectName.length >= 8) {
        const pattern = new RegExp(`\\b${projectName.replace(/-/g, '-')}(?:\\s|\\.|,|$)`, 'i');
        if (pattern.test(p.title + ' ' + (p.summary || ''))) {
          // Additional check: make sure it's not just a substring match like "claude" in "CLAUDE"
          return true;
        }
      }

      return false;
    });
  }, [plans, currentProject]);

  const projectTasks = useMemo(() => {
    if (!currentProject) return [];

    // Filter tasks by projectPath field
    // task.projectPath contains the full path (e.g., "/Users/zhangbo/Public/go/github.com/agent-stats")
    // currentProject.name contains the display name (e.g., "agent-stats")
    const projectName = currentProject.name;

    return allTasks.filter(task => {
      if (!task.projectPath) return false;

      // Check if task.projectPath ends with the project name
      return task.projectPath.endsWith('/' + projectName) ||
             task.projectPath.endsWith(projectName);
    });
  }, [allTasks, currentProject]);

  // Process sessions (search and sort)
  const processedSessions = useMemo(() => {
    let sessions = [...projectSessions];

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
  }, [projectSessions, sessionSearchQuery, sessionSortBy]);

  // Process plans (search and sort)
  const processedPlans = useMemo(() => {
    let filtered = projectPlans;

    if (planSearchQuery) {
      const query = planSearchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.title.toLowerCase().includes(query) ||
        plan.summary?.toLowerCase().includes(query) ||
        plan.filesToModify.some(f => f.toLowerCase().includes(query))
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
  }, [projectPlans, planSearchQuery, planSortBy]);

  // Process tasks (search, status filter, and sort)
  const processedTasks = useMemo(() => {
    let filteredTasks = [...projectTasks];

    if (taskStatusFilter === 'has_in_progress') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.some((todo: any) => todo.status === 'in_progress')
      );
    } else if (taskStatusFilter === 'completed') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.every((todo: any) => todo.status === 'completed')
      );
    } else if (taskStatusFilter === 'pending') {
      filteredTasks = filteredTasks.filter(t =>
        t.todos.some((todo: any) => todo.status === 'pending')
      );
    }

    if (taskSearchQuery) {
      const query = taskSearchQuery.toLowerCase();
      filteredTasks = filteredTasks.filter((t: any) =>
        t.agentId.toLowerCase().includes(query) ||
        t.sessionId.toLowerCase().includes(query) ||
        t.todos.some((todo: any) => todo.content.toLowerCase().includes(query))
      );
    }

    filteredTasks = filteredTasks.sort((a: any, b: any) => {
      switch (taskSortBy) {
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
  }, [projectTasks, taskStatusFilter, taskSearchQuery, taskSortBy]);

  if (loading) {
    return (
      <Layout currentPage="/projects">
        <div className="space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Project List
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{currentProject?.name || projectPath}</span>
          </div>

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
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
              <ChevronLeft className="h-4 w-4" />
              Project List
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">{currentProject?.name || projectPath}</span>
          </div>

          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const projectName = currentProject?.name || formatProjectName(projectPath);

  return (
    <Layout currentPage="/projects">
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/projects" className="hover:text-foreground transition-colors flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Project List
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">{projectName}</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{projectName}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {projectSessions.length} Sessions · {projectPlans.length} Plans · {projectTasks.length} Tasks
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

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count = tab.id === 'sessions' ? projectSessions.length
                : tab.id === 'plans' ? projectPlans.length
                : projectTasks.length;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`${
                    isActive
                      ? 'border-primary text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  } group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.name}
                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'sessions' && (
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
                    onChange={(e) => setSessionSortBy(e.target.value as SortOption)}
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
              <CardContent className="p-0">
                <SessionList
                  sessions={processedSessions}
                  onSessionClick={setSelectedSessionId}
                />
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'plans' && (
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
                    onChange={(e) => setPlanSortBy(e.target.value as SortOption)}
                    className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="created">Sort by Created Date</option>
                    <option value="title">Sort by Title</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <PlanList
                  plans={processedPlans}
                  onPlanClick={setSelectedPlanId}
                />
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'tasks' && (
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
                    onChange={(e) => setTaskSortBy(e.target.value as SortOption)}
                    className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="taskCount">Sort by Task Count</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <TaskList tasks={processedTasks} />
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty state */}
        {(activeTab === 'sessions' && processedSessions.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4" />
              {sessionSearchQuery ? 'No matching sessions found' : 'No session records'}
            </CardContent>
          </Card>
        )}

        {(activeTab === 'plans' && processedPlans.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              {planSearchQuery ? 'No matching plans found' : 'No plans'}
            </CardContent>
          </Card>
        )}

        {(activeTab === 'tasks' && processedTasks.length === 0) && (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4" />
              {taskSearchQuery || taskStatusFilter !== 'all' ? 'No matching tasks found' : 'No task records'}
            </CardContent>
          </Card>
        )}

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
      </div>
    </Layout>
  );
}

// Default export that unwraps the params promise
export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const resolvedParams = await params;
  return <ProjectDetailPageContent projectPath={resolvedParams.projectPath} />;
}
