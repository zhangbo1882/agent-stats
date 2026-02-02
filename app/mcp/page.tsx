'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { MCPList } from '@/components/lists/MCPList';
import { RefreshCw, Search, Server } from 'lucide-react';
import { useState, useCallback, useTransition, useMemo } from 'react';
import { MCPServer } from '@/lib/types';

type TypeFilter = 'all' | 'stdio' | 'SSE' | 'HTTP';

export default function MCPPage() {
  const { mcp, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Calculate stats
  const totalTools = useMemo(() => {
    return mcp.reduce((sum, server) => sum + (server.tools?.length || 0), 0);
  }, [mcp]);

  const serverTypes = useMemo(() => {
    const types = new Set(mcp.map(s => s.type));
    return Array.from(types);
  }, [mcp]);

  // Filter and search
  const filteredMCP = useMemo(() => {
    let filtered = mcp;

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(s => s.type === typeFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(server =>
        server.name.toLowerCase().includes(query) ||
        server.tools?.some(tool => tool.toLowerCase().includes(query)) ||
        server.url?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [mcp, searchQuery, typeFilter]);

  if (loading) {
    return (
      <Layout currentPage="/mcp">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">MCP Servers</h1>
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
      <Layout currentPage="/mcp">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">MCP Servers</h1>
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
    <Layout currentPage="/mcp">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">MCP Servers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {mcp.length} servers · {totalTools} tools
              {searchQuery && ` · ${filteredMCP.length} results found`}
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

        {/* Type Filter Pills */}
        {serverTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                typeFilter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              All ({mcp.length})
            </button>
            {serverTypes.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type as TypeFilter)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  typeFilter === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {type} ({mcp.filter(s => s.type === type).length})
              </button>
            ))}
          </div>
        )}

        {/* Search Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by server name, tool, or URL..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </CardContent>
        </Card>

        {/* MCP Servers Grid */}
        {filteredMCP.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              {searchQuery || typeFilter !== 'all' ? 'No matching servers found' : 'No MCP servers available'}
            </CardContent>
          </Card>
        ) : (
          <MCPList servers={filteredMCP} />
        )}
      </div>
    </Layout>
  );
}
