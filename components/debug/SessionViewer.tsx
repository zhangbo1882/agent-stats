'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, User, Bot } from 'lucide-react';
import { HistoryEntry } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface SessionViewerProps {
  sessionId: string;
  entries: HistoryEntry[];
  onClose: () => void;
}

export const SessionViewer = memo(function SessionViewer({
  sessionId,
  entries,
  onClose
}: SessionViewerProps) {
  // Filter entries for this session
  const sessionEntries = entries.filter(entry => entry.sessionId === sessionId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Session Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {sessionEntries.length} messages · ID: {sessionId.substring(0, 8)}...
              </p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            {sessionEntries.map((entry, index) => {
              const isUser = index % 2 === 0;
              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isUser ? 'flex-row' : 'flex-row-reverse'}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser ? 'bg-primary' : 'bg-muted'
                  }`}>
                    {isUser ? (
                      <User className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <Bot className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className={`flex-1 ${isUser ? 'text-left' : 'text-right'}`}>
                    <div className={`inline-block max-w-[80%] rounded-lg p-3 ${
                      isUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}>
                      {entry.display && (
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {entry.display}
                        </p>
                      )}
                      {entry.pastedContents && Object.keys(entry.pastedContents).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/20">
                          <p className="text-xs opacity-70 mb-1">Attachments:</p>
                          {Object.entries(entry.pastedContents).map(([key, value]) => (
                            <div key={key} className="text-xs">
                              <span className="font-mono opacity-60">{key}:</span>{' '}
                              <span className="font-mono">
                                {typeof value === 'string' ? value.substring(0, 100) + (value.length > 100 ? '...' : '') : JSON.stringify(value).substring(0, 100) + '...'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(new Date(entry.timestamp).toISOString())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
