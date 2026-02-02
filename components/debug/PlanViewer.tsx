'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { X, FileText, Clock, FolderOpen } from 'lucide-react';
import { Plan } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface PlanViewerProps {
  plan: Plan;
  onClose: () => void;
}

export const PlanViewer = memo(function PlanViewer({ plan, onClose }: PlanViewerProps) {
  const projectName = plan.project ? plan.project.split('/').pop() : 'Unknown Project';
  const fullProjectPath = plan.project || '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl h-[90vh] flex flex-col">
        <CardHeader className="border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                <CardTitle className="text-xl">{plan.title}</CardTitle>
                {plan.project && (
                  <Badge variant="secondary" className="text-xs">
                    <FolderOpen className="h-3 w-3 mr-1" />
                    {projectName}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(plan.createdAt)}</span>
                </div>
                <Badge variant="outline">
                  {plan.filesToModify.length} files
                </Badge>
                {plan.project && (
                  <span className="text-xs font-mono text-muted-foreground">
                    {fullProjectPath}
                  </span>
                )}
              </div>
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
        <CardContent className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Summary */}
            {plan.summary && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {plan.summary}
                </p>
              </div>
            )}

            {/* Files to Modify */}
            {plan.filesToModify.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Files to Modify ({plan.filesToModify.length})
                </h3>
                <div className="space-y-2">
                  {plan.filesToModify.map((file, index) => (
                    <div
                      key={index}
                      className="p-3 bg-muted rounded-lg"
                    >
                      <code className="text-sm font-mono break-all">
                        {file}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Content */}
            {plan.content && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Full Content</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap break-words font-mono">
                    {plan.content}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
