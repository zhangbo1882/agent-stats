'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { ProjectList } from '@/components/lists/ProjectList';
import { RefreshCw, Search, FolderOpen } from 'lucide-react';
import { useState, useCallback, useTransition, useMemo } from 'react';

type SortOption = 'name' | 'sessionCount' | 'lastActive';

export default function ProjectsPage() {
  const { projects, plans, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('sessionCount');

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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-2xl">{projects.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Sessions</CardDescription>
              <CardTitle className="text-2xl">{totalSessions}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Plans</CardDescription>
              <CardTitle className="text-2xl">{plans.length}</CardTitle>
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
    </Layout>
  );
}
