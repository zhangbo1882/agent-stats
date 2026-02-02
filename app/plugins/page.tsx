'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { PluginList } from '@/components/lists/PluginList';
import { RefreshCw, Search, Package, Store } from 'lucide-react';
import { useState, useCallback, useTransition, useMemo } from 'react';

type TabValue = 'installed' | 'marketplaces';

export default function PluginsPage() {
  const { plugins, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('installed');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Get unique marketplaces
  const marketplacesList = useMemo(() => {
    return ['all', ...new Set(plugins.installed.map(p => p.marketplace))];
  }, [plugins.installed]);

  // Filter and search
  const filteredInstalled = useMemo(() => {
    let filtered = plugins.installed;

    // Apply marketplace filter
    if (marketplaceFilter !== 'all') {
      filtered = filtered.filter(p => p.marketplace === marketplaceFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.marketplace.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [plugins.installed, searchQuery, marketplaceFilter]);

  const filteredMarketplaces = useMemo(() => {
    if (!searchQuery) return plugins.marketplaces;

    const query = searchQuery.toLowerCase();
    return plugins.marketplaces.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.source.toLowerCase().includes(query)
    );
  }, [plugins.marketplaces, searchQuery]);

  if (loading) {
    return (
      <Layout currentPage="/plugins">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Plugins</h1>
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
      <Layout currentPage="/plugins">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Plugins</h1>
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
    <Layout currentPage="/plugins">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Plugins</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {activeTab === 'installed' && (
                <>{plugins.installed.length} plugins installed · {plugins.marketplaces.length} marketplaces</>
              )}
              {activeTab === 'marketplaces' && (
                <>{plugins.marketplaces.length} plugin marketplaces · {plugins.installed.length} installed</>
              )}
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
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('installed')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'installed'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4" />
            Installed
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {plugins.installed.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('marketplaces')}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'marketplaces'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Store className="h-4 w-4" />
            Marketplaces
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {plugins.marketplaces.length}
            </span>
          </button>
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
                  placeholder={activeTab === 'installed' ? 'Search by plugin name...' : 'Search by marketplace name...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Marketplace Filter (only for installed tab) */}
              {activeTab === 'installed' && marketplacesList.length > 1 && (
                <select
                  value={marketplaceFilter}
                  onChange={(e) => setMarketplaceFilter(e.target.value)}
                  className="px-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="all">All Marketplaces</option>
                  {marketplacesList.slice(1).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeTab === 'installed' ? (
          filteredInstalled.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                {searchQuery || marketplaceFilter !== 'all' ? 'No matching plugins found' : 'No plugins installed'}
              </CardContent>
            </Card>
          ) : (
            <PluginList
              installed={filteredInstalled}
              marketplaces={[]}
              showMarketplaces={false}
            />
          )
        ) : (
          filteredMarketplaces.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                {searchQuery ? 'No matching marketplaces found' : 'No plugin marketplaces available'}
              </CardContent>
            </Card>
          ) : (
            <PluginList
              installed={[]}
              marketplaces={filteredMarketplaces}
              showMarketplaces={true}
            />
          )
        )}
      </div>
    </Layout>
  );
}
