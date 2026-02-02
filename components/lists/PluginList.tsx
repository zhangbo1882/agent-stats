'use client';

import { memo } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Plug } from 'lucide-react';
import { Plugin, Marketplace } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface PluginListProps {
  installed: Plugin[];
  marketplaces: Marketplace[];
  showMarketplaces?: boolean;
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const PluginList = memo(function PluginList({ installed, marketplaces, showMarketplaces = false }: PluginListProps) {
  if (!showMarketplaces && installed.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Plug className="h-12 w-12 mx-auto mb-4" />
        <p>No installed plugins</p>
      </div>
    );
  }

  if (showMarketplaces) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {marketplaces.map(marketplace => (
          <Card key={marketplace.name}>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Plug className="h-5 w-5 text-primary" />
                <Badge variant="outline">{marketplace.source}</Badge>
              </div>
              <CardTitle className="text-lg">{marketplace.name}</CardTitle>
              <CardDescription>
                Last updated: {formatDate(marketplace.lastUpdated)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground truncate">
                Install Location: {marketplace.installLocation}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {installed.map(plugin => (
        <Card key={plugin.name}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{plugin.name}</CardTitle>
                <CardDescription className="mt-1">
                  {plugin.marketplace} · v{plugin.version}
                </CardDescription>
              </div>
              <Badge>Enabled</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Installed at: {formatDate(plugin.installedAt)}</p>
              <p className="font-mono text-xs truncate">
                Git: {plugin.gitCommitSha.substring(0, 8)}...
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
