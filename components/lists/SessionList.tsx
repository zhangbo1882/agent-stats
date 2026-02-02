'use client';

import { memo } from 'react';
import { History } from 'lucide-react';
import { Session } from '@/lib/types';
import { formatDate, formatDuration } from '@/lib/utils';

interface SessionListProps {
  sessions: Session[];
  onSessionClick?: (sessionId: string) => void;
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const SessionList = memo(function SessionList({ sessions, onSessionClick }: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-4" />
        <p>No session records</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.slice(0, 50).map((session, index) => (
        <div
          key={session.id || index}
          className={`border rounded-lg p-4 transition-colors ${
            onSessionClick ? 'hover:bg-accent/50 cursor-pointer' : 'hover:bg-accent/50'
          }`}
          onClick={() => onSessionClick && session.id && onSessionClick(session.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm text-muted-foreground">
                  {session.id ? `${session.id.substring(0, 8)}...` : 'Unknown ID'}
                </span>
                {session.project && (
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {session.project.split('/').pop()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(session.timestamp)}</span>
                <span>{session.messageCount} messages</span>
                {session.duration && (
                  <span>{formatDuration(session.duration)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
});
