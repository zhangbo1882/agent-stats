'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { SessionList } from '@/components/lists/SessionList';
import { SessionViewer } from '@/components/debug/SessionViewer';
import { RefreshCw, Search, Download, ChevronLeft, ChevronRight, History } from 'lucide-react';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports: Lazy load SessionViewer to reduce initial bundle size
const SessionViewerDynamic = dynamic(() =>
  import('@/components/debug/SessionViewer').then(mod => ({ default: mod.SessionViewer })),
  {
    ssr: false
  }
);
import { useState, useCallback, useTransition, useMemo } from 'react';

type SortOption = 'date' | 'messageCount' | 'duration';
type PaginationDirection = 'next' | 'prev';

export default function SessionsPage() {
  const { history, projects, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const pageSize = 50;

  // Extract sessions and entries from history
  const historyData = history as { entries: any[], sessions: any[] } | null;
  const historyEntries = historyData?.entries || [];
  const historySessions = historyData?.sessions || [];

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Get unique projects
  const projectList = useMemo(() => {
    if (!historySessions) return ['all'];
    const projectsSet = new Set(
      historySessions
        .filter(h => h.project)
        .map(h => h.project!)
    );
    return ['all', ...Array.from(projectsSet)];
  }, [historySessions]);

  // Filter and sort sessions
  const processedSessions = useMemo(() => {
    if (!historySessions) return [];
    let sessions = [...historySessions];

    // Apply project filter
    if (selectedProject !== 'all') {
      sessions = sessions.filter(s => s.project === selectedProject);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      sessions = sessions.filter(s =>
        s.id.toLowerCase().includes(query) ||
        s.project?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    sessions = sessions.sort((a, b) => {
      switch (sortBy) {
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
  }, [historySessions, selectedProject, searchQuery, sortBy]);

  // Pagination
  const totalPages = Math.ceil(processedSessions.length / pageSize);
  const paginatedSessions = processedSessions.slice(page * pageSize, (page + 1) * pageSize);

  // Handle page change
  const handlePageChange = (direction: PaginationDirection) => {
    if (direction === 'next' && page < totalPages - 1) {
      setPage(page + 1);
    } else if (direction === 'prev' && page > 0) {
      setPage(page - 1);
    }
  };

  // Export to CSV
  const handleExport = useCallback(() => {
    const headers = ['ID', 'Date', 'Message Count', 'Project', 'Duration'];
    const rows = processedSessions.map(s => [
      s.id,
      s.timestamp,
      s.messageCount,
      s.project || 'N/A',
      s.duration || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [processedSessions]);

  if (loading) {
    return (
      <Layout currentPage="/sessions">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Sessions</h1>
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
      <Layout currentPage="/sessions">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Sessions</h1>
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
    <Layout currentPage="/sessions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Sessions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {historySessions.length || 0} Sessions
              {searchQuery || selectedProject !== 'all' ? ` · Found ${processedSessions.length} Results` : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={processedSessions.length === 0}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
                  name="session-search"
                  placeholder="Search session ID or project..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Project Filter */}
              {projectList.length > 1 && (
                <select
                  name="session-project-filter"
                  value={selectedProject}
                  onChange={(e) => {
                    setSelectedProject(e.target.value);
                    setPage(0); // Reset to first page when filter changes
                  }}
                  className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="all">All Projects</option>
                  {projectList.slice(1).map(project => (
                    <option key={project} value={project}>{project.split('/').pop()}</option>
                  ))}
                </select>
              )}

              {/* Sort Options */}
              <select
                name="session-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="date">Sort by Date</option>
                <option value="messageCount">Sort by Message Count</option>
                <option value="duration">Sort by Duration</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {paginatedSessions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchQuery || selectedProject !== 'all' ? 'No matching sessions found' : 'No session records'}
            </CardContent>
          </Card>
        ) : (
          <>
            <SessionList
              sessions={paginatedSessions}
              onSessionClick={(sessionId) => setSelectedSession(sessionId)}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, processedSessions.length)} / {processedSessions.length} Sessions
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange('prev')}
                    disabled={page === 0}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="px-3 py-2 text-sm">
                    Page {page + 1} / {totalPages}
                  </span>
                  <Button
                    onClick={() => handlePageChange('next')}
                    disabled={page >= totalPages - 1}
                    variant="outline"
                    size="sm"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Session Viewer Modal */}
        {selectedSession && (
          <SessionViewerDynamic
            sessionId={selectedSession}
            entries={historyEntries}
            onClose={() => setSelectedSession(null)}
          />
        )}
      </div>
    </Layout>
  );
}
