'use client';

import { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { FileText, FolderOpen } from 'lucide-react';
import { Plan } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface PlanListProps {
  plans: Plan[];
  onPlanClick?: (planId: string) => void;
}

// rerender-memo: Use React.memo to prevent unnecessary re-renders
export const PlanList = memo(function PlanList({ plans, onPlanClick }: PlanListProps) {
  if (plans.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-4" />
        <p>No plans</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`hover:shadow-md transition-all cursor-pointer ${
            onPlanClick ? 'hover:border-primary/50' : ''
          }`}
          onClick={() => onPlanClick && onPlanClick(plan.id)}
        >
          <CardHeader>
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-lg truncate">{plan.title}</CardTitle>
                  {plan.project && (
                    <Badge variant="secondary" className="text-xs">
                      <FolderOpen className="h-3 w-3 mr-1" />
                      {plan.project.split('/').pop()}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  {formatDate(plan.createdAt)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {plan.summary && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {plan.summary}
                </p>
              )}
              {plan.filesToModify.length > 0 && (
                <div className="text-xs text-muted-foreground">
                  <p className="font-medium mb-1">
                    Modify {plan.filesToModify.length} files
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
});
