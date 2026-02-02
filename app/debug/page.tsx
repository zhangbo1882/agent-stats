'use client';

import { useClaudeData } from '@/hooks/useClaudeData';
import { Layout } from '@/components/layout/Layout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { RefreshCw, FileText, Clock, HardDrive } from 'lucide-react';
import { useState, useCallback, useTransition, useMemo } from 'react';
import { formatDate, formatBytes } from '@/lib/utils';
import dynamic from 'next/dynamic';

// bundle-dynamic-imports: Lazy load LogViewer to reduce initial bundle size
const LogViewer = dynamic(() => import('@/components/debug/LogViewer').then(mod => ({ default: mod.LogViewer })), {
  ssr: false
});

interface LogFile {
  name: string;
  size: number;
  modified: string;
}

export default function DebugPage() {
  const { debugLogs, loading, error, refresh } = useClaudeData();
  const [isPending, startTransition] = useTransition();
  const [selectedLog, setSelectedLog] = useState<LogFile | null>(null);
  const [logContent, setLogContent] = useState<string>('');
  const [loadingLog, setLoadingLog] = useState(false);

  const handleRefresh = useCallback(() => {
    startTransition(async () => {
      await refresh();
    });
  }, [refresh]);

  // Fetch log content
  const fetchLogContent = useCallback(async (logFile: LogFile) => {
    setLoadingLog(true);
    try {
      const response = await fetch(`/api/debug/${logFile.name}`);
      if (!response.ok) {
        throw new Error('Failed to fetch log content');
      }
      const data = await response.json();
      setLogContent(data.content);
      setSelectedLog(logFile);
    } catch (err) {
      console.error('Error fetching log:', err);
    } finally {
      setLoadingLog(false);
    }
  }, []);

  // Process debug logs into LogFile objects
  const logFiles = useMemo(() => {
    return debugLogs
      .map(name => {
        // Extract timestamp from filename if available
        // Format: claude-2025-01-15.log or similar
        const match = name.match(/(\d{4}-\d{2}-\d{2})/);
        const dateStr = match ? match[1] : null;

        return {
          name,
          size: 0, // We don't have size info from just the filename
          modified: dateStr || new Date().toISOString(),
        };
      })
      .sort((a, b) => {
        // Sort by date descending (newest first)
        return new Date(b.modified).getTime() - new Date(a.modified).getTime();
      });
  }, [debugLogs]);

  if (loading) {
    return (
      <Layout currentPage="/debug">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Debug Logs</h1>
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
      <Layout currentPage="/debug">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Debug Logs</h1>
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
    <Layout currentPage="/debug">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Debug Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {debugLogs.length} Log Files
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

        {/* Log Files List */}
        {logFiles.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              No log files
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {logFiles.map((logFile) => (
              <Card
                key={logFile.name}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => fetchLogContent(logFile)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{logFile.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(logFile.modified)}</span>
                          </div>
                          {logFile.size > 0 && (
                            <div className="flex items-center gap-1">
                              <HardDrive className="h-3 w-3" />
                              <span>{formatBytes(logFile.size)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Log Viewer Modal */}
        {selectedLog && (
          <LogViewer
            filename={selectedLog.name}
            content={logContent}
            onClose={() => {
              setSelectedLog(null);
              setLogContent('');
            }}
          />
        )}
      </div>
    </Layout>
  );
}
