'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Server, CheckCircle, XCircle } from 'lucide-react';
import { MCPServer } from '@/lib/types';

interface MCPListProps {
  servers: MCPServer[];
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const MCPList = memo(function MCPList({ servers }: MCPListProps) {
  if (servers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Server className="h-12 w-12 mx-auto mb-4" />
        <p>No MCP servers</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {servers.map((server) => (
        <Card key={server.name}>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <Server className="h-5 w-5 text-primary" />
              <Badge variant="outline">{server.type}</Badge>
            </div>
            <CardTitle className="text-lg">{server.name}</CardTitle>
            {server.url && (
              <CardDescription className="truncate font-mono text-xs">
                {server.url}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {server.tools && server.tools.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Available tools ({server.tools.length}):</p>
                <div className="flex flex-wrap gap-1">
                  {server.tools.slice(0, 5).map((tool, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tool}
                    </Badge>
                  ))}
                  {server.tools.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{server.tools.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
