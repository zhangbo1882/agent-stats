'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { MessageSquare, Layers, Wrench, Calendar, RefreshCw } from 'lucide-react';
import { useState, useCallback, useTransition } from 'react';
import { formatNumber } from '@/lib/utils';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports: Lazy load chart components to reduce initial bundle size
const ActivityChart = dynamic(() => import('@/components/charts/ActivityChart').then(mod => ({ default: mod.ActivityChart })), {
  loading: () => <LoadingSpinner size="md" />,
  ssr: false
});

const ModelUsageChart = dynamic(() => import('@/components/charts/ModelUsageChart').then(mod => ({ default: mod.ModelUsageChart })), {
  loading: () => <LoadingSpinner size="md" />,
  ssr: false
});

const ProjectChart = dynamic(() => import('@/components/charts/ProjectChart').then(mod => ({ default: mod.ProjectChart })), {
  loading: () => <LoadingSpinner size="md" />,
  ssr: false
});

function calculateTrend(current: number, previous: number): { value: number; isPositive: boolean } | undefined {
  if (previous === 0) return undefined;
  const percentChange = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(percentChange * 10) / 10),
    isPositive: percentChange >= 0,
  };
}

export default function HomePage() {
  const { stats, projects, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
      setLastRefresh(new Date());
    });
  }, [refresh]);

  if (loading) {
    return (
      <Layout currentPage="/">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">AI Agent Stats Dashboard</h1>
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
      <Layout currentPage="/">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">AI Agent Stats Dashboard</h1>
          <Card className="border-destructive">
            <CardContent className="p-6">
              <p className="text-destructive">{error}</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout currentPage="/">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">AI Agent Stats Dashboard</h1>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">No statistics available</p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Calculate totals for tool calls
  const totalToolCalls = stats.dailyActivity.reduce((sum, day) => sum + (day.toolCallCount || 0), 0);

  // Calculate active days
  const activeDays = stats.dailyActivity.filter(day => day.messageCount > 0).length;

  // Calculate trends (week-over-week comparison)
  const last7Days = stats.dailyActivity.slice(-7);
  const previous7Days = stats.dailyActivity.slice(-14, -7);

  const currentWeekMessages = last7Days.reduce((sum, day) => sum + day.messageCount, 0);
  const previousWeekMessages = previous7Days.reduce((sum, day) => sum + day.messageCount, 0);
  const messageTrend = calculateTrend(currentWeekMessages, previousWeekMessages);

  const currentWeekSessions = last7Days.reduce((sum, day) => sum + day.sessionCount, 0);
  const previousWeekSessions = previous7Days.reduce((sum, day) => sum + day.sessionCount, 0);
  const sessionTrend = calculateTrend(currentWeekSessions, previousWeekSessions);

  const currentWeekTools = last7Days.reduce((sum, day) => sum + (day.toolCallCount || 0), 0);
  const previousWeekTools = previous7Days.reduce((sum, day) => sum + (day.toolCallCount || 0), 0);
  const toolTrend = calculateTrend(currentWeekTools, previousWeekTools);

  // Prepare model usage data
  const modelUsageData = Object.entries(stats.modelUsage || {}).reduce((acc, [model, usage]) => {
    if (usage.inputTokens > 0 || usage.outputTokens > 0) {
      acc[model] = usage;
    }
    return acc;
  }, {} as Record<string, typeof stats.modelUsage[string]>);

  return (
    <Layout currentPage="/">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">AI Agent Stats Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {stats.lastComputedDate || 'Unknown'}
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

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions}
            icon={Layers}
            trend={sessionTrend}
          />
          <StatCard
            title="Total Messages"
            value={stats.totalMessages}
            icon={MessageSquare}
            trend={messageTrend}
          />
          <StatCard
            title="Tool Calls"
            value={totalToolCalls}
            icon={Wrench}
            trend={toolTrend}
          />
          <StatCard
            title="Active Days"
            value={activeDays}
            icon={Calendar}
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity Trend</CardTitle>
              <CardDescription>Message count for the past 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityChart data={stats.dailyActivity.slice(-30)} metric="messageCount" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Model Usage Distribution</CardTitle>
              <CardDescription>Token usage by model</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(modelUsageData).length > 0 ? (
                <ModelUsageChart data={modelUsageData} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No model usage data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid gap-4 md:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Top Projects</CardTitle>
              <CardDescription>Top 10 projects by session count</CardDescription>
            </CardHeader>
            <CardContent>
              {projects && projects.length > 0 ? (
                <ProjectChart data={projects} />
              ) : (
                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                  No project data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Longest Session</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.longestSession ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Session ID</p>
                  <p className="font-mono text-xs break-all">{stats.longestSession.sessionId}</p>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Messages</p>
                      <p className="font-semibold">{stats.longestSession.messageCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-semibold">{Math.round(stats.longestSession.duration / 60)} min</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No data</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>First Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="font-semibold">
                  {stats.firstSessionDate
                    ? new Date(stats.firstSessionDate).toLocaleDateString('en-US')
                    : 'Unknown'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statistics Version</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="font-semibold">v{stats.version}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
