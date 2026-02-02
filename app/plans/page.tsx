'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PlanList } from '@/components/lists/PlanList';
import { PlanViewer } from '@/components/debug/PlanViewer';
import { RefreshCw, Search, FileText } from 'lucide-react';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports: Lazy load PlanViewer to reduce initial bundle size
const PlanViewerDynamic = dynamic(() =>
  import('@/components/debug/PlanViewer').then(mod => ({ default: mod.PlanViewer })),
  {
    ssr: false
  }
);
import { useState, useCallback, useTransition, useMemo } from 'react';

type SortOption = 'created' | 'title';

export default function PlansPage() {
  const { plans, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Filter and sort plans
  const filteredPlans = useMemo(() => {
    let filtered = plans;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plan =>
        plan.title.toLowerCase().includes(query) ||
        plan.summary?.toLowerCase().includes(query) ||
        plan.filesToModify.some(f => f.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return sorted;
  }, [plans, searchQuery, sortBy]);

  // Calculate stats
  const totalFilesToModify = useMemo(() => {
    return plans.reduce((sum, plan) => sum + plan.filesToModify.length, 0);
  }, [plans]);

  if (loading) {
    return (
      <Layout currentPage="/plans">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Plans</h1>
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
      <Layout currentPage="/plans">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Plans</h1>
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
    <Layout currentPage="/plans">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plans</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {plans.length} Plans · {totalFilesToModify} Files to Modify
              {searchQuery && ` · Found ${filteredPlans.length} Results`}
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

        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  name="plan-search"
                  placeholder="Search title, summary, or filename..."
                  autoComplete="off"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              {/* Sort Options */}
              <select
                name="plan-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="created">Sort by Created Date</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        {filteredPlans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchQuery ? 'No matching plans found' : 'No plans'}
            </CardContent>
          </Card>
        ) : (
          <PlanList
            plans={filteredPlans}
            onPlanClick={(planId) => setSelectedPlanId(planId)}
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
