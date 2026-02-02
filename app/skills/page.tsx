'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { SkillList } from '@/components/lists/SkillList';
import { SkillViewer } from '@/components/debug/SkillViewer';
import { RefreshCw, Search } from 'lucide-react';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports: Lazy load SkillViewer to reduce initial bundle size
const SkillViewerDynamic = dynamic(() =>
  import('@/components/debug/SkillViewer').then(mod => ({ default: mod.SkillViewer })),
  {
    ssr: false
  }
);
import { useState, useCallback, useTransition, useMemo } from 'react';
import { Skill } from '@/lib/types';

type SortOption = 'mostUsed' | 'recentlyUsed' | 'name';

export default function SkillsPage() {
  const { skills, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('mostUsed');
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(null);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let filtered = skills;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(skill =>
        skill.name.toLowerCase().includes(query) ||
        skill.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'mostUsed':
          return (b.usageCount || 0) - (a.usageCount || 0);
        case 'recentlyUsed':
          const aTime = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bTime = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return bTime - aTime;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return sorted;
  }, [skills, searchQuery, sortBy]);

  if (loading) {
    return (
      <Layout currentPage="/skills">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Skills</h1>
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
      <Layout currentPage="/skills">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Skills</h1>
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
    <Layout currentPage="/skills">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Skills</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {skills.length} skills total
              {searchQuery && ` · ${filteredSkills.length} results found`}
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
                  placeholder="Search by skill name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Sort Options */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="mostUsed">Most Used</option>
                <option value="recentlyUsed">Recently Used</option>
                <option value="name">Sort by Name</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Skills Grid */}
        {filteredSkills.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchQuery ? 'No matching skills found' : 'No skills available'}
            </CardContent>
          </Card>
        ) : (
          <SkillList
            skills={filteredSkills}
            onSkillClick={(skillName) => setSelectedSkillName(skillName)}
          />
        )}

        {/* Skill Viewer Modal */}
        {selectedSkillName && (
          <SkillViewerDynamic
            skill={skills.find(s => s.name === selectedSkillName)!}
            onClose={() => setSelectedSkillName(null)}
          />
        )}
      </div>
    </Layout>
  );
}
